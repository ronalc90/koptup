'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { bankFile } from '../lib/files';
import { PARAMS, csv, currentPeriod, download, journal, payroll, sundayRate, totals, weeklyHours, type Period } from '../lib/payroll';
import { useHr } from '../lib/store';
import type { RunStatus } from '../lib/types';
import FilingsCard from './FilingsCard';
import { Benefits, Novelties } from './PayrollParts';
import { useDocuments } from './useDocuments';
import { Empty, Pager, SectionTitle, Stat, TabIntro, btn, inputCls, usePager, useFmt, usePos } from './ui';

const STEPS: RunStatus[] = ['draft', 'liquidated', 'approved', 'paid'];

export function usePeriodLabel() {
  const t = useTranslations('demoHrms.payroll');
  const f = useFmt();
  return (p: Period) =>
    p.kind === 'M'
      ? f.date(p.from, 'monthYear')
      : t('periodLabel', { n: p.kind === 'Q1' ? 1 : 2, month: f.date(p.from, 'monthYear'), from: Number(p.from.slice(8)), to: Number(p.to.slice(8)) });
}

export default function PayrollTab() {
  const t = useTranslations('demoHrms.payroll');
  const pos = usePos();
  const { state, dispatch, openProfile } = useHr();
  const f = useFmt();
  const docs = useDocuments();
  const label = usePeriodLabel();
  const period = useMemo(() => currentPeriod(state.baseDate), [state.baseDate]);
  const status = state.run.status;
  const byId = useMemo(() => new Map(state.employees.map((e) => [e.id, e])), [state.employees]);
  const lines = useMemo(() => payroll(state.employees, state.run.novelties, period), [state.employees, state.run.novelties, period]);
  const tot = useMemo(() => totals(lines), [lines]);
  const entry = useMemo(() => journal(tot), [tot]);
  const [q, setQ] = useState('');
  const filtered = lines.filter((l) => !q.trim() || byId.get(l.employeeId)!.name.toLowerCase().includes(q.trim().toLowerCase()));
  const pager = usePager(filtered, 10);
  const { setPage } = pager;
  useEffect(() => setPage(1), [q, setPage]);
  const locked = status !== 'draft';
  const liquidated = status !== 'draft';

  const setStatus = (s: RunStatus, msg: string) => {
    dispatch({ type: 'run.status', status: s });
    toast.success(msg);
  };

  const pay = () => {
    download(`dispersion-${period.id}.csv`, bankFile(period.id, lines, byId, t('files.bankHeader')));
    setStatus('paid', t('toasts.paid', { n: lines.length, total: f.money(tot.net) }));
  };

  const exportDetail = () => {
    download(
      `nomina-${period.id}.csv`,
      csv([
        [t('csv.name'), t('csv.doc'), t('csv.position'), t('csv.days'), t('concepts.salary'), t('concepts.transport'), t('concepts.overtime'), t('concepts.commission'), t('concepts.earned'), t('concepts.health'), t('concepts.pension'), t('concepts.fsp'), t('concepts.withholding'), t('concepts.deductions'), t('concepts.net')],
        ...lines.map((l) => {
          const e = byId.get(l.employeeId)!;
          return [e.name, e.docId, pos(e), l.days, l.salary, l.transport, l.overtime, l.commission, l.earned, l.health, l.pension, l.fsp, l.withholding, l.deductions, l.net];
        }),
      ]),
    );
    toast.success(t('toasts.exported', { n: lines.length }));
  };

  const exportJournal = () => {
    const rows: (string | number)[][] = [[t('journal.account'), t('journal.description'), t('journal.debit'), t('journal.credit')], ...entry.map((l) => [l.account, t(`journal.lines.${l.key}`), l.debit, l.credit])];
    rows.push(['', t('journal.totals'), entry.reduce((a, l) => a + l.debit, 0), entry.reduce((a, l) => a + l.credit, 0)]);
    download(`asiento-nomina-${period.id}.csv`, csv(rows));
    toast.success(t('toasts.journal'));
  };

  const groups: { title: string; rows: [string, number][] }[] = [
    { title: t('groups.earned'), rows: [[t('concepts.salary'), tot.salary - tot.apprenticeSalary], [t('concepts.support'), tot.apprenticeSalary], [t('concepts.transport'), tot.transport], [t('concepts.overtime'), tot.overtime], [t('concepts.commission'), tot.commission]] },
    { title: t('groups.deductions'), rows: [[t('concepts.health'), tot.health], [t('concepts.pension'), tot.pension], [t('concepts.fsp'), tot.fsp], [t('concepts.withholding'), tot.withholding]] },
    { title: t('groups.employer'), rows: [[t('concepts.erHealth'), tot.erHealth], [t('concepts.erPension'), tot.erPension], [t('concepts.arl'), tot.arl], [t('concepts.ccf'), tot.ccf], [t('concepts.icbf'), tot.icbf], [t('concepts.sena'), tot.sena]] },
    { title: t('groups.provisions'), rows: [[t('concepts.prima'), tot.prima], [t('concepts.severance'), tot.severance], [t('concepts.interest'), tot.severanceInterest], [t('concepts.vacation'), tot.vacation]] },
  ];
  const debit = entry.reduce((a, l) => a + l.debit, 0);
  const credit = entry.reduce((a, l) => a + l.credit, 0);

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle')} />

      <Card variant="bordered">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-secondary-500">{t('period')}</p>
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{label(period)}</h3>
            <p className="text-xs text-secondary-500">{t('payDate', { date: f.date(period.payDate, 'long'), n: lines.length })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {status === 'draft' && <button type="button" className={btn.primary} onClick={() => setStatus('liquidated', t('toasts.liquidated', { n: lines.length, total: f.money(tot.net) }))}>{t('actions.liquidate')}</button>}
            {status === 'liquidated' && (
              <>
                <button type="button" className={btn.outline} onClick={() => setStatus('draft', t('toasts.reopened'))}>{t('actions.reopen')}</button>
                <button type="button" className={btn.primary} onClick={() => setStatus('approved', t('toasts.approved'))}>{t('actions.approve')}</button>
              </>
            )}
            {status === 'approved' && <button type="button" className={btn.primary} onClick={pay}><ArrowDownTrayIcon className="w-4 h-4" />{t('actions.pay')}</button>}
            {status === 'paid' && <Badge variant="success">{t('paidBadge')}</Badge>}
          </div>
        </div>
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4" aria-label={t('stepsAria')}>
          {STEPS.map((s, i) => {
            const reached = STEPS.indexOf(status) >= i;
            return (
              <li key={s} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${reached ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200 font-semibold' : 'bg-secondary-50 dark:bg-secondary-800 text-secondary-500'}`}>
                {reached ? <CheckCircleIcon className="w-4 h-4" /> : <span className="w-4 text-center">{i + 1}</span>}
                {t(`steps.${s}`)}
              </li>
            );
          })}
        </ol>
        <p className="text-[11px] text-secondary-500 mt-3">
          {t('params', { smmlv: f.money(PARAMS.smmlv), transport: f.money(PARAMS.transport), uvt: f.money(PARAMS.uvt), hours: weeklyHours(period.to), divisor: weeklyHours(period.to) * 5, sunday: Math.round(sundayRate(period.to) * 100) })}
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label={t('concepts.earned')} value={f.moneyShort(tot.earned)} sub={t('stat.earnedSub')} />
        <Stat label={t('concepts.deductions')} value={f.moneyShort(tot.deductions)} sub={t('stat.deductionsSub')} />
        <Stat label={t('concepts.net')} value={f.moneyShort(tot.net)} sub={t('stat.netSub')} />
        <Stat label={t('groups.employer')} value={f.moneyShort(tot.contributions)} sub={t('stat.employerSub')} />
        <Stat label={t('groups.provisions')} value={f.moneyShort(tot.provisions)} sub={t('stat.provisionsSub')} />
        <Stat label={t('stat.cost')} value={f.moneyShort(tot.cost)} sub={t('stat.costSub')} />
      </div>

      <Novelties locked={locked} period={period} />

      <Card variant="bordered">
        <SectionTitle title={t('summary')} subtitle={t('summarySub')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-secondary-500 mb-1">{g.title}</p>
              <table className="w-full text-sm">
                <tbody>
                  {g.rows.map(([k, v]) => (
                    <tr key={k} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className="py-1 pr-2 text-secondary-700 dark:text-secondary-300">{k}</td>
                      <td className="py-1 text-right font-medium whitespace-nowrap">{f.money(v)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1 pr-2 font-bold">{t('groups.total')}</td>
                    <td className="py-1 text-right font-bold whitespace-nowrap">{f.money(g.rows.reduce((a, [, v]) => a + v, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 text-emerald-700 dark:text-emerald-300 font-medium">
          {t('check', { earned: f.money(tot.earned), deductions: f.money(tot.deductions), net: f.money(tot.net) })}
        </p>
      </Card>

      <Card variant="bordered">
        <SectionTitle
          title={t('detail')}
          subtitle={liquidated ? t('detailSub') : t('detailDraft')}
          action={<button type="button" className={btn.small} onClick={exportDetail}><ArrowDownTrayIcon className="w-3.5 h-3.5" />CSV</button>}
        />
        <input type="search" className={`${inputCls} mb-3`} placeholder={t('search')} aria-label={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        {filtered.length === 0 ? <Empty>{t('noResults')}</Empty> : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-2 font-semibold">{t('csv.name')}</th>
                  <th className="py-2 px-2 text-right font-semibold">{t('concepts.earned')}</th>
                  <th className="py-2 px-2 text-right font-semibold">{t('concepts.deductions')}</th>
                  <th className="py-2 px-2 text-right font-semibold">{t('concepts.net')}</th>
                  <th className="py-2 pl-2"><span className="sr-only">{t('payslip')}</span></th>
                </tr>
              </thead>
              <tbody>
                {pager.visible.map((l) => {
                  const e = byId.get(l.employeeId)!;
                  return (
                    <tr key={l.employeeId} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className="py-2 pr-2">
                        <button type="button" onClick={() => openProfile(e.id)} className="font-medium text-secondary-900 dark:text-white hover:underline text-left">{e.name}</button>
                        <span className="block text-[11px] text-secondary-500">{pos(e)}{l.overtime || l.commission ? ` · ${t('withNovelties')}` : ''}</span>
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">{f.money(l.earned)}</td>
                      <td className="py-2 px-2 text-right whitespace-nowrap text-red-700 dark:text-red-300">{f.money(l.deductions)}</td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-semibold">{f.money(l.net)}</td>
                      <td className="py-2 pl-2 text-right">
                        <button type="button" className={btn.small} disabled={!liquidated} title={liquidated ? undefined : t('payslipLocked')} onClick={() => docs.payslip(e, state.run.novelties, period, label(period))}>
                          {t('payslip')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pager pager={pager} />
          </div>
        )}
      </Card>

      <Card variant="bordered">
        <SectionTitle
          title={t('journal.title')}
          subtitle={t('journal.subtitle')}
          action={<button type="button" className={btn.small} disabled={!liquidated} onClick={exportJournal}><ArrowDownTrayIcon className="w-3.5 h-3.5" />CSV</button>}
        />
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2 pr-2 font-semibold">{t('journal.account')}</th>
                <th className="py-2 px-2 font-semibold">{t('journal.description')}</th>
                <th className="py-2 px-2 text-right font-semibold">{t('journal.debit')}</th>
                <th className="py-2 pl-2 text-right font-semibold">{t('journal.credit')}</th>
              </tr>
            </thead>
            <tbody>
              {entry.map((l) => (
                <tr key={l.account} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-1.5 pr-2 font-mono text-xs">{l.account}</td>
                  <td className="py-1.5 px-2">{t(`journal.lines.${l.key}`)}</td>
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">{l.debit ? f.money(l.debit) : ''}</td>
                  <td className="py-1.5 pl-2 text-right whitespace-nowrap">{l.credit ? f.money(l.credit) : ''}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 pr-2" />
                <td className="py-2 px-2">{t('journal.totals')}</td>
                <td className="py-2 px-2 text-right whitespace-nowrap">{f.money(debit)}</td>
                <td className="py-2 pl-2 text-right whitespace-nowrap">{f.money(credit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={`text-xs mt-2 font-medium ${debit === credit ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'}`}>{debit === credit ? t('journal.balanced') : t('journal.unbalanced')}</p>
      </Card>

      <FilingsCard />
      <Benefits />
    </div>
  );
}
