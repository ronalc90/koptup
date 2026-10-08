'use client';

/**
 * Receta y órdenes dentro de la consulta: diagnóstico CIE-10 con buscador, medicamentos
 * (con alerta de alergias), órdenes de laboratorio, firma (simulada), PDF y envío (simulado).
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CIE10, DEMO_DATE, IPS, LAB_ORDERS, MED_PRESETS, PROFESSIONAL } from './mockData';
import { allergyConflicts, fmtDate, normalize, payerOf, tx } from './logic';
import { makePdf } from './pdf';
import { SimTag, useDateNames, useLoc } from './ui';
import type { Cie10, Patient, Prescription, RxMed } from './types';

export interface ConsultDraft {
  dx: Cie10 | null;
  meds: RxMed[];
  orders: string[];
  rx: Prescription | null;
  rxSent: boolean;
}

export const EMPTY_DRAFT: ConsultDraft = { dx: null, meds: [], orders: [], rx: null, rxSent: false };

interface Props {
  patient: Patient;
  draft: ConsultDraft;
  onChange: (d: ConsultDraft) => void;
  onSign: () => void;
  onUnsign: () => void;
  onSend: () => void;
  onDx: (dx: Cie10) => void;
  notify: (text: string, tone?: 'ok' | 'warn') => void;
}

export default function PrescriptionEditor({ patient, draft, onChange, onSign, onUnsign, onSend, onDx, notify }: Props) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const [q, setQ] = useState('');
  const [seq, setSeq] = useState(1);
  const locked = !!draft.rx;

  const matches = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return CIE10.slice(0, 6);
    return CIE10.filter((c) => normalize(c.code).includes(n) || normalize(c.label[loc]).includes(n)).slice(0, 8);
  }, [q, loc]);

  const conflicts = allergyConflicts(patient, draft.meds);
  const missingNames = draft.meds.some((m) => !m.name.trim());
  const canSign = !!draft.dx && (draft.meds.length > 0 || draft.orders.length > 0) && conflicts.length === 0 && !missingNames;

  function addMed(presetId?: string) {
    const p = MED_PRESETS.find((m) => m.id === presetId);
    const id = `m${seq}`;
    setSeq((s) => s + 1);
    onChange({
      ...draft,
      meds: [
        ...draft.meds,
        p
          ? { id, name: p.name[loc], dose: p.dose[loc], freq: p.freq[loc], duration: p.duration[loc], instructions: p.instructions[loc] }
          : { id, name: '', dose: '', freq: '', duration: '', instructions: '' },
      ],
    });
  }

  function updateMed(id: string, k: keyof RxMed, v: string) {
    onChange({ ...draft, meds: draft.meds.map((m) => (m.id === id ? { ...m, [k]: v } : m)) });
  }

  function toggleOrder(id: string) {
    onChange({ ...draft, orders: draft.orders.includes(id) ? draft.orders.filter((o) => o !== id) : [...draft.orders, id] });
  }

  async function downloadPdf() {
    if (!draft.rx || !draft.dx) return;
    await makePdf({
      filename: `${draft.rx.number}.pdf`,
      title: t('rx.pdf.title'),
      subtitle: `${draft.rx.number} · ${fmtDate(DEMO_DATE, loc, names, { year: true })} ${draft.rx.signedAt}`,
      sample: t('pdf.sample'),
      ipsLine: t('pdf.ipsLine', { nit: IPS.nit, city: IPS.city[loc] }),
      sections: [
        {
          heading: t('rx.pdf.patient'),
          rows: [
            [t('rx.pdf.name'), patient.name],
            [t('rx.pdf.doc'), `${patient.docType} ${patient.doc}`],
            [t('rx.pdf.age'), `${patient.age} ${t('record.years')}`],
            [t('rx.pdf.payer'), tx(payerOf(patient.payerId).name, loc)],
            [t('rx.pdf.dx'), `${draft.dx.code} · ${draft.dx.label[loc]}`],
          ],
        },
        ...(draft.meds.length
          ? [
              {
                heading: t('rx.pdf.meds'),
                table: {
                  head: [t('rx.med'), t('rx.dose'), t('rx.freq'), t('rx.duration'), t('rx.instructions')],
                  rows: draft.meds.map((m) => [m.name, m.dose, m.freq, m.duration, m.instructions]),
                  widths: [52, 22, 30, 20, 56],
                },
              },
            ]
          : []),
        ...(draft.orders.length
          ? [{ heading: t('rx.pdf.orders'), paragraphs: draft.orders.map((o) => `• ${tx(LAB_ORDERS.find((x) => x.id === o)?.label, loc)}`) }]
          : []),
      ],
      signature: { name: PROFESSIONAL.name, detail: t('rx.pdf.signature', { reg: PROFESSIONAL.reg, time: draft.rx.signedAt }) },
      footer: t('pdf.footer'),
    });
    notify(t('toasts.pdf', { name: `${draft.rx.number}.pdf` }));
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Diagnóstico */}
      <div>
        <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-100 mb-1.5">{t('rx.dx')}</p>
        {draft.dx ? (
          <div className="flex items-start justify-between gap-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-2">
            <p className="text-xs text-emerald-900 dark:text-emerald-100">
              <span className="font-mono font-semibold">{draft.dx.code}</span> · {draft.dx.label[loc]}
            </p>
            {!locked && (
              <button
                type="button"
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline shrink-0"
                onClick={() => onChange({ ...draft, dx: null })}
              >
                {t('rx.changeDx')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('rx.dxSearch')} aria-label={t('rx.dxSearch')} />
            </div>
            <ul className="max-h-40 overflow-y-auto rounded-lg border border-secondary-200 dark:border-secondary-700 divide-y divide-secondary-100 dark:divide-secondary-800">
              {matches.length === 0 && <li className="p-2 text-xs text-secondary-500">{t('rx.dxNone')}</li>}
              {matches.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onDx(c);
                      setQ('');
                    }}
                    className="w-full text-left p-2 text-xs hover:bg-secondary-50 dark:hover:bg-secondary-800"
                  >
                    <span className="font-mono font-semibold text-secondary-900 dark:text-white">{c.code}</span>{' '}
                    <span className="text-secondary-600 dark:text-secondary-300">{c.label[loc]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Medicamentos */}
      <div>
        <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-100 mb-1.5">{t('rx.meds')}</p>
        {draft.meds.length === 0 && <p className="text-xs text-secondary-500 dark:text-secondary-400 italic mb-2">{t('rx.noMeds')}</p>}
        <div className="space-y-2">
          {draft.meds.map((m) => (
            <div
              key={m.id}
              className="p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/60 dark:bg-secondary-800/40 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <Input
                  value={m.name}
                  onChange={(e) => updateMed(m.id, 'name', e.target.value)}
                  placeholder={t('rx.medPh')}
                  aria-label={t('rx.med')}
                  disabled={locked}
                />
                {!locked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ ...draft, meds: draft.meds.filter((x) => x.id !== m.id) })}
                    aria-label={t('rx.remove')}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Input
                  value={m.dose}
                  onChange={(e) => updateMed(m.id, 'dose', e.target.value)}
                  placeholder={t('rx.dose')}
                  aria-label={t('rx.dose')}
                  disabled={locked}
                />
                <Input
                  value={m.freq}
                  onChange={(e) => updateMed(m.id, 'freq', e.target.value)}
                  placeholder={t('rx.freq')}
                  aria-label={t('rx.freq')}
                  disabled={locked}
                />
                <Input
                  value={m.duration}
                  onChange={(e) => updateMed(m.id, 'duration', e.target.value)}
                  placeholder={t('rx.duration')}
                  aria-label={t('rx.duration')}
                  disabled={locked}
                />
              </div>
              <Input
                value={m.instructions}
                onChange={(e) => updateMed(m.id, 'instructions', e.target.value)}
                placeholder={t('rx.instructions')}
                aria-label={t('rx.instructions')}
                disabled={locked}
              />
            </div>
          ))}
        </div>
        {!locked && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MED_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addMed(p.id)}
                className="text-[11px] px-2 py-1 rounded-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 hover:border-primary-400 hover:text-primary-600"
              >
                + {p.name[loc].split(' ')[0]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => addMed()}
              className="text-[11px] px-2 py-1 rounded-full border border-dashed border-secondary-400 text-secondary-700 dark:text-secondary-200 hover:border-primary-400 inline-flex items-center gap-1"
            >
              <PlusIcon className="w-3 h-3" /> {t('rx.blankMed')}
            </button>
          </div>
        )}
        {conflicts.length > 0 && (
          <div
            role="alert"
            className="mt-2 flex gap-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-2 text-xs text-red-800 dark:text-red-200"
          >
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
            <p>{t('rx.allergyAlert', { classes: conflicts.map((c) => t(`rx.allergyClass.${c}`)).join(', ') })}</p>
          </div>
        )}
      </div>

      {/* Órdenes */}
      <div>
        <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-100 mb-1.5">{t('rx.orders')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {LAB_ORDERS.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-xs text-secondary-700 dark:text-secondary-200 cursor-pointer">
              <input type="checkbox" checked={draft.orders.includes(o.id)} onChange={() => toggleOrder(o.id)} disabled={locked} className="rounded" />
              {o.label[loc]}
            </label>
          ))}
        </div>
      </div>

      {/* Firma */}
      {!draft.rx ? (
        <div className="space-y-1.5">
          <Button fullWidth onClick={onSign} disabled={!canSign}>
            <CheckBadgeIcon className="w-4 h-4 mr-1" /> {t('rx.sign')}
          </Button>
          {!canSign && <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('rx.signHint')}</p>}
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-emerald-900 dark:text-emerald-100">
              <CheckBadgeIcon className="w-4 h-4 inline -mt-0.5 mr-1" />
              {t('rx.signedBy', { number: draft.rx.number, name: PROFESSIONAL.name, time: draft.rx.signedAt })}
            </p>
            <SimTag>{t('common.simulated')}</SimTag>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <Button size="sm" variant="outline" onClick={downloadPdf}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onSend} disabled={draft.rxSent}>
              <PaperAirplaneIcon className="w-4 h-4 mr-1" /> {draft.rxSent ? t('rx.sent') : t('rx.send')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onUnsign}>
              <PencilSquareIcon className="w-4 h-4 mr-1" /> {t('rx.edit')}
            </Button>
          </div>
          <p className="text-[10px] text-emerald-800/80 dark:text-emerald-200/80">{t('rx.signNote')}</p>
        </div>
      )}
    </div>
  );
}
