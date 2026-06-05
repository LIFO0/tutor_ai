/** Вероятность подмешивания задачи из банка вместо генерации (0..1). */
export function getTaskBankMixRate(): number {
  const raw = process.env.TASK_BANK_MIX_RATE;
  if (raw == null || raw === "") return 0.5;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}
