"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Modal,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

const grades = Array.from({ length: 7 }, (_, i) => 5 + i);

export function GradeOnboardingModal({
  show,
  initialGrade = 7,
}: {
  show: boolean;
  initialGrade?: number;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [grade, setGrade] = useState<number>(initialGrade || 7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => Number.isInteger(grade) && grade >= 5 && grade <= 11, [grade]);
  const isOpen = show && !saved;

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data as { error?: string } | null)?.error || "Не удалось сохранить");
      }

      setSaved(true);
      // Clean query param and refresh user-dependent UI.
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={() => undefined}>
      <Modal.Trigger>
        <button type="button" className="sr-only">
          Open
        </button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <ModalContainer>
          <ModalDialog>
            <ModalHeader className="flex flex-col gap-1">Выберите класс</ModalHeader>
            <ModalBody>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Это нужно, чтобы Мишка объяснял “по программе”.
              </p>

              <div className="mt-3">
                <label
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  htmlFor="onboarding-grade"
                >
                  Класс
                </label>
                <select
                  id="onboarding-grade"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="mt-2 h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {error ? <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div> : null}
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onPress={save} isDisabled={!canSave || saving}>
                {saving ? "Сохраняем…" : "Продолжить"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </Modal.Backdrop>
    </Modal>
  );
}

