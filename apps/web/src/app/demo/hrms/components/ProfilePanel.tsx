'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { addDays, diffDays, fullYears, type ISODate } from '../lib/dates';
import { COMPANY, POSITIONS, SITE_CITY } from '../lib/catalog';
import { PARAMS } from '../lib/payroll';
import { useHr } from '../lib/store';
import { examDue, probationEnd, vacationBalance } from '../lib/selectors';
import { COMPETENCIES, type ExitReason } from '../lib/types';
import LeaveForm from './LeaveForm';
import { statusVariant } from './LeaveItem';
import { useDocuments } from './useDocuments';
import { Field, Initials, Modal, btn, inputCls, useFmt, usePos } from './ui';

const REASONS: ExitReason[] = ['resignation', 'dismissal', 'agreement', 'endOfTerm'];

export default function ProfilePanel() {
  const t = useTranslations('demoHrms.profile');
  const pos = usePos();
  const ta = useTranslations('demoHrms.areas');
  const tc = useTranslations('demoHrms.contracts');
  const tsh = useTranslations('demoHrms.shifts');
  const tl = useTranslations('demoHrms.leaveTypes');
  const tx = useTranslations('demoHrms.exitReasons');
  const tco = useTranslations('demoHrms.courses');
  const { state, profileId, openProfile, dispatch } = useHr();
  const f = useFmt();
  const docs = useDocuments();
  const [sub, setSub] = useState<null | 'leave' | 'exit'>(null);
  const [withSalary, setWithSalary] = useState(true);
  const [reason, setReason] = useState<ExitReason>('resignation');
  const [lastDay, setLastDay] = useState<ISODate>(addDays(state.baseDate, 15));
  const panelRef = useRef<HTMLDivElement>(null);
  const e = profileId ? state.employees.find((x) => x.id === profileId) : undefined;

  useEffect(() => {
    if (!e) return;
    setSub(null);
    panelRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]:not([data-drawer])')) openProfile(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [e?.id, openProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!e) return null;
  const manager = state.employees.find((m) => m.id === e.managerId);
  const bal = vacationBalance(state, e);
  const prob = probationEnd(e);
  const leaves = state.leaves.filter((l) => l.employeeId === e.id).sort((a, b) => (a.from < b.from ? 1 : -1));
  const review = state.reviews.find((r) => r.employeeId === e.id);
  const courses = state.courses.filter((c) => c.assigned.includes(e.id));
  const years = fullYears(e.joined, state.baseDate);
  const months = Math.floor((diffDays(e.joined, state.baseDate) % 365) / 30.4);
  const transport = e.contract !== 'apprentice' && e.salary <= 2 * PARAMS.smmlv;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[180]" onClick={() => openProfile(null)} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        data-drawer="true"
        aria-labelledby="hrms-profile-title"
        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-secondary-900 z-[190] shadow-2xl overflow-y-auto outline-none"
      >
        <div className="sticky top-0 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 p-4 sm:p-6 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Initials name={e.name} size="lg" />
              <div className="min-w-0">
                <h2 id="hrms-profile-title" className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">{e.name}</h2>
                <p className="text-sm text-secondary-500">{pos(e)} · {ta(e.area)}</p>
                {e.status !== 'active' && <Badge variant={e.status === 'leaving' ? 'warning' : 'default'} size="sm">{t(`status.${e.status}`)}</Badge>}
              </div>
            </div>
            <button type="button" onClick={() => openProfile(null)} aria-label={t('close')} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="inline-flex items-center gap-2">
              <button type="button" className={btn.primary} onClick={() => docs.certificate(e, withSalary)}>
                <ArrowDownTrayIcon className="w-4 h-4" />
                {t('certificate')}
              </button>
              <label className="inline-flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-300">
                <input type="checkbox" checked={withSalary} onChange={(ev) => setWithSalary(ev.target.checked)} className="rounded border-secondary-300" />
                {t('withSalary')}
              </label>
            </div>
            {e.status === 'active' && (
              <>
                <button type="button" className={btn.outline} onClick={() => setSub('leave')}>{t('addLeave')}</button>
                <button type="button" className={btn.outline} onClick={() => setSub('exit')}>{t('startExit')}</button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 text-sm">
          <Section title={t('personal')}>
            <Grid
              items={[
                [t('doc'), e.docId],
                [t('phone'), e.phone],
                [t('email'), e.email ?? t('noEmail')],
                [t('site'), `${SITE_CITY[e.site]} (${t(`siteName.${e.site}`)})`],
                [t('birthday'), f.date(`${state.baseDate.slice(0, 4)}-${e.birthday}`, 'dayMonth')],
              ]}
            />
          </Section>
          <Section title={t('employment')}>
            <Grid
              items={[
                [t('contract'), tc(e.contract)],
                [t('joined'), f.date(e.joined)],
                [t('end'), e.contractEnd ? f.date(e.contractEnd) : t('noEnd')],
                [t('tenure'), t('tenureValue', { y: years, m: Math.max(0, months) })],
                [t('probation'), prob ? (prob >= state.baseDate ? t('probationUntil', { date: f.date(prob) }) : t('probationDone')) : t('na')],
                [t('shift'), tsh(e.shift)],
                [t('manager'), manager ? <button key="m" type="button" className="text-violet-700 dark:text-violet-300 hover:underline text-left" onClick={() => openProfile(manager.id)}>{manager.name}</button> : t('board')],
              ]}
            />
          </Section>
          <Section title={t('compensation')}>
            <Grid
              items={[
                [e.contract === 'apprentice' ? t('support') : t('salary'), f.money(e.salary)],
                [t('transport'), transport ? f.money(PARAMS.transport) : t('noTransport')],
                [t('bank'), `${e.bank} ****${e.account.slice(-4)}`],
              ]}
            />
          </Section>
          <Section title={t('social')}>
            <Grid items={[[t('eps'), e.eps], [t('afp'), e.afp], [t('arl'), `${COMPANY.arl} · ${t('riskClass', { n: e.arlClass })}`], [t('ccf'), e.ccf]]} />
          </Section>
          <Section title={t('vacations')}>
            {e.contract === 'apprentice' ? (
              <p className="text-secondary-500">{t('apprenticeVacation')}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Box label={t('accrued')} value={f.num(bal.accrued)} />
                  <Box label={t('taken')} value={f.num(bal.taken)} />
                  <Box label={t('balance')} value={f.num(bal.balance)} strong />
                </div>
                <p className="text-[11px] text-secondary-500 mb-2">{t('vacationRule')}</p>
              </>
            )}
            {leaves.length === 0 ? (
              <p className="text-secondary-500 text-xs">{t('noLeaves')}</p>
            ) : (
              <ul className="space-y-1">
                {leaves.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded bg-secondary-50 dark:bg-secondary-800">
                    <span>{tl(l.type)} · {f.date(l.from)} → {f.date(l.to)}</span>
                    <Badge variant={statusVariant(l.status)} size="sm">{t(`leaveStatus.${l.status}`)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title={t('documents')}>
            <ul className="space-y-2">
              {(['contract', 'affiliations', 'exam'] as const).map((k) => (
                <li key={k} className="flex items-center gap-2 p-2 rounded bg-secondary-50 dark:bg-secondary-800">
                  <DocumentTextIcon className="w-4 h-4 text-secondary-500" />
                  <span className="flex-1">{t(`docs.${k}`)}{k === 'exam' && <span className="text-xs text-secondary-500"> · {t('examDue', { date: f.date(examDue(e)) })}</span>}</span>
                  <button type="button" className={btn.link} onClick={() => docs.record(e, k)}>{t('download')}</button>
                </li>
              ))}
            </ul>
          </Section>
          {POSITIONS[e.positionId].evaluated && review && (
            <Section title={t('performance')}>
              {review.status === 'done' ? (
                <p>{t('reviewDone', { score: f.num(COMPETENCIES.reduce((a, c) => a + (review.scores[c] ?? 0), 0) / COMPETENCIES.length) })}</p>
              ) : (
                <p className="text-secondary-500">{t('reviewPending')}</p>
              )}
            </Section>
          )}
          <Section title={t('training')}>
            <ul className="space-y-1">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span>{tco(c.id)}</span>
                  <Badge variant={c.completed.includes(e.id) ? 'success' : c.due < state.baseDate ? 'danger' : 'warning'} size="sm">
                    {c.completed.includes(e.id) ? t('courseDone') : c.due < state.baseDate ? t('courseLate') : t('coursePending')}
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {sub === 'leave' && (
        <Modal title={t('addLeave')} subtitle={e.name} onClose={() => setSub(null)} labelId="hrms-profile-leave">
          <LeaveForm employeeId={e.id} idPrefix="profile-leave" onDone={() => setSub(null)} />
        </Modal>
      )}
      {sub === 'exit' && (
        <Modal title={t('exitTitle')} subtitle={e.name} onClose={() => setSub(null)} size="sm" labelId="hrms-profile-exit">
          <div className="space-y-3">
            <Field label={t('exitReason')} htmlFor="exit-reason">
              <select id="exit-reason" className={inputCls} value={reason} onChange={(ev) => setReason(ev.target.value as ExitReason)}>
                {REASONS.map((r) => <option key={r} value={r}>{tx(r)}</option>)}
              </select>
            </Field>
            <Field label={t('lastDay')} htmlFor="exit-day">
              <input id="exit-day" type="date" className={inputCls} value={lastDay} min={state.baseDate} onChange={(ev) => setLastDay(ev.target.value)} />
            </Field>
            <p className="text-[11px] text-secondary-500">{t('exitNote')}</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={btn.outline} onClick={() => setSub(null)}>{t('cancel')}</button>
              <button
                type="button"
                className={btn.primary}
                disabled={!lastDay || lastDay < state.baseDate}
                onClick={() => {
                  dispatch({ type: 'employee.exit', id: e.id, reason, lastDay });
                  setSub(null);
                  toast.success(t('exitDone', { name: e.name }));
                }}
              >
                {t('exitConfirm')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>,
    document.body,
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-bold text-secondary-900 dark:text-white mb-2 text-xs uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

function Grid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="p-2.5 rounded-lg bg-secondary-50 dark:bg-secondary-800 min-w-0">
          <dt className="text-[11px] text-secondary-500">{k}</dt>
          <dd className="font-medium text-secondary-900 dark:text-white break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Box({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg text-center ${strong ? 'bg-violet-50 dark:bg-violet-950/50' : 'bg-secondary-50 dark:bg-secondary-800'}`}>
      <p className="text-[11px] text-secondary-500">{label}</p>
      <p className={`text-lg font-bold ${strong ? 'text-violet-700 dark:text-violet-300' : 'text-secondary-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
