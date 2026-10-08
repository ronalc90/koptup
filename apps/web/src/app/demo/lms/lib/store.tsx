'use client';

/**
 * Estado de la demo en el navegador: un reducer con todas las acciones y
 * persistencia en localStorage (los cambios sobreviven a recargar la página
 * durante 7 días; luego se regeneran los datos de ejemplo). Se carga después
 * de montar para que el HTML del servidor y el del cliente coincidan.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { diffDays, localToday, yearOf, type ISODate } from './dates';
import { eligibleForCertificate, gradeQuiz, lessonsOf, totals } from './engine';
import { buildState, rebaseCohort, STATE_VERSION } from './seed';
import { courseById } from './selectors';
import type { Course, LmsState, PayMethod, Profile } from './types';

const STORAGE_KEY = 'koptup.lms.state';
const MAX_AGE_DAYS = 7;

type Payload =
  | { type: 'reset' }
  | { type: 'load'; state: LmsState }
  | { type: 'profile.update'; profile: Profile }
  | { type: 'purchase'; courseId: string; method: PayMethod; coupon?: string; last4?: string; buyer: string; email: string; doc: string }
  | { type: 'enroll.free'; courseId: string }
  | { type: 'lesson.open'; courseId: string; lessonId: string }
  | { type: 'lesson.position'; courseId: string; lessonId: string; sec: number }
  | { type: 'lesson.complete'; courseId: string; lessonId: string }
  | { type: 'quiz.submit'; courseId: string; answers: number[] }
  | { type: 'note.add'; courseId: string; lessonId: string; at: number; text: string }
  | { type: 'note.remove'; id: string }
  | { type: 'tutor.asked' }
  | { type: 'live.reminder'; id: string; on: boolean }
  | { type: 'live.attend'; id: string }
  | { type: 'coupon.add'; code: string; pct: number }
  | { type: 'coupon.toggle'; code: string }
  | { type: 'course.save'; course: Course }
  | { type: 'course.publish'; id: string; published: boolean }
  | { type: 'course.remove'; id: string }
  | { type: 'remind'; ids: string[] };

export type Action = Payload & { today: ISODate };

function issueCertificateIfEligible(s: LmsState, courseId: string, today: ISODate): LmsState {
  const enr = s.enrollments[courseId];
  const course = courseById(s, courseId);
  if (!enr || !course || enr.certificateId || !eligibleForCertificate(course, enr)) return s;
  const seq = s.seq + 1;
  const id = `AQ-${yearOf(today)}-${String(seq).padStart(4, '0')}`;
  return {
    ...s,
    seq,
    enrollments: { ...s.enrollments, [courseId]: { ...enr, certificateId: id } },
    certificates: [
      { id, courseId, name: s.profile.name, date: today, hours: course.hours, score: enr.quiz?.best ?? 0, total: enr.quiz?.total ?? 0 },
      ...s.certificates,
    ],
  };
}

function reducer(s: LmsState | null, a: Action): LmsState | null {
  if (a.type === 'reset') return buildState(a.today);
  if (a.type === 'load') return a.state;
  if (!s) return s;
  const today = a.today;
  switch (a.type) {
    case 'profile.update':
      return { ...s, profile: a.profile, certificates: s.certificates.map((c) => ({ ...c, name: a.profile.name })) };
    case 'purchase': {
      const course = courseById(s, a.courseId);
      if (!course || s.enrollments[a.courseId]) return s;
      const coupon = a.coupon ? s.coupons.find((c) => c.code === a.coupon && c.active) : undefined;
      const tt = totals(course.price, coupon?.pct ?? 0);
      const idSeq = s.idSeq + 1;
      const id = `m${idSeq}`;
      const first = lessonsOf(course)[0];
      return {
        ...s,
        idSeq,
        sales: [
          ...s.sales,
          {
            id,
            ref: `AQ-${today.replace(/-/g, '').slice(2)}-${id.toUpperCase()}`,
            invoice: '',
            date: today,
            courseId: a.courseId,
            buyer: a.buyer,
            email: a.email,
            doc: a.doc,
            method: a.method,
            gross: tt.gross,
            discount: tt.discount,
            total: tt.total,
            coupon: coupon?.code,
            last4: a.last4,
            mine: true,
          },
        ],
        coupons: coupon ? s.coupons.map((c) => (c.code === coupon.code ? { ...c, uses: c.uses + 1 } : c)) : s.coupons,
        enrollments: {
          ...s.enrollments,
          [a.courseId]: { courseId: a.courseId, enrolledAt: today, completed: {}, lastLessonId: first?.id ?? '', position: {} },
        },
      };
    }
    case 'enroll.free': {
      const course = courseById(s, a.courseId);
      if (!course || s.enrollments[a.courseId] || course.price > 0) return s;
      const first = lessonsOf(course)[0];
      return {
        ...s,
        enrollments: {
          ...s.enrollments,
          [a.courseId]: { courseId: a.courseId, enrolledAt: today, completed: {}, lastLessonId: first?.id ?? '', position: {} },
        },
      };
    }
    case 'lesson.open': {
      const enr = s.enrollments[a.courseId];
      if (!enr || enr.lastLessonId === a.lessonId) return s;
      return { ...s, enrollments: { ...s.enrollments, [a.courseId]: { ...enr, lastLessonId: a.lessonId } } };
    }
    case 'lesson.position': {
      const enr = s.enrollments[a.courseId];
      if (!enr) return s;
      return { ...s, enrollments: { ...s.enrollments, [a.courseId]: { ...enr, position: { ...enr.position, [a.lessonId]: Math.round(a.sec) } } } };
    }
    case 'lesson.complete': {
      const enr = s.enrollments[a.courseId];
      if (!enr || enr.completed[a.lessonId]) return s;
      const next = { ...s, enrollments: { ...s.enrollments, [a.courseId]: { ...enr, completed: { ...enr.completed, [a.lessonId]: today } } } };
      return issueCertificateIfEligible(next, a.courseId, today);
    }
    case 'quiz.submit': {
      const enr = s.enrollments[a.courseId];
      const course = courseById(s, a.courseId);
      if (!enr || !course) return s;
      const g = gradeQuiz(course.quiz, a.answers);
      const best = Math.max(g.score, enr.quiz?.best ?? 0);
      const quizLesson = lessonsOf(course).find((x) => x.kind === 'quiz');
      const completed = g.passed && quizLesson && !enr.completed[quizLesson.id] ? { ...enr.completed, [quizLesson.id]: today } : enr.completed;
      const next = {
        ...s,
        enrollments: {
          ...s.enrollments,
          [a.courseId]: { ...enr, completed, quiz: { answers: a.answers, score: g.score, total: g.total, at: today, best } },
        },
      };
      return issueCertificateIfEligible(next, a.courseId, today);
    }
    case 'note.add': {
      const idSeq = s.idSeq + 1;
      return {
        ...s,
        idSeq,
        notes: [{ id: `n${idSeq}`, courseId: a.courseId, lessonId: a.lessonId, at: Math.round(a.at), text: a.text.slice(0, 1000), createdAt: today }, ...s.notes],
      };
    }
    case 'note.remove':
      return { ...s, notes: s.notes.filter((n) => n.id !== a.id) };
    case 'tutor.asked':
      return { ...s, tutorQuestions: s.tutorQuestions + 1 };
    case 'live.reminder':
      return { ...s, live: { ...s.live, [a.id]: { ...s.live[a.id], reminder: a.on } } };
    case 'live.attend':
      return { ...s, live: { ...s.live, [a.id]: { ...s.live[a.id], attended: true } } };
    case 'coupon.add':
      if (s.coupons.some((c) => c.code === a.code)) return s;
      return { ...s, coupons: [...s.coupons, { code: a.code, pct: a.pct, active: true, uses: 0 }] };
    case 'coupon.toggle':
      return { ...s, coupons: s.coupons.map((c) => (c.code === a.code ? { ...c, active: !c.active } : c)) };
    case 'course.save': {
      const exists = s.customCourses.some((c) => c.id === a.course.id);
      return {
        ...s,
        customCourses: exists ? s.customCourses.map((c) => (c.id === a.course.id ? a.course : c)) : [...s.customCourses, a.course],
      };
    }
    case 'course.publish':
      return { ...s, customCourses: s.customCourses.map((c) => (c.id === a.id ? { ...c, published: a.published } : c)) };
    case 'course.remove': {
      const enrollments = { ...s.enrollments };
      delete enrollments[a.id];
      return {
        ...s,
        customCourses: s.customCourses.filter((c) => c.id !== a.id),
        enrollments,
        notes: s.notes.filter((n) => n.courseId !== a.id),
      };
    }
    case 'remind':
      return { ...s, reminders: { ...s.reminders, ...Object.fromEntries(a.ids.map((id) => [id, today])) } };
    default:
      return s;
  }
}

function readStored(today: ISODate): LmsState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as LmsState;
    if (!s || s.version !== STATE_VERSION || typeof s.savedAt !== 'string') return null;
    if (diffDays(today, s.savedAt) > MAX_AGE_DAYS || diffDays(today, s.savedAt) < 0) return null;
    return rebaseCohort(s, today);
  } catch {
    return null;
  }
}

interface Ctx {
  state: LmsState | null;
  today: ISODate;
  dispatch: (p: Payload) => void;
  reset: () => void;
}

const LmsContext = createContext<Ctx | null>(null);

export function LmsProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, null);
  const [today, setToday] = useState<ISODate>('');
  const todayRef = useRef<ISODate>('');

  useEffect(() => {
    const t = localToday();
    todayRef.current = t;
    setToday(t);
    rawDispatch({ type: 'load', state: readStored(t) ?? buildState(t), today: t });
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: todayRef.current || state.savedAt }));
    } catch {
      /* sin almacenamiento: la demo funciona igual, sin recordar cambios */
    }
  }, [state]);

  const dispatch = useCallback((p: Payload) => {
    const t = todayRef.current || localToday();
    rawDispatch({ ...p, today: t } as Action);
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset' }), [dispatch]);

  const value = useMemo(() => ({ state, today, dispatch, reset }), [state, today, dispatch, reset]);
  return <LmsContext.Provider value={value}>{children}</LmsContext.Provider>;
}

export function useLms(): Ctx {
  const ctx = useContext(LmsContext);
  if (!ctx) throw new Error('useLms debe usarse dentro de LmsProvider');
  return ctx;
}

/** Igual que useLms, pero solo cuando el estado ya cargó. */
export function useLmsReady() {
  const { state, today, dispatch, reset } = useLms();
  if (!state) throw new Error('Estado de la demo sin cargar');
  return { state, today, dispatch, reset };
}
