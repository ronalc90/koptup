'use client';

/**
 * UploadDemo — modo "Prueba con tu documento" de /demo/chatbot.
 *
 * Flujo:
 *  1. Consulta el estado del backend (`GET /api/demo-rag/status`). Si la demo
 *     está apagada (DEMO_UPLOAD_ENABLED, Redis u OpenAI) o se agotó el
 *     presupuesto del mes, muestra el aviso y "Agenda una demo con nosotros".
 *  2. Formulario: archivo (PDF/DOCX/TXT, 5 MB, 30 páginas), email y la casilla
 *     de autorización de datos (Ley 1581 de 2012) con enlace a /privacy.
 *  3. Chat sobre el documento: contador x/10, citas de página o fragmento y
 *     aviso de que el documento se borra en 1 hora.
 *
 * La demo con el documento de ejemplo (modo Playground) sigue sin registro.
 * Solo se guarda en sessionStorage el id del documento para retomarlo si la
 * pestaña se recarga (el contenido vive en la memoria del backend, 1 hora).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { trackDemoUpload } from '../demoEvents';
import {
  DEFAULT_DEMO_LIMITS,
  deleteDemoDocument,
  getDemoDocument,
  getDemoStatus,
  type DemoDisabledReason,
  type DemoDocument,
  type DemoLimits,
} from './api';
import UploadForm from './UploadForm';
import DocumentChat from './DocumentChat';

const DOC_SESSION_KEY = 'koptup.demoRag.docId';

type View =
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: DemoDisabledReason }
  | { kind: 'form' }
  | { kind: 'chat'; doc: DemoDocument };

function readSavedDocId(): string | null {
  try {
    return window.sessionStorage.getItem(DOC_SESSION_KEY);
  } catch {
    return null;
  }
}

function saveDocId(docId: string | null): void {
  try {
    if (docId) window.sessionStorage.setItem(DOC_SESSION_KEY, docId);
    else window.sessionStorage.removeItem(DOC_SESSION_KEY);
  } catch {
    /* sessionStorage no disponible: no se puede retomar tras recargar */
  }
}

interface UploadDemoProps {
  /** Cambia al modo Playground (demo con el documento de ejemplo, sin registro). */
  onUseSample: () => void;
  /** Se llama en cada pregunta; la página dispara `demo_start` solo la primera vez. */
  onQuestion: () => void;
}

export default function UploadDemo({ onUseSample, onQuestion }: UploadDemoProps) {
  const t = useTranslations('demoChatbot.uploadDemo');
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [limits, setLimits] = useState<DemoLimits>(DEFAULT_DEMO_LIMITS);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await getDemoStatus();
      if (cancelled) return;
      if (status.limits) setLimits(status.limits);
      if (!status.enabled) {
        setView({ kind: 'unavailable', reason: status.reason ?? 'unavailable' });
        return;
      }
      const savedId = readSavedDocId();
      if (savedId) {
        try {
          const doc = await getDemoDocument(savedId);
          if (!cancelled) setView({ kind: 'chat', doc });
          return;
        } catch {
          saveDocId(null);
        }
      }
      if (!cancelled) setView({ kind: 'form' });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** FASE 7: aquí se dispara `demo_upload` (documento subido). */
  const handleUploaded = useCallback((doc: DemoDocument) => {
    saveDocId(doc.docId);
    trackDemoUpload({ fileType: doc.kind, pages: doc.pages });
    setNotice(null);
    setView({ kind: 'chat', doc });
  }, []);

  const handleUnavailable = useCallback((reason: 'budget_exhausted' | 'disabled') => {
    setView({ kind: 'unavailable', reason });
  }, []);

  const handleReset = useCallback(
    (opts?: { expired?: boolean }) => {
      if (view.kind === 'chat' && !opts?.expired) void deleteDemoDocument(view.doc.docId);
      saveDocId(null);
      setNotice(opts?.expired ? t('chat.expired') : null);
      setView({ kind: 'form' });
    },
    [t, view],
  );

  if (view.kind === 'chat') {
    return (
      <div className="flex h-[80vh] min-h-[420px] flex-col overflow-hidden md:h-auto md:min-h-0 md:flex-1">
        <DocumentChat
          key={view.doc.docId}
          doc={view.doc}
          limits={limits}
          onReset={handleReset}
          onUnavailable={handleUnavailable}
          onQuestion={onQuestion}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
              <DocumentArrowUpIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-secondary-900 dark:text-white sm:text-xl">
                {t('title')}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-secondary-600 dark:text-secondary-300">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {view.kind === 'loading' ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400" role="status">
              <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('loading')}
            </p>
          ) : null}

          {view.kind === 'unavailable' ? (
            <UnavailableCard reason={view.reason} onUseSample={onUseSample} />
          ) : null}

          {view.kind === 'form' ? (
            <>
              <div
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
                role="note"
              >
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">{t('warning.title')}</p>
                  <p className="mt-0.5 text-xs leading-relaxed">{t('warning.body')}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">
                {t('limits', {
                  maxMb: limits.maxFileMb,
                  maxPages: limits.maxPages,
                  maxQuestions: limits.maxQuestionsPerDocument,
                  maxDocs: limits.maxDocumentsPerDay,
                })}
              </p>
              <div className="mt-5">
                <UploadForm
                  limits={limits}
                  notice={notice}
                  onUploaded={handleUploaded}
                  onUnavailable={handleUnavailable}
                  onUseSample={onUseSample}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Demo apagada o sin presupuesto: aviso + "Agenda una demo con nosotros" → /contact. */
function UnavailableCard({ reason, onUseSample }: { reason: DemoDisabledReason; onUseSample: () => void }) {
  const t = useTranslations('demoChatbot.uploadDemo');
  const budget = reason === 'budget_exhausted';
  return (
    <div className="mt-6 rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-4 dark:border-secondary-700 dark:bg-secondary-800/50">
      <div className="flex items-start gap-2.5">
        <NoSymbolIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary-500 dark:text-secondary-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-secondary-900 dark:text-white">
            {budget ? t('unavailable.budgetTitle') : t('unavailable.title')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-secondary-600 dark:text-secondary-300">
            {budget ? t('unavailable.budgetBody') : t('unavailable.body')}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
          {t('cta.schedule')}
        </Link>
        <button
          type="button"
          onClick={onUseSample}
          className="inline-flex items-center justify-center rounded-lg border border-secondary-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800"
        >
          {t('cta.sample')}
        </button>
      </div>
    </div>
  );
}
