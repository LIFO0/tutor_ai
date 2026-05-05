import { stripMathlivePlaceholdersForKatex } from "@/lib/mathlive-katex";

/**
 * Normalize mixed chat text before sending to the model.
 *
 * Goal: remove MathLive template scaffolding (e.g. \placeholder[...]) inside $...$ / $$...$$
 * so prompts are smaller and the model sees cleaner LaTeX.
 */
export function normalizeMathMessageForModel(input: string) {
  if (!input || input.indexOf("$") === -1) return input;

  const collapseEmptyBraces = (latex: string) => {
    // After stripping placeholders we can get artifacts like `{{}}` (e.g. `\log_{{}}`).
    // Collapse them to `{}` to keep prompts small and predictable.
    let s = latex;
    // A couple of passes is enough for our generated templates.
    for (let i = 0; i < 3; i += 1) {
      const next = s.replace(/\{\s*\{\s*\}\s*\}/g, "{}");
      if (next === s) break;
      s = next;
    }
    return s;
  };

  // Match $$...$$ first, then $...$.
  // This is a best-effort normalization; we don't try to fully parse markdown.
  const re = /\$\$([\s\S]*?)\$\$|\$([^$]*?)\$/g;

  return input.replace(re, (m, dbl, sgl) => {
    const inner = typeof dbl === "string" ? dbl : typeof sgl === "string" ? sgl : "";
    if (!inner) return m;

    const cleaned = collapseEmptyBraces(stripMathlivePlaceholdersForKatex(inner));
    if (typeof dbl === "string") return `$$${cleaned}$$`;
    return `$${cleaned}$`;
  });
}

