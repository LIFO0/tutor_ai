/**
 * Pure helpers for chat search (no DB). Shared by server and client.
 *
 * SQLite lower()/LIKE are ASCII-only, so we fold text in JS (registered as the
 * SQLite function `ru_fold`) and compare with instr() — literal substring match,
 * so no LIKE wildcard escaping is needed.
 */

export const CHAT_SEARCH_MIN_LEN = 2;
export const CHAT_SEARCH_MAX_LEN = 100;

/**
 * Case-fold preserving string length (index i in output ↔ index i in input),
 * so match offsets can be mapped back onto the original text for highlighting.
 * ё → е, all whitespace → space.
 */
export function foldForSearch(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (/\s/.test(ch)) {
      out += " ";
      continue;
    }
    const lower = ch.toLowerCase();
    const c = lower.length === 1 ? lower : ch;
    out += c === "ё" ? "е" : c;
  }
  return out;
}

/** Normalize a user query: trim, collapse whitespace, cap length, fold. Returns null if too short. */
export function normalizeSearchQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const collapsed = raw.replace(/\s+/g, " ").trim().slice(0, CHAT_SEARCH_MAX_LEN).trim();
  if (collapsed.length < CHAT_SEARCH_MIN_LEN) return null;
  return foldForSearch(collapsed);
}

/** Escape LIKE wildcards (for callers that do use LIKE … ESCAPE '\'). */
export function escapeLikePattern(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export type SnippetPart = { text: string; match: boolean };

/**
 * Build a short snippet around the first match of `foldedQuery` in `text`,
 * split into parts with highlighted matches. Returns null if no match.
 */
export function buildSnippet(text: string, foldedQuery: string, radius = 40): SnippetPart[] | null {
  if (!foldedQuery) return null;
  const flat = text.replace(/\s+/g, " ");
  const folded = foldForSearch(flat);
  const first = folded.indexOf(foldedQuery);
  if (first < 0) return null;

  let start = Math.max(0, first - radius);
  let end = Math.min(flat.length, first + foldedQuery.length + radius);
  if (start > 0) {
    const sp = flat.indexOf(" ", start);
    if (sp >= 0 && sp < first) start = sp + 1;
  }
  if (end < flat.length) {
    const sp = flat.lastIndexOf(" ", end);
    if (sp > first + foldedQuery.length) end = sp;
  }

  const parts: SnippetPart[] = [];
  if (start > 0) parts.push({ text: "…", match: false });
  let i = start;
  while (i < end) {
    const idx = folded.indexOf(foldedQuery, i);
    if (idx < 0 || idx >= end) {
      parts.push({ text: flat.slice(i, end), match: false });
      break;
    }
    if (idx > i) parts.push({ text: flat.slice(i, idx), match: false });
    const mEnd = Math.min(end, idx + foldedQuery.length);
    parts.push({ text: flat.slice(idx, mEnd), match: true });
    i = mEnd;
  }
  if (end < flat.length) parts.push({ text: "…", match: false });
  return parts;
}
