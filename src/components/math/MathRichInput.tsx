"use client";

import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import katex from "katex";
import { Button } from "@heroui/react";

type Segment =
  | { type: "text"; text: string }
  | { type: "math"; latex: string; display: "$" | "$$" };

export type MathRichInputHandle = {
  focus: () => void;
  insert: (insertText: string) => void;
};

function renderLatexToHtml(latex: string) {
  try {
    return katex.renderToString(latex, { throwOnError: false });
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

    // Determine delimiter: $$ or $
    const isDouble = input[i + 1] === "$";
    const delim = isDouble ? "$$" : "$";
    const display = isDouble ? ("$$" as const) : ("$" as const);

    // Find closing delimiter
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
          j += 1;
          continue;
        } else {
          found = j;
          break;
        }
      }
      j += 1;
    }

    if (found === -1) {
      // Unclosed delimiter; treat as plain text
      buf += ch;
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

function getSelectionOffset(root: HTMLElement): number | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;

  // Walk nodes in DOM order, counting serialized characters.
  let offset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;

  // TreeWalker starts at root; advance into children
  node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.math === "1") {
        const latex = el.dataset.latex ?? "";
        const display = (el.dataset.display === "$$" ? "$$" : "$") as "$" | "$$";
        const token = `${display}${latex}${display}`;
        // If selection is inside the chip (shouldn't happen), clamp to end.
        if (node.contains(range.startContainer)) return offset + token.length;
        offset += token.length;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (node === range.startContainer) return offset + range.startOffset;
      offset += text.length;
    }
    node = walker.nextNode();
  }
  return offset;
}

function setSelectionOffset(root: HTMLElement, target: number) {
  const sel = window.getSelection();
  if (!sel) return;

  const range = document.createRange();
  let offset = 0;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.math === "1") {
        const latex = el.dataset.latex ?? "";
        const display = (el.dataset.display === "$$" ? "$$" : "$") as "$" | "$$";
        const tokenLen = (`${display}${latex}${display}`).length;
        if (offset + tokenLen >= target) {
          // Place caret after the chip
          range.setStartAfter(el);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
        offset += tokenLen;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (offset + text.length >= target) {
        range.setStart(node, Math.max(0, target - offset));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      offset += text.length;
    }
    node = walker.nextNode();
  }

  // Fallback: place at end
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function serializeFromDom(root: HTMLElement): string {
  let out = "";
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
      continue;
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      if (el.dataset.math === "1") {
        const latex = el.dataset.latex ?? "";
        const display = (el.dataset.display === "$$" ? "$$" : "$") as "$" | "$$";
        out += `${display}${latex}${display}`;
      } else {
        out += el.textContent ?? "";
      }
    }
  }
  return out;
}

export const MathRichInput = forwardRef<
  MathRichInputHandle,
  {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  }
