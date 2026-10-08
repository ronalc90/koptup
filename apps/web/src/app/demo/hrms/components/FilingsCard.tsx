'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { COMPANY } from '../lib/catalog';
import { pilaFile } from '../lib/files';
import { csv, download, filingDeadline, monthPeriod, payroll, sha384, totals } from '../lib/payroll';
import { useHr } from '../lib/store';
import { SectionTitle, btn, useFmt } from './ui';

/**
 * Obligaciones mensuales del mes anterior: nómina electrónica (transmisión
 * simulada con CUNE de ejemplo calculado en el navegador) y planilla de aportes
 * (archivo plano de estructura simplificada).
 */
export default function FilingsCard() {
  const t = useTranslations('demoHrms.filings');
  const { state, dispatch } = useHr();
  const f = useFmt();
  const [sending, setSending] = useState(false);
  const period = useMemo(() => monthPeriod(state.filing.month), [state.filing.month]);
  const byId = useMemo(() => new Map(state.employees.map((e) => [e.id, e])), [state.employees]);
  const lines = useMemo(() => payroll(state.employees.filter((e) => e.joined <= period.to), [], period), [state.employees, period]);
  const tot = useMemo(() => totals(lines), [lines]);
  const month = f.date(period.from, 'monthYear');
  const cunes = Object.entries(state.filing.cunes);

  const transmit = async () => {
    setSending(true);
    try {
      const out: Record<string, string> = {};
      for (const l of lines) {
        const e = byId.get(l.employeeId)!;
        out[l.employeeId] = await sha384(`${COMPANY.nit}|${e.docId}|${period.month}|${l.earned}|${l.deductions}|${l.net}|102`);
      }
      dispatch({ type: 'filing.einvoice', cunes: out });
      toast.success(t('einvoice.done', { n: lines.length }));
    } catch {
      toast.error(t('einvoice.error'));
    } finally {
      setSending(false);
    }
  };

  const downloadCunes = () => {
    download(`cune-nomina-${period.month}.csv`, csv([[t('einvoice.csvName'), t('einvoice.csvDoc'), t('einvoice.csvNet'), 'CUNE'], ...lines.map((l) => [byId.get(l.employeeId)!.name, byId.get(l.employeeId)!.docId, l.net, state.filing.cunes[l.employeeId] ?? ''])]));
    toast.success(t('einvoice.downloaded'));
  };

  const generatePila = () => {
    download(`aportes-${period.month}.csv`, pilaFile(period.month, lines, byId, t('pila.header')));
    dispatch({ type: 'filing.pila', status: 'generated' });
    toast.success(t('pila.generated', { n: lines.length }));
  };

  const contrib: [string, number][] = [
    [t('pila.health'), tot.health + tot.erHealth],
    [t('pila.pension'), tot.pension + tot.fsp + tot.erPension],
    [t('pila.arl'), tot.arl],
    [t('pila.ccf'), tot.ccf],
    [t('pila.icbfSena'), tot.icbf + tot.sena],
  ];

  return (
    <Card variant="bordered">
      <SectionTitle title={t('title', { month })} subtitle={t('subtitle')} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-secondary-900 dark:text-white">{t('einvoice.title')}</p>
            <Badge variant={state.filing.einvoice === 'accepted' ? 'success' : 'warning'} size="sm">
              {state.filing.einvoice === 'accepted' ? t('einvoice.accepted') : t('einvoice.pending')}
            </Badge>
          </div>
          <p className="text-xs text-secondary-500 mb-3">{t('einvoice.summary', { n: lines.length, total: f.money(tot.earned), date: f.date(filingDeadline(period.month)) })}</p>
          {state.filing.einvoice === 'accepted' ? (
            <>
              <ul className="space-y-1 mb-3">
                {cunes.slice(0, 3).map(([id, cune]) => (
                  <li key={id} className="text-[11px] font-mono text-secondary-600 dark:text-secondary-300 truncate" title={cune}>
                    {byId.get(id)?.name}: {cune.slice(0, 32)}…
                  </li>
                ))}
              </ul>
              <button type="button" className={btn.small} onClick={downloadCunes}><ArrowDownTrayIcon className="w-3.5 h-3.5" />{t('einvoice.download')}</button>
            </>
          ) : (
            <button type="button" className={btn.primary} disabled={sending} onClick={transmit}>{sending ? t('einvoice.sending') : t('einvoice.transmit')}</button>
          )}
          <p className="text-[11px] text-secondary-500 mt-3">{t('einvoice.note')}</p>
        </div>

        <div className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-secondary-900 dark:text-white">{t('pila.title')}</p>
            <Badge variant={state.filing.pila === 'paid' ? 'success' : state.filing.pila === 'generated' ? 'info' : 'warning'} size="sm">{t(`pila.status.${state.filing.pila}`)}</Badge>
          </div>
          <table className="w-full text-xs my-2">
            <tbody>
              {contrib.map(([k, v]) => (
                <tr key={k} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-1 pr-2">{k}</td>
                  <td className="py-1 text-right font-medium">{f.money(v)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-1 pr-2 font-bold">{t('pila.total')}</td>
                <td className="py-1 text-right font-bold">{f.money(contrib.reduce((a, [, v]) => a + v, 0))}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={state.filing.pila === 'pending' ? btn.primary : btn.small} onClick={generatePila}>
              <ArrowDownTrayIcon className="w-4 h-4" />
              {state.filing.pila === 'pending' ? t('pila.generate') : t('pila.again')}
            </button>
            {state.filing.pila === 'generated' && (
              <button type="button" className={btn.outline} onClick={() => { dispatch({ type: 'filing.pila', status: 'paid' }); toast.success(t('pila.paidToast')); }}>
                {t('pila.markPaid')}
              </button>
            )}
          </div>
          <p className="text-[11px] text-secondary-500 mt-3">{t('pila.note')}</p>
        </div>
      </div>
    </Card>
  );
}
