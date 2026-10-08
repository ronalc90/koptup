'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentArrowUpIcon, EyeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ITEMS, ITEM_BY_SKU, PO_LEVEL2_THRESHOLD, PURCHASE_WITHHOLDING, SUPPLIERS, SUPPLIER_BY_ID, WAREHOUSES, WORK_DATE } from '../lib/catalog';
import { docTotals, periodRange, poAmounts, poDueDate, poOpenAt, valuationAt } from '../lib/engine';
import { csvMoney, downloadCsv, downloadText, fmtNit } from '../lib/format';
import { poMatches } from '../lib/search';
import { pad } from '../lib/seed';
import { useErp } from '../lib/store';
import { buildSampleXml, parseInvoiceXml, suggestedSupplierInvoice, type ParsedInvoice } from '../lib/ubl';
import type { PurchaseOrder, WarehouseId } from '../lib/types';
import { Empty, FieldLabel, Modal, MoreButton, Note, SectionHeader, SubTabs, Th, btn, inputCls, plainSelectCls, rowCls, theadCls, useFmt, usePager } from './ui';

type View = 'pending' | 'approved' | 'received' | 'all';

export default function PurchasesModule() {
  const t = useTranslations('demoErp.purchases');
  const tc = useTranslations('demoErp.common');
  const { state, computed, filters, locale } = useErp();
  const f = useFmt();
  // Si llegas desde un enlace con búsqueda (p. ej. «OC en curso»), se muestran todas las OC
  const [view, setView] = useState<View>(() => (filters.search ? 'all' : 'pending'));
  const [detail, setDetail] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const r = periodRange(filters.period);

  const list = useMemo(
    () =>
      state.pos
        .filter((p) => view === 'all' || p.status === view)
        .filter((p) => (p.date >= r.start && p.date <= r.end) || (p.receipt && p.receipt.date >= r.start && p.receipt.date <= r.end))
        .filter((p) => poMatches(p, filters.search))
        .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.no.localeCompare(a.no))),
    [state.pos, view, r.start, r.end, filters.search],
  );
  const pager = usePager(list, 8);
  const counts = { pending: state.pos.filter((p) => p.status === 'pending').length, approved: state.pos.filter((p) => p.status === 'approved').length };

  if (filters.company === 'log') {
    return (
      <Card variant="bordered" padding="md">
        <SectionHeader title={t('title')} />
        <Empty>{t('noPurchasesLog')}</Empty>
      </Card>
    );
  }

  const exportCsv = () => {
    const head = [t('csv.doc'), t('csv.status'), t('csv.supplier'), t('csv.nit'), t('csv.date'), t('csv.warehouse'), t('csv.subtotal'), t('csv.vat'), t('csv.total'), t('csv.withholding'), t('csv.payable'), t('csv.open'), tc('currency')];
    const data = list.map((p) => {
      const a = poAmounts(p);
      const s = SUPPLIER_BY_ID[p.supplierId];
      return [p.no, t(`status.${p.status}`), s.name, fmtNit(s.nit), p.date, p.warehouse, csvMoney(a.subtotal, filters.currency), csvMoney(a.vat, filters.currency), csvMoney(a.total, filters.currency), csvMoney(a.withholding, filters.currency), csvMoney(a.payable, filters.currency), csvMoney(poOpenAt(p, computed, WORK_DATE), filters.currency), filters.currency];
    });
    downloadCsv(`compras-${filters.period}.csv`, [head, ...data], locale);
    toast.success(tc('csvDone', { n: data.length }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2 min-w-0">
        <SectionHeader title={t('title')} subtitle={t('subtitle')}>
          <button className={btn.outline} onClick={exportCsv} disabled={!list.length}>
            <ArrowDownTrayIcon className="w-4 h-4" />
            {tc('exportCsv')}
          </button>
          <button className={btn.primary} onClick={() => setCreating(true)}>
            <PlusIcon className="w-4 h-4" />
            {t('newPo')}
          </button>
        </SectionHeader>
        <div className="mb-3">
          <SubTabs
            value={view}
            onChange={setView}
            tabs={[
              { id: 'pending', label: t('views.pending', { n: counts.pending }) },
              { id: 'approved', label: t('views.approved', { n: counts.approved }) },
              { id: 'received', label: t('views.received') },
              { id: 'all', label: t('views.all') },
            ]}
          />
        </div>
        {list.length === 0 ? (
          <Empty>{filters.search ? tc('noResults') : t('empty')}</Empty>
        ) : (
          <div className="space-y-3">
            {pager.visible.map((po) => (
              <PoCard key={po.id} po={po} onDetail={() => setDetail(po.id)} onReceive={() => setReceiving(po.id)} onReject={() => setRejecting(po.id)} />
            ))}
          </div>
        )}
        <MoreButton pager={pager} />
      </Card>

      <Card variant="bordered" padding="md" className="min-w-0 h-fit">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-2">{t('rules.title')}</h3>
        <ul className="text-xs text-secondary-700 dark:text-secondary-300 space-y-2 list-disc pl-4">
          <li>{t('rules.level1')}</li>
          <li>{t('rules.level2', { amount: f.cop(PO_LEVEL2_THRESHOLD) })}</li>
          <li>{t('rules.receive')}</li>
          <li>{t('rules.withholding', { pct: f.dec(PURCHASE_WITHHOLDING * 100, 1) })}</li>
        </ul>
        <div className="mt-4">
          <Note>{t('rules.demoNote')}</Note>
        </div>
      </Card>

      {detail && <PoDetail id={detail} onClose={() => setDetail(null)} />}
      {receiving && <ReceiveForm id={receiving} onClose={() => setReceiving(null)} />}
      {rejecting && <RejectForm id={rejecting} onClose={() => setRejecting(null)} />}
      {creating && <PoForm onClose={() => setCreating(false)} />}
    </div>
  );
}

function PoStatus({ po }: { po: PurchaseOrder }) {
  const t = useTranslations('demoErp.purchases');
  const { computed } = useErp();
  if (po.status === 'pending') return <Badge variant="warning">{t('status.pending')}</Badge>;
  if (po.status === 'approved') return <Badge variant="info">{t('status.approved')}</Badge>;
  if (po.status === 'rejected') return <Badge variant="danger">{t('status.rejected')}</Badge>;
  return poOpenAt(po, computed, WORK_DATE) > 0 ? <Badge variant="primary">{t('status.received')}</Badge> : <Badge variant="success">{t('status.paid')}</Badge>;
}

function PoCard({ po, onDetail, onReceive, onReject }: { po: PurchaseOrder; onDetail: () => void; onReceive: () => void; onReject: () => void }) {
  const t = useTranslations('demoErp.purchases');
  const tw = useTranslations('demoErp.warehouses');
  const { computed, dispatch, ensureOpenPeriod, state } = useErp();
  const f = useFmt();
  const a = poAmounts(po);
  const open = poOpenAt(po, computed, WORK_DATE);
  const nextLevel = (po.approvals.length + 1) as 1 | 2;
  const steps = [
    { label: t('flow.level1'), done: po.approvals.some((x) => x.level === 1) },
    ...(po.levels === 2 ? [{ label: t('flow.level2'), done: po.approvals.some((x) => x.level === 2) }] : []),
    { label: t('flow.receive'), done: po.status === 'received' },
    { label: t('flow.pay'), done: po.status === 'received' && open <= 0 },
  ];
  const firstPending = steps.findIndex((s) => !s.done);
  const approve = () => {
    dispatch({ type: 'approvePo', id: po.id, level: nextLevel });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t(nextLevel >= po.levels ? 'toasts.approvedFinal' : 'toasts.approvedLevel', { doc: po.no, role: t(`flow.level${nextLevel}`) }));
  };
  const pay = () => {
    const n = state.counters.CE;
    dispatch({ type: 'payPo', id: po.id });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.paid', { doc: `CE-${pad(n)}`, po: po.no, amount: f.cop(open) }));
  };
  return (
    <div className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
      <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline" onClick={onDetail}>
              {po.no}
            </button>
            <PoStatus po={po} />
            {po.origin !== 'seed' && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">{t(`origin.${po.origin}`)}</span>}
          </div>
          <p className="text-sm text-secondary-900 dark:text-white font-medium">{SUPPLIER_BY_ID[po.supplierId].name}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {f.date(po.date)} · {tw(po.warehouse)} · {t('itemsCount', { n: po.lines.length, first: f.item(po.lines[0].sku) })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-secondary-900 dark:text-white">{f.money(a.total)}</p>
          {po.status === 'received' && open > 0 && <p className="text-[11px] text-secondary-500">{t('openAmount', { amount: f.money(open), due: f.date(poDueDate(po)) })}</p>}
        </div>
      </div>
      <ol className="flex items-center gap-1 sm:gap-2 mb-3 overflow-x-auto" aria-label={t('flow.aria')}>
        {steps.map((s, i) => {
          const current = po.status !== 'rejected' && i === firstPending;
          return (
            <li key={s.label} className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${s.done ? 'bg-emerald-500 text-white' : current ? 'bg-amber-400 text-white' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-500'}`}>
                {s.done ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
              </span>
              <span className="text-[11px] text-secondary-700 dark:text-secondary-300 truncate">{s.label}</span>
              {i < steps.length - 1 && <span className={`hidden sm:block flex-1 h-0.5 min-w-[8px] ${s.done ? 'bg-emerald-500' : 'bg-secondary-200 dark:bg-secondary-700'}`} />}
            </li>
          );
        })}
      </ol>
      {po.status === 'rejected' && po.rejectReason && <p className="text-xs text-red-700 dark:text-red-300 mb-2">{t('rejectedReason', { reason: po.rejectReason })}</p>}
      <div className="flex flex-wrap gap-2">
        {po.status === 'pending' && (
          <>
            <button className={btn.primary} onClick={approve}>
              {t('actions.approveAs', { role: t(`flow.level${nextLevel}`) })}
            </button>
            <button className={btn.danger} onClick={onReject}>
              {t('actions.reject')}
            </button>
          </>
        )}
        {po.status === 'approved' && (
          <button className={btn.primary} onClick={onReceive}>
            {t('actions.receive')}
          </button>
        )}
        {po.status === 'received' && open > 0 && (
          <button className={btn.outline} onClick={pay}>
            {t('actions.pay', { amount: f.money(open) })}
          </button>
        )}
        <button className={btn.ghost} onClick={onDetail}>
          <EyeIcon className="w-4 h-4" />
          {t('actions.detail')}
        </button>
      </div>
    </div>
  );
}

function PoDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('demoErp.purchases');
  const tw = useTranslations('demoErp.warehouses');
  const tc = useTranslations('demoErp.common');
  const { state, computed, goTo } = useErp();
  const f = useFmt();
  const po = state.pos.find((p) => p.id === id)!;
  const s = SUPPLIER_BY_ID[po.supplierId];
  const a = poAmounts(po);
  const pays = state.payments.filter((p) => p.poId === po.id);
  const entries = [...(computed.entriesBySource[po.id] || []), ...pays.flatMap((p) => computed.entriesBySource[p.id] || [])];
  return (
    <Modal wide title={`${t('detail.title')} ${po.no}`} subtitle={`${s.name} · NIT ${fmtNit(s.nit)} · ${tw(po.warehouse)}`} onClose={onClose} footer={<button className={btn.outline} onClick={onClose}>{tc('close')}</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className={theadCls}>
              <Th>{t('detail.item')}</Th>
              <Th right>{t('detail.qty')}</Th>
              <Th right>{t('detail.cost')}</Th>
              <Th right>{t('detail.vat')}</Th>
              <Th right>{t('detail.subtotal')}</Th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((l) => (
              <tr key={l.sku} className={rowCls}>
                <td className="py-1.5 pr-3">
                  <span className="font-mono text-[10px] text-secondary-500 mr-1.5">{l.sku}</span>
                  {f.item(l.sku)}
                </td>
                <td className="py-1.5 pr-3 text-right">{f.qty(l.qty)}</td>
                <td className="py-1.5 pr-3 text-right">{f.money(l.price)}</td>
                <td className="py-1.5 pr-3 text-right">{l.vat ? `${l.vat} %` : t('detail.excluded')}</td>
                <td className="py-1.5 pr-3 text-right">{f.money(Math.round(l.qty * l.price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-3 ml-auto max-w-xs text-sm space-y-1">
        {[
          [t('detail.subtotal'), f.money(a.subtotal)],
          [t('detail.vatTotal'), f.money(a.vat)],
          [t('detail.total'), f.money(a.total)],
          [t('detail.withholding'), `- ${f.money(a.withholding)}`],
          [t('detail.payable'), f.money(a.payable)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-secondary-600 dark:text-secondary-400">{k}</dt>
            <dd className="font-medium text-secondary-900 dark:text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 text-xs text-secondary-700 dark:text-secondary-300 space-y-1">
        <p className="font-semibold text-secondary-900 dark:text-white">{t('detail.history')}</p>
        <p>{t('detail.created', { date: f.date(po.date) })}</p>
        {po.approvals.map((x) => (
          <p key={x.level}>{t('detail.approved', { role: t(`flow.level${x.level}`), date: f.date(x.date) })}</p>
        ))}
        {po.receipt && <p>{t('detail.received', { date: f.date(po.receipt.date), invoice: po.receipt.invoiceNo, source: t(`detail.source.${po.receipt.source}`) })}</p>}
        {pays.map((p) => (
          <p key={p.id}>{t('detail.paid', { doc: p.no, date: f.date(p.date), amount: f.money(p.amount) })}</p>
        ))}
        {po.status === 'rejected' && <p>{t('rejectedReason', { reason: po.rejectReason || '' })}</p>}
        {entries.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2">
            {entries.map((e) => (
              <button key={e.id} className="text-primary-700 dark:text-primary-300 underline" onClick={() => goTo('accounting', e.no)}>
                {t('detail.seeEntry', { doc: e.no })}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ReceiveForm({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('demoErp.purchases');
  const tc = useTranslations('demoErp.common');
  const tw = useTranslations('demoErp.warehouses');
  const { state, dispatch, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const po = state.pos.find((p) => p.id === id)!;
  const s = SUPPLIER_BY_ID[po.supplierId];
  const a = poAmounts(po);
  const [invoiceNo, setInvoiceNo] = useState(suggestedSupplierInvoice(po));
  const [xml, setXml] = useState<ParsedInvoice | null>(null);
  const [xmlError, setXmlError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const checks = xml
    ? [
        { key: 'supplier', ok: xml.supplierNit.replace(/\D/g, '') === s.nit, xml: xml.supplierNit, po: s.nit },
        { key: 'order', ok: !xml.orderRef || xml.orderRef === po.no, xml: xml.orderRef || '—', po: po.no },
        { key: 'subtotal', ok: Math.abs(xml.subtotal - a.subtotal) <= 1, xml: f.cop(xml.subtotal), po: f.cop(a.subtotal) },
        { key: 'vat', ok: Math.abs(xml.vat - a.vat) <= 1, xml: f.cop(xml.vat), po: f.cop(a.vat) },
        { key: 'total', ok: Math.abs(xml.total - a.total) <= 1, xml: f.cop(xml.total), po: f.cop(a.total) },
      ]
    : [];
  const mismatch = checks.some((c) => !c.ok);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setXmlError('');
    if (file.size > 2_000_000) return setXmlError(t('receive.errors.tooBig'));
    const text = await file.text();
    const res = parseInvoiceXml(text);
    if (!res.ok) {
      setXml(null);
      return setXmlError(t(`receive.errors.${res.error}`));
    }
    setXml(res.data);
    setInvoiceNo(res.data.invoiceNo);
  };

  const download = () => {
    downloadText(`factura-${s.nit}-${invoiceNo || 'ejemplo'}.xml`, buildSampleXml(po, invoiceNo || suggestedSupplierInvoice(po), WORK_DATE), 'application/xml');
  };

  const save = () => {
    if (!invoiceNo.trim()) return;
    dispatch({ type: 'receivePo', id: po.id, invoiceNo: invoiceNo.trim(), source: xml ? 'xml' : 'manual' });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.received', { doc: po.no, wh: tw(po.warehouse) }));
    onClose();
  };

  return (
    <Modal
      wide
      title={t('receive.title', { doc: po.no })}
      subtitle={`${s.name} · ${tw(po.warehouse)}`}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save} disabled={!invoiceNo.trim() || mismatch}>
            {t('receive.save')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block">
            <FieldLabel>{t('receive.invoiceNo')}</FieldLabel>
            <input className={inputCls} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value.slice(0, 30))} />
          </label>
          <div>
            <FieldLabel>{t('receive.xml')}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <button className={btn.outline} onClick={() => fileRef.current?.click()}>
                <DocumentArrowUpIcon className="w-4 h-4" />
                {t('receive.upload')}
              </button>
              <button className={btn.ghost} onClick={download}>
                <ArrowDownTrayIcon className="w-4 h-4" />
                {t('receive.sample')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xml,application/xml,text/xml"
                className="hidden"
                aria-label={t('receive.upload')}
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="text-[11px] text-secondary-500 mt-1">{t('receive.xmlHint')}</p>
            {xmlError && <p className="text-xs text-red-600 mt-1">{xmlError}</p>}
          </div>
        </div>
        <dl className="text-sm space-y-1 sm:border-l sm:pl-4 border-secondary-200 dark:border-secondary-700">
          {[
            [t('detail.subtotal'), f.money(a.subtotal)],
            [t('receive.vatCredit'), f.money(a.vat)],
            [t('detail.total'), f.money(a.total)],
            [t('detail.withholding'), `- ${f.money(a.withholding)}`],
            [t('detail.payable'), f.money(a.payable)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-secondary-600 dark:text-secondary-400">{k}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {xml && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-secondary-900 dark:text-white mb-1">{t('receive.match', { lines: xml.lines })}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className={theadCls}>
                  <Th>{t('receive.field')}</Th>
                  <Th>{t('receive.inXml')}</Th>
                  <Th>{t('receive.inPo')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.key} className={rowCls}>
                    <td className="py-1 pr-3">{t(`receive.fields.${c.key}`)}</td>
                    <td className="py-1 pr-3 font-mono">{c.xml}</td>
                    <td className="py-1 pr-3 font-mono">{c.po}</td>
                    <td className="py-1">{c.ok ? <Badge variant="success">{t('receive.ok')}</Badge> : <Badge variant="danger">{t('receive.diff')}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mismatch && (
            <div className="mt-2">
              <Note tone="warn">{t('receive.mismatch')}</Note>
            </div>
          )}
        </div>
      )}
      <p className="mt-4 text-[11px] text-secondary-500">{t('receive.effect', { wh: tw(po.warehouse) })}</p>
    </Modal>
  );
}

function RejectForm({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('demoErp.purchases');
  const tc = useTranslations('demoErp.common');
  const { state, dispatch } = useErp();
  const po = state.pos.find((p) => p.id === id)!;
  const [reason, setReason] = useState('');
  const save = () => {
    if (!reason.trim()) return;
    dispatch({ type: 'rejectPo', id, reason: reason.trim().slice(0, 200) });
    toast(t('toasts.rejected', { doc: po.no }));
    onClose();
  };
  return (
    <Modal
      title={t('reject.title', { doc: po.no })}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.danger} onClick={save} disabled={!reason.trim()}>
            {t('reject.save')}
          </button>
        </>
      }
    >
      <label className="block">
        <FieldLabel>{t('reject.reason')}</FieldLabel>
        <textarea className={`${inputCls} min-h-[80px]`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('reject.placeholder')} />
      </label>
    </Modal>
  );
}

function PoForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoErp.purchases');
  const tc = useTranslations('demoErp.common');
  const tw = useTranslations('demoErp.warehouses');
  const { state, computed, dispatch, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const [supplierId, setSupplierId] = useState(SUPPLIERS[0].id);
  const [warehouse, setWarehouse] = useState<WarehouseId>('bog');
  const items = ITEMS.filter((i) => i.supplierId === supplierId);
  const val = useMemo(() => valuationAt(computed.movements, '9999-12-31'), [computed]);
  const [lines, setLines] = useState<{ sku: string; qty: string }[]>([{ sku: items[0].sku, qty: '' }]);
  const [error, setError] = useState('');
  const changeSupplier = (id: string) => {
    setSupplierId(id);
    const first = ITEMS.find((i) => i.supplierId === id)!;
    setLines([{ sku: first.sku, qty: '' }]);
    if (first.kind === 'raw') setWarehouse('bog');
  };
  const parsed = lines
    .map((l) => ({ sku: l.sku, qty: Math.round(Number(l.qty)), price: Math.round(val.avgCost[l.sku] || ITEM_BY_SKU[l.sku].cost), vat: ITEM_BY_SKU[l.sku].vat }))
    .filter((l) => l.qty > 0);
  const tt = docTotals(parsed);
  const save = () => {
    if (!parsed.length) return setError(t('form.errorLines'));
    if (new Set(parsed.map((l) => l.sku)).size !== parsed.length) return setError(t('form.errorDup'));
    if (parsed.some((l) => ITEM_BY_SKU[l.sku].kind === 'raw') && warehouse !== 'bog') return setError(t('form.errorRaw'));
    const n = state.counters.OC;
    dispatch({ type: 'createPo', supplierId, warehouse, lines: parsed, origin: 'manual' });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.created', { doc: `OC-${pad(n)}` }));
    onClose();
  };
  return (
    <Modal
      wide
      title={t('form.title')}
      subtitle={t('form.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save}>
            {t('form.save')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <label className="block">
          <FieldLabel>{t('form.supplier')}</FieldLabel>
          <select className={plainSelectCls} value={supplierId} onChange={(e) => changeSupplier(e.target.value)}>
            {SUPPLIERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <FieldLabel>{t('form.warehouse')}</FieldLabel>
          <select className={plainSelectCls} value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseId)}>
            {WAREHOUSES.map((w) => (
              <option key={w} value={w}>
                {tw(w)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <label className="col-span-12 sm:col-span-6 block">
              {i === 0 && <FieldLabel>{t('form.item')}</FieldLabel>}
              <select className={plainSelectCls} value={l.sku} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))}>
                {items.map((it) => (
                  <option key={it.sku} value={it.sku}>
                    {it.sku} · {f.item(it.sku)}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-5 sm:col-span-2 block">
              {i === 0 && <FieldLabel>{t('form.qty')}</FieldLabel>}
              <input className={inputCls} inputMode="numeric" value={l.qty} placeholder="0" aria-label={t('form.qty')} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value.replace(/[^\d]/g, '') } : x)))} />
            </label>
            <div className="col-span-5 sm:col-span-3 text-[11px] text-secondary-600 dark:text-secondary-400 pb-2">{t('form.cost', { cost: f.cop(Math.round(val.avgCost[l.sku] || ITEM_BY_SKU[l.sku].cost)) })}</div>
            <div className="col-span-2 sm:col-span-1 pb-1 text-right">
              <button className="p-2 rounded-md text-secondary-500 hover:text-red-600 disabled:opacity-30" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label={t('form.removeLine')}>
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > lines.length && (
        <button className={`${btn.ghost} mt-2`} onClick={() => setLines((ls) => [...ls, { sku: items.find((c) => !ls.some((x) => x.sku === c.sku))?.sku || items[0].sku, qty: '' }])}>
          <PlusIcon className="w-4 h-4" />
          {t('form.addLine')}
        </button>
      )}
      <p className="mt-3 text-sm text-right text-secondary-800 dark:text-secondary-200">{t('form.totals', { total: f.money(tt.total), levels: tt.total >= PO_LEVEL2_THRESHOLD ? 2 : 1 })}</p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </Modal>
  );
}
