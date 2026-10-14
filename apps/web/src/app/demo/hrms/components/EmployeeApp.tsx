'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  AcademicCapIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { SITE_CITY } from '../lib/catalog';
import { liquidate, periodFromId, previousPeriod, type Period } from '../lib/payroll';
import { APP_EMPLOYEE_NAME } from '../lib/seed';
import { useHr, type AppScreen } from '../lib/store';
import type { HrState, Novelty } from '../lib/types';
import { vacationBalance } from '../lib/selectors';
import { courseState } from './LearningTab';
import LeaveForm from './LeaveForm';
import { statusVariant } from './LeaveItem';
import { usePeriodLabel } from './PayrollTab';
import { useDocuments } from './useDocuments';
import Assistant, { type Msg } from './Assistant';
import { btn, useFmt, usePos } from './ui';

type Screen = AppScreen;

/**
 * Último desprendible pagado: la quincena en curso si ya se pagó; si no, la
 * última pagada en la demo o, al empezar, la quincena anterior (que se da por
 * pagada sin novedades).
 */
function lastPaid(state: HrState): { period: Period; novelties: Novelty[]; current: boolean } {
  if (state.run.status === 'paid') return { period: periodFromId(state.run.periodId), novelties: state.run.novelties, current: true };
  const last = state.paidRuns[state.paidRuns.length - 1];
  if (last) return { period: periodFromId(last.periodId), novelties: last.novelties, current: false };
  return { period: previousPeriod(periodFromId(state.run.periodId)), novelties: [], current: false };
}

