'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { lessonsOf, pick, progressOf } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import { courseById } from '../lib/selectors';
import PlayerPanel from './PlayerPanel';
import TutorPanel from './TutorPanel';
import QuizPanel from './QuizPanel';
import PathPanel from './PathPanel';
import { SectionTitle, useFmt } from './ui';

export default function LearningView({
  courseId,
  onCourse,
  onCatalog,
  onOpenCourse,
  onCertificates,
}: {
  courseId: string | null;
  onCourse: (id: string) => void;
  onCatalog: () => void;
  onOpenCourse: (id: string) => void;
  onCertificates: () => void;
}) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, dispatch } = useLmsReady();

  const enrolled = Object.values(state.enrollments)
    .filter((e) => courseById(state, e.courseId))
    .sort((a, b) => {
      const la = Object.values(a.completed).sort().pop() ?? a.enrolledAt;
      const lb = Object.values(b.completed).sort().pop() ?? b.enrolledAt;
      return lb.localeCompare(la);
    });
  const activeId = courseId && state.enrollments[courseId] ? courseId : enrolled[0]?.courseId;
  const course = activeId ? courseById(state, activeId) : undefined;
  const enr = activeId ? state.enrollments[activeId] : undefined;

  const [lessonId, setLessonId] = useState<string>('');
  const [seek, setSeek] = useState<{ at: number; nonce: number } | null>(null);
  const nonce = useRef(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const certCount = useRef(state.certificates.length);

  useEffect(() => {
    if (!course || !enr) return;
    const all = lessonsOf(course);
    const start = all.find((x) => x.id === enr.lastLessonId) ?? all.find((x) => !enr.completed[x.id]) ?? all[0];
    setLessonId(start?.id ?? '');
    setSeek(null);
    // Solo al cambiar de curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  // Aviso cuando la demo emite un certificado nuevo.
  useEffect(() => {
    if (state.certificates.length > certCount.current) {
      const c = state.certificates[0];
      toast.success(t('learning.certToast', { code: c.id }), { duration: 6000 });
    }
    certCount.current = state.certificates.length;
  }, [state.certificates, t]);

  const openLesson = useCallback(
    (id: string) => {
      if (!activeId) return;
      setLessonId(id);
      dispatch({ type: 'lesson.open', courseId: activeId, lessonId: id });
    },
    [activeId, dispatch],
  );

  const jump = useCallback(
    (id: string, at: number) => {
      openLesson(id);
      nonce.current += 1;
      setSeek({ at, nonce: nonce.current });
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [openLesson],
  );

  const goQuiz = useCallback(() => {
    document.getElementById('lms-quiz')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  if (!course || !enr) {
    return (
      <Card variant="bordered">
        <CardContent className="p-0 py-10 text-center space-y-3">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('learning.empty')}</p>
          <Button variant="primary" size="sm" onClick={onCatalog}>
            {t('learning.goCatalog')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = progressOf(course, enr);
  const all = lessonsOf(course);
  const current = all.find((x) => x.id === lessonId) ?? all[0];

  return (
    <div className="space-y-6">
      <SectionTitle
        title={pick(course.title, f.locale)}
        subtitle={`${t('catalog.instructor')}: ${course.instructor}`}
        action={
          <>
            {enrolled.length > 1 && (
              <select
                value={course.id}
                onChange={(e) => onCourse(e.target.value)}
                aria-label={t('learning.switchCourse')}
                className="text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 pl-3 pr-9 py-2 text-secondary-800 dark:text-secondary-100 max-w-[16rem]"
              >
                {enrolled.map((e) => {
                  const c = courseById(state, e.courseId);
                  return c ? (
                    <option key={c.id} value={c.id}>
                      {pick(c.title, f.locale)}
                    </option>
                  ) : null;
                })}
              </select>
            )}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('detail.progress')}</p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{f.pct(progress)}</p>
              </div>
              <div className="w-28 h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </>
        }
      />

      <div ref={playerRef} className="scroll-mt-40">
        {current && <PlayerPanel course={course} lessonId={current.id} onLesson={openLesson} onJump={jump} seek={seek} onGoQuiz={goQuiz} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TutorPanel course={course} onJump={jump} />
        </div>
        <div className="lg:col-span-1">
          <QuizPanel course={course} onReview={(id) => jump(id, 0)} onCertificates={onCertificates} />
        </div>
        <div className="lg:col-span-1">
          <PathPanel course={course} onLesson={(id) => jump(id, state.enrollments[course.id]?.position[id] ?? 0)} onQuiz={goQuiz} onOpenCourse={onOpenCourse} />
        </div>
      </div>
    </div>
  );
}
