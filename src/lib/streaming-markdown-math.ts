/**
 * While SSE streams assistant markdown, trailing unclosed `$` / `$$` blocks
 * must not be passed to remark-math — KaTeX renders them as red .katex-error.
 */
export function maskIncompleteMathForStreaming(markdown: string): string {
  if (!markdown) return markdown;

  let s = maskUnclosedDisplayMath(markdown);
  s = maskUnclosedInlineMath(s);
  return s;
}

function maskUnclosedDisplayMath(markdown: string): string {
  const parts = markdown.split("$$");
  if (parts.length <= 1) return markdown;
  // Odd count => all $$ pairs closed. Even count => trailing unclosed block.
  if (parts.length % 2 === 1) return markdown;

  const lastDelimiter = markdown.lastIndexOf("$$");
  if (lastDelimiter === -1) return markdown;
  return markdown.slice(0, lastDelimiter);
}

function maskUnclosedInlineMath(markdown: string): string {
  let inInline = false;
  let openIndex = -1;

  for (let i = 0; i < markdown.length; i++) {
    if (markdown[i] !== "$") continue;
    const prevIsDollar = markdown[i - 1] === "$";
    const nextIsDollar = markdown[i + 1] === "$";
    if (prevIsDollar || nextIsDollar) {
      if (nextIsDollar) i += 1;
      continue;
    }

    if (!inInline) {
      inInline = true;
      openIndex = i;
    } else {
      inInline = false;
      openIndex = -1;
    }
  }

  if (inInline && openIndex >= 0) {
    return markdown.slice(0, openIndex);
  }
  return markdown;
}
