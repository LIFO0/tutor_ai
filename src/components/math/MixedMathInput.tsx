"use client";

import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import katex from "katex";
import { mathLiveLatexToKatexDisplay } from "@/lib/mathlive-katex";
import { parseMixedLatex } from "@/lib/mixed-math";

export type MixedMathInputHandle = {
  focus: () => void;
  insertFromKeyboard: (latexOrText: string) => void;
};

/** KaTeX preview chip */
const MATH_CHIP_PREVIEW_CLASS =
  "mx-0.5 inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 align-baseline hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

/** MathLive edit chip: avoid `inline-flex/items-center` (can inflate line-height inside contenteditable) */
const MATH_CHIP_EDIT_CLASS =
  "mx-0.5 inline-block cursor-text rounded-md border border-zinc-200 bg-zinc-50 align-middle dark:border-zinc-800 dark:bg-zinc-900";

function renderLatexToHtml(latex: string) {
  try {
    const displayLatex = mathLiveLatexToKatexDisplay(latex);
    return katex.renderToString(displayLatex, { throwOnError: false });
  } catch {
    return null;
  }
}

function renderValueToDom(root: HTMLElement, value: string) {
  // Imperative render to avoid React <-> contentEditable DOM conflicts.
  root.replaceChildren();
  const segs = parseMixedLatex(value);
  for (const s of segs) {
    if (s.type === "text") {
      root.appendChild(document.createTextNode(s.text));
      continue;
    }
    const span = document.createElement("span");
    span.dataset.math = "1";
    span.dataset.latex = s.latex;
    span.dataset.display = s.display;
    span.contentEditable = "false";
    span.className = MATH_CHIP_PREVIEW_CLASS;
    span.innerHTML = renderLatexToHtml(s.latex) ?? "$?$";
    root.appendChild(span);
  }
}

function serializeFromDom(root: HTMLElement): string {
  const parts: string[] = [];

  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;

    if (el.dataset.math === "1") {
      const latex = el.dataset.latex ?? "";
      const display = (el.dataset.display === "$$" ? "$$" : "$") as "$" | "$$";
      parts.push(`${display}${latex}${display}`);
      return;
    }

    if (el.tagName.toLowerCase() === "math-field") {
      const latex = String((el as unknown as { value?: string }).value ?? "");
      parts.push(`$${latex}$`);
      return;
    }

    for (const child of el.childNodes) walk(child);
  };

  for (const child of root.childNodes) walk(child);
  return parts.join("");
}

function isMathField(el: Element | null): el is HTMLElement {
  return Boolean(el && el.tagName.toLowerCase() === "math-field");
}

async function ensureMathLiveLoaded() {
  await import("mathlive");
}

