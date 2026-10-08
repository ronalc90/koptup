'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  CATALOG,
  CREDIT_CONCEPTS,
  DEBIT_CONCEPTS,
  SAMPLE_CLIENTS,
  type BillingDoc,
  type DocLine,
  type Party,
} from './data';
import { docTotals, invoiceBalance, returnedQty } from './docs';
import { referenceableInvoices, type Draft, type DraftClient, type DraftIssue } from './draft';
import {
  checkNit,
  formatCOP,
  formatNit,
  lineBase,
  RETE_CONCEPTS,
  TAX_CATEGORIES,
  TAX_RATE,
  type Totals,
} from './fiscal';
import { Field, inputCls, labelCls } from './ui';

type SetDraft = (fn: (d: Draft) => Draft) => void;

// ---------- Adquirente ----------

export function BuyerForm({ draft, setDraft, docs }: { draft: Draft; setDraft: SetDraft; docs: BillingDoc[] }) {
  const t = useTranslations('demoBilling');
  const c = draft.client;
  const [autofilled, setAutofilled] = useState(false);
  const known = useMemo(() => {
    const map = new Map<string, Party>();
    SAMPLE_CLIENTS.forEach((p) => map.set(p.idNumber, p));
    docs.forEach((d) => d.client.idType === 'NIT' && !map.has(d.client.idNumber) && map.set(d.client.idNumber, d.client));
    return map;
  }, [docs]);
  const set = (patch: Partial<DraftClient>) => setDraft((d) => ({ ...d, client: { ...d.client, ...patch } }));

  const fromParty = (p: Party): Partial<DraftClient> => ({
    idType: 'NIT',
    idRaw: `${p.idNumber}-${p.dv}`,
    name: p.name,
    email: p.email,
    city: p.city,
    retIva: p.retIva,
    retIcaPerMil: p.retIcaPerMil,
  });

  const onIdChange = (value: string) => {
    const patch: Partial<DraftClient> = { idRaw: value };
    let filled = false;
    if (c.idType === 'NIT') {
      const chk = checkNit(value);
      const p = chk.state === 'ok' ? known.get(chk.digits) : undefined;
      if (p && !c.name.trim()) {
        Object.assign(patch, fromParty(p), { idRaw: value });
        filled = true;
      }
    }
    setAutofilled(filled);
    set(patch);
  };

  const chk = c.idType === 'NIT' ? checkNit(c.idRaw) : null;
  const nitHint =
    chk && chk.state !== 'empty' ? (
      <p
        className={
          'mt-1 text-xs flex items-center gap-1 ' +
          (chk.state === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')
        }
      >
        {chk.state === 'ok' ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
        <span>{t(`form.nitState.${chk.state}`, { dv: chk.state === 'ok' ? chk.dv : chk.expectedDv })}</span>
        {(chk.state === 'missingDv' || chk.state === 'badDv') && (
          <button
            type="button"
            className="ml-1 underline font-medium"
            onClick={() => onIdChange(`${chk.digits}-${chk.expectedDv}`)}
          >
            {t('form.useDv', { dv: chk.expectedDv })}
          </button>
        )}
      </p>
    ) : (
      <p className="mt-1 text-xs text-secondary-500">{c.idType === 'NIT' ? t('form.nitHelp') : t('form.ccHelp')}</p>
    );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('form.frequent')} htmlFor="fe-frequent">
          <select
            id="fe-frequent"
            className={inputCls}
            value=""
            onChange={(e) => {
              const p = SAMPLE_CLIENTS.find((x) => x.idNumber === e.target.value);
              if (p) {
                set(fromParty(p));
                setAutofilled(false);
              }
            }}
          >
            <option value="">{t('form.frequentPlaceholder')}</option>
            {SAMPLE_CLIENTS.map((p) => (
              <option key={p.idNumber} value={p.idNumber}>
                {p.name} · {formatNit(p.idNumber, p.dv)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('form.idType')} htmlFor="fe-idtype">
          <select
            id="fe-idtype"
            className={inputCls}
            value={c.idType}
            onChange={(e) => set({ idType: e.target.value as DraftClient['idType'], idRaw: '', retIva: false, retIcaPerMil: 0 })}
          >
            <option value="NIT">{t('form.idTypes.NIT')}</option>
            <option value="CC">{t('form.idTypes.CC')}</option>
          </select>
        </Field>
        <Field label={c.idType === 'NIT' ? t('form.nit') : t('form.cc')} htmlFor="fe-id" hint={nitHint}>
          <input
            id="fe-id"
            className={inputCls}
            inputMode="numeric"
            autoComplete="off"
            placeholder={c.idType === 'NIT' ? '901234517-9' : '1020304050'}
            value={c.idRaw}
            onChange={(e) => onIdChange(e.target.value)}
          />
          {autofilled && <p className="mt-1 text-xs text-primary-600 dark:text-primary-300">{t('form.nitAutofill')}</p>}
        </Field>
        <Field label={t('form.name')} htmlFor="fe-name">
          <input
            id="fe-name"
            className={inputCls}
            placeholder={t('form.namePlaceholder')}
            value={c.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label={t('form.email')} htmlFor="fe-email">
          <input
            id="fe-email"
            type="email"
            className={inputCls}
            placeholder="facturas@cliente.example"
            value={c.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </Field>
        <Field label={t('form.city')} htmlFor="fe-city">
          <input
            id="fe-city"
            className={inputCls}
            placeholder={t('form.cityPlaceholder')}
            value={c.city}
            onChange={(e) => set({ city: e.target.value })}
          />
        </Field>
      </div>
      {c.idType === 'NIT' && draft.type === 'factura' && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-2 text-sm text-secondary-700 dark:text-secondary-200">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={c.retIva} onChange={(e) => set({ retIva: e.target.checked })} />
            {t('form.retIva')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={c.retIcaPerMil > 0}
              onChange={(e) => set({ retIcaPerMil: e.target.checked ? 9.66 : 0 })}
            />
            {t('form.retIca')}
          </label>
          {c.retIcaPerMil > 0 && (
            <label className="inline-flex items-center gap-2">
              <span className="text-xs">{t('form.retIcaRate')}</span>
              <input
                type="number"
                min={0.1}
                max={30}
                step={0.01}
                className={inputCls + ' w-24'}
                value={c.retIcaPerMil}
                onChange={(e) => set({ retIcaPerMil: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Líneas ----------

export function LinesEditor({ draft, setDraft, showRete }: { draft: Draft; setDraft: SetDraft; showRete: boolean }) {
  const t = useTranslations('demoBilling');
  const update = (id: string, patch: Partial<DocLine>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const add = (line: Omit<DocLine, 'id'>) =>
    setDraft((d) => {
      const n = d.lines.reduce((m, l) => Math.max(m, Number(l.id.split('-l')[1]) || 0), 0) + 1;
      return { ...d, lines: [...d.lines, { ...line, id: `draft-l${n}` }] };
    });
  const remove = (id: string) => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">{t('form.lines')}</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto min-w-0">
          <select
            aria-label={t('form.addFromCatalog')}
            className={inputCls + ' py-1.5 flex-1 min-w-0 sm:w-72 sm:flex-none'}
            value=""
            onChange={(e) => {
              const item = CATALOG.find((x) => x.id === e.target.value);
              if (item) add({ description: item.description, qty: 1, unitPrice: item.unitPrice, tax: item.tax, rete: showRete ? item.rete : 'none' });
            }}
          >
            <option value="">{t('form.addFromCatalog')}</option>
            {CATALOG.map((item) => (
              <option key={item.id} value={item.id}>
                {item.description} · {formatCOP(item.unitPrice)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => add({ description: '', qty: 1, unitPrice: 0, tax: 'iva19', rete: 'none' })}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-600 text-primary-600 text-sm hover:bg-primary-50 dark:hover:bg-primary-950"
          >
            <PlusIcon className="w-4 h-4" /> {t('form.addLine')}
          </button>
        </div>
      </div>
      {draft.lines.length === 0 && <p className="text-sm text-secondary-500 py-3">{t('form.noLines')}</p>}
      <div className="space-y-2">
        {draft.lines.map((l, i) => {
          const base = lineBase(l);
          return (
            <div key={l.id} className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary-500 w-5 flex-shrink-0">{i + 1}</span>
                <input
                  className={inputCls}
                  aria-label={t('form.line.descriptionN', { n: i + 1 })}
                  placeholder={t('form.line.description')}
                  value={l.description}
                  onChange={(e) => update(l.id, { description: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  aria-label={t('form.removeLine', { n: i + 1 })}
                  className="p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className={'mt-2 grid grid-cols-2 gap-2 ' + (showRete ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
                <div>
                  <label className={labelCls} htmlFor={`${l.id}-qty`}>{t('form.line.qty')}</label>
                  <input
                    id={`${l.id}-qty`}
                    type="number"
                    min={1}
                    step={1}
                    className={inputCls}
                    value={l.qty}
                    onChange={(e) => update(l.id, { qty: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${l.id}-price`}>{t('form.line.unitPrice')}</label>
                  <input
                    id={`${l.id}-price`}
                    type="number"
                    min={0}
                    step={1000}
                    className={inputCls}
                    value={l.unitPrice}
                    onChange={(e) => update(l.id, { unitPrice: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${l.id}-tax`}>{t('form.line.tax')}</label>
                  <select
                    id={`${l.id}-tax`}
                    className={inputCls}
                    value={l.tax}
                    onChange={(e) => update(l.id, { tax: e.target.value as DocLine['tax'] })}
                  >
                    {TAX_CATEGORIES.map((k) => (
                      <option key={k} value={k}>
                        {t(`taxOptions.${k}`)}
                      </option>
                    ))}
                  </select>
                </div>
                {showRete && (
                  <div>
                    <label className={labelCls} htmlFor={`${l.id}-rete`}>{t('form.line.rete')}</label>
                    <select
                      id={`${l.id}-rete`}
                      className={inputCls}
                      value={l.rete}
                      onChange={(e) => update(l.id, { rete: e.target.value as DocLine['rete'] })}
                    >
                      {RETE_CONCEPTS.map((k) => (
                        <option key={k} value={k}>
                          {t(`reteOptions.${k}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="mt-2 text-right text-xs text-secondary-600 dark:text-secondary-300 tabular-nums">
                {t('form.line.base')}: {formatCOP(base)} · IVA: {formatCOP(Math.round(base * TAX_RATE[l.tax]))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Pago ----------

export function PaymentFields({ draft, setDraft, allowCredit }: { draft: Draft; setDraft: SetDraft; allowCredit: boolean }) {
  const t = useTranslations('demoBilling');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {allowCredit && (
        <Field label={t('form.paymentForm')} htmlFor="fe-payform">
          <select
            id="fe-payform"
            className={inputCls}
            value={draft.paymentForm}
            onChange={(e) => setDraft((d) => ({ ...d, paymentForm: e.target.value as Draft['paymentForm'] }))}
          >
            <option value="contado">{t('form.paymentForms.contado')}</option>
            <option value="credito">{t('form.paymentForms.credito')}</option>
          </select>
        </Field>
      )}
      {allowCredit && draft.paymentForm === 'credito' && (
        <Field label={t('form.creditDays')} htmlFor="fe-days">
          <select
            id="fe-days"
            className={inputCls}
            value={draft.creditDays}
            onChange={(e) => setDraft((d) => ({ ...d, creditDays: Number(e.target.value) }))}
          >
            {[15, 30, 45, 60, 90].map((n) => (
              <option key={n} value={n}>
                {t('form.daysN', { n })}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={t('form.paymentMethod')} htmlFor="fe-paymethod">
        <select
          id="fe-paymethod"
          className={inputCls}
          value={draft.paymentMethod}
          onChange={(e) => setDraft((d) => ({ ...d, paymentMethod: e.target.value as Draft['paymentMethod'] }))}
        >
          <option value="transferencia">{t('form.paymentMethods.transferencia')}</option>
          <option value="efectivo">{t('form.paymentMethods.efectivo')}</option>
          <option value="tarjeta">{t('form.paymentMethods.tarjeta')}</option>
        </select>
      </Field>
    </div>
  );
}

// ---------- Notas crédito y débito ----------

export function NoteForm({ draft, setDraft, docs }: { draft: Draft; setDraft: SetDraft; docs: BillingDoc[] }) {
  const t = useTranslations('demoBilling');
  const invoices = useMemo(() => referenceableInvoices(docs), [docs]);
  const ref = invoices.find((d) => d.id === draft.refId);
  const concepts = draft.type === 'notaCredito' ? CREDIT_CONCEPTS : DEBIT_CONCEPTS;
  const conceptKey = draft.type === 'notaCredito' ? 'creditConcepts' : 'debitConcepts';
  const done = ref ? returnedQty(ref, docs) : {};
  const lineMode = draft.type === 'notaCredito' && (draft.concept === '1' || draft.concept === '2');

  return (
    <div className="space-y-3">
      <p className="text-xs text-secondary-500 dark:text-secondary-400">{t(draft.type === 'notaCredito' ? 'note.helpCredit' : 'note.helpDebit')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('note.ref')} htmlFor="fe-ref">
          <select
            id="fe-ref"
            className={inputCls}
            value={draft.refId}
            onChange={(e) => setDraft((d) => ({ ...d, refId: e.target.value, returnQty: {} }))}
          >
            <option value="">{invoices.length ? t('note.refPlaceholder') : t('note.noInvoices')}</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {t('note.refOption', { id: inv.id, client: inv.client.name, balance: formatCOP(invoiceBalance(inv, docs)) })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('note.concept')} htmlFor="fe-concept">
          <select
            id="fe-concept"
            className={inputCls}
            value={draft.concept}
            onChange={(e) => setDraft((d) => ({ ...d, concept: e.target.value, returnQty: {} }))}
          >
            <option value="">{t('note.conceptPlaceholder')}</option>
            {concepts.map((c) => (
              <option key={c} value={c}>
                {t(`${conceptKey}.${c}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {ref && (
        <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 p-3 text-sm text-secondary-700 dark:text-secondary-200 flex flex-wrap gap-x-4 gap-y-1">
          <span>{t('note.refClient', { client: ref.client.name })}</span>
          <span>{t('note.refTotal', { total: formatCOP(docTotals(ref).total) })}</span>
          <span className="font-medium">{t('note.balance', { balance: formatCOP(invoiceBalance(ref, docs)) })}</span>
        </div>
      )}
      {ref && draft.concept === '1' && draft.type === 'notaCredito' && (
        <div>
          <p className={labelCls}>{t('note.returnTitle')}</p>
          <div className="space-y-2">
            {ref.lines.map((l) => {
              const max = l.qty - (done[l.id] || 0);
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-lg border border-secondary-200 dark:border-secondary-700 p-2">
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="truncate text-secondary-900 dark:text-white">{l.description}</p>
                    <p className="text-xs text-secondary-500">
                      {formatCOP(l.unitPrice)} · {t('note.available', { n: max })}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    aria-label={t('note.returnQtyFor', { item: l.description })}
                    className={inputCls + ' w-20'}
                    value={draft.returnQty[l.id] || 0}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        returnQty: { ...d.returnQty, [l.id]: Math.max(0, Math.round(Number(e.target.value) || 0)) },
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {ref && draft.concept === '2' && draft.type === 'notaCredito' && (
        <p className="text-sm rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3">
          {t('note.fullVoid', { total: formatCOP(docTotals(ref).total) })}
        </p>
      )}
      {ref && draft.concept && !lineMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('note.adjustBase')} htmlFor="fe-adjbase">
            <input
              id="fe-adjbase"
              type="number"
              min={0}
              step={1000}
              className={inputCls}
              value={draft.adjustBase}
              onChange={(e) => setDraft((d) => ({ ...d, adjustBase: Math.max(0, Math.round(Number(e.target.value) || 0)) }))}
            />
          </Field>
          <Field label={t('note.adjustTax')} htmlFor="fe-adjtax">
            <select
              id="fe-adjtax"
              className={inputCls}
              value={draft.adjustTax}
              onChange={(e) => setDraft((d) => ({ ...d, adjustTax: e.target.value as Draft['adjustTax'] }))}
            >
              {TAX_CATEGORIES.map((k) => (
                <option key={k} value={k}>
                  {t(`taxOptions.${k}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {ref && draft.concept && (
        <Field label={t('note.description')} htmlFor="fe-note">
          <textarea
            id="fe-note"
            rows={2}
            className={inputCls}
            placeholder={t('note.descriptionPlaceholder')}
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />
        </Field>
      )}
    </div>
  );
}

// ---------- POS ----------

export function PosBuyer({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const t = useTranslations('demoBilling');
  return (
    <div className="space-y-2">
      <p className="text-xs text-secondary-500 dark:text-secondary-400">
        {t('pos.help')}{' '}
        <Link href="/demo/pos" className="text-primary-600 hover:underline">
          {t('pos.linkPos')}
        </Link>
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-secondary-700 dark:text-secondary-200">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="fe-posbuyer" checked={!draft.posWithBuyer} onChange={() => setDraft((d) => ({ ...d, posWithBuyer: false }))} />
          {t('pos.finalConsumer')}
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="fe-posbuyer" checked={draft.posWithBuyer} onChange={() => setDraft((d) => ({ ...d, posWithBuyer: true }))} />
          {t('pos.withBuyer')}
        </label>
      </div>
    </div>
  );
}

// ---------- Totales ----------

export function TotalsSummary({ totals, showRete }: { totals: Totals; showRete: boolean }) {
  const t = useTranslations('demoBilling');
  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 p-4 text-sm">
      <dl className="space-y-1 tabular-nums">
        <div className="flex justify-between gap-3">
          <dt className="text-secondary-600 dark:text-secondary-300">{t('summary.subtotal')}</dt>
          <dd className="whitespace-nowrap text-secondary-900 dark:text-white">{formatCOP(totals.subtotal)}</dd>
        </div>
        {TAX_CATEGORIES.filter((k) => totals.byTax[k].base > 0).map((k) => (
          <div key={k} className="flex justify-between gap-3 text-xs">
            <dt className="text-secondary-500 dark:text-secondary-400">
              {t('summary.base', { tax: t(`taxOptions.${k}`) })}
              {totals.byTax[k].tax > 0 && ` → IVA ${formatCOP(totals.byTax[k].tax)}`}
            </dt>
            <dd className="whitespace-nowrap text-secondary-700 dark:text-secondary-200">{formatCOP(totals.byTax[k].base)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3">
          <dt className="text-secondary-600 dark:text-secondary-300">{t('summary.ivaTotal')}</dt>
          <dd className="whitespace-nowrap text-secondary-900 dark:text-white">{formatCOP(totals.iva)}</dd>
        </div>
        <div className="flex justify-between gap-3 pt-1 border-t border-secondary-200 dark:border-secondary-700 text-base font-bold">
          <dt className="text-secondary-900 dark:text-white">{t('summary.total')}</dt>
          <dd className="whitespace-nowrap text-primary-700 dark:text-primary-300">{formatCOP(totals.total)}</dd>
        </div>
      </dl>
      {showRete && (
        <div className="mt-3 pt-3 border-t border-dashed border-secondary-300 dark:border-secondary-600">
          <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-200">{t('summary.retTitle')}</p>
          <dl className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs tabular-nums">
            <div className="flex justify-between gap-3">
              <dt className="text-secondary-500">{t('summary.retFuente')}</dt>
              <dd className="whitespace-nowrap">{formatCOP(totals.rete.fuente)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-secondary-500">{t('summary.retIva')}</dt>
              <dd className="whitespace-nowrap">{formatCOP(totals.rete.iva)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-secondary-500">{t('summary.retIca')}</dt>
              <dd className="whitespace-nowrap">{formatCOP(totals.rete.ica)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <dt className="text-secondary-700 dark:text-secondary-200">{t('summary.net')}</dt>
              <dd className="whitespace-nowrap">{formatCOP(totals.netEstimate)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">{t('summary.retNote')}</p>
        </div>
      )}
    </div>
  );
}

// ---------- Validaciones previas ----------

export function IssuesList({ issues }: { issues: DraftIssue[] }) {
  const t = useTranslations('demoBilling');
  if (issues.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
      <p className="font-medium">{t('issues.title')}</p>
      <ul className="mt-1 list-disc pl-5 space-y-0.5">
        {issues.map((iss, i) => {
          const { key, ...rest } = iss;
          const params = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, k === 'balance' ? formatCOP(v as number) : (v as string | number)]),
          );
          return <li key={i}>{t(`issues.${key}`, params)}</li>;
        })}
      </ul>
    </div>
  );
}
