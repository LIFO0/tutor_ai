"use client";

import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

export function ConfirmDeleteChatModal({
  isOpen,
  onOpenChange,
  title = "Удалить чат?",
  description = "Удалить этот чат навсегда? Все сообщения будут удалены без возможности восстановления.",
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  onConfirm,
  isLoading = false,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Trigger>
        <button type="button" className="sr-only">
          Open
        </button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <ModalContainer>
          <ModalDialog>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onPress={close} isDisabled={isLoading}>
                {cancelLabel}
              </Button>
              <Button variant="danger" onPress={onConfirm} isDisabled={isLoading}>
                {isLoading ? "Удаляем…" : confirmLabel}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </Modal.Backdrop>
    </Modal>
  );
}

