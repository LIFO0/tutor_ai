import { describe, expect, test } from "vitest";
import { createSseParser } from "./sse";

describe("createSseParser", () => {
  test("emits metrics as a named event", () => {
    const seen: unknown[] = [];
    const parser = createSseParser((ev) => seen.push(ev));

    parser.feed(
      [
        "event: metrics",
        'data: {"t_total_model_ms":123}',
        "",
        "",
      ].join("\n"),
    );

    expect(seen).toEqual([{ type: "event", event: "metrics", data: { t_total_model_ms: 123 } }]);
  });

  test("emits done", () => {
    const seen: unknown[] = [];
    const parser = createSseParser((ev) => seen.push(ev));
    parser.feed(["event: done", "data: {}", "", ""].join("\n"));
    expect(seen).toEqual([{ type: "done" }]);
  });
});