function insertTextAtSelection(root: HTMLElement, text: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    // Fallback: append at end of editor.
    root.appendChild(document.createTextNode(text));
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function insertMathNodeAtSelection(params: { latex: string; display: "$" | "$$" }) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    // No selection: let caller handle fallback insertion.
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();

  const span = document.createElement("span");
  span.dataset.math = "1";
  span.dataset.latex = params.latex;
  span.dataset.display = params.display;
  span.contentEditable = "false";
  span.className = MATH_CHIP_PREVIEW_CLASS;
  span.innerHTML = renderLatexToHtml(params.latex) ?? "$?$";

  range.insertNode(span);
  range.setStartAfter(span);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export const MixedMathInput = forwardRef<
  MixedMathInputHandle,
  {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
    onFocus?: () => void;
    /** Disable inline MathLive editor (no <math-field>, no dynamic import). */
    disableInlineEdit?: boolean;
    /** How to open inline editor for a math chip. Default: click. */
    inlineEditActivation?: "click" | "doubleClick";
  }
>(function MixedMathInput(
  {
    value,
    onChange,
    disabled,
    placeholder,
    className,
    inputClassName,
    onKeyDown,
    onFocus,
    disableInlineEdit,
    inlineEditActivation = "click",
  },
  ref,
) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const internalValueRef = useRef(value);
  const syncLockRef = useRef(false);
  const [mathliveReady, setMathliveReady] = useState(false);
  const mathlivePromiseRef = useRef<Promise<void> | null>(null);

  const placeholderText = placeholder ?? "Введите текст…";
  const hasContent = useMemo(() => value.trim().length > 0, [value]);

  // Keep DOM synced when parent changes externally (but don't clobber while focused/editing).
  useEffect(() => {
    internalValueRef.current = value;
    const root = rootRef.current;
    if (!root) return;
    const active = document.activeElement;
    if (active && root.contains(active)) {
      // If parent forcibly clears the value (e.g. on submit), we must also clear the DOM
      // even while focused; otherwise the placeholder overlays stale DOM text.
      if (!value) renderValueToDom(root, "");
      return;
    }
    renderValueToDom(root, value);
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        rootRef.current?.focus();
      },
      insertFromKeyboard(latexOrText: string) {
        if (disabled) return;
        const root = rootRef.current;
        if (!root) return;

        const active = document.activeElement;
        if (isMathField(active) && root.contains(active)) {
          if (disableInlineEdit) {
            // If inline edit is disabled, treat insertion as plain text at editor level.
            root.focus();
            insertTextAtSelection(root, latexOrText);
            const next = serializeFromDom(root);
            internalValueRef.current = next;
            onChange(next);
            return;
          }
          // Insert into active MathLive field
          const mf = active as unknown as { insert?: (s: string) => void; executeCommand?: (c: unknown) => void };
          if (typeof mf.insert === "function") {
            mf.insert(latexOrText);
          } else if (typeof mf.executeCommand === "function") {
            mf.executeCommand(["insert", latexOrText]);
          } else {
            (active as unknown as { value?: string }).value =
              String((active as unknown as { value?: string }).value ?? "") + latexOrText;
          }
          onChange(serializeFromDom(root));
          return;
        }

        root.focus();

        // If looks like $...$ treat as math template insertion
        const m = latexOrText.match(/^\$\$([\s\S]*)\$\$$/);
        const m2 = latexOrText.match(/^\$([\s\S]*)\$$/);
        if (m) {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) {
            insertTextAtSelection(root, `$$${m[1]}$$`);
          } else {
            insertMathNodeAtSelection({ latex: m[1], display: "$$" });
          }
        } else if (m2) {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) {
            insertTextAtSelection(root, `$${m2[1]}$`);
          } else {
            insertMathNodeAtSelection({ latex: m2[1], display: "$" });
          }
        } else {
          insertTextAtSelection(root, latexOrText);
        }

        const next = serializeFromDom(root);
        internalValueRef.current = next;
        onChange(next);
        // Important for perf: DO NOT rebuild the whole editor DOM here.
        // We already inserted the correct nodes (text or a KaTeX preview span).
      },
    }),
    [disabled, disableInlineEdit, onChange],
  );

  async function enterEditMode(targetSpan: HTMLElement) {
    if (disableInlineEdit) return;
    if (disabled) return;
    const latex = targetSpan.dataset.latex ?? "";

    if (!mathliveReady) {
      if (!mathlivePromiseRef.current) mathlivePromiseRef.current = ensureMathLiveLoaded();
      await mathlivePromiseRef.current;
      setMathliveReady(true);
    }
    // Load CSS only when the user actually opens the editor.
    await import("mathlive/static.css");

    const mf = document.createElement("math-field");
    // Slightly larger hit area in edit mode; keep glyph scale close to KaTeX to avoid "stretched" radicals
    mf.className = `${MATH_CHIP_EDIT_CLASS} math-inline-edit py-1 px-2.5`;
    mf.setAttribute("default-mode", "inline-math");
    (mf as unknown as { value?: string }).value = latex;
    // Disable built-in menus/virtual keyboard (they clutter the UI for our use-case).
    mf.addEventListener(
      "mount",
      () => {
        try {
          (mf as unknown as { menuItems?: unknown[] }).menuItems = [];
          (mf as unknown as { mathVirtualKeyboardPolicy?: string }).mathVirtualKeyboardPolicy = "manual";
          // Keep math style tight for inline editing (helps with sqrt/fraction proportions)
          (mf as unknown as { defaultMode?: string }).defaultMode = "inline-math";
        } catch {
          // ignore
        }
      },
      { once: true },
    );

    // Replace node and focus
    targetSpan.replaceWith(mf);
    requestAnimationFrame(() => {
      (mf as unknown as { focus?: () => void }).focus?.();
    });

    const root = rootRef.current;
    if (!root) return;

    const commit = () => {
      const newLatex = String((mf as unknown as { value?: string }).value ?? "");
      const span = document.createElement("span");
      span.dataset.math = "1";
      span.dataset.latex = newLatex;
      span.dataset.display = "$";
      span.contentEditable = "false";
      span.className = MATH_CHIP_PREVIEW_CLASS;
      span.innerHTML = renderLatexToHtml(newLatex) ?? "$?$";
      mf.replaceWith(span);

      const next = serializeFromDom(root);
      internalValueRef.current = next;
      onChange(next);
      // Important for perf: DO NOT rebuild the whole editor DOM here.
      // We already replaced math-field with a KaTeX preview span.

      requestAnimationFrame(() => {
        // Set caret safely at the end of the editor.
        const r = rootRef.current;
        const sel = window.getSelection();
        if (!r || !sel) return;
        const range = document.createRange();
        range.selectNodeContents(r);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      });
    };

    mf.addEventListener("blur", commit, { once: true });
    mf.addEventListener(
      "keydown",
      (e) => {
        // Escape cancels edit and commits current state (cheap + predictable)
        if ((e as KeyboardEvent).key === "Escape") {
          (e as KeyboardEvent).preventDefault();
          (mf as unknown as { blur?: () => void }).blur?.();
        }
      },
      { once: false },
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        {!hasContent ? (
          <div className="pointer-events-none absolute left-3 top-2 text-sm text-zinc-400">{placeholderText}</div>
        ) : null}
        <div
          id={inputId}
          ref={rootRef}
          role="textbox"
          aria-multiline
          tabIndex={disabled ? -1 : 0}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onInput={() => {
            const root = rootRef.current;
            if (!root) return;
            // Prevent React state churn; treat DOM as source of truth.
            if (syncLockRef.current) return;
            syncLockRef.current = true;
            const next = serializeFromDom(root);
            internalValueRef.current = next;
            onChange(next);
            syncLockRef.current = false;
          }}
          onClick={(e) => {
            if (disableInlineEdit) return;
            if (inlineEditActivation !== "click") return;
            const t = e.target as HTMLElement | null;
            if (!t) return;
            const span = t.closest?.('span[data-math="1"]') as HTMLElement | null;
            if (!span) return;
            void enterEditMode(span);
          }}
          onDoubleClick={(e) => {
            if (disableInlineEdit) return;
            if (inlineEditActivation !== "doubleClick") return;
            const t = e.target as HTMLElement | null;
            if (!t) return;
            const span = t.closest?.('span[data-math="1"]') as HTMLElement | null;
            if (!span) return;
            void enterEditMode(span);
          }}
          className={[
            "min-h-24 w-full whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950",
            inputClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </div>
    </div>
  );
});

