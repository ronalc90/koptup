'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  BanknotesIcon,
  BeakerIcon,
  BriefcaseIcon,
  CakeIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  FaceSmileIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { diffDays } from '../lib/dates';
import { SITE_CITY } from '../lib/catalog';
import { useHr } from '../lib/store';
import { alerts, examDue, kpis, obligations, probationEnd, upcomingBirthdays } from '../lib/selectors';
import type { Employee } from '../lib/types';
import LeaveForm from './LeaveForm';
import LeaveItem from './LeaveItem';
import ClimateCard from './ClimateCard';
import { Empty, Modal, SectionTitle, Stat, TabIntro, btn, useFmt, usePos } from './ui';

export default function HomeTab() {
  const t = useTranslations('demoHrms.home');
  const pos = usePos();
  const { state, setTab, openProfile, dispatch } = useHr();
  const f = useFmt();
  const k = useMemo(() => kpis(state), [state]);
  const a = useMemo(() => alerts(state), [state]);
  const pending = state.leaves.filter((l) => l.status === 'pending').sort((x, y) => (x.from < y.from ? -1 : 1));
  const birthdays = useMemo(() => upcomingBirthdays(state), [state]);
  const [scheduleFor, setScheduleFor] = useState<Employee | null>(null);
  const month = f.date(state.baseDate, 'monthYear');
  const daysTo = (d: string) => diffDays(state.baseDate, d);

  const icon = (I: typeof UsersIcon) => <I className="w-5 h-5 text-violet-600 dark:text-violet-400" />;

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat
          label={t('kpi.headcount')}
          value={f.int(k.headcount)}
          sub={Object.entries(k.bySite).map(([s, n]) => `${SITE_CITY[s as keyof typeof SITE_CITY]} ${n}`).join(' · ')}
          icon={icon(UsersIcon)}
          onClick={() => setTab('people')}
        />
        <Stat label={t('kpi.turnover')} value={f.pct(k.turnover)} sub={t('kpi.turnoverSub', { n: k.exits12 })} icon={icon(UserMinusIcon)} />
        <Stat label={t('kpi.absenteeism')} value={f.pct(k.absenteeism)} sub={t('kpi.absenteeismSub', { n: k.absenceDays })} icon={icon(ClockIcon)} onClick={() => setTab('absences')} />
        <Stat label={t('kpi.cost')} value={f.moneyShort(k.monthlyCost)} sub={t('kpi.costSub', { month })} icon={icon(BanknotesIcon)} onClick={() => setTab('payroll')} />
        <Stat label={t('kpi.openRoles')} value={f.int(k.openRoles)} sub={t('kpi.openRolesSub', { n: state.vacancies.length })} icon={icon(BriefcaseIcon)} onClick={() => setTab('talent')} />
        <Stat label={t('kpi.enps')} value={k.enps === null ? '—' : `${k.enps > 0 ? '+' : ''}${k.enps}`} sub={t('kpi.enpsSub', { n: k.responses })} icon={icon(FaceSmileIcon)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <Card variant="bordered">
            <SectionTitle title={t('alerts.title')} subtitle={t('alerts.subtitle')} />
            <div className="space-y-3">
              <AlertGroup icon={<DocumentTextIcon className="w-5 h-5" />} title={t('alerts.contracts')} hint={t('alerts.contractsHint')} count={a.contracts.length} empty={t('alerts.none')}>
                {a.contracts.map((e) => (
                  <AlertRow key={e.id} e={e} onOpen={() => openProfile(e.id)} detail={`${pos(e)} · ${t('alerts.endsOn', { date: f.date(e.contractEnd!), n: daysTo(e.contractEnd!) })}`}>
                    {e.contract === 'fixed' && (
                      <>
                        <button
                          type="button"
                          className={btn.small}
                          onClick={() => {
                            dispatch({ type: 'employee.renew', id: e.id });
                            toast.success(t('alerts.renewed', { name: e.name, n: e.termMonths ?? 12 }));
                          }}
                        >
                          {t('alerts.renew')}
                        </button>
                        <button
                          type="button"
                          className={btn.small}
                          onClick={() => {
                            dispatch({ type: 'employee.notice', id: e.id });
                            toast.success(t('alerts.noticeSent', { name: e.name }));
                          }}
                        >
                          {t('alerts.notice')}
                        </button>
                      </>
                    )}
                  </AlertRow>
                ))}
              </AlertGroup>
              <AlertGroup icon={<ClockIcon className="w-5 h-5" />} title={t('alerts.probation')} hint={t('alerts.probationHint')} count={a.probation.length} empty={t('alerts.none')}>
                {a.probation.map((e) => (
                  <AlertRow key={e.id} e={e} onOpen={() => openProfile(e.id)} detail={`${pos(e)} · ${t('alerts.probationEnds', { date: f.date(probationEnd(e)!), n: daysTo(probationEnd(e)!) })}`}>
                    <button type="button" className={btn.small} onClick={() => openProfile(e.id)}>
                      {t('alerts.viewProfile')}
                    </button>
                  </AlertRow>
                ))}
              </AlertGroup>
              <AlertGroup icon={<CalendarDaysIcon className="w-5 h-5" />} title={t('alerts.accumulated')} hint={t('alerts.accumulatedHint')} count={a.accumulated.length} empty={t('alerts.none')}>
                {a.accumulated.map(({ e, balance }) => (
                  <AlertRow key={e.id} e={e} onOpen={() => openProfile(e.id)} detail={`${pos(e)} · ${t('alerts.balance', { n: f.num(balance) })}`}>
                    <button type="button" className={btn.small} onClick={() => setScheduleFor(e)}>
                      {t('alerts.schedule')}
                    </button>
                  </AlertRow>
                ))}
              </AlertGroup>
              <AlertGroup icon={<BeakerIcon className="w-5 h-5" />} title={t('alerts.exams')} hint={t('alerts.examsHint')} count={a.exams.filter((e) => !e.examScheduled).length} empty={t('alerts.none')}>
                {a.exams.map((e) => {
                  const due = examDue(e);
                  const late = due < state.baseDate;
                  return (
                    <AlertRow
                      key={e.id}
                      e={e}
                      onOpen={() => openProfile(e.id)}
                      detail={`${pos(e)} · ${late ? t('alerts.examLate', { date: f.date(due) }) : t('alerts.examDue', { date: f.date(due) })}`}
                    >
                      {e.examScheduled ? (
                        <Badge variant="success" size="sm">{t('alerts.examScheduled', { date: f.date(e.examScheduled) })}</Badge>
                      ) : (
                        <button
                          type="button"
                          className={btn.small}
                          onClick={() => {
                            dispatch({ type: 'employee.exam', id: e.id });
                            toast.success(t('alerts.examDone', { name: e.name }));
                          }}
                        >
                          {t('alerts.scheduleExam')}
                        </button>
                      )}
                    </AlertRow>
                  );
                })}
              </AlertGroup>
            </div>
          </Card>

          <Card variant="bordered">
            <SectionTitle title={t('calendar.title')} subtitle={t('calendar.subtitle')} />
            <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {obligations(state.baseDate).map((o) => (
                <li key={o.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-secondary-900 dark:text-white">{t(`calendar.items.${o.key}`)}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">{t(`calendar.notes.${o.key}`)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{f.date(o.date)}</p>
                    <p className="text-[11px] text-secondary-500">{t('calendar.inDays', { n: daysTo(o.date) })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card variant="bordered">
            <SectionTitle
              title={t('requests.title')}
              subtitle={t('requests.subtitle', { n: pending.length })}
              action={
                <button type="button" className={btn.link} onClick={() => setTab('absences')}>
                  {t('requests.viewAll')}
                </button>
              }
            />
            <div className="space-y-2">
              {pending.length === 0 && <Empty>{t('requests.empty')}</Empty>}
              {pending.slice(0, 4).map((l) => (
                <LeaveItem key={l.id} leave={l} />
              ))}
              {pending.length > 4 && <p className="text-xs text-secondary-500 text-center">{t('requests.more', { n: pending.length - 4 })}</p>}
            </div>
          </Card>

          <Card variant="bordered">
            <SectionTitle title={<span className="inline-flex items-center gap-2"><CakeIcon className="w-5 h-5 text-pink-500" />{t('birthdays.title')}</span>} subtitle={t('birthdays.subtitle')} />
            {birthdays.length === 0 ? (
              <Empty>{t('birthdays.empty')}</Empty>
            ) : (
              <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {birthdays.map(({ e, date }) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => openProfile(e.id)} className="w-full flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 text-left">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-secondary-900 dark:text-white truncate">{e.name}</span>
                        <span className="block text-xs text-secondary-500 truncate">{pos(e)} · {SITE_CITY[e.site]}</span>
                      </span>
                      <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 shrink-0">
                        {date === state.baseDate ? t('birthdays.today') : f.date(date, 'dayMonth')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ClimateCard />
        </div>
      </div>

      {scheduleFor && (
        <Modal title={t('alerts.scheduleTitle')} subtitle={scheduleFor.name} onClose={() => setScheduleFor(null)} labelId="hrms-schedule-title">
          <LeaveForm employeeId={scheduleFor.id} idPrefix="home-leave" onDone={() => setScheduleFor(null)} />
        </Modal>
      )}
    </div>
  );
}

function AlertGroup({ icon, title, hint, count, empty, children }: { icon: ReactNode; title: string; hint: string; count: number; empty: string; children: ReactNode }) {
  const t = useTranslations('demoHrms.home.alerts');
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-700">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center gap-3 p-3 text-left">
        <span className={count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-secondary-900 dark:text-white">{title}</span>
          <span className="block text-xs text-secondary-500 dark:text-secondary-400">{hint}</span>
        </span>
        <Badge variant={count > 0 ? 'warning' : 'success'} size="sm">{count}</Badge>
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 w-14 text-right">{open ? t('hide') : t('show')}</span>
      </button>
      {open && <div className="border-t border-secondary-200 dark:border-secondary-700 p-2 space-y-1">{Array.isArray(children) && children.length === 0 ? <Empty>{empty}</Empty> : children}</div>}
    </div>
  );
}

function AlertRow({ e, detail, onOpen, children }: { e: Employee; detail: string; onOpen: () => void; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-800">
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-medium text-secondary-900 dark:text-white truncate">{e.name}</span>
        <span className="block text-xs text-secondary-500 dark:text-secondary-400">{detail}</span>
      </button>
      {children && <div className="flex flex-wrap gap-1.5">{children}</div>}
    </div>
  );
}
