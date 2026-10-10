'use client';

import { useState, type RefObject } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRightOnRectangleIcon, BeakerIcon, CloudArrowUpIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useDocs } from '../lib/store';
import { ACCEPT_ATTR } from '../lib/util';
import { btnPrimary, btnSecondary, focusRing } from './ui';

const LOGIN_HREF = `/login?redirect=${encodeURIComponent('/demo/gestor-documentos')}`;
const REQUEST_HREF = '/solicitar-demo?demos=gestor-documentos';

/** Botones para entrar o pedir acceso (el visitante sin sesión no llama a la API). */
export function AccessButtons({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoDocs');
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'justify-center'}`}>
      <Link href={LOGIN_HREF} className={btnPrimary}>
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        {t('access.login')}
      </Link>
      <Link href={REQUEST_HREF} className={btnSecondary}>
        {t('access.request')}
      </Link>
    </div>
  );
}

export function AccessCard() {
  const t = useTranslations('demoDocs');
  const { setMode } = useDocs();
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
        <LockClosedIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('access.title')}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">{t('access.text')}</p>
      <ul className="mx-auto mt-4 max-w-md list-disc space-y-1 pl-5 text-left text-sm text-slate-600 dark:text-slate-300">
        {(t.raw('access.points') as string[]).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <div className="mt-5">
        <AccessButtons />
      </div>
      <button type="button" onClick={() => setMode('sample')} className={`mt-4 rounded text-sm font-medium text-blue-700 hover:underline dark:text-blue-300 ${focusRing}`}>
        {t('access.sample')}
      </button>
    </div>
  );
}

interface UploadAreaProps {
  inputRef: RefObject<HTMLInputElement>;
  targetFolder: string;
}

export default function UploadArea({ inputRef, targetFolder }: UploadAreaProps) {
  const t = useTranslations('demoDocs');
  const { mode, hasSession, setMode, upload, uploading, folderLabel } = useDocs();
  const [drag, setDrag] = useState(false);

  if (mode === 'sample') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <BeakerIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">{t('upload.sampleTitle')}</p>
            <p className="text-slate-700 dark:text-slate-300">{hasSession ? t('upload.sampleTextSession') : t('upload.sampleText')}</p>
          </div>
        </div>
        <div className="shrink-0">
          {hasSession ? (
            <button type="button" onClick={() => setMode('server')} className={btnPrimary}>
              {t('upload.goServer')}
            </button>
          ) : (
            <AccessButtons compact />
          )}
        </div>
      </div>
    );
  }

  if (!hasSession) return null;

  const onFiles = (list: FileList | null) => {
    if (!list || !list.length || uploading) return;
    void upload(Array.from(list), targetFolder);
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        id="docs-upload-input"
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={Boolean(uploading)}
        onClick={() => inputRef.current?.click()}
        className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition-all ${focusRing} ${
          drag ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-blue-950'
        }`}
      >
        <CloudArrowUpIcon className="mx-auto mb-2 h-10 w-10 text-slate-400" />
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t('upload.dropTitle')}</span>
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{t('upload.dropHint')}</span>
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{t('upload.toFolder', { folder: folderLabel(targetFolder) })}</span>
      </button>
      {uploading && (
        <div className="mt-3" role="status" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className={`h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ${uploading.phase === 'process' ? 'animate-pulse' : ''}`} style={{ width: `${uploading.phase === 'process' ? 100 : uploading.pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {uploading.phase === 'process'
              ? t('upload.processing', { name: uploading.name, index: uploading.index, total: uploading.total })
              : t('upload.progress', { name: uploading.name, index: uploading.index, total: uploading.total, pct: uploading.pct })}
          </p>
        </div>
      )}
    </div>
  );
}
