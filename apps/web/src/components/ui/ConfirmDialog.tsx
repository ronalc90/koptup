'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/demos/shared';
import Button from '@/components/ui/Button';

/**
 * Confirmación con el modal del panel (en lugar de `confirm()` del navegador).
 * `onConfirm` puede ser asíncrona: el botón queda ocupado mientras termina.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={title} onClose={busy ? () => undefined : onClose}>
      {message ? <div className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">{message}</div> : null}
      {children}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} isLoading={busy} disabled={busy} data-testid="confirm-dialog-confirm">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
