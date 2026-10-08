'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { clock } from '../lib/dates';
import { lessonsOf, pick, PASS_PCT, progressOf } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import { courseById, studentsInCourse } from '../lib/selectors';
import type { LessonKind } from '../lib/types';
import { levelLabelFor, modeBadgeFor } from './CatalogGrid';
import { Modal, useFmt } from './ui';

export const KIND_ICON: Record<LessonKind, typeof VideoCameraIcon> = {
  video: VideoCameraIcon,
  reading: BookOpenIcon,
  quiz: QuestionMarkCircleIcon,
};

export default function CourseModal({
  courseId,
  onClose,
  onBuy,
  onContinue,
}: {
  courseId: string;
  onClose: () => void;
  onBuy: (id: string) => void;
  onContinue: (id: string) => void;
}) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state } = useLmsReady();
  const [expanded, setExpanded] = useState<number | null>(0);
  const course = courseById(state, courseId);
  if (!course) return null;
  const enr = state.enrollments[course.id];
  const progress = progressOf(course, enr);
  const lessons = lessonsOf(course);
  const mb = modeBadgeFor(course.mode, t);

  return (
    <Modal open onClose={onClose} size="lg" labelledBy="lms-course-modal-title" closeLabel={t('common.close')}>
      <div className={`relative p-6 bg-gradient-to-br ${course.gradient} text-white sm:rounded-t-2xl`}>
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20" aria-label={t('common.close')}>
          <XMarkIcon className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5 mb-3 flex-wrap pr-10">
          <Badge variant={mb.variant} size="sm">
            {mb.label}
          </Badge>
          <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/20">
            {levelLabelFor(course.level, t)}
          </Badge>
          {course.custom && !course.published && (
            <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/20">
              {t('authoring.draft')}
            </Badge>
          )}
        </div>
        <h2 id="lms-course-modal-title" className="text-2xl font-black pr-8">
          {pick(course.title, f.locale)}
        </h2>
        <p className="text-sm opacity-90 mt-1">{pick(course.desc, f.locale)}</p>
        <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            {t('catalog.hours', { hours: course.hours })}
          </span>
          {course.reviews > 0 && (
            <span className="inline-flex items-center gap-1">
              <StarSolid className="w-4 h-4 text-amber-300" />
              {f.dec(course.rating)} ({t('detail.reviews', { count: course.reviews })})
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="w-4 h-4" />
            {t('catalog.studentsCount', { count: studentsInCourse(state, course.id) })}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {enr ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">{t('detail.progress')}</h3>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{f.pct(progress)}</span>
            </div>
            <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-3 flex-wrap p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
            <span className="text-2xl font-black text-secondary-900 dark:text-white">{course.price > 0 ? f.money(course.price) : t('catalog.free')}</span>
            <span className="text-xs text-secondary-600 dark:text-secondary-300">{course.price > 0 ? t('detail.priceNote') : t('detail.freeNote')}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('detail.skills')}</h3>
            <ul className="space-y-1.5">
              {course.skills.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-200">
                  <CheckCircleIcon className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                  {pick(s, f.locale)}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-1">{t('detail.requirements')}</h3>
              <ul className="list-disc pl-5 text-sm text-secondary-700 dark:text-secondary-200 space-y-1">
                {course.requirements.map((r, i) => (
                  <li key={i}>{pick(r, f.locale)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-1">{t('detail.instructor')}</h3>
              <p className="text-sm text-secondary-700 dark:text-secondary-200">
                <strong>{course.instructor}</strong>
                {pick(course.instructorBio, f.locale) ? ` · ${pick(course.instructorBio, f.locale)}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">
            {t('detail.syllabus')}{' '}
            <span className="text-xs font-normal text-secondary-500 dark:text-secondary-400">
              ({t('detail.modulesCount', { count: course.modules.length })} · {t('detail.lessonsCount', { count: lessons.length })})
            </span>
          </h3>
          <div className="space-y-2">
            {course.modules.map((m, idx) => {
              const open = expanded === idx;
              const done = m.lessons.filter((x) => enr?.completed[x.id]).length;
              const pct = m.lessons.length ? Math.round((done / m.lessons.length) * 100) : 0;
              return (
                <div key={m.id} className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : idx)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800/50"
                  >
                    {open ? <ChevronDownIcon className="w-4 h-4 text-secondary-400" /> : <ChevronRightIcon className="w-4 h-4 text-secondary-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">
                        {t('detail.moduleN', { n: idx + 1 })}: {pick(m.title, f.locale)}
                      </p>
                      <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
                        {t('detail.lessonsCount', { count: m.lessons.length })}
                        {enr ? ` · ${t('detail.completedPct', { pct })}` : ''}
                      </p>
                    </div>
                    {enr && (
                      <div className="w-20 h-1.5 bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </button>
                  {open && (
                    <ul className="border-t border-secondary-200 dark:border-secondary-700 p-3 space-y-1.5 bg-secondary-50/60 dark:bg-secondary-800/30">
                      {m.lessons.map((lesson) => {
                        const Icon = KIND_ICON[lesson.kind];
                        const isDone = !!enr?.completed[lesson.id];
                        return (
                          <li key={lesson.id} className="flex items-center gap-2 text-xs text-secondary-700 dark:text-secondary-200">
                            {isDone ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" /> : <Icon className="w-4 h-4 text-primary-500 shrink-0" />}
                            <span className="flex-1 min-w-0 truncate">
                              {t('detail.lessonN', { n: lesson.n })}. {pick(lesson.title, f.locale)}
                            </span>
                            <span className="text-secondary-500 dark:text-secondary-400 shrink-0">
                              {lesson.kind === 'video' ? clock(lesson.duration) : t('detail.minutes', { n: Math.round(lesson.duration / 60) })}
                            </span>
                            <Badge variant="outline" size="sm">
                              {t(`kind.${lesson.kind}`)}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-secondary-600 dark:text-secondary-300 space-y-1">
          <p>
            <strong>{t('detail.certPolicyTitle')}:</strong> {t('detail.certPolicy', { pct: PASS_PCT })}
          </p>
          <p className="text-secondary-500 dark:text-secondary-400">{t('detail.summaryNote', { count: lessons.length, hours: course.hours })}</p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            {t('common.close')}
          </Button>
          {enr ? (
            <Button variant="primary" size="md" className="flex-1" onClick={() => onContinue(course.id)}>
              {progress > 0 ? t('detail.continue') : t('detail.start')}
            </Button>
          ) : course.custom && !course.published ? (
            <Button variant="primary" size="md" className="flex-1" disabled title={t('detail.draftHint')}>
              {t('detail.draftHint')}
            </Button>
          ) : (
            <Button variant="primary" size="md" className="flex-1" onClick={() => onBuy(course.id)}>
              {course.price > 0 ? t('detail.buyFor', { price: f.money(course.price) }) : t('catalog.enrollFree')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
