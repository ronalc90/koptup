import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { courses as seedCourses, enrollments as seedEnrollments } from './lms.data';
import { Course, Enrollment } from './lms.types';

export interface LmsService {
  list(q: Filterable): ListResult<Course>;
  get(id: string): Course;
  create(input: Partial<Course>): Course;
  update(id: string, patch: Partial<Course>): Course;
  remove(id: string): { id: string };
  listEnrollments(q: Filterable & { courseId?: string }): ListResult<Enrollment>;
  enroll(courseId: string, studentEmail: string): Enrollment;
}

export class InMemoryLmsService implements LmsService {
  private courses: Course[] = [...seedCourses];
  private enrollments: Enrollment[] = [...seedEnrollments];

  list(q: Filterable): ListResult<Course> {
    return paginate(this.courses, q, (c, n) => c.title.toLowerCase().includes(n) || c.instructor.toLowerCase().includes(n));
  }
  get(id: string): Course { return findOrThrow(this.courses, id, 'Course'); }

  create(input: Partial<Course>): Course {
    if (!input.title || !input.instructor) throw new DomainError('VALIDATION', 'title e instructor requeridos');
    const c: Course = {
      id: nextId('crs'),
      title: input.title,
      description: input.description ?? '',
      instructor: input.instructor,
      level: input.level ?? 'beginner',
      durationHours: input.durationHours ?? 1,
      modules: input.modules ?? [],
      status: input.status ?? 'draft',
      enrolledCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.courses.push(c);
    return c;
  }

  update(id: string, patch: Partial<Course>): Course {
    const idx = this.courses.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Course ${id}`);
    this.courses[idx] = applyPatch(this.courses[idx], patch);
    return this.courses[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.courses.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Course ${id}`);
    this.courses[idx] = softDelete(this.courses[idx]);
    return { id };
  }

  listEnrollments(q: Filterable & { courseId?: string }): ListResult<Enrollment> {
    const base = paginate(this.enrollments, q, (e, n) => e.studentEmail.toLowerCase().includes(n));
    const items = q.courseId ? base.items.filter((e) => e.courseId === q.courseId) : base.items;
    return { ...base, items };
  }

  enroll(courseId: string, studentEmail: string): Enrollment {
    const course = findOrThrow(this.courses, courseId, 'Course');
    const exists = this.enrollments.find((e) => e.courseId === courseId && e.studentEmail === studentEmail && !e.deletedAt);
    if (exists) throw new DomainError('CONFLICT', 'Ya inscrito');
    const e: Enrollment = {
      id: nextId('enr'),
      courseId,
      studentEmail,
      status: 'active',
      progress: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.enrollments.push(e);
    const idx = this.courses.findIndex((c) => c.id === course.id);
    this.courses[idx] = { ...course, enrolledCount: course.enrolledCount + 1, updatedAt: nowIso() };
    return e;
  }
}

export const lmsService: LmsService = new InMemoryLmsService();
