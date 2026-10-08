'use client';

/**
 * Estado de la demo en el navegador: un reducer con todas las acciones y
 * persistencia en localStorage (los cambios sobreviven a recargar la página
 * durante 7 días; después se regeneran los datos de ejemplo con la fecha nueva).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { addDays, addMonths, diffDays, localToday, type ISODate } from './dates';
import { POSITIONS } from './catalog';
import { buildState, STATE_VERSION } from './seed';
import type {
  Candidate, Competency, Employee, ExitReason, HrState, Leave, Novelty, Offboarding, OffTask, Onboarding, OnTask, RunStatus,
  Stage, Survey, TabId,
} from './types';

const STORAGE_KEY = 'koptup.hrms.state';
const MAX_AGE_DAYS = 7;

export type Action =
  | { type: 'reset'; base: ISODate }
  | { type: 'load'; state: HrState }
  | { type: 'leave.create'; leave: Omit<Leave, 'id'> }
  | { type: 'leave.decide'; id: string; status: 'approved' | 'rejected'; reason?: string }
  | { type: 'employee.renew'; id: string }
  | { type: 'employee.notice'; id: string }
  | { type: 'employee.exam'; id: string }
  | { type: 'employee.exit'; id: string; reason: ExitReason; lastDay: ISODate }
  | { type: 'candidate.add'; candidate: Omit<Candidate, 'id'> }
  | { type: 'candidate.move'; id: string; stage: Stage }
  | { type: 'candidate.discard'; id: string }
  | { type: 'process.toggle'; id: string; task: OnTask | OffTask }
  | { type: 'process.close'; id: string }
  | { type: 'novelty.add'; novelty: Omit<Novelty, 'id'> }
  | { type: 'novelty.remove'; id: string }
  | { type: 'run.status'; status: RunStatus }
  | { type: 'filing.einvoice'; cunes: Record<string, string> }
  | { type: 'filing.pila'; status: 'generated' | 'paid' }
  | { type: 'review.submit'; employeeId: string; scores: Record<Competency, number>; comment: string }
  | { type: 'course.remind'; id: string }
  | { type: 'survey.launch'; survey: Pick<Survey, 'question' | 'audience' | 'invited'> }
  | { type: 'survey.responses'; id: string; promoters: number; passives: number; detractors: number };

function nextId(s: HrState, prefix: string): [string, number] {
  const seq = s.seq + 1;
  return [`${prefix}${seq}`, seq];
}

function reducer(s: HrState | null, a: Action): HrState | null {
  if (a.type === 'reset') return buildState(a.base);
  if (a.type === 'load') return a.state;
  if (!s) return s;
  switch (a.type) {
    case 'leave.create': {
      const [id, seq] = nextId(s, 'L');
      return { ...s, seq, leaves: [{ ...a.leave, id }, ...s.leaves] };
    }
    case 'leave.decide':
      return { ...s, leaves: s.leaves.map((l) => (l.id === a.id ? { ...l, status: a.status, rejectReason: a.reason } : l)) };
    case 'employee.renew':
      return {
        ...s,
        employees: s.employees.map((e) => (e.id === a.id && e.contractEnd ? { ...e, contractEnd: addMonths(e.contractEnd, e.termMonths ?? 12) } : e)),
      };
    case 'employee.exam':
      return { ...s, employees: s.employees.map((e) => (e.id === a.id ? { ...e, examScheduled: addDays(s.baseDate, 7) } : e)) };
    case 'employee.notice':
    case 'employee.exit': {
      const e = s.employees.find((x) => x.id === a.id);
      if (!e || s.processes.some((p) => p.kind === 'out' && p.employeeId === a.id && !p.closed)) return s;
      const [id, seq] = nextId(s, 'P');
      const proc: Offboarding = {
        id,
        kind: 'out',
        employeeId: e.id,
        lastDay: a.type === 'employee.notice' ? e.contractEnd ?? s.baseDate : a.lastDay,
        reason: a.type === 'employee.notice' ? 'endOfTerm' : a.reason,
        done: a.type === 'employee.notice' ? ['letter'] : [],
        closed: false,
      };
      return {
        ...s,
        seq,
        processes: [...s.processes, proc],
        employees: s.employees.map((x) => (x.id === e.id ? { ...x, status: 'leaving', noticeSent: a.type === 'employee.notice' || x.noticeSent } : x)),
      };
    }
    case 'candidate.add': {
      const [id, seq] = nextId(s, 'C');
      return { ...s, seq, candidates: [...s.candidates, { ...a.candidate, id }] };
    }
    case 'candidate.discard':
      return { ...s, candidates: s.candidates.map((c) => (c.id === a.id ? { ...c, discarded: true } : c)) };
    case 'candidate.move': {
      const c = s.candidates.find((x) => x.id === a.id);
      if (!c || c.stage === 'hired') return s;
      let next: HrState = { ...s, candidates: s.candidates.map((x) => (x.id === a.id ? { ...x, stage: a.stage } : x)) };
      if (a.stage === 'hired') {
        const v = s.vacancies.find((x) => x.id === c.vacancyId)!;
        const [id, seq] = nextId(s, 'P');
        const proc: Onboarding = {
          id,
          kind: 'in',
          candidateId: c.id,
          name: c.name,
          gender: c.gender,
          docId: `10${String(seq).padStart(8, '7')}`,
          positionId: v.positionId,
          site: v.site,
          startDate: addDays(s.baseDate, 14),
          done: [],
          closed: false,
        };
        next = {
          ...next,
          seq,
          processes: [...next.processes, proc],
          vacancies: next.vacancies.map((x) => (x.id === v.id ? { ...x, hired: x.hired + 1 } : x)),
        };
      }
      return next;
    }
    case 'process.toggle':
      return {
        ...s,
        processes: s.processes.map((p) => {
          if (p.id !== a.id || p.closed) return p;
          const done = (p.done as string[]).includes(a.task) ? (p.done as string[]).filter((t) => t !== a.task) : [...(p.done as string[]), a.task];
          return { ...p, done } as typeof p;
        }),
      };
    case 'process.close': {
      const p = s.processes.find((x) => x.id === a.id);
      if (!p || p.closed) return s;
      const processes = s.processes.map((x) => (x.id === a.id ? { ...x, closed: true } : x));
      if (p.kind === 'in') {
        const info = POSITIONS[p.positionId];
        const id = `E${String(s.employees.length + 1).padStart(3, '0')}`;
        const manager = s.employees.find((e) => e.positionId === 'supervisor' && e.site === p.site) ?? s.employees.find((e) => e.positionId === 'plantDirector');
        const cand = s.candidates.find((c) => c.id === p.candidateId);
        const n = s.employees.length + 1;
        const emp: Employee = {
          id,
          name: p.name,
          gender: p.gender,
          docId: p.docId,
          positionId: p.positionId,
          area: info.area,
          site: p.site,
          managerId: manager?.id ?? null,
          contract: 'fixed',
          termMonths: 6,
          joined: p.startDate,
          contractEnd: addDays(addMonths(p.startDate, 6), -1),
          salary: info.salary[0],
          birthday: `${String((n % 12) + 1).padStart(2, '0')}-${String((n % 27) + 1).padStart(2, '0')}`,
          birthYear: 2000,
          phone: cand?.phone ?? '',
          email: null,
          eps: 'EPS Andina Salud',
          afp: 'AFP Futuro Andino',
          ccf: 'Caja de Compensación Sabana',
          arlClass: info.arl,
          shift: info.shift,
          vacTaken: 0,
          lastExam: s.baseDate,
          bank: 'Banco Andino',
          account: p.docId.slice(-10),
          status: 'active',
        };
        return { ...s, processes, employees: [...s.employees, emp] };
      }
      const e = s.employees.find((x) => x.id === p.employeeId)!;
      const [xid, seq] = nextId(s, 'X');
      return {
        ...s,
        seq,
        processes,
        employees: s.employees.map((x) => (x.id === e.id ? { ...x, status: 'retired' } : x)),
        exits: [{ id: xid, name: e.name, positionId: e.positionId, date: p.lastDay < s.baseDate ? p.lastDay : s.baseDate, reason: p.reason }, ...s.exits],
        reviews: s.reviews.filter((r) => r.employeeId !== e.id),
      };
    }
    case 'novelty.add': {
      const [id, seq] = nextId(s, 'N');
      return { ...s, seq, run: { ...s.run, novelties: [...s.run.novelties, { ...a.novelty, id }] } };
    }
    case 'novelty.remove':
      return { ...s, run: { ...s.run, novelties: s.run.novelties.filter((n) => n.id !== a.id) } };
    case 'run.status':
      return { ...s, run: { ...s.run, status: a.status } };
    case 'filing.einvoice':
      return { ...s, filing: { ...s.filing, einvoice: 'accepted', cunes: a.cunes } };
    case 'filing.pila':
      return { ...s, filing: { ...s.filing, pila: a.status } };
    case 'review.submit':
      return {
        ...s,
        reviews: s.reviews.map((r) => (r.employeeId === a.employeeId ? { ...r, scores: a.scores, comment: a.comment, status: 'done' } : r)),
      };
    case 'course.remind':
      return { ...s, courses: s.courses.map((c) => (c.id === a.id ? { ...c, remindedOn: s.baseDate } : c)) };
    case 'survey.launch': {
      const [id, seq] = nextId(s, 'S');
      return {
        ...s,
        seq,
        surveys: [...s.surveys, { ...a.survey, id, sentOn: s.baseDate, promoters: 0, passives: 0, detractors: 0, closed: false }],
      };
    }
    case 'survey.responses':
      return {
        ...s,
        surveys: s.surveys.map((x) => (x.id === a.id ? { ...x, promoters: a.promoters, passives: a.passives, detractors: a.detractors, closed: true } : x)),
      };
    default:
      return s;
  }
}

function load(today: ISODate): HrState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HrState;
      const age = diffDays(parsed.baseDate, today);
      if (parsed.version === STATE_VERSION && age >= 0 && age <= MAX_AGE_DAYS) return parsed;
    }
  } catch {
    /* sin almacenamiento disponible: se usan datos nuevos */
  }
  return buildState(today);
}

