'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { EyeIcon, PaintBrushIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { DEMO_TODAY, PREFIXES, SAMPLE_ISSUER, type BillingDoc, type Issuer } from './data';
import { docTotals, formatDate, nextNumber, qrText } from './docs';
import { draftLines, draftParty } from './draft';
import { checkNit, computeTotals, formatCOP, formatNit, isEmail, TAX_CATEGORIES, TAX_RATE } from './fiscal';
import { Field, inputCls, Modal, QrSvg, useMonths } from './ui';
import type { BillingStore } from './useBillingStore';

const MAX_LOGO_BYTES = 300 * 1024;

export function DocPreview({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const { state, draft, tab, successId } = store;
  const [editing, setEditing] = useState(false);
  const issuer = state.issuer;
  const emitted = successId ? state.docs.find((d) => d.id === successId) : undefined;

  const view = useMemo(() => {
    if (emitted) return { doc: emitted, lines: emitted.lines, client: emitted.client, totals: docTotals(emitted), number: emitted.id, pending: false };
    const type = tab === 'contingencia' ? draft.type : tab;
    const ref = draft.refId ? state.docs.find((d) => d.id === draft.refId) : undefined;
    const lines = draftLines(draft, ref, ref ? `${t(`${type === 'notaCredito' ? 'creditConcepts' : 'debitConcepts'}.${draft.concept || '1'}`).replace(/^\d+ · /, '')} · ${ref.id}` : '');
    const client = draftParty({ ...draft, type }, ref);
    const prefix = type === 'factura' ? issuer.prefix : PREFIXES[type];
    return {
      doc: undefined as BillingDoc | undefined,
      lines,
      client,
      totals: computeTotals(lines, client),
      number: `${prefix}${nextNumber(state.docs, type, prefix)}`,
      pending: true,
    };
  }, [emitted, tab, draft, state.docs, issuer.prefix, t]);

  const type = emitted ? emitted.type : tab === 'contingencia' ? draft.type : tab;
  const hasBuyer = view.client.name && (view.client.idType === 'CF' || view.client.idNumber);

  return (
    <Card variant="elevated" padding="md" className="lg:col-span-2 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-primary-600" /> {t('preview.title')}
          </h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
            {emitted ? t('preview.showing', { id: emitted.id }) : t('preview.subtitle')}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <PaintBrushIcon className="w-4 h-4 mr-1" /> {t('preview.customize')}
        </Button>
      </div>

      <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-4 text-xs space-y-3">
        <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-3 pb-3 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-start gap-2 min-w-0">
            {issuer.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={issuer.logo} alt={t('issuer.logoAlt')} className="h-10 w-auto max-w-[72px] object-contain flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-secondary-900 dark:text-white break-words">{issuer.name}</p>
              <p className="text-secondary-500">NIT {formatNit(issuer.nit, issuer.dv)} · {t('preview.issuerExtra')}</p>
              <p className="text-secondary-500 break-words">{issuer.city} · {issuer.email}</p>
            </div>
          </div>
          <div className="sm:text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 sm:max-w-[9rem]">{t(`docTypes.${type}`)}</p>
            <Badge variant="primary" size="sm" className="mt-1 font-mono">{view.number}</Badge>
            <p className="text-secondary-500 mt-1">{formatDate(emitted ? emitted.issueDate : DEMO_TODAY, months)}</p>
          </div>
        </div>
        <div>
          <p className="text-secondary-500 uppercase tracking-wide text-[10px]">{t('preview.buyer')}</p>
          {hasBuyer ? (
            <>
              <p className="font-medium text-secondary-900 dark:text-white break-words">{view.client.name}</p>
              <p className="text-secondary-500">
                {view.client.idType === 'NIT'
                  ? `NIT ${formatNit(view.client.idNumber, view.client.dv)}`
                  : view.client.idType === 'CC'
                    ? `${t('form.idTypes.CC')} ${view.client.idNumber}`
                    : view.client.idNumber}
              </p>
              {(view.client.city || view.client.email) && (
                <p className="text-secondary-500 break-words">{[view.client.city, view.client.email].filter(Boolean).join(' · ')}</p>
              )}
            </>
          ) : (
            <p className="italic text-secondary-400">{t('preview.noBuyer')}</p>
          )}
          {emitted?.refId && <p className="mt-1 text-secondary-600 dark:text-secondary-300">{t('documents.refLabel', { id: emitted.refId })}</p>}
        </div>
        <div className="space-y-1">
          {view.lines.length === 0 && <p className="italic text-secondary-400">{t('preview.noLines')}</p>}
          {view.lines.slice(0, 5).map((l) => (
            <div key={l.id} className="flex justify-between gap-2">
              <span className="truncate text-secondary-600 dark:text-secondary-300">
                {l.qty} × {l.description || '—'}
              </span>
              <span className="text-secondary-700 dark:text-secondary-200 tabular-nums whitespace-nowrap">{formatCOP(l.qty * l.unitPrice)}</span>
            </div>
          ))}
          {view.lines.length > 5 && <p className="text-secondary-400">{t('preview.more', { n: view.lines.length - 5 })}</p>}
        </div>
        <div className="pt-2 border-t border-dashed border-secondary-200 dark:border-secondary-700 space-y-0.5 tabular-nums">
          <div className="flex justify-between">
            <span className="text-secondary-500">{t('summary.subtotal')}</span>
            <span>{formatCOP(view.totals.subtotal)}</span>
          </div>
          {TAX_CATEGORIES.filter((k) => view.totals.byTax[k].tax > 0).map((k) => (
            <div key={k} className="flex justify-between">
              <span className="text-secondary-500">IVA {Math.round(TAX_RATE[k] * 100)} %</span>
              <span>{formatCOP(view.totals.byTax[k].tax)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-sm text-secondary-900 dark:text-white">
            <span>{t('summary.total')}</span>
            <span>{formatCOP(view.totals.total)}</span>
          </div>
        </div>
        <div className="pt-2 flex items-center gap-3">
          {view.doc && view.doc.cufe ? (
            <QrSvg text={qrText(view.doc, issuer)} size={84} label={t('preview.qrAlt', { id: view.doc.id })} />
          ) : (
            <div className="w-[84px] h-[84px] rounded border border-dashed border-secondary-300 dark:border-secondary-600 flex items-center justify-center text-center text-[9px] text-secondary-400 p-1 flex-shrink-0">
              {t('preview.qrPendingShort')}
            </div>
          )}
          <div className="text-[10px] text-secondary-500 dark:text-secondary-400 min-w-0">
            <p className="uppercase tracking-wide">{type === 'factura' ? t('success.cufeLabel') : t('success.cudeLabel')}</p>
            <p className="font-mono break-all">{view.doc?.cufe || t('preview.qrPending')}</p>
          </div>
        </div>
        <p className="text-[10px] text-secondary-400 pt-2 border-t border-secondary-200 dark:border-secondary-700">{t('preview.footer')}</p>
      </div>

      {editing && <IssuerModal onClose={() => setEditing(false)} issuer={issuer} onSave={store.setIssuer} />}
    </Card>
  );
}

function IssuerModal({ onClose, issuer, onSave }: { onClose: () => void; issuer: Issuer; onSave: (i: Issuer) => void }) {
  const t = useTranslations('demoBilling');
  const [form, setForm] = useState({ ...issuer, nitRaw: `${issuer.nit}-${issuer.dv}` });
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError(t('issuer.logoType'));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(t('issuer.logoTooBig'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set({ logo: String(reader.result) });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const chk = checkNit(form.nitRaw);
    if (!form.name.trim()) return setError(t('issuer.errors.name'));
    if (chk.state !== 'ok') return setError(t('issuer.errors.nit', { dv: chk.expectedDv || '?' }));
    if (!/^[A-Za-z]{2,4}$/.test(form.prefix)) return setError(t('issuer.errors.prefix'));
    if (!isEmail(form.email)) return setError(t('issuer.errors.email'));
    const { nitRaw: _nitRaw, ...rest } = form;
    void _nitRaw;
    onSave({ ...rest, name: form.name.trim(), nit: chk.digits, dv: chk.dv, prefix: form.prefix.toUpperCase() });
    toast.success(t('issuer.saved'));
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={t('issuer.title')}>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">{t('issuer.subtitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Field label={t('issuer.name')} htmlFor="fe-is-name">
            <input id="fe-is-name" className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
        </div>
        <Field label={t('issuer.nit')} htmlFor="fe-is-nit">
          <input id="fe-is-nit" className={inputCls} value={form.nitRaw} onChange={(e) => set({ nitRaw: e.target.value })} />
        </Field>
        <Field label={t('issuer.prefix')} htmlFor="fe-is-prefix" hint={<p className="mt-1 text-[11px] text-secondary-500">{t('issuer.prefixHelp')}</p>}>
          <input
            id="fe-is-prefix"
            className={inputCls}
            maxLength={4}
            value={form.prefix}
            onChange={(e) => set({ prefix: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label={t('issuer.city')} htmlFor="fe-is-city">
          <input id="fe-is-city" className={inputCls} value={form.city} onChange={(e) => set({ city: e.target.value })} />
        </Field>
        <Field label={t('issuer.address')} htmlFor="fe-is-address">
          <input id="fe-is-address" className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        <Field label={t('issuer.email')} htmlFor="fe-is-email">
          <input id="fe-is-email" type="email" className={inputCls} value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label={t('issuer.phone')} htmlFor="fe-is-phone">
          <input id="fe-is-phone" className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <p className="block text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1">{t('issuer.logo')}</p>
          <div className="flex flex-wrap items-center gap-3">
            {form.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo} alt={t('issuer.logoAlt')} className="h-12 w-auto max-w-[120px] object-contain rounded border border-secondary-200 dark:border-secondary-700" />
            ) : (
              <span className="inline-flex h-12 w-12 items-center justify-center rounded border border-dashed border-secondary-300 text-secondary-400">
                <PhotoIcon className="w-6 h-6" />
              </span>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-primary-600 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950">
              {t('issuer.logoUpload')}
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
            {form.logo && (
              <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => set({ logo: null })}>
                {t('issuer.logoRemove')}
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setForm({ ...SAMPLE_ISSUER, nitRaw: `${SAMPLE_ISSUER.nit}-${SAMPLE_ISSUER.dv}` })}>
          {t('issuer.restore')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={save}>
            {t('issuer.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
