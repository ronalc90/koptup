'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CLIENTS, CLIENT_BY_ID, COMPANY, IVA, fmtNit } from '../lib/catalog';
import { billing, toCsv } from '../lib/engine';
import { previousMonth } from '../lib/dates';
import { fmtCOP, fmtDate, fmtMonth, fmtNum } from '../lib/format';
import { useWms } from '../lib/store';
import type { ClientId, Tariff } from '../lib/types';
import { Panel, Segmented, SimNote, download, baseInputCls, tdCls, thCls, useT } from './ui';

type Period = 'prev' | 'mtd';
const FIELD: Record<string, keyof Tariff> = { storage: 'storage', line: 'line', order: 'order', parcel: 'parcel', rma: 'rma' };

export default function Billing() {
  const t = useT();
  const { state, lang, today, dispatch, notify } = useWms();
  const [client, setClient] = useState<ClientId>('lir');
  const [period, setPeriod] = useState<Period>('prev');
  const b = billing(state, client, period, today);
  const iva = Math.round(b.subtotal * IVA);
  const total = b.subtotal + iva;
  const periodLabel = period === 'prev' ? fmtMonth(previousMonth(today), lang) : t('billing.mtdLabel', { month: fmtMonth(today, lang), date: fmtDate(today, lang) });
  const c = CLIENT_BY_ID[client];

  const csv = () => {
    const rows: (string | number)[][] = [
      [t('billing.docTitle'), COMPANY.name, `NIT ${fmtNit(COMPANY.nit)}`],
      [t('billing.client'), c.name, `NIT ${fmtNit(c.nit)}`],
      [t('billing.period'), periodLabel],
      [t('billing.sample')],
      [],
      [t('billing.concept'), t('billing.qty'), t('billing.unit'), t('billing.subtotal')],
      ...b.lines.map((l) => [t(`billing.concepts.${l.concept}`), l.qty, l.unit, l.total]),
      [t('billing.subtotal'), '', '', b.subtotal],
      [t('billing.iva'), '', '', iva],
      [t('billing.total'), '', '', total],
    ];
    download(`prefactura-${client}-${period === 'prev' ? previousMonth(today).slice(0, 7) : today}.csv`, toCsv(rows));
    notify(t('billing.downloaded'));
  };

  const pdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    let y = 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(t('billing.docTitle'), 18, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${COMPANY.name} · NIT ${fmtNit(COMPANY.nit)} · ${COMPANY.city}`, 18, (y += 6));
    doc.text(`${t('billing.client')}: ${c.name} · NIT ${fmtNit(c.nit)}`, 18, (y += 5));
    doc.text(`${t('billing.period')}: ${periodLabel}`, 18, (y += 5));
    doc.setTextColor(185, 28, 28);
    doc.text(doc.splitTextToSize(t('billing.sample'), 175), 18, (y += 6));
    doc.setTextColor(20, 20, 20);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(t('billing.concept'), 18, y);
    doc.text(t('billing.qty'), 120, y, { align: 'right' });
    doc.text(t('billing.unit'), 155, y, { align: 'right' });
    doc.text(t('billing.subtotal'), 195, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    for (const l of b.lines) {
      y += 7;
      doc.text(t(`billing.concepts.${l.concept}`), 18, y);
      doc.text(fmtNum(l.qty, lang), 120, y, { align: 'right' });
      doc.text(fmtCOP(l.unit, lang), 155, y, { align: 'right' });
      doc.text(fmtCOP(l.total, lang), 195, y, { align: 'right' });
    }
    y += 4;
    doc.line(18, y, 195, y);
    y += 6;
    doc.text(t('billing.subtotal'), 155, y, { align: 'right' });
    doc.text(fmtCOP(b.subtotal, lang), 195, y, { align: 'right' });
    y += 6;
    doc.text(t('billing.iva'), 155, y, { align: 'right' });
    doc.text(fmtCOP(iva, lang), 195, y, { align: 'right' });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(t('billing.total'), 155, y, { align: 'right' });
    doc.text(fmtCOP(total, lang), 195, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(t('billing.erpNote'), 175), 18, y + 14);
    doc.save(`prefactura-${client}.pdf`);
    notify(t('billing.downloaded'));
  };

  return (
    <div className="space-y-5">
      <Panel
        title={t('billing.title')}
        subtitle={t('billing.subtitle')}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={csv}>
              <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
              CSV
            </Button>
            <Button size="sm" onClick={pdf}>
              <DocumentArrowDownIcon className="mr-1.5 h-4 w-4" />
              PDF
            </Button>
          </>
        }
      >
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Segmented label={t('billing.client')} value={client} options={CLIENTS.map((x) => ({ id: x.id, label: x.name.replace(' S.A.S.', '') }))} onChange={setClient} />
          <Segmented label={t('billing.period')} value={period} options={[{ id: 'prev', label: t('billing.prev') }, { id: 'mtd', label: t('billing.mtd') }]} onChange={setPeriod} />
        </div>
        <div className="mb-3 text-sm">
          <span className="font-semibold">{c.name}</span> · NIT {fmtNit(c.nit)} · {periodLabel}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className={thCls}>{t('billing.concept')}</th>
                <th className={`${thCls} text-right`}>{t('billing.qty')}</th>
                <th className={`${thCls} text-right`}>{t('billing.unit')}</th>
                <th className={`${thCls} text-right`}>{t('billing.subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              {b.lines.map((l) => (
                <tr key={l.concept} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className={tdCls}>
                    {t(`billing.concepts.${l.concept}`)}
                    <div className="text-xs text-secondary-500">{t(`billing.conceptHint.${l.concept}`)}</div>
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(l.qty, lang)}</td>
                  <td className={`${tdCls} text-right`}>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      className={`${baseInputCls} ml-auto w-28 text-right`}
                      value={state.tariffs[client][FIELD[l.concept]]}
                      onChange={(e) => dispatch({ type: 'tariff.set', client, field: FIELD[l.concept], value: Number(e.target.value) })}
                      aria-label={t('billing.editTariff', { concept: t(`billing.concepts.${l.concept}`) })}
                    />
                  </td>
                  <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtCOP(l.total, lang)}</td>
                </tr>
              ))}
              <tr>
                <td className={tdCls} colSpan={3}>
                  {t('billing.subtotal')}
                </td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmtCOP(b.subtotal, lang)}</td>
              </tr>
              <tr>
                <td className={tdCls} colSpan={3}>
                  {t('billing.iva')}
                </td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmtCOP(iva, lang)}</td>
              </tr>
              <tr className="bg-stone-50 dark:bg-stone-900/30">
                <td className={`${tdCls} font-bold`} colSpan={3}>
                  {t('billing.total')}
                </td>
                <td className={`${tdCls} text-right font-bold tabular-nums text-stone-800 dark:text-stone-200`}>{fmtCOP(total, lang)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <SimNote className="mt-3">{period === 'mtd' ? t('billing.mtdNote') : t('billing.prevNote')}</SimNote>
        <SimNote className="mt-1">{t('billing.erpNote')}</SimNote>
      </Panel>

      <Panel title={t('billing.summary', { period: periodLabel })}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className={thCls}>{t('billing.client')}</th>
                <th className={`${thCls} text-right`}>{t('billing.subtotal')}</th>
                <th className={`${thCls} text-right`}>{t('billing.total')}</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((x) => {
                const bb = billing(state, x.id, period, today);
                return (
                  <tr key={x.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className={tdCls}>
                      <button type="button" className="font-medium text-primary-700 hover:underline dark:text-primary-300" onClick={() => setClient(x.id)}>
                        {x.name}
                      </button>
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmtCOP(bb.subtotal, lang)}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtCOP(bb.subtotal + Math.round(bb.subtotal * IVA), lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