interface Ctx {
  state: HrState;
  dispatch: (a: Action) => void;
  tab: TabId;
  setTab: (t: TabId) => void;
  openProfile: (id: string | null) => void;
  profileId: string | null;
  openApp: (open: boolean) => void;
  appOpen: boolean;
  reset: () => void;
  /** Filtro del directorio fijado desde otra pestaña (p. ej. "ver equipo"). */
  peopleFilter: { managerId?: string } | null;
  setPeopleFilter: (f: { managerId?: string } | null) => void;
}

const HrContext = createContext<Ctx | null>(null);

export function HrProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null);
  const [tab, setTabState] = useState<TabId>('home');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [appOpen, setAppOpen] = useState(false);
  const [peopleFilter, setPeopleFilter] = useState<{ managerId?: string } | null>(null);

  // Los datos dependen de la fecha local y de localStorage: se cargan solo en el cliente.
  useEffect(() => {
    dispatch({ type: 'load', state: load(localToday()) });
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue funcionando en memoria */
    }
  }, [state]);

  const setTab = useCallback((t: TabId) => {
    setTabState(t);
    if (typeof window !== 'undefined') {
      document.getElementById('hrms-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que limpiar */
    }
    dispatch({ type: 'reset', base: localToday() });
    setProfileId(null);
  }, []);

  const value = useMemo<Ctx | null>(
    () =>
      state
        ? {
            state,
            dispatch,
            tab,
            setTab,
            profileId,
            openProfile: setProfileId,
            appOpen,
            openApp: setAppOpen,
            reset,
            peopleFilter,
            setPeopleFilter,
          }
        : null,
    [state, tab, setTab, profileId, appOpen, reset, peopleFilter],
  );

  if (!value) return <>{fallback}</>;
  return <HrContext.Provider value={value}>{children}</HrContext.Provider>;
}

export function useHr(): Ctx {
  const ctx = useContext(HrContext);
  if (!ctx) throw new Error('useHr fuera de HrProvider');
  return ctx;
}
