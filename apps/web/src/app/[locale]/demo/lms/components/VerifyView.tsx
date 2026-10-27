'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CheckBadgeIcon, ExclamationTriangleIcon, ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ACADEMY } from '../lib/catalog';
import { certificatesFromStored, decodeCert, formatNit, registryLookup, type CertCheck, type CertPayload, type RegistryCheck } from '../lib/engine';
import { localToday } from '../lib/dates';
import { MAX_AGE_DAYS, STORAGE_KEY } from '../lib/store';
import { SimNote, btn, useFmt } from './ui';

type Outcome =
  | { kind: 'checking' }
  | { kind: 'invalid' }
  | { kind: 'tampered'; payload: CertPayload }
  | { kind: 'valid'; payload: CertPayload; signature: string }
  | { kind: 'unconfirmed'; payload: CertPayload; signature: string; otherCert: boolean }
  | { kind: 'replaced'; payload: CertPayload; by: string };

/**
 * Cruza la firma de ejemplo del enlace con el registro de certificados de la
 * demo, que vive en el navegador donde se emitieron (localStorage). Solo se
 * confirma un certificado emitido en este navegador; en un proyecto real el
 * registro está en el servidor y cualquiera puede consultarlo.
 */
function outcomeOf(check: CertCheck, registry: RegistryCheck | null): Outcome {
  if (check.status === 'invalid') return { kind: 'invalid' };
  if (check.status === 'tampered') return { kind: 'tampered', payload: check.payload };
  if (!registry || registry.status === 'none' || registry.status === 'notFound' || registry.status === 'mismatch') {
    // «mismatch» con la firma correcta: en este navegador ese código es de otro certificado de la demo
    // (cada navegador numera los suyos), no un enlace alterado.
    return { kind: 'unconfirmed', payload: check.payload, signature: check.signature, otherCert: registry?.status === 'mismatch' };
  }
  if (registry.status === 'replaced') return { kind: 'replaced', payload: check.payload, by: registry.by };
  return { kind: 'valid', payload: check.payload, signature: check.signature };
}

/** Página pública de verificación del certificado (lo que abre el QR). Funciona sin sesión. */
export default function VerifyView() {
  const t = useTranslations('demoLms.verify');
  const f = useFmt();
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'checking' });

  // Todo se lee después de montar (URL y localStorage): el HTML del servidor es siempre «Verificando…».
  useEffect(() => {
    const check = decodeCert(new URLSearchParams(window.location.search).get('d'));
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const registry = check.status === 'valid' ? registryLookup(certificatesFromStored(stored, localToday(), MAX_AGE_DAYS), check.payload) : null;
    setOutcome(outcomeOf(check, registry));
  }, []);

  const details = (p: CertPayload) => (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      {[
        [t('code'), p.c],
        [t('name'), p.n],
        [t('course'), p.t],
        [t('hours'), String(p.h)],
        [t('date'), /^\d{4}-\d{2}-\d{2}$/.test(p.f) ? f.date(p.f, 'long') : p.f],
        [t('issuer'), p.o],
      ].map(([k, v]) => (
        <div key={k} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
          <dt className="text-[11px] text-secondary-500 dark:text-secondary-400">{k}</dt>
          <dd className="font-semibold text-secondary-900 dark:text-white break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-cyan-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950 px-4 py-10">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {ACADEMY.legalName} · NIT {formatNit(ACADEMY.nit)} · {t('sampleAcademy')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm" aria-live="polite">
          {outcome.kind === 'checking' ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('checking')}</p>
          ) : outcome.kind === 'valid' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckBadgeIcon className="w-7 h-7 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-lg font-bold">{t('valid')}</p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">{t('validBody')}</p>
                </div>
              </div>
              {details(outcome.payload)}
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400 font-mono">
                {t('signature')}: {outcome.signature}
              </p>
            </div>
          ) : outcome.kind === 'unconfirmed' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                <ExclamationTriangleIcon className="w-7 h-7 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-lg font-bold">{t('unconfirmed')}</p>
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    {t(outcome.otherCert ? 'otherCertBody' : 'unconfirmedBody', { code: outcome.payload.c })}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-300">{t('linkData')}</p>
              {details(outcome.payload)}
            </div>
          ) : outcome.kind === 'replaced' ? (
            <div className="flex items-start gap-2 text-red-700 dark:text-red-300">
              <XCircleIcon className="w-7 h-7 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-lg font-bold">{t('replaced')}</p>
                <p className="text-sm">{t('replacedBody', { code: outcome.payload.c, by: outcome.by })}</p>
              </div>
            </div>
          ) : outcome.kind === 'tampered' ? (
            <div className="flex items-start gap-2 text-red-700 dark:text-red-300">
              <XCircleIcon className="w-7 h-7 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-lg font-bold">{t('tampered')}</p>
                <p className="text-sm">{t('tamperedBody', { code: outcome.payload.c })}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
              <ExclamationTriangleIcon className="w-7 h-7 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-lg font-bold">{t('invalid')}</p>
                <p className="text-sm">{t('invalidBody')}</p>
              </div>
            </div>
          )}
        </div>

        <SimNote>{t('note')}</SimNote>
        <div className="flex flex-wrap gap-2">
          <Link href="/demo/lms" className={btn.primary}>
            {t('backToDemo')}
          </Link>
          <Link href="/demo" className={btn.outline}>
            {t('allDemos')}
          </Link>
        </div>
      </div>
    </div>
  );
}
