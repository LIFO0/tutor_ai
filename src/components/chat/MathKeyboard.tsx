"use client";

import { useMemo, useState } from "react";
import katex from "katex";

type TabKey = "basic" | "func" | "frac" | "spec";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "Основные" },
  { key: "func", label: "Функции" },
  { key: "frac", label: "Дроби/степени" },
  { key: "spec", label: "Специальные" },
];

type KeyDef = { label: string; insertLatex: string; displayLatex?: string };

const KEYS: Record<TabKey, KeyDef[]> = {
  basic: [
    { label: "+", insertLatex: "+", displayLatex: "+" },
    { label: "−", insertLatex: "−", displayLatex: "-" },
    { label: "×", insertLatex: "×", displayLatex: "\\times" },
    { label: "÷", insertLatex: "÷", displayLatex: "\\div" },
    { label: "=", insertLatex: "=", displayLatex: "=" },
    { label: "≠", insertLatex: "≠", displayLatex: "\\neq" },
    { label: "<", insertLatex: "<", displayLatex: "<" },
    { label: ">", insertLatex: ">", displayLatex: ">" },
    { label: "≤", insertLatex: "≤", displayLatex: "\\le" },
    { label: "≥", insertLatex: "≥", displayLatex: "\\ge" },
  ],
  func: [
    { label: "sin", insertLatex: "sin()", displayLatex: "\\sin x" },
    { label: "cos", insertLatex: "cos()", displayLatex: "\\cos x" },
    { label: "tan", insertLatex: "tan()", displayLatex: "\\tan x" },
    { label: "cot", insertLatex: "cot()", displayLatex: "\\cot x" },
    { label: "arcsin", insertLatex: "arcsin()", displayLatex: "\\arcsin x" },
    { label: "arccos", insertLatex: "arccos()", displayLatex: "\\arccos x" },
    { label: "arctan", insertLatex: "arctan()", displayLatex: "\\arctan x" },
    { label: "√", insertLatex: "√()", displayLatex: "\\sqrt{x}" },
  ],
  frac: [
    { label: "x²", insertLatex: "²", displayLatex: "x^{2}" },
    { label: "x³", insertLatex: "³", displayLatex: "x^{3}" },
    { label: "xⁿ", insertLatex: "^n", displayLatex: "x^{n}" },
    { label: "√x", insertLatex: "√()", displayLatex: "\\sqrt{x}" },
    { label: "∛x", insertLatex: "∛()", displayLatex: "\\sqrt[3]{x}" },
    { label: "x/y", insertLatex: "()/()", displayLatex: "\\frac{a}{b}" },
  ],
  spec: [
    { label: "∫", insertLatex: "∫", displayLatex: "\\int" },
    { label: "∑", insertLatex: "∑", displayLatex: "\\sum" },
    { label: "∞", insertLatex: "∞", displayLatex: "\\infty" },
    { label: "π", insertLatex: "π", displayLatex: "\\pi" },
    { label: "→", insertLatex: "→", displayLatex: "\\to" },
    { label: "∈", insertLatex: "∈", displayLatex: "\\in" },
    { label: "∉", insertLatex: "∉", displayLatex: "\\notin" },
    { label: "∩", insertLatex: "∩", displayLatex: "\\cap" },
    { label: "∪", insertLatex: "∪", displayLatex: "\\cup" },
    { label: "Δ", insertLatex: "Δ", displayLatex: "\\Delta" },
  ],
};

function renderLatex(latex: string) {
  try {
    return katex.renderToString(latex, { throwOnError: false });
  } catch {
    return null;
  }
}

export function MathKeyboard({ onInsert }: { onInsert: (latex: string) => void }) {
  const [tab, setTab] = useState<TabKey>("basic");
  const keys = useMemo(() => KEYS[tab], [tab]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "h-9 rounded-lg px-3 text-sm font-medium",
              tab === t.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {keys.map((k) => (
          <button
            key={`${tab}-${k.label}`}
            type="button"
            onClick={() => onInsert(k.insertLatex)}
            className="h-9 rounded-lg border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            title={k.insertLatex}
          >
            {k.displayLatex ? (
              <span
                className="inline-flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: renderLatex(k.displayLatex) ?? k.label,
                }}
              />
            ) : (
              k.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

