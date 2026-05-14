import { BaseEntity } from '../_shared/types';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Course extends BaseEntity {
  title: string;
  description: string;
  instructor: string;
  level: CourseLevel;
  durationHours: number;
  modules: ReadonlyArray<{ title: string; duration: number }>;
  status: 'draft' | 'published' | 'archived';
  enrolledCount: number;
}

export interface Enrollment extends BaseEntity {
  courseId: string;
  studentEmail: string;
  status: EnrollmentStatus;
  progress: number;
  completedAt?: string;
}
