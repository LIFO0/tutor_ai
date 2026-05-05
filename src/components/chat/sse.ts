export type SseEvent =
  | { type: "data"; data: unknown }
  | { type: "event"; event: string; data: unknown }
  | { type: "done" }
  | { type: "error"; error: string };

export function createSseParser(onEvent: (ev: SseEvent) => void) {
  let buffer = "";

  function feed(chunkText: string) {
    buffer += chunkText;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const raw of parts) {
      const lines = raw.split("\n").map((l) => l.trim());
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));

      const eventName = eventLine ? eventLine.replace("event:", "").trim() : "message";
      const dataText = dataLine ? dataLine.replace("data:", "").trim() : "";

      if (eventName === "done") {
        onEvent({ type: "done" });
        continue;
      }
      if (eventName === "error") {
        try {
          const obj = JSON.parse(dataText) as unknown;
          const err =
            typeof obj === "object" && obj !== null && "error" in obj
              ? String((obj as { error: unknown }).error)
              : "stream error";
          onEvent({ type: "error", error: err });
        } catch {
          onEvent({ type: "error", error: dataText || "stream error" });
        }
        continue;
      }

      if (dataText) {
        if (eventName !== "message") {
          try {
            onEvent({ type: "event", event: eventName, data: JSON.parse(dataText) });
          } catch {
            onEvent({ type: "event", event: eventName, data: dataText });
          }
          continue;
        }
        try {
          onEvent({ type: "data", data: JSON.parse(dataText) });
        } catch {
          onEvent({ type: "data", data: dataText });
        }
      }
    }
  }

  return { feed };
}