>(function MathRichInput(
  { value, onChange, disabled, placeholder, className, inputClassName, onKeyDown },
  ref,
) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [segments, setSegments] = useState<Segment[]>(() => parseMixedLatex(value));
  const [rawMode, setRawMode] = useState(false);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [mathliveReady, setMathliveReady] = useState(false);
  const mathFieldRef = useRef<HTMLElement | null>(null);
  const normalizeTimerRef = useRef<number | null>(null);

  const placeholderText = placeholder ?? "Ваш ответ… Можно использовать LaTeX";

  useEffect(() => {
    // Keep segments in sync with external value (e.g. form reset)
    if (rawMode) return;
    const next = parseMixedLatex(value);
    setSegments(next);
  }, [value, rawMode]);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        if (rawMode) {
          const el = document.getElementById(inputId) as HTMLTextAreaElement | null;
          el?.focus();
          return;
        }
        rootRef.current?.focus();
      },
      insert(insertText: string) {
        if (disabled) return;
        if (rawMode) {
          const el = document.getElementById(inputId) as HTMLTextAreaElement | null;
          if (!el) return;
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const next = el.value.slice(0, start) + insertText + el.value.slice(end);
          onChange(next);
          requestAnimationFrame(() => {
            el.focus();
            const pos = start + insertText.length;
            el.setSelectionRange(pos, pos);
          });
          return;
        }

        const root = rootRef.current;
        if (!root) return;
        root.focus();
        document.execCommand("insertText", false, insertText);
      },
    }),
    [disabled, inputId, onChange, rawMode],
  );

  const hasContent = useMemo(() => value.trim().length > 0, [value]);

  async function ensureMathlive() {
    if (mathliveReady) return;
    // Load on demand only.
    await import("mathlive");
    // CSS is optional; but improves caret/layout inside MathLive.
    await import("mathlive/static.css");
    setMathliveReady(true);
  }

  function openEditorForIndex(idx: number) {
    setEditingIdx(idx);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingIdx(null);
  }

  useEffect(() => {
    if (!editorOpen) return;
    void ensureMathlive();
  }, [editorOpen]);

  useEffect(() => {
    if (!editorOpen || !mathliveReady) return;
    const idx = editingIdx;
    if (idx == null) return;
    const seg = segments[idx];
    if (!seg || seg.type !== "math") return;

    const el = mathFieldRef.current as unknown as { value?: string } | null;
    if (el) el.value = seg.latex;
  }, [editorOpen, editingIdx, mathliveReady, segments]);

  function commitFromEditor() {
    const idx = editingIdx;
    if (idx == null) return;
    const seg = segments[idx];
    if (!seg || seg.type !== "math") return;

    const el = mathFieldRef.current as unknown as { value?: string } | null;
    const nextLatex = String(el?.value ?? "");
    const nextSegs = segments.map((s, i) => (i === idx ? { ...seg, latex: nextLatex } : s));
    setSegments(nextSegs);
    onChange(segmentsToValue(nextSegs));
    closeEditor();
  }

  function normalizeDomToSegments() {
    const root = rootRef.current;
    if (!root) return;
    const serialized = serializeFromDom(root);
    const caret = getSelectionOffset(root);
    const nextSegs = parseMixedLatex(serialized);
    const nextValue = segmentsToValue(nextSegs);
    setSegments(nextSegs);
    onChange(nextValue);

    if (caret != null) {
      requestAnimationFrame(() => {
        const r = rootRef.current;
        if (!r) return;
        setSelectionOffset(r, caret);
      });
    }
  }

  useEffect(() => {
    return () => {
      if (normalizeTimerRef.current != null) {
        window.clearTimeout(normalizeTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <div className="flex items-start gap-2">
        {rawMode ? (
          <textarea
            id={inputId}
            disabled={disabled}
            className={[
              "min-h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950",
              inputClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholderText}
            onKeyDown={onKeyDown as unknown as React.KeyboardEventHandler<HTMLTextAreaElement>}
          />
        ) : (
          <div className="relative w-full">
            {!hasContent ? (
              <div className="pointer-events-none absolute left-3 top-2 text-sm text-zinc-400">
                {placeholderText}
              </div>
            ) : null}
            <div
              ref={rootRef}
              role="textbox"
              aria-label="Ответ"
              aria-multiline
              tabIndex={disabled ? -1 : 0}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onKeyDown={onKeyDown}
              onInput={() => {
                const root = rootRef.current;
                if (root) {
                  // Keep parent state up to date on each input.
                  onChange(serializeFromDom(root));
                }
                // Normalize segments on idle (convert $...$ => chips).
                if (normalizeTimerRef.current != null) window.clearTimeout(normalizeTimerRef.current);
                normalizeTimerRef.current = window.setTimeout(normalizeDomToSegments, 200);
              }}
              onBlur={() => normalizeDomToSegments()}
              className={[
                "min-h-24 w-full whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950",
                inputClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {segments.map((s, idx) => {
                if (s.type === "text") return <React.Fragment key={`t-${idx}`}>{s.text}</React.Fragment>;

                const html = renderLatexToHtml(s.latex);
                return (
                  <span
                    key={`m-${idx}`}
                    data-math="1"
                    data-latex={s.latex}
                    data-display={s.display}
                    contentEditable={false}
                    onMouseDown={(e) => {
                      // Prevent contenteditable from moving caret into chip.
                      e.preventDefault();
                    }}
                    onClick={() => openEditorForIndex(idx)}
                    className="mx-0.5 inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 align-baseline hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    dangerouslySetInnerHTML={{ __html: html ?? "$?$" }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <Button
          variant="secondary"
          isDisabled={Boolean(disabled)}
          onPress={() => setRawMode((v) => !v)}
          className="shrink-0"
        >
          {rawMode ? "Формулы" : "Текст"}
        </Button>
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <div className="text-sm font-semibold">Редактирование формулы</div>
            <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              {mathliveReady ? (
                // @ts-expect-error - mathlive web component
                <math-field
                  ref={(el: HTMLElement | null) => {
                    mathFieldRef.current = el;
                  }}
                  style={{ width: "100%", fontSize: "1.2rem" }}
                />
              ) : (
                <div className="text-sm text-zinc-500">Загружаем редактор…</div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onPress={closeEditor}>
                Отмена
              </Button>
              <Button variant="primary" isDisabled={!mathliveReady} onPress={commitFromEditor}>
                Готово
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

