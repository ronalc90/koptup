'use client';

import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { AcademicCapIcon, ArrowPathIcon, CheckCircleIcon, ClipboardDocumentCheckIcon, PlayCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { COURSES, NEXT_COURSE } from '../lib/catalog';
import { learningPath, PASS_PCT, pick, quizPct } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import type { Course } from '../lib/types';
import { useFmt } from './ui';

const STYLE = {
  done: 'bg-green-100 dark:bg-green-900/30 ring-green-300 dark:ring-green-700 text-green-800 dark:text-green-200',
  current: 'bg-primary-100 dark:bg-primary-900/30 ring-primary-300 dark:ring-primary-700 text-primary-800 dark:text-primary-200',
  pending: 'bg-secondary-50 dark:bg-secondary-800 ring-secondary-200 dark:ring-secondary-700 text-secondary-600 dark:text-secondary-300',
  reinforce: 'bg-amber-100 dark:bg-amber-900/30 ring-amber-300 dark:ring-amber-700 text-amber-900 dark:text-amber-100',
  next: 'bg-purple-100 dark:bg-purple-900/30 ring-purple-300 dark:ring-purple-700 text-purple-900 dark:text-purple-100',
};

export default function PathPanel({
  course,
  onLesson,
  onQuiz,
  onOpenCourse,
}: {
  course: Course;
  onLesson: (id: string) => void;
  onQuiz: () => void;
  onOpenCourse: (id: string) => void;
}) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state } = useLmsReady();
  const enr = state.enrollments[course.id];
  const steps = learningPath(course, enr, NEXT_COURSE[course.id]);
  const attempt = enr?.quiz;
  const pct = attempt ? quizPct(attempt.score, attempt.total) : null;

  return (
    <Card variant="bordered">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{t('path.title')}</h3>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('path.subtitle', { pct: PASS_PCT })}</p>
          </div>
          {pct !== null && (
            <Badge variant={pct >= PASS_PCT ? 'success' : 'warning'} size="sm">
              {t('path.lastQuiz', { pct: f.pct(pct) })}
            </Badge>
          )}
        </div>
        <ol className="space-y-2">
          {steps.map((s, i) => {
            if (s.kind === 'lesson') {
              const Icon = s.state === 'done' ? CheckCircleIcon : s.state === 'current' ? PlayCircleIcon : AcademicCapIcon;
              return (
                <li key={`${s.lesson.id}-${i}`}>
                  <button type="button" onClick={() => onLesson(s.lesson.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg ring-1 text-left ${STYLE[s.state]}`}>
                    <span className="w-7 h-7 rounded-md bg-white dark:bg-secondary-900 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {t('detail.lessonN', { n: s.lesson.n })}. {pick(s.lesson.title, f.locale)}
                      </span>
                      <span className="block text-[11px] opacity-80">{t(`path.state_${s.state}`)}</span>
                    </span>
                  </button>
                </li>
              );
            }
            if (s.kind === 'takeQuiz') {
              return (
                <li key="quiz">
                  <button type="button" onClick={onQuiz} className={`w-full flex items-center gap-3 p-2.5 rounded-lg ring-1 text-left ${STYLE.pending}`}>
                    <span className="w-7 h-7 rounded-md bg-white dark:bg-secondary-900 flex items-center justify-center shrink-0">
                      <ClipboardDocumentCheckIcon className="w-4 h-4" />
                    </span>
                    <span className="text-sm">{t('path.takeQuiz', { pct: PASS_PCT })}</span>
                  </button>
                </li>
              );
            }
            if (s.kind === 'reinforce') {
              return (
                <li key={`r-${s.lesson.id}`} className="ml-4 sm:ml-6">
                  <button type="button" onClick={() => onLesson(s.lesson.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg ring-1 text-left ${STYLE.reinforce}`}>
                    <span className="w-7 h-7 rounded-md bg-white dark:bg-secondary-900 flex items-center justify-center shrink-0">
                      <ArrowPathIcon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide">{t('path.reinforce')}</span>
                      <span className="block text-sm truncate">
                        {t('detail.lessonN', { n: s.lesson.n })}. {pick(s.lesson.title, f.locale)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            }
            const next = COURSES.find((c) => c.id === s.courseId);
            return next ? (
              <li key={`n-${s.courseId}`} className="ml-4 sm:ml-6">
                <button type="button" onClick={() => onOpenCourse(next.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg ring-1 text-left ${STYLE.next}`}>
                  <span className="w-7 h-7 rounded-md bg-white dark:bg-secondary-900 flex items-center justify-center shrink-0">
                    <SparklesIcon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide">{t('path.nextCourse')}</span>
                    <span className="block text-sm truncate">{pick(next.title, f.locale)}</span>
                  </span>
                </button>
              </li>
            ) : null;
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
