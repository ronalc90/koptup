'use client';

import { useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useDialogFocus } from './useDialogFocus';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmación dentro de la página (en lugar de `window.confirm`): Escape o "Cancelar" la cierran. */
export default function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(open, ref, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="chatbot-confirm-title"
        aria-describedby="chatbot-confirm-body"
        className="w-full max-w-sm rounded-2xl border border-secondary-200 bg-white p-5 shadow-2xl dark:border-secondary-700 dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="chatbot-confirm-title" className="text-sm font-bold text-secondary-900 dark:text-white">
              {title}
            </h2>
            <p id="chatbot-confirm-body" className="mt-1 text-xs leading-relaxed text-secondary-600 dark:text-secondary-300">
              {body}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            className="rounded-md border border-secondary-300 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-secondary-50 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
