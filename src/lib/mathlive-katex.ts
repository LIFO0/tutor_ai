export function stripMathlivePlaceholdersForKatex(latex: string) {
  // MathLive placeholders are not KaTeX commands. When serializing, MathLive may emit several shapes:
  // - \placeholder[id]{body}
  // - \placeholder[id][default]{body}
  // - \placeholder[id]body  (body may be digits / simple atoms)
  //
  // We strip ONLY the placeholder scaffolding and keep the user's body so numbers don't "disappear".
  // Note: keeping the body can leave extra grouping braces (e.g. `{{3}}`). That's harmless LaTeX and
  // the model-path normalizer may further collapse empty artifacts like `{{}}` -> `{}`.
  // If the placeholder has a simple braced body (no nested braces), replace the whole placeholder+body
  // with the body content. This avoids artifacts like `{{3}}` inside surrounding template braces.
  let s = latex.replace(
    /\\placeholder(?:\[[^\]]+\])?(?:\[[^\]]*\])?\{([^{}]*)\}/g,
    "$1",
  );
  // Then strip any remaining placeholder scaffolding, keeping whatever body follows (including the
  // documented `\placeholder[id]body` form).
  s = s.replace(/\\placeholder(?:\[[^\]]+\])?(?:\[[^\]]*\])?/g, "");
  return s;
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

/**
 * Patch empty common templates for the model path too.
 * We keep the function shared so preview and prompt normalization stay consistent.
 */
export function patchEmptyCommonTemplatesForModel(latex: string) {
  return patchEmptyCommonTemplates(latex);
}

/** Convert MathLive-oriented LaTeX to something KaTeX can render (preview / message bubble). */
export function mathLiveLatexToKatexDisplay(latex: string) {
  let s = emptyPlaceholderBodiesToSquareForKatex(latex);
  s = stripMathlivePlaceholdersForKatex(s);
  s = patchEmptyCommonTemplates(s);
  return s;
}
