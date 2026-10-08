/** Cálculos derivados del estado (ventas, estadísticas, cohorte con "tú"). */
import { COURSES } from './catalog';
import { diffDays, type ISODate } from './dates';
import { myCohortRow, progressOf } from './engine';
import type { CohortEnrollment, Course, LmsState, Sale } from './types';

export function allCourses(s: LmsState): Course[] {
  return [...COURSES, ...s.customCourses];
}

export function catalogCourses(s: LmsState): Course[] {
  return [...COURSES, ...s.customCourses.filter((c) => c.published)];
}

export function courseById(s: LmsState, id: string): Course | undefined {
  return allCourses(s).find((c) => c.id === id);
}

/** Cohorte de ejemplo + las inscripciones de quien recorre la demo. */
export function cohortWithMe(s: LmsState, today: ISODate): CohortEnrollment[] {
  const mine = Object.values(s.enrollments)
    .map((e) => {
      const c = courseById(s, e.courseId);
      return c ? myCohortRow(c, e, s.profile.name, today) : null;
    })
    .filter((x): x is CohortEnrollment => !!x);
  return [...s.cohort, ...mine];
}

/**
 * Ventas: cada inscripción de la cohorte de ejemplo tiene su venta, más las
 * compras hechas en la demo. La numeración de factura es consecutiva por fecha.
 */
export function salesList(s: LmsState): Sale[] {
  const fromCohort: Sale[] = s.cohort.map((r) => {
    const c = courseById(s, r.courseId);
    return {
      id: r.id,
      ref: '',
      invoice: '',
      date: r.enrolledAt,
      courseId: r.courseId,
      buyer: r.name,
      email: `${r.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '.')}@example.com`,
      doc: '',
      method: r.method,
      gross: c?.price ?? r.total + r.discount,
      discount: r.discount,
      total: r.total,
      coupon: r.coupon,
    };
  });
  // Orden cronológico; el mismo día, las compras hechas en la demo quedan de últimas (son las más recientes).
  const all = [...fromCohort, ...s.sales].sort(
    (a, b) => a.date.localeCompare(b.date) || Number(!!a.mine) - Number(!!b.mine) || a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  return all
    .map((x, i) => ({ ...x, ref: `AQ-${x.date.replace(/-/g, '').slice(2)}-${String(1001 + i)}`, invoice: `FEQ-${1001 + i}` }))
    .reverse();
}

export function headerStats(s: LmsState) {
  const courses = catalogCourses(s);
  const rows = s.cohort;
  const students = new Set(rows.map((r) => r.studentId)).size + 1;
  const myEnrs = Object.values(s.enrollments);
  const myDone = myEnrs.filter((e) => {
    const c = courseById(s, e.courseId);
    return c ? progressOf(c, e) >= 100 : false;
  }).length;
  const enrollments = rows.length + myEnrs.length;
  const completed = rows.filter((r) => r.progress >= 100).length + myDone;
  return {
    courses: courses.length,
    students,
    completion: enrollments ? Math.round((completed / enrollments) * 100) : 0,
    hours: courses.reduce((a, c) => a + c.hours, 0),
  };
}

export function studentsInCourse(s: LmsState, courseId: string): number {
  return s.cohort.filter((r) => r.courseId === courseId).length + (s.enrollments[courseId] ? 1 : 0);
}

export function salesInWindow(sales: Sale[], today: ISODate, days: number): Sale[] {
  return sales.filter((x) => {
    const d = diffDays(today, x.date);
    return d >= 0 && d < days;
  });
}