export default function EmployeeApp() {
  const t = useTranslations('demoHrms.app');
  const pos = usePos();
  const tl = useTranslations('demoHrms.leaveTypes');
  const tc = useTranslations('demoHrms.courses');
  const tlc = useTranslations('demoHrms.learning');
  const tr = useTranslations('demoHrms.rejectReasons');
  const { state, appOpen, appScreen, openApp } = useHr();
  const f = useFmt();
  const docs = useDocuments();
  const label = usePeriodLabel();
  const [screen, setScreen] = useState<Screen>('menu');
  const [withSalary, setWithSalary] = useState(true);
  // Conversación con el asistente: vive mientras la página está abierta (no se borra al volver al menú).
  const [chat, setChat] = useState<Msg[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appOpen) return;
    setScreen(appScreen);
    // Al cerrar, el foco vuelve al botón que abrió la app.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openApp(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [appOpen, appScreen, openApp]);

  if (!appOpen) return null;
  const me = state.employees.find((e) => e.name === APP_EMPLOYEE_NAME);
  const close = () => openApp(false);

  let body: ReactNode = null;
  if (!me || me.status === 'retired') {
    body = <p className="text-sm text-secondary-600 p-4">{t('inactive')}</p>;
  } else {
    const bal = vacationBalance(state, me);
    const mine = state.leaves.filter((l) => l.employeeId === me.id).sort((a, b) => (a.from < b.from ? 1 : -1));
    const { period, novelties, current: paid } = lastPaid(state);
    const slip = liquidate(me, novelties, period);
    const activeIds = new Set(state.employees.filter((e) => e.status !== 'retired').map((e) => e.id));
    const courses = state.courses.filter((c) => c.assigned.includes(me.id));
    const pendingCourses = courses.filter((c) => !c.completed.includes(me.id));

    const items: { id: Screen; icon: typeof UserIcon; badge?: string }[] = [
      { id: 'vacation', icon: CalendarDaysIcon, badge: t('daysBadge', { n: f.num(Math.floor((bal.balance - bal.pending) * 10) / 10) }) },
      { id: 'requests', icon: ClipboardDocumentListIcon, badge: mine.filter((l) => l.status === 'pending').length ? String(mine.filter((l) => l.status === 'pending').length) : undefined },
      { id: 'payslip', icon: BanknotesIcon },
      { id: 'certificate', icon: DocumentTextIcon },
      { id: 'courses', icon: AcademicCapIcon, badge: pendingCourses.length ? String(pendingCourses.length) : undefined },
      { id: 'assistant', icon: ChatBubbleLeftRightIcon },
      { id: 'profile', icon: UserIcon },
    ];

    if (screen === 'menu') {
      body = (
        <div className="p-3 space-y-2">
          {items.map(({ id, icon: Icon, badge }) => (
            <button key={id} type="button" onClick={() => setScreen(id)} className="w-full flex items-center gap-2 p-3 bg-white dark:bg-secondary-800 rounded-xl shadow-sm text-left hover:ring-2 hover:ring-violet-300">
              <Icon className="w-5 h-5 text-violet-600 shrink-0" />
              <span className="text-sm flex-1 font-medium text-secondary-900 dark:text-white">{t(`menu.${id}`)}</span>
              {badge && <Badge variant="primary" size="sm">{badge}</Badge>}
              <ChevronRightIcon className="w-4 h-4 text-secondary-400" />
            </button>
          ))}
        </div>
      );
    } else if (screen === 'vacation') {
      body = (
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            {[[t('accrued'), bal.accrued], [t('taken'), bal.taken], [t('available'), bal.balance - bal.pending]].map(([k, v]) => (
              <div key={k as string} className="rounded-lg bg-white dark:bg-secondary-800 p-2">
                <p className="text-[10px] text-secondary-500">{k}</p>
                <p className="text-sm font-bold">{f.num(Math.floor((v as number) * 10) / 10)}</p>
              </div>
            ))}
          </div>
          <LeaveForm employeeId={me.id} appMode idPrefix="app-leave" onDone={() => setScreen('requests')} />
        </div>
      );
    } else if (screen === 'requests') {
      body = (
        <div className="p-3 space-y-2">
          {mine.length === 0 && <p className="text-xs text-secondary-500">{t('noRequests')}</p>}
          {mine.map((l) => (
            <div key={l.id} className="p-3 rounded-xl bg-white dark:bg-secondary-800 text-xs">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{tl(l.type)} · {t('daysShort', { n: l.days })}</span>
                <Badge variant={statusVariant(l.status)} size="sm">{t(`status.${l.status}`)}</Badge>
              </div>
              <p className="text-secondary-500 mt-1">{f.date(l.from)} → {f.date(l.to)}</p>
              {l.status === 'rejected' && l.rejectReason && (
                <p className="text-red-700 dark:text-red-300 mt-1">{t('rejectedBecause', { reason: tr(l.rejectReason as 'peak' | 'overlap' | 'balance' | 'other') })}</p>
              )}
            </div>
          ))}
          <p className="text-[10px] text-secondary-500">{t('requestsHint')}</p>
        </div>
      );
    } else if (screen === 'payslip') {
      body = (
        <div className="p-3 space-y-3 text-xs">
          <p className="font-semibold">{label(period)}</p>
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 space-y-1">
            <Row k={t('earned')} v={f.money(slip.earned)} />
            <Row k={t('deductions')} v={`− ${f.money(slip.deductions)}`} />
            <Row k={t('net')} v={f.money(slip.net)} strong />
          </div>
          <p className="text-[10px] text-secondary-500">{paid ? t('slipCurrent') : t('slipPrevious')}</p>
          <button type="button" className={`${btn.primary} w-full`} onClick={() => docs.payslip(me, novelties, period, label(period))}>{t('downloadPdf')}</button>
        </div>
      );
    } else if (screen === 'certificate') {
      body = (
        <div className="p-3 space-y-3 text-xs">
          <p>{t('certIntro')}</p>
          <label className="flex items-center gap-2"><input type="checkbox" checked={withSalary} onChange={(e) => setWithSalary(e.target.checked)} className="rounded border-secondary-300" />{t('withSalary')}</label>
          <button type="button" className={`${btn.primary} w-full`} onClick={() => docs.certificate(me, withSalary)}>{t('downloadPdf')}</button>
        </div>
      );
    } else if (screen === 'courses') {
      body = (
        <div className="p-3 space-y-2 text-xs">
          {courses.map((c) => {
            const done = c.completed.includes(me.id);
            const st = courseState(c, state.baseDate, activeIds);
            return (
              <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-secondary-800">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{tc(c.id)}</span>
                  <Badge variant={done ? 'success' : c.due < state.baseDate ? 'danger' : 'warning'} size="sm">{done ? t('courseDone') : c.due < state.baseDate ? t('courseLate') : t('coursePending')}</Badge>
                </div>
                <p className="text-secondary-500 mt-1">{tlc('meta', { hours: c.hours, date: f.date(c.due), audience: tlc(`audience.${c.id}`) })}</p>
                {st.state !== 'done' && !done && <p className="text-[10px] text-secondary-500 mt-1">{t('courseHint')}</p>}
              </div>
            );
          })}
        </div>
      );
    } else if (screen === 'assistant') {
      body = (
        <div className="p-3 h-full">
          <Assistant msgs={chat} setMsgs={setChat} />
        </div>
      );
    } else if (screen === 'profile') {
      body = (
        <div className="p-3 space-y-1 text-xs">
          {[
            [t('profile.doc'), me.docId],
            [t('profile.position'), pos(me)],
            [t('profile.site'), SITE_CITY[me.site]],
            [t('profile.joined'), f.date(me.joined)],
            [t('profile.eps'), me.eps],
            [t('profile.afp'), me.afp],
            [t('profile.bank'), `${me.bank} ****${me.account.slice(-4)}`],
          ].map(([k, v]) => <Row key={k} k={k} v={v} />)}
          <p className="text-[10px] text-secondary-500 pt-2">{t('profile.hint')}</p>
        </div>
      );
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="hrms-app-title" className="outline-none bg-secondary-900 rounded-[2rem] p-2.5 shadow-2xl w-full max-w-[360px]">
        <div className="bg-gradient-to-b from-violet-50 to-white dark:from-secondary-800 dark:to-secondary-900 rounded-[1.6rem] overflow-hidden flex flex-col h-[min(640px,calc(100vh-7rem))]">
          <div className="bg-violet-700 text-white p-4 shrink-0">
            <div className="flex items-center justify-between gap-2">
              {screen !== 'menu' ? (
                <button type="button" onClick={() => setScreen('menu')} aria-label={t('back')} className="p-1 -ml-1 rounded hover:bg-white/15"><ChevronLeftIcon className="w-5 h-5" /></button>
              ) : <span className="text-[10px] uppercase tracking-wide opacity-80">{t('title')}</span>}
              <button type="button" onClick={close} aria-label={t('close')} className="p-1 rounded hover:bg-white/15"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <p id="hrms-app-title" className="text-lg font-bold mt-1">{screen === 'menu' ? (me?.name ?? APP_EMPLOYEE_NAME) : t(`menu.${screen}`)}</p>
            {screen === 'menu' && me && <p className="text-xs opacity-80">{pos(me)} · {SITE_CITY[me.site]}</p>}
          </div>
          <div className="flex-1 overflow-y-auto">{body}</div>
          <p className="shrink-0 text-[10px] text-center text-secondary-500 px-3 py-2 border-t border-secondary-200 dark:border-secondary-700">{t('footer')}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-secondary-100 dark:border-secondary-700 last:border-0">
      <span className="text-secondary-500">{k}</span>
      <span className={`text-right ${strong ? 'font-bold text-secondary-900 dark:text-white' : ''}`}>{v}</span>
    </div>
  );
}
