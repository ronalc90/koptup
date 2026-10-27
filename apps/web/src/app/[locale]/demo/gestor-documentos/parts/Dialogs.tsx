'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ExclamationTriangleIcon, FolderPlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useDocs } from '../lib/store';
import type { DocItem } from '../lib/types';
import { Modal, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from './ui';

interface ConfirmProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmación con botón de cancelar enfocado al abrir (Escape cancela). */
export function ConfirmDialog({ open, title, children, confirmLabel, danger = true, busy, onConfirm, onClose }: ConfirmProps) {
  const t = useTranslations('demoDocs');
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      initialFocus={cancelRef}
      icon={<ExclamationTriangleIcon className={`h-6 w-6 ${danger ? 'text-red-600 dark:text-red-400' : ''}`} />}
      footer={
        <>
          <button ref={cancelRef} type="button" onClick={onClose} className={btnSecondary}>
            {t('common.cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={danger ? btnDanger : btnPrimary}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </Modal>
  );
}

export function RenameDialog({ doc, onClose }: { doc: DocItem | null; onClose: () => void }) {
  const t = useTranslations('demoDocs');
  const { rename, busy } = useDocs();
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (doc) setName(doc.name);
  }, [doc]);
  const submit = async () => {
    if (!doc || !name.trim()) return;
    if (name.trim() === doc.name) {
      onClose();
      return;
    }
    if (await rename(doc, name)) onClose();
  };
  return (
    <Modal
      open={Boolean(doc)}
      onClose={onClose}
      size="sm"
      title={t('rename.title')}
      icon={<PencilIcon className="h-6 w-6" />}
      initialFocus={inputRef}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="rename-form" disabled={!name.trim() || (doc ? busy(doc.id) : false)} className={btnPrimary}>
            {t('rename.save')}
          </button>
        </>
      }
    >
      <form
        id="rename-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="rename-input" className={labelCls}>
          {t('rename.label')}
        </label>
        <input ref={inputRef} id="rename-input" type="text" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </form>
    </Modal>
  );
}

export function NewFolderDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (name: string) => void }) {
  const t = useTranslations('demoDocs');
  const { createFolder, mode } = useDocs();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);
  const submit = () => {
    const problem = createFolder(name);
    if (problem) {
      setError(t(`newFolder.errors.${problem}`));
      return;
    }
    onCreated(name.trim().replace(/\s+/g, ' '));
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={t('newFolder.title')}
      icon={<FolderPlusIcon className="h-6 w-6" />}
      initialFocus={inputRef}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="folder-form" className={btnPrimary}>
            {t('newFolder.create')}
          </button>
        </>
      }
    >
      <form
        id="folder-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-2"
      >
        <label htmlFor="folder-input" className={labelCls}>
          {t('newFolder.label')}
        </label>
        <input
          ref={inputRef}
          id="folder-input"
          type="text"
          value={name}
          maxLength={60}
          aria-invalid={Boolean(error)}
          aria-describedby="folder-help"
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className={inputCls}
        />
        {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
        <p id="folder-help" className="text-xs text-slate-500 dark:text-slate-400">
          {mode === 'sample' ? t('newFolder.hintSample') : t('newFolder.hintServer')}
        </p>
      </form>
    </Modal>
  );
}
