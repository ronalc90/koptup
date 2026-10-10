'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, FingerPrintIcon, LinkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { addMinutes, fmtDateTime } from '../lib/dates';
import { acts, verifyChain } from '../lib/logic';
import { shortHash } from '../lib/sha256';
import { useFirma } from '../lib/store';
import type { Envelope } from '../lib/types';
import { Panel, SignerDot, SimNote, StatusBadge, labelCls, selectCls } from './ui';
import { actorLabel, actorWhere, eventText } from './text';
import { downloadCertificate, downloadSignedPdf } from './pdfSpecs';

export default function Evidence() {
  const t = useTranslations('demoSign');
  const { s, focusEnv, setFocusEnv, envTitle } = useFirma();
  const options = [...s.envelopes].filter((e) => e.status !== 'draft').sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const current = options.find((e) => e.id === focusEnv) ?? options[0];

  return (
    <Panel title={t('evidence.title')} subtitle={t('evidence.subtitle')}>
      {options.length === 0 ? (
        <p className="text-sm text-secondary-500">{t('evidence.empty')}</p>
      ) : (
        <>
          <div className="mb-4 max-w-xl">
            <label htmlFor="ev-env" className={labelCls}>
              {t('evidence.pick')}
            </label>
            <select id="ev-env" className={selectCls} value={current?.id} onChange={(e) => setFocusEnv(e.target.value)}>
              {options.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} · {envTitle(e)} ({t(`status.${e.status}`)})
                </option>
              ))}
            </select>
          </div>
          {current && <EvidenceView env={current} />}
        </>
      )}
    </Panel>
  );
}

