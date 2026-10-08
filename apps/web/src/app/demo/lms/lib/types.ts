/** Tipos de la demo LMS (Academia Quindé, datos de ejemplo). */
import type { ISODate } from './dates';

export type Locale = 'es' | 'en';

/** Texto bilingüe: el contenido de los cursos se muestra en el idioma activo. */
export interface L {
  es: string;
  en: string;
}

export type Mode = 'live' | 'self-paced' | 'cohort';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type LessonKind = 'video' | 'reading' | 'quiz';
export type PayMethod = 'pse' | 'card' | 'nequi';
export type Role = 'student' | 'instructor' | 'admin';

/** Línea del guion: en un video es un subtítulo que empieza en `at` (segundos). */
export interface ScriptLine {
  at: number;
  text: L;
}

export interface Lesson {
  id: string;
  /** Número de la lección dentro del curso (1, 2, 3...). */
  n: number;
  kind: LessonKind;
  title: L;
  /** Segundos de video o de lectura estimada. */
  duration: number;
  /** Subtítulos (video) o párrafos (lectura). Vacío en la evaluación. */
  lines: ScriptLine[];
}

export interface Module {
  id: string;
  title: L;
  lessons: Lesson[];
}

export interface QuizQuestion {
  id: string;
  q: L;
  options: L[];
  correct: number;
  /** Lección que explica la respuesta: alimenta la ruta de refuerzo. */
  lessonId: string;
}

export interface Course {
  id: string;
  title: L;
  desc: L;
  instructor: string;
  instructorBio: L;
  category: L;
  level: Level;
  mode: Mode;
  /** Horas totales del programa (la demo trae una versión resumida). */
  hours: number;
  /** Precio en COP con IVA incluido. 0 = gratis. */
  price: number;
  rating: number;
  reviews: number;
  gradient: string;
  skills: L[];
  requirements: L[];
  modules: Module[];
  quiz: QuizQuestion[];
  suggestions: L[];
  /** Curso creado en la vista Instructor (vive solo en este navegador). */
  custom?: boolean;
  published?: boolean;
  createdAt?: ISODate;
  /** Archivos adjuntados en el asistente: solo nombre y tamaño. */
  files?: { name: string; size: number }[];
}

export interface QuizAttempt {
  answers: number[];
  score: number;
  total: number;
  at: ISODate;
  best: number;
}

export interface Enrollment {
  courseId: string;
  enrolledAt: ISODate;
  /** Lección → fecha en que se completó. */
  completed: Record<string, ISODate>;
  lastLessonId: string;
  /** Lección → segundo donde quedó el reproductor. */
  position: Record<string, number>;
  quiz?: QuizAttempt;
  certificateId?: string;
}

export interface Sale {
  id: string;
  ref: string;
  invoice: string;
  date: ISODate;
  courseId: string;
  buyer: string;
  email: string;
  doc: string;
  method: PayMethod;
  gross: number;
  discount: number;
  total: number;
  coupon?: string;
  last4?: string;
  /** true si la hizo quien recorre la demo. */
  mine?: boolean;
}

export interface Coupon {
  code: string;
  pct: number;
  active: boolean;
  uses: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  name: string;
  date: ISODate;
  hours: number;
  score: number;
  total: number;
}

export interface Note {
  id: string;
  courseId: string;
  lessonId: string;
  at: number;
  text: string;
  createdAt: ISODate;
}

/** Estudiante de ejemplo de la cohorte (alimenta la analítica). */
export interface CohortEnrollment {
  id: string;
  studentId: string;
  name: string;
  city: string;
  courseId: string;
  enrolledAt: ISODate;
  progress: number;
  lastActive: ISODate;
  score: number | null;
  method: PayMethod;
  coupon?: string;
  total: number;
  discount: number;
}

export interface Profile {
  name: string;
  email: string;
  doc: string;
}

export interface LmsState {
  version: number;
  baseDate: ISODate;
  savedAt: ISODate;
  /** Consecutivo de certificados (continúa la numeración de la academia de ejemplo). */
  seq: number;
  /** Consecutivo de ventas y notas creadas en la demo. */
  idSeq: number;
  profile: Profile;
  enrollments: Record<string, Enrollment>;
  sales: Sale[];
  coupons: Coupon[];
  certificates: Certificate[];
  notes: Note[];
  cohort: CohortEnrollment[];
  customCourses: Course[];
  /** Estudiante de la cohorte → fecha del último recordatorio (simulado). */
  reminders: Record<string, ISODate>;
  live: Record<string, { reminder?: boolean; attended?: boolean }>;
  tutorQuestions: number;
}
