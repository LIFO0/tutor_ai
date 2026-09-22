/** In-memory handoff for dashboard → chat navigation (same SPA session). */
let pendingChatFile: File | null = null;

export function setPendingChatFile(file: File | null) {
  pendingChatFile = file;
}

export function takePendingChatFile(): File | null {
  const f = pendingChatFile;
  pendingChatFile = null;
  return f;
}
