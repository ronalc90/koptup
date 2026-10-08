'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { COMPANIES, EMPLOYEES, EMPLOYEE_BY_ID, PAYROLL_BENEFITS_FACTOR, PAYROLL_EMPLOYER_FACTOR, WORK_DATE } from '../lib/catalog';
import { inCompany, periodRange } from '../lib/engine';
import { matches } from '../lib/format';
import { useErp } from '../lib/store';
import { Empty, MoreButton, Note, SectionHeader, Th, btn, rowCls, theadCls, useFmt, usePager } from './ui';

export default function HrModule() {
  const t = useTranslations('demoErp.hr');
  const { state, filters, dispatch, transmitPayroll, goTo, locale } = useErp();
  const f = useFmt();
  const r = periodRange(filters.period);
  const staff = useMemo(() => EMPLOYEES.filter((e) => inCompany(e.company, filters.company)), [filters.company]);
  const onVacation = new Set(state.vacations.filter((v) => v.status === 'approved' && v.from <= WORK_DATE && v.to >= WORK_DATE).map((v) => v.employeeId));
  const runs = state.payroll.filter((p) => inCompany(p.company, filters.company) && p.date >= r.start && p.date <= r.end).sort((a, b) => (b.month > a.month ? 1 : b.month < a.month ? -1 : a.company.localeCompare(b.company)));
  const factor = 1 + PAYROLL_EMPLOYER_FACTOR + PAYROLL_BENEFITS_FACTOR;
  const cost = runs.reduce((a, p) => a + Math.round(p.gross * (1 + PAYROLL_EMPLOYER_FACTOR)) + Math.round(p.gross * PAYROLL_BENEFITS_FACTOR), 0);
  const list = useMemo(() => staff.filter((e) => matches(filters.search, e.name, locale === 'en' ? e.positionEn : e.position, e.city)), [staff, filters.search, locale]);
  const pager = usePager(list, 12);
  const vacations = state.vacations.filter((v) => inCompany(EMPLOYEE_BY_ID[v.employeeId].company, filters.company)).sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || (a.from > b.from ? -1 : 1));

  const decide = (id: string, status: 'approved' | 'rejected') => {
    const v = state.vacations.find((x) => x.id === id)!;
    dispatch({ type: 'vacation', id, status });
    toast.success(t(status === 'approved' ? 'toasts.approved' : 'toasts.rejected', { name: EMPLOYEE_BY_ID[v.employeeId].name }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase font-semibold">{t('kpi.employees')}</p>
        <p className="text-3xl font-bold text-secondary-900 dark:text-white">{staff.length}</p>
        <p className="text-xs text-secondary-500 mt-1">{t('kpi.employeesNote')}</p>
      </Card>
      <Card variant="bordered" padding="md">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase font-semibold">{t('kpi.onVacation')}</p>
        <p className="text-3xl font-bold text-secondary-900 dark:text-white">{staff.filter((e) => onVacation.has(e.id)).length}</p>
        <p className="text-xs text-secondary-500 mt-1">{t('kpi.onVacationNote', { date: f.date(WORK_DATE) })}</p>
      </Card>
      <Card variant="bordered" padding="md">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase font-semibold">{t('kpi.payrollCost')}</p>
        <p className="text-3xl font-bold text-secondary-900 dark:text-white truncate">{f.moneyShort(cost)}</p>
        <p className="text-xs text-secondary-500 mt-1">{t('kpi.payrollCostNote', { n: runs.length })}</p>
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-2 min-w-0">
        <SectionHeader title={t('staff.title')} subtitle={t('staff.subtitle')} />
        {list.length === 0 ? (
          <Empty>{t('staff.empty')}</Empty>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className={theadCls}>
                  <Th>{t('staff.name')}</Th>
                  <Th>{t('staff.position')}</Th>
                  <Th>{t('staff.dept')}</Th>
                  <Th>{t('staff.city')}</Th>
                  <Th right>{t('staff.salary')}</Th>
                  <Th>{t('staff.status')}</Th>
                </tr>
              </thead>
              <tbody>
                {pager.visible.map((e) => (
                  <tr key={e.id} className={rowCls}>
                    <td className="py-2 pr-3 text-secondary-900 dark:text-white">
                      {e.name}
                      <span className="block text-[11px] text-secondary-500">{COMPANIES[e.company].short}</span>
                    </td>
                    <td className="py-2 pr-3 text-secondary-700 dark:text-secondary-300">{locale === 'en' ? e.positionEn : e.position}</td>
                    <td className="py-2 pr-3 text-secondary-600 dark:text-secondary-400">{t(`depts.${e.dept}`)}</td>
                    <td className="py-2 pr-3 text-secondary-600 dark:text-secondary-400">{e.city}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">{f.money(e.salary)}</td>
                    <td className="py-2 pr-3">{onVacation.has(e.id) ? <Badge variant="warning">{t('staff.vacation')}</Badge> : <Badge variant="success">{t('staff.active')}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MoreButton pager={pager} />
      </Card>

      <Card variant="bordered" padding="md" className="min-w-0">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-3">{t('vacations.title')}</h3>
        {vacations.length === 0 && <Empty>{t('vacations.empty')}</Empty>}
        <div className="space-y-2">
          {vacations.map((v) => {
            const e = EMPLOYEE_BY_ID[v.employeeId];
            return (
              <div key={v.id} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-secondary-900 dark:text-white">{e.name}</p>
                    <p className="text-[11px] text-secondary-500">{locale === 'en' ? e.positionEn : e.position}</p>
                  </div>
                  <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'danger' : 'warning'}>{t(`vacations.status.${v.status}`)}</Badge>
                </div>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('vacations.range', { from: f.date(v.from), to: f.date(v.to), days: v.days })}</p>
                {v.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button className={`${btn.primary} flex-1`} onClick={() => decide(v.id, 'approved')}>
                      {t('vacations.approve')}
                    </button>
                    <button className={`${btn.outline} flex-1`} onClick={() => decide(v.id, 'rejected')}>
                      {t('vacations.reject')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0">
        <SectionHeader title={t('payroll.title')} subtitle={t('payroll.subtitle')} />
        {runs.length === 0 ? (
          <Empty>{t('payroll.empty')}</Empty>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className={theadCls}>
                  <Th>{t('payroll.month')}</Th>
                  <Th>{t('payroll.company')}</Th>
                  <Th right>{t('payroll.headcount')}</Th>
                  <Th right>{t('payroll.gross')}</Th>
                  <Th right>{t('payroll.cost')}</Th>
                  <Th>{t('payroll.eStatus')}</Th>
                  <Th className="text-right pr-0">{t('payroll.actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((p) => (
                  <tr key={p.id} className={rowCls}>
                    <td className="py-2 pr-3 whitespace-nowrap">{f.month(p.month, true)}</td>
                    <td className="py-2 pr-3">{COMPANIES[p.company].short}</td>
                    <td className="py-2 pr-3 text-right">{p.headcount}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">{f.money(p.gross)}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">{f.money(Math.round(p.gross * (1 + PAYROLL_EMPLOYER_FACTOR)) + Math.round(p.gross * PAYROLL_BENEFITS_FACTOR))}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={p.eStatus === 'accepted' ? 'success' : p.eStatus === 'sending' ? 'info' : 'warning'}>{t(`payroll.e.${p.eStatus}`)}</Badge>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        {p.eStatus === 'pending' && (
                          <button
                            className={btn.primary}
                            onClick={() => {
                              transmitPayroll(p.id);
                              toast.success(t('toasts.transmitting', { month: f.month(p.month, true), company: COMPANIES[p.company].short }));
                            }}
                          >
                            {t('payroll.transmit')}
                          </button>
                        )}
                        <button className={btn.ghost} onClick={() => goTo('accounting', p.no)}>
                          {t('payroll.seeEntry')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Note>{t('payroll.factorNote', { factor: f.dec(factor, 2) })}</Note>
          <Note>
            {t('payroll.hrmsNote')}{' '}
            <Link href="/demo/hrms" className="font-semibold underline">
              {t('payroll.hrmsLink')}
            </Link>
          </Note>
        </div>
      </Card>
    </div>
  );
}
