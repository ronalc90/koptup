'use client';

import { useCallback, useId, useState, type DragEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  ACCEPT_ATTRIBUTE,
  ACCEPTED_EXTENSIONS,
  DemoRagApiError,
  uploadDemoDocument,
  type DemoDocument,
  type DemoErrorCode,
  type DemoLimits,
} from './api';
import { demoErrorText, unavailableReasonFor } from './messages';

interface UploadFormProps {
  limits: DemoLimits;
  /** Aviso a mostrar arriba del formulario (p. ej. documento vencido). */
  notice?: string | null;
  onUploaded: (doc: DemoDocument) => void;
  onUnavailable: (reason: 'budget_exhausted' | 'disabled') => void;
  onUseSample: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Validación en el cliente (el backend vuelve a validar todo). */
function validateFile(file: File, limits: DemoLimits): DemoErrorCode | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'invalid_format';
  if (file.size === 0) return 'missing_file';
  if (file.size > limits.maxFileMb * 1024 * 1024) return 'file_too_large';
  return null;
}

/**
 * Formulario de "Prueba con tu documento": archivo, email y autorización de
 * tratamiento de datos (Ley 1581 de 2012). Es lo único que se pide.
 */
export default function UploadForm({ limits, notice, onUploaded, onUnavailable, onUseSample }: UploadFormProps) {
  const t = useTranslations('demoChatbot.uploadDemo');
  const ids = useId();
  const fileId = `${ids}-file`;
  const emailId = `${ids}-email`;
  const consentId = `${ids}-consent`;
  const errorId = `${ids}-error`;

  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<DemoErrorCode | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(
    (candidate: File | null | undefined) => {
      if (!candidate) return;
      const problem = validateFile(candidate, limits);
      setError(problem);
      setFile(problem ? null : candidate);
    },
    [limits],
  );

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!submitting) pickFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!file) return setError('missing_file');
    const fileProblem = validateFile(file, limits);
    if (fileProblem) return setError(fileProblem);
    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail)) return setError('invalid_email');
    if (!consent) return setError('consent_required');

    setError(null);
    setSubmitting(true);
    try {
      const doc = await uploadDemoDocument({ file, email: cleanEmail, consent });
      onUploaded(doc);
    } catch (err) {
      const code: DemoErrorCode = err instanceof DemoRagApiError ? err.code : 'unknown';
      const unavailable = unavailableReasonFor(code);
      if (unavailable) onUnavailable(unavailable);
      else setError(code);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby={error ? errorId : undefined}>
      {notice ? (
        <p className="rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-xs text-secondary-700 dark:border-secondary-700 dark:bg-secondary-800/60 dark:text-secondary-200">
          {notice}
        </p>
      ) : null}

      {/* Archivo */}
      <div>
        <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300">{t('form.fileLabel')}</span>
        <label
          htmlFor={fileId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
              : 'border-secondary-300 bg-white hover:border-primary-400 hover:bg-primary-50/50 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:bg-primary-950/30'
          }`}
        >
          {file ? (
            <>
              <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span className="max-w-full truncate text-sm font-semibold text-secondary-900 dark:text-white">
                {file.name}
              </span>
              <span className="text-[11px] text-secondary-500 dark:text-secondary-400">
                {formatSize(file.size)} · {t('form.fileChange')}
              </span>
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="h-8 w-8 text-secondary-400" aria-hidden="true" />
              <span className="text-sm">
                <span className="font-semibold text-primary-600 dark:text-primary-400">{t('form.fileCta')}</span>{' '}
                <span className="text-secondary-600 dark:text-secondary-300">{t('form.fileDrop')}</span>
              </span>
              <span className="text-[11px] text-secondary-500 dark:text-secondary-400">
                {t('form.fileHint', { maxMb: limits.maxFileMb, maxPages: limits.maxPages })}
              </span>
            </>
          )}
          <input
            id={fileId}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            disabled={submitting}
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* Email */}
      <div>
        <label htmlFor={emailId} className="text-xs font-semibold text-secondary-700 dark:text-secondary-300">
          {t('form.emailLabel')}
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error === 'invalid_email') setError(null);
          }}
          placeholder={t('form.emailPlaceholder')}
          disabled={submitting}
          className="mt-1.5 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100"
        />
        <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">{t('form.emailHint')}</p>
      </div>

      {/* Autorización de tratamiento de datos (Ley 1581 de 2012) */}
      <div className="flex items-start gap-2.5">
        <input
          id={consentId}
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (error === 'consent_required') setError(null);
          }}
          disabled={submitting}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-900"
        />
        <label htmlFor={consentId} className="text-xs leading-relaxed text-secondary-700 dark:text-secondary-300">
          {t.rich('form.consent', {
            link: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {chunks}
              </Link>
            ),
          })}
        </label>
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <ExclamationCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{demoErrorText(t, error, limits)}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? t('form.submitting') : t('form.submit')}
        </button>
        {error === 'daily_limit' ? (
          <Link
            href="/contact"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('cta.schedule')}
          </Link>
        ) : null}
      </div>

      <div className="border-t border-secondary-200 pt-4 text-xs text-secondary-600 dark:border-secondary-800 dark:text-secondary-400">
        <p>{t('form.noSignup')}</p>
        <button
          type="button"
          onClick={onUseSample}
          className="mt-1.5 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {t('cta.sample')} →
        </button>
      </div>
    </form>
  );
}
