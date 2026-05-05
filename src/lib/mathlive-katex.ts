export function stripMathlivePlaceholdersForKatex(latex: string) {
  // MathLive placeholders are not KaTeX commands. When serializing, MathLive may emit several shapes:
  // - \placeholder[id]{body}
  // - \placeholder[id][default]{body}
  // - \placeholder[id]body  (body may be digits / simple atoms)
  //
  // We strip ONLY the placeholder scaffolding and keep the user's body so numbers don't "disappear".
  return latex.replace(/\\placeholder(?:\[[^\]]+\])?(?:\[[^\]]*\])?/g, "");
}

function emptyPlaceholderBodiesToSquareForKatex(latex: string) {
  // For KaTeX preview only: empty placeholder bodies become a visible box.
  // In MathLive templates we use `{}` (empty) so the user doesn't have to delete a \square first.
  return latex.replace(/(\\placeholder(?:\[[^\]]+\])?(?:\[[^\]]*\])?)\{\s*\}/g, "$1{\\square}");
}

function patchEmptyCommonTemplates(s: string) {
  return s
    .replace(/\\log_\{\s*\}/g, "\\log_{\\square}")
    .replace(/\\sqrt\{\s*\}/g, "\\sqrt{\\square}")
    // Empty root index after stripping placeholders: \sqrt[]{…} -> \sqrt[\square]{…}
    .replace(/\\sqrt\[\s*\]/g, "\\sqrt[\\square]")
    .replace(/\\sqrt\[([^\]]*)\]\{\s*\}/g, "\\sqrt[$1]{\\square}")
    .replace(/\\frac\{\s*\}\{\s*\}/g, "\\frac{\\square}{\\square}");
}

/** Convert MathLive-oriented LaTeX to something KaTeX can render (preview / message bubble). */
export function mathLiveLatexToKatexDisplay(latex: string) {
  let s = emptyPlaceholderBodiesToSquareForKatex(latex);
  s = stripMathlivePlaceholdersForKatex(s);
  s = patchEmptyCommonTemplates(s);
  return s;
}
