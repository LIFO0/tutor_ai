/**
 * Normalize LaTeX delimiters emitted by the model into remark-math / KaTeX format.
 *
 * remark-math only recognizes `$...$` (inline) and `$$...$$` (display). Models often
 * emit `\(...\)` and `\[...\]` instead; CommonMark treats those backslashes as escapes,
 * so the formulas render as raw text. This helper converts matched pairs only.
 *
 * Note: does not skip fenced/inline code spans — unlikely in tutoring answers.
 */
export function normalizeLatexDelimiters(input: string): string {
  if (!input) return input;

  // Display math first so inline conversion does not touch display delimiters.
  let s = input.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`);
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`);
  return s;
}
