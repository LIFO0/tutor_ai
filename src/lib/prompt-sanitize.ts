/** Strip control chars and collapse newlines for LLM prompt injection mitigation. */
export function sanitizePromptLine(input: string, maxLen: number): string {
  return input
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function sanitizePromptBlock(input: string, maxLen: number): string {
  return input
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/[\r\n]{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLen);
}
