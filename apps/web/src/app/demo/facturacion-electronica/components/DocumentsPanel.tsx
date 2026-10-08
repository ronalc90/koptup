'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, DocumentDuplicateIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DEMO_TODAY, DOC_TYPES, type BillingDoc, type DocStatus, type DocType, type HistoryEntry } from './data';
import { colombiaNow, cufeInput, docTotals, downloadText, formatDate, invoiceBalance, notesFor, qrText, toCsv } from './docs';
import { checkNit, formatCOP, formatNit, isEmail, sha384Hex, TAX_CATEGORIES } from './fiscal';
import { Field, inputCls, Modal, QrSvg, SectionTitle, StatusBadge, useMonths } from './ui';
import type { BillingStore } from './useBillingStore';
import { useDocActions } from './useDocActions';

type SortKey = 'newest' | 'oldest' | 'amountDesc' | 'amountAsc';

export function DocumentsPanel({ store, onStartNote }: { store: BillingStore; onStartNote: (type: 'notaCredito' | 'notaDebito', id: string) => void }) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const { state, setDetailId } = store;
  const { downloadPdf, downloadXml } = useDocActions(store);
  const [type, setType] = useState<DocType | 'all'>('all');
  const [status, setStatus] = useState<DocStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [fixId, setFixId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[.\s-]/g, '');
    const list = state.docs.filter((d) => {
      if (type !== 'all' && d.type !== type) return false;
      if (status !== 'all' && d.status !== status) return false;
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.client.name.toLowerCase().replace(/[.\s-]/g, '').includes(q) ||
        d.client.idNumber.includes(q)
      );
    });
    const key = (d: BillingDoc) => d.issueDate + d.issueTime;
    return list.sort((a, b) => {
      if (sort === 'newest') return key(b).localeCompare(key(a));
      if (sort === 'oldest') return key(a).localeCompare(key(b));
      const diff = docTotals(a).total - docTotals(b).total;
      return sort === 'amountAsc' ? diff : -diff;
    });
  }, [state.docs, type, status, query, sort]);

  const exportCsv = () => {
    const csv = toCsv([
      [t('reports.cols.date'), t('reports.cols.doc'), t('reports.cols.type'), t('reports.cols.client'), t('reports.cols.nit'), t('reports.cols.base'), t('reports.cols.iva'), t('reports.cols.total'), t('reports.cols.status'), t('reports.cols.ref'), 'CUFE/CUDE'],
      ...rows.map((d) => {
        const tt = docTotals(d);
        return [d.issueDate, d.id, t(`docTypesShort.${d.type}`), d.client.name, d.client.idType === 'NIT' ? `${d.client.idNumber}-${d.client.dv}` : d.client.idNumber, tt.subtotal, tt.iva, tt.total, t(`status.${d.status}`), d.refId || '', d.cufe];
      }),
    ]);
    downloadText(`documentos-${DEMO_TODAY}.csv`, csv, 'text/csv');
    toast.success(t('documents.exportDone', { n: rows.length }));
  };

  const rowActions = (d: BillingDoc) => {
    const isInvoice = d.type === 'factura' && d.status !== 'rejected';
    return (
      <>
        <button type="button" className="text-primary-600 hover:underline" onClick={() => setDetailId(d.id)}>
          {t('documents.actions.view')}
        </button>
        <button type="button" className="text-secondary-700 dark:text-secondary-200 hover:underline" onClick={() => downloadPdf(d)}>
          PDF
        </button>
        <button type="button" className="text-secondary-700 dark:text-secondary-200 hover:underline" onClick={() => downloadXml(d)}>
          XML
        </button>
        {isInvoice && (
          <button type="button" className="text-secondary-700 dark:text-secondary-200 hover:underline" onClick={() => onStartNote('notaCredito', d.id)}>
            {t('documents.actions.credit')}
          </button>
        )}
        {isInvoice && (
          <button type="button" className="text-secondary-700 dark:text-secondary-200 hover:underline" onClick={() => onStartNote('notaDebito', d.id)}>
            {t('documents.actions.debit')}
          </button>
        )}
        {d.status === 'rejected' && (
          <button type="button" className="text-red-600 font-medium hover:underline" onClick={() => setFixId(d.id)}>
            {t('documents.actions.fix')}
          </button>
        )}
      </>
    );
  };

  const fixDoc = fixId ? state.docs.find((d) => d.id === fixId) : undefined;
  const detail = store.detailId ? state.docs.find((d) => d.id === store.detailId) : undefined;

  return (
    <Card variant="bordered" padding="md" id="documentos">
      <SectionTitle
        icon={<DocumentDuplicateIcon className="w-5 h-5" />}
        title={t('documents.title')}
        subtitle={t('documents.subtitle')}
        right={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('documents.export')}
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            className={inputCls + ' pl-9'}
            aria-label={t('documents.search')}
            placeholder={t('documents.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select aria-label={t('documents.filters.type')} className={inputCls} value={type} onChange={(e) => setType(e.target.value as DocType | 'all')}>
          <option value="all">{t('documents.filters.allTypes')}</option>
          {DOC_TYPES.map((k) => (
            <option key={k} value={k}>
              {t(`docTypesShort.${k}`)}
            </option>
          ))}
        </select>
        <select aria-label={t('documents.filters.status')} className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as DocStatus | 'all')}>
          <option value="all">{t('documents.filters.allStatus')}</option>
          {(['accepted', 'rejected', 'contingency'] as DocStatus[]).map((k) => (
            <option key={k} value={k}>
              {t(`status.${k}`)}
            </option>
          ))}
        </select>
        <select aria-label={t('documents.sort')} className={inputCls} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {(['newest', 'oldest', 'amountDesc', 'amountAsc'] as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {t(`documents.sortOptions.${k}`)}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-secondary-500 mb-2">{t('documents.count', { n: rows.length, total: state.docs.length })}</p>
      {/* Móvil: tarjetas; escritorio: tabla. */}
      <ul className="md:hidden divide-y divide-secondary-100 dark:divide-secondary-800 border-y border-secondary-100 dark:border-secondary-800">
        {rows.length === 0 && <li className="py-6 text-center text-sm text-secondary-500">{t('documents.empty')}</li>}
        {rows.map((d) => (
          <li key={d.id} className="py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-medium text-secondary-900 dark:text-white">
                  {d.id} <span className="font-sans font-normal text-secondary-500">· {t(`docTypesShort.${d.type}`)}</span>
                </p>
                <p className="font-medium text-secondary-900 dark:text-white break-words">{d.client.name}</p>
                <p className="text-[11px] text-secondary-500">
                  {formatDate(d.issueDate, months)}
                  {d.refId ? ` · ${t('documents.refLabel', { id: d.refId })}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={'tabular-nums whitespace-nowrap font-medium ' + (d.type === 'notaCredito' ? 'text-red-600 dark:text-red-400' : '')}>
                  {d.type === 'notaCredito' ? '−' : ''}
                  {formatCOP(docTotals(d).total)}
                </p>
                <StatusBadge status={d.status} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">{rowActions(d)}</div>
          </li>
        ))}
      </ul>
      <div className="hidden md:block overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
            <tr>
              <th className="py-2 pr-3">{t('reports.cols.doc')}</th>
              <th className="py-2 pr-3">{t('reports.cols.client')}</th>
              <th className="py-2 pr-3">{t('reports.cols.date')}</th>
              <th className="py-2 pr-3 text-right">{t('reports.cols.total')}</th>
              <th className="py-2 pr-3">{t('reports.cols.status')}</th>
              <th className="py-2 text-right">{t('documents.actionsCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-secondary-500">
                  {t('documents.empty')}
                </td>
              </tr>
            )}
            {rows.map((d) => {
              const tt = docTotals(d);
              return (
                <tr key={d.id} className="align-top hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                  <td className="py-2 pr-3">
                    <p className="font-mono text-xs font-medium text-secondary-900 dark:text-white">{d.id}</p>
                    <p className="text-[11px] text-secondary-500">
                      {t(`docTypesShort.${d.type}`)}
                      {d.refId ? ` · ${t('documents.refLabel', { id: d.refId })}` : ''}
                    </p>
                  </td>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-secondary-900 dark:text-white">{d.client.name}</p>
                    <p className="text-[11px] text-secondary-500">
                      {d.client.idType === 'NIT' ? `NIT ${formatNit(d.client.idNumber, d.client.dv)}` : d.client.idNumber}
                    </p>
                  </td>
                  <td className="py-2 pr-3 text-secondary-600 dark:text-secondary-300 whitespace-nowrap">{formatDate(d.issueDate, months)}</td>
                  <td className={'py-2 pr-3 text-right tabular-nums whitespace-nowrap ' + (d.type === 'notaCredito' ? 'text-red-600 dark:text-red-400' : '')}>
                    {d.type === 'notaCredito' ? '−' : ''}
                    {formatCOP(tt.total)}
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs">
                      {rowActions(d)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {detail && (
        <DocDetailModal
          doc={detail}
          store={store}
          onClose={() => setDetailId(null)}
          onFix={() => {
            setDetailId(null);
            setFixId(detail.id);
          }}
          onStartNote={(k) => {
            setDetailId(null);
            onStartNote(k, detail.id);
          }}
        />
      )}
      {fixDoc && <FixModal doc={fixDoc} store={store} onClose={() => setFixId(null)} />}
    </Card>
  );
}

function DocDetailModal({
  doc,
  store,
  onClose,
  onFix,
  onStartNote,
}: {
  doc: BillingDoc;
  store: BillingStore;
  onClose: () => void;
  onFix: () => void;
  onStartNote: (type: 'notaCredito' | 'notaDebito') => void;
}) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const { state, updateDoc } = store;
  const { downloadPdf, downloadXml, idLabel } = useDocActions(store);
  const tt = docTotals(doc);
  const notes = doc.type === 'factura' ? notesFor(doc.id, state.docs) : [];
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [target, setTarget] = useState(doc.client.email);

  const send = () => {
    const ok = channel === 'email' ? isEmail(target) : /^\+?\d[\d\s]{6,14}$/.test(target.trim());
    if (!ok) {
      toast.error(t(channel === 'email' ? 'detail.badEmail' : 'detail.badPhone'));
      return;
    }
    const { time } = colombiaNow();
    const detail = channel === 'email' ? target.trim() : `WhatsApp ${target.trim()}`;
    updateDoc(doc.id, (d) => ({ ...d, history: [...d.history, { date: DEMO_TODAY, time: time.slice(0, 5), key: 'sent', detail }] }));
    toast.success(t('detail.sent', { to: detail }));
  };

  const historyText = (h: HistoryEntry) => t(`history.${h.key}`, { detail: h.detail || '' });

  return (
    <Modal open onClose={onClose} wide title={`${t(`docTypes.${doc.type}`)} ${doc.id}`}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={doc.status} />
          <span className="text-secondary-500">
            {t('detail.issued', { date: formatDate(doc.issueDate, months), time: doc.issueTime.slice(0, 5) })}
          </span>
          {doc.dueDate && <span className="text-secondary-500">· {t('detail.due', { date: formatDate(doc.dueDate, months) })}</span>}
        </div>
        {doc.status === 'rejected' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-red-800 dark:text-red-200">
            <p>{t('detail.rejection', { reason: t('rejection.badDv') })}</p>
            <Button size="sm" variant="danger" className="mt-2" onClick={onFix}>
              {t('documents.actions.fix')}
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-secondary-500">{t('preview.buyer')}</p>
            <p className="font-medium text-secondary-900 dark:text-white">{doc.client.name}</p>
            <p className="text-secondary-500">{idLabel(doc)}</p>
            {doc.client.email && <p className="text-secondary-500 break-words">{doc.client.email}</p>}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-secondary-500">{t('pdf.payment')}</p>
            <p>
              {t(`form.paymentForms.${doc.paymentForm}`)} · {t(`form.paymentMethods.${doc.paymentMethod}`)}
            </p>
            {doc.refId && <p className="mt-1">{t('documents.refLabel', { id: doc.refId })}</p>}
            {doc.concept && (
              <p>{t(`${doc.type === 'notaCredito' ? 'creditConcepts' : 'debitConcepts'}.${doc.concept}`)}</p>
            )}
            {doc.note && <p className="text-secondary-500">{doc.note}</p>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-xs">
            <thead className="text-left text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
              <tr>
                <th className="py-1 pr-2">{t('form.line.description')}</th>
                <th className="py-1 pr-2 text-right">{t('form.line.qty')}</th>
                <th className="py-1 pr-2 text-right">{t('form.line.unitPrice')}</th>
                <th className="py-1 pr-2">{t('form.line.tax')}</th>
                <th className="py-1 text-right">{t('form.line.base')}</th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l) => (
                <tr key={l.id} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-1 pr-2">{l.description}</td>
                  <td className="py-1 pr-2 text-right">{l.qty}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{formatCOP(l.unitPrice)}</td>
                  <td className="py-1 pr-2">{t(`taxOptions.${l.tax}`)}</td>
                  <td className="py-1 text-right tabular-nums">{formatCOP(l.qty * l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto max-w-xs space-y-0.5 tabular-nums">
          <div className="flex justify-between gap-4">
            <dt className="text-secondary-500">{t('summary.subtotal')}</dt>
            <dd>{formatCOP(tt.subtotal)}</dd>
          </div>
          {TAX_CATEGORIES.filter((k) => tt.byTax[k].tax > 0).map((k) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-secondary-500">{t(`taxOptions.${k}`)}</dt>
              <dd>{formatCOP(tt.byTax[k].tax)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 font-semibold">
            <dt>{t('summary.total')}</dt>
            <dd>{formatCOP(tt.total)}</dd>
          </div>
        </dl>
        {doc.type === 'factura' && (
          <div>
            <p className="font-medium text-secondary-900 dark:text-white">{t('detail.notes')}</p>
            {notes.length === 0 ? (
              <p className="text-secondary-500">{t('detail.noNotes')}</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {notes.map((n) => (
                  <li key={n.id} className="flex justify-between gap-3">
                    <span>
                      {n.id} · {t(`docTypesShort.${n.type}`)}
                    </span>
                    <span className="tabular-nums">
                      {n.type === 'notaCredito' ? '−' : '+'}
                      {formatCOP(docTotals(n).total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 font-medium">{t('note.balance', { balance: formatCOP(invoiceBalance(doc, state.docs)) })}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
          {doc.cufe ? (
            <QrSvg text={qrText(doc, state.issuer)} size={104} label={t('preview.qrAlt', { id: doc.id })} />
          ) : (
            <p className="text-secondary-500">{t('documents.cufePending')}</p>
          )}
          <div className="min-w-0 text-xs">
            <p className="uppercase tracking-wide text-secondary-500">{doc.type === 'factura' ? t('success.cufeLabel') : t('success.cudeLabel')}</p>
            <p className="font-mono break-all">{doc.cufe || '…'}</p>
            <p className="mt-1 text-secondary-500">{t('success.cufeNote')}</p>
          </div>
        </div>
        <div>
          <p className="font-medium text-secondary-900 dark:text-white">{t('detail.history')}</p>
          <ol className="mt-1 space-y-0.5 text-xs">
            {doc.history.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-secondary-500 whitespace-nowrap tabular-nums">
                  {formatDate(h.date, months)} {h.time}
                </span>
                <span>{historyText(h)}</span>
              </li>
            ))}
          </ol>
        </div>
        {doc.status !== 'rejected' && (
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 p-3">
            <p className="font-medium text-secondary-900 dark:text-white">{t('detail.send')}</p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <select
                aria-label={t('detail.channel')}
                className={inputCls + ' sm:w-40'}
                value={channel}
                onChange={(e) => {
                  const c = e.target.value as 'email' | 'whatsapp';
                  setChannel(c);
                  setTarget(c === 'email' ? doc.client.email : '');
                }}
              >
                <option value="email">{t('detail.channels.email')}</option>
                <option value="whatsapp">{t('detail.channels.whatsapp')}</option>
              </select>
              <input
                aria-label={t('detail.target')}
                className={inputCls}
                placeholder={channel === 'email' ? 'facturas@cliente.example' : '+57 300 000 0000'}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <Button size="sm" onClick={send}>
                {t('detail.sendButton')}
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-secondary-500">{t('detail.sendNote')}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => downloadPdf(doc)}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadXml(doc)}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> XML
          </Button>
          {doc.type === 'factura' && doc.status !== 'rejected' && (
            <>
              <Button size="sm" variant="outline" onClick={() => onStartNote('notaCredito')}>
                {t('documents.actions.credit')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onStartNote('notaDebito')}>
                {t('documents.actions.debit')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function FixModal({ doc, store, onClose }: { doc: BillingDoc; store: BillingStore; onClose: () => void }) {
  const t = useTranslations('demoBilling');
  const [nitRaw, setNitRaw] = useState(`${doc.client.idNumber}-${doc.client.dv}`);
  const [busy, setBusy] = useState(false);
  const chk = checkNit(nitRaw);

  const submit = async () => {
    if (chk.state !== 'ok' || busy) return;
    setBusy(true);
    const before = formatNit(doc.client.idNumber, doc.client.dv);
    const fixed: BillingDoc = { ...doc, client: { ...doc.client, idNumber: chk.digits, dv: chk.dv }, rejection: undefined };
    const cufe = await sha384Hex(cufeInput(fixed, store.state.issuer));
    await new Promise((r) => setTimeout(r, 700));
    const { time } = colombiaNow();
    const h = (key: HistoryEntry['key'], detail?: string): HistoryEntry => ({ date: DEMO_TODAY, time: time.slice(0, 5), key, detail });
    store.updateDoc(doc.id, () => ({
      ...fixed,
      cufe,
      status: 'accepted',
      history: [
        ...doc.history,
        h('corrected', `NIT ${before} → ${formatNit(chk.digits, chk.dv)}`),
        h('xml'),
        h('signed'),
        h('transmitted'),
        h('accepted'),
        ...(fixed.client.email ? [h('delivered', fixed.client.email)] : []),
      ],
    }));
    toast.success(t('fix.done', { id: doc.id }));
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={t('fix.title', { id: doc.id })}>
      <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('fix.text', { reason: t('rejection.badDv') })}</p>
      <div className="mt-3">
        <Field
          label={t('fix.nit')}
          htmlFor="fe-fix-nit"
          hint={
            <p className={'mt-1 text-xs ' + (chk.state === 'ok' ? 'text-green-600' : 'text-amber-700 dark:text-amber-400')}>
              {chk.state === 'empty' ? '' : t(`form.nitState.${chk.state}`, { dv: chk.state === 'ok' ? chk.dv : chk.expectedDv })}
            </p>
          }
        >
          <input id="fe-fix-nit" className={inputCls} value={nitRaw} onChange={(e) => setNitRaw(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" onClick={submit} disabled={chk.state !== 'ok'} isLoading={busy}>
          {t('fix.submit')}
        </Button>
      </div>
    </Modal>
  );
}
