"use client";

import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import katex from "katex";
import { mathLiveLatexToKatexDisplay } from "@/lib/mathlive-katex";

type Segment =
  | { type: "text"; text: string }
  | { type: "math"; latex: string; display: "$" | "$$" };

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

function parseMixedLatex(input: string): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  let buf = "";

  const flushText = () => {
    if (buf) segs.push({ type: "text", text: buf });
    buf = "";
  };

  while (i < input.length) {
    const ch = input[i];
    if (ch !== "$") {
      buf += ch;
      i += 1;
      continue;
    }

    const isDouble = input[i + 1] === "$";
    const delim = isDouble ? "$$" : "$";
    const display = (isDouble ? "$$" : "$") as "$" | "$$";

    const start = i + delim.length;
    let j = start;
    let found = -1;
    while (j < input.length) {
      if (input[j] === "$") {
        if (isDouble) {
          if (input[j + 1] === "$") {
            found = j;
            break;
          }
        } else {
          found = j;
          break;
        }
      }
      j += 1;
    }

    if (found === -1) {
      // Unclosed delimiter: keep as text
      buf += "$";
      i += 1;
      continue;
    }

    const latex = input.slice(start, found);
    flushText();
    segs.push({ type: "math", latex, display });
    i = found + delim.length;
  }

  flushText();
  return segs.length ? segs : [{ type: "text", text: "" }];
}

function segmentsToValue(segs: Segment[]): string {
  return segs
    .map((s) => {
      if (s.type === "text") return s.text;
      const d = s.display;
      return `${d}${s.latex}${d}`;
    })
    .join("");
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
  let out = "";
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as HTMLElement;

    if (el.dataset.math === "1") {
      const latex = el.dataset.latex ?? "";
      const display = (el.dataset.display === "$$" ? "$$" : "$") as "$" | "$$";
      out += `${display}${latex}${display}`;
      continue;
    }

    if (el.tagName.toLowerCase() === "math-field") {
      const latex = String((el as unknown as { value?: string }).value ?? "");
      out += `$${latex}$`;
      continue;
    }

    out += el.textContent ?? "";
  }
  return out;
}

function isMathField(el: Element | null): el is HTMLElement {
  return Boolean(el && el.tagName.toLowerCase() === "math-field");
}

async function ensureMathLiveLoaded() {
  await import("mathlive");
  await import("mathlive/static.css");
}

function insertTextAtSelection(text: string) {
  // Works inside contentEditable
  document.execCommand("insertText", false, text);
}

function insertMathNodeAtSelection(params: { latex: string; display: "$" | "$$" }) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    insertTextAtSelection(`${params.display}${params.latex}${params.display}`);
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
  }
>(function MixedMathInput({ value, onChange, disabled, placeholder, className, inputClassName, onKeyDown }, ref) {
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
    if (active && root.contains(active)) return;
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
          insertMathNodeAtSelection({ latex: m[1], display: "$$" });
        } else if (m2) {
          insertMathNodeAtSelection({ latex: m2[1], display: "$" });
        } else {
          insertTextAtSelection(latexOrText);
        }

        const next = serializeFromDom(root);
        internalValueRef.current = next;
        onChange(next);
        // Important for perf: DO NOT rebuild the whole editor DOM here.
        // We already inserted the correct nodes (text or a KaTeX preview span).
      },
    }),
    [disabled, onChange],
  );

  async function enterEditMode(targetSpan: HTMLElement) {
    if (disabled) return;
    const latex = targetSpan.dataset.latex ?? "";

    if (!mathliveReady) {
      if (!mathlivePromiseRef.current) mathlivePromiseRef.current = ensureMathLiveLoaded();
      await mathlivePromiseRef.current;
      setMathliveReady(true);
    }

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

