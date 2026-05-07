export type Segment =
  | { type: "text"; text: string }
  | { type: "math"; latex: string; display: "$" | "$$" };

/**
 * Parse a mixed string that may contain inline/block LaTeX delimited by `$...$` or `$$...$$`.
 *
 * Notes:
 * - Best-effort parser: does not attempt full markdown parsing or escaping rules.
 * - Unclosed delimiters are treated as plain text.
 */
export function parseMixedLatex(input: string): Segment[] {
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

    const isDouble = input[i + 1] === "$";
    const delim = isDouble ? "$$" : "$";
    const display = (isDouble ? "$$" : "$") as "$" | "$$";

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
        } else {
          found = j;
          break;
        }
      }
      j += 1;
    }

    if (found === -1) {
      // Unclosed delimiter: keep as text
      buf += "$";
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

export function serializeSegments(segs: Segment[]): string {
  return segs
    .map((s) => {
      if (s.type === "text") return s.text;
      const d = s.display;
      return `${d}${s.latex}${d}`;
    })
    .join("");
}

