import { patchEmptyCommonTemplatesForModel, stripMathlivePlaceholdersForKatex } from "@/lib/mathlive-katex";
import { parseMixedLatex, serializeSegments } from "@/lib/mixed-math";

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
    while (true) {
      const next = s.replace(/\{\s*\{\s*\}\s*\}/g, "{}");
      if (next === s) break;
      s = next;
    }
    return s;
  };

  const segs = parseMixedLatex(input);
  return serializeSegments(
    segs.map((seg) => {
      if (seg.type === "text") return seg;
      const cleaned0 = stripMathlivePlaceholdersForKatex(seg.latex);
      const cleaned1 = collapseEmptyBraces(cleaned0);
      const cleaned2 = patchEmptyCommonTemplatesForModel(cleaned1);
      const latex = cleaned2.trim() ? cleaned2 : "\\square";
      return { ...seg, latex };
    }),
  );
}

