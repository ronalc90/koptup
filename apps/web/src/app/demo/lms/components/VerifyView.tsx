'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckBadgeIcon, ExclamationTriangleIcon, ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ACADEMY } from '../lib/catalog';
import { decodeCert, formatNit, type CertCheck } from '../lib/engine';
import { SimNote, btn, useFmt } from './ui';

/** Página pública de verificación del certificado (lo que abre el QR). */
export default function VerifyView() {
  const t = useTranslations('demoLms.verify');
  const f = useFmt();
  const [check, setCheck] = useState<CertCheck | null>(null);

  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get('d');
    setCheck(decodeCert(d));
  }, []);

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-cyan-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950 px-4 py-10">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {ACADEMY.legalName} · NIT {formatNit(ACADEMY.nit)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm" aria-live="polite">
          {!check ? (
            <p className="text-sm text-secondary-500">{t('checking')}</p>
          ) : check.status === 'valid' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckBadgeIcon className="w-7 h-7" />
                <p className="text-lg font-bold">{t('valid')}</p>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  [t('code'), check.payload.c],
                  [t('name'), check.payload.n],
                  [t('course'), check.payload.t],
                  [t('hours'), String(check.payload.h)],
                  [t('date'), /^\d{4}-\d{2}-\d{2}$/.test(check.payload.f) ? f.date(check.payload.f, 'long') : check.payload.f],
                  [t('issuer'), check.payload.o],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
                    <dt className="text-[11px] text-secondary-500 dark:text-secondary-400">{k}</dt>
                    <dd className="font-semibold text-secondary-900 dark:text-white break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[11px] text-secondary-500 font-mono">
                {t('signature')}: {check.signature}
              </p>
            </div>
          ) : check.status === 'tampered' ? (
            <div className="flex items-start gap-2 text-red-700 dark:text-red-300">
              <XCircleIcon className="w-7 h-7 shrink-0" />
              <div>
                <p className="text-lg font-bold">{t('tampered')}</p>
                <p className="text-sm">{t('tamperedBody', { code: check.payload.c })}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
              <ExclamationTriangleIcon className="w-7 h-7 shrink-0" />
              <div>
                <p className="text-lg font-bold">{t('invalid')}</p>
                <p className="text-sm">{t('invalidBody')}</p>
              </div>
            </div>
          )}
        </div>

        <SimNote>{t('note')}</SimNote>
        <Link href="/demo/lms" className={btn.primary}>
          {t('backToDemo')}
        </Link>
      </div>
    </div>
  );
}