export function EvidenceView({ env }: { env: Envelope }) {
  const t = useTranslations('demoSign');
  const store = useFirma();
  const { loc, envTitle, toast } = store;
  const [check, setCheck] = useState<ReturnType<typeof verifyChain> | null>(null);
  const [tamper, setTamper] = useState<{ index: number; result: ReturnType<typeof verifyChain> } | null>(null);
  const [busy, setBusy] = useState(false);

  // Cambiar de sobre o recibir eventos nuevos invalida la verificación anterior.
  useEffect(() => {
    setCheck(null);
    setTamper(null);
  }, [env.id, env.events.length]);

  const sealed = env.events.find((e) => e.type === 'sealed');
  const tamperTest = () => {
    const index = Math.min(1, env.events.length - 1);
    const altered = env.events.map((e, i) => (i === index ? { ...e, at: addMinutes(e.at, 7) } : e));
    setTamper({ index, result: verifyChain(env.doc.hash, altered) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold text-secondary-900 dark:text-white">{envTitle(env)}</p>
          <p className="text-xs text-secondary-500">{env.id}</p>
        </div>
        <StatusBadge status={env.status} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-700 dark:bg-secondary-800/50">
          <p className="flex items-center gap-1 text-xs font-medium uppercase text-secondary-500 dark:text-secondary-400">
            <FingerPrintIcon className="h-3.5 w-3.5" /> {t('evidence.docHash')}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-secondary-800 dark:text-secondary-100">{env.doc.hash}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{t(env.doc.kind === 'upload' ? 'evidence.docHashUpload' : 'evidence.docHashTemplate')}</p>
        </div>
        <div className="min-w-0 rounded-lg border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-700 dark:bg-secondary-800/50">
          <p className="flex items-center gap-1 text-xs font-medium uppercase text-secondary-500 dark:text-secondary-400">
            <ClockIcon className="h-3.5 w-3.5" /> {t('evidence.timestamp')}
          </p>
          <p className="mt-1 text-sm text-secondary-800 dark:text-secondary-100">
            {!env.timestamp
              ? t('evidence.timestampOff')
              : sealed
                ? t('evidence.timestampDone', { date: fmtDateTime(sealed.at, loc, true) })
                : t('evidence.timestampPending')}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t('evidence.timestampSim')}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary-500">{t('evidence.signers')}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {env.signers.map((x, i) => (
            <li key={x.id} className="flex min-w-0 items-start gap-2 rounded-lg border border-secondary-200 p-2 text-sm dark:border-secondary-700">
              <SignerDot index={i} />
              <div className="min-w-0">
                <p className="break-words font-medium">{x.name}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  {t(`roles.${x.role}`)} · {acts(x) ? t(`signerStates.${x.state}`) : t('signerStates.copy')}
                  {x.signedAt ? ` · ${fmtDateTime(x.signedAt, loc)}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {env.comments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary-500">{t('evidence.comments')}</p>
          <ul className="space-y-1 text-sm">
            {env.comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-secondary-200 p-2 dark:border-secondary-700">
                <span className="font-medium">{c.sample ? t(`redlines.samples.${c.sample}.author`) : actorLabel(t, c.author)}:</span>{' '}
                {c.sample ? t(`redlines.samples.${c.sample}.text`) : c.text} <span className="text-xs text-secondary-500">({t(`redlines.status.${c.status}`)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
        <p className="flex items-center gap-1 text-sm font-semibold">
          <LinkIcon className="h-4 w-4" /> {t('evidence.chainTitle')}
        </p>
        <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{t('evidence.chainHelp')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setCheck(verifyChain(env.doc.hash, env.events))} disabled={env.events.length === 0}>
            {t('evidence.verify')}
          </Button>
          <Button size="sm" variant="ghost" onClick={tamperTest} disabled={env.events.length < 2}>
            {t('evidence.tamper')}
          </Button>
        </div>
        {check && (
          <p className={`mt-2 flex items-center gap-1 text-sm ${check.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`} role="status">
            {check.ok ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationTriangleIcon className="h-4 w-4" />}
            {check.ok ? t('evidence.chainOk', { n: check.checked }) : t('evidence.chainBroken', { n: (check.brokenAt ?? 0) + 1 })}
          </p>
        )}
        {tamper && (
          <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="status">
            {t('evidence.tamperResult', {
              n: tamper.index + 1,
              event: eventText(t, env.events[tamper.index]),
              broken: (tamper.result.brokenAt ?? 0) + 1,
            })}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary-500">{t('evidence.timeline', { n: env.events.length })}</p>
        {env.events.length === 0 ? (
          <p className="text-sm text-secondary-500">{t('evidence.noEvents')}</p>
        ) : (
          <ol className="relative ml-2 space-y-3 border-l-2 border-lime-200 dark:border-lime-900">
            {env.events.map((e, i) => (
              <li key={e.id} className="ml-4">
                <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-lime-600 ring-4 ring-white dark:ring-secondary-900" aria-hidden />
                <div className="min-w-0 rounded-lg border border-secondary-200 p-2.5 dark:border-secondary-700">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="min-w-0 break-words text-sm font-medium">
                      {i + 1}. {eventText(t, e)}
                    </p>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">{fmtDateTime(e.at, loc, true)}</span>
                  </div>
                  <p className="mt-1 break-words text-xs text-secondary-600 dark:text-secondary-300">
                    {actorWhere(t, e)}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-secondary-500 dark:text-secondary-400" title={e.hash}>
                    {t('evidence.hash')}: {shortHash(e.hash, 10)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          isLoading={busy}
          disabled={busy}
          onClick={() => {
            setBusy(true);
            downloadCertificate(env, store, t)
              .then(() => toast(t('pdf.certDone')))
              .catch(() => toast(t('pdf.failed'), 'warn'))
              .finally(() => setBusy(false));
          }}
        >
          <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('evidence.downloadCert')}
        </Button>
        {env.status === 'completed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadSignedPdf(env, store, t)
                .then(() => toast(t('pdf.signedDone')))
                .catch(() => toast(t('pdf.failed'), 'warn'))
            }
          >
            <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('evidence.downloadSigned')}
          </Button>
        )}
      </div>
      <SimNote>{t('evidence.simNote')}</SimNote>
    </div>
  );
}
