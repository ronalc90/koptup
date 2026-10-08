'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowPathIcon, CheckCircleIcon, ShieldCheckIcon, TrophyIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { gradeQuiz, lessonsOf, PASS_PCT, pick, quizPct } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import type { Course } from '../lib/types';
import { useFmt } from './ui';

export default function QuizPanel({
  course,
  onReview,
  onCertificates,
}: {
  course: Course;
  onReview: (lessonId: string) => void;
  onCertificates: () => void;
}) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, dispatch } = useLmsReady();
  const enr = state.enrollments[course.id];
  const questions = course.quiz;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [view, setView] = useState<'intro' | 'quiz' | 'result'>(enr?.quiz ? 'result' : 'intro');

  useEffect(() => {
    setStep(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setView(state.enrollments[course.id]?.quiz ? 'result' : 'intro');
    // Solo al cambiar de curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  if (questions.length === 0) {
    return (
      <Card variant="elevated">
        <CardContent className="p-0 text-sm text-secondary-500 dark:text-secondary-400">{t('quiz.none')}</CardContent>
      </Card>
    );
  }

  const total = questions.length;
  const q = questions[step];

  const start = () => {
    setStep(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setView('quiz');
  };

  const onSubmit = () => {
    if (selected === null) return;
    setAnswers((a) => [...a.slice(0, step), selected]);
    setSubmitted(true);
  };

  const onNext = () => {
    if (step + 1 >= total) {
      dispatch({ type: 'quiz.submit', courseId: course.id, answers });
      setView('result');
      return;
    }
    setStep((s) => s + 1);
    setSelected(null);
    setSubmitted(false);
  };

  if (view === 'intro') {
    return (
      <Card variant="elevated" id="lms-quiz">
        <CardContent className="p-0 space-y-3">
          <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{t('quiz.title')}</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('quiz.intro', { count: total, pct: PASS_PCT })}</p>
          <Button variant="primary" size="sm" onClick={start}>
            {t('quiz.start')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (view === 'result' && enr?.quiz) {
    const attempt = enr.quiz;
    const pct = quizPct(attempt.score, attempt.total);
    const g = gradeQuiz(questions, attempt.answers);
    const cert = enr.certificateId ? state.certificates.find((c) => c.id === enr.certificateId) : undefined;
    const lessons = lessonsOf(course);
    const pending = lessons.filter((x) => x.kind !== 'quiz' && !enr.completed[x.id]);
    return (
      <Card variant="elevated" id="lms-quiz">
        <CardContent className="p-0 text-center space-y-3">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              g.passed ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-secondary-400 to-secondary-500'
            }`}
          >
            <TrophyIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{g.passed ? t('quiz.passed') : t('quiz.failed')}</h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {t('quiz.scoreLine', { score: attempt.score, total: attempt.total, pct: f.pct(pct) })}
            {attempt.best > attempt.score ? ` · ${t('quiz.best', { best: attempt.best, total: attempt.total })}` : ''}
          </p>
          {attempt.score === attempt.total && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium">
              <TrophyIcon className="w-4 h-4" />
              {t('quiz.perfectBadge')}
            </div>
          )}
          {!g.passed && g.failed.length > 0 && (
            <div className="text-left p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-1.5">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">{t('quiz.review')}</p>
              {g.failed.map((qq) => {
                const ls = lessons.find((x) => x.id === qq.lessonId);
                return ls ? (
                  <button key={qq.id} type="button" onClick={() => onReview(ls.id)} className="block text-left text-xs text-amber-900 dark:text-amber-100 hover:underline">
                    → {t('detail.lessonN', { n: ls.n })}. {pick(ls.title, f.locale)}
                  </button>
                ) : null;
              })}
            </div>
          )}
          {cert ? (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2 flex-wrap">
              <ShieldCheckIcon className="w-5 h-5" />
              {t('quiz.certIssued', { code: cert.id })}
              <button type="button" onClick={onCertificates} className="font-semibold underline">
                {t('quiz.seeCert')}
              </button>
            </div>
          ) : g.passed && pending.length > 0 ? (
            <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('quiz.pendingLessons', { count: pending.length })}</p>
          ) : null}
          <div>
            <Button variant="outline" size="sm" onClick={start}>
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              {t('quiz.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" id="lms-quiz">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{t('quiz.title')}</h3>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('quiz.progress', { n: step + 1, total })}</p>
          </div>
          <Badge variant="primary">
            {answers.filter((a, i) => a === questions[i].correct).length}/{total}
          </Badge>
        </div>

        <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((step + (submitted ? 1 : 0)) / total) * 100}%` }}
          />
        </div>

        <p className="text-base font-medium text-secondary-900 dark:text-white mb-4">{pick(q.q, f.locale)}</p>

        <div className="space-y-2" role="radiogroup" aria-label={pick(q.q, f.locale)}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = submitted && i === q.correct;
            const isWrong = submitted && isSelected && i !== q.correct;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => !submitted && setSelected(i)}
                disabled={submitted}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center gap-3 ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : isWrong
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      : isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700 text-secondary-800 dark:text-secondary-100'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isCorrect
                      ? 'bg-green-500 text-white'
                      : isWrong
                        ? 'bg-red-500 text-white'
                        : isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{pick(opt, f.locale)}</span>
                {isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                {isWrong && <XCircleIcon className="w-5 h-5 text-red-600" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              selected === q.correct ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {selected === q.correct ? t('quiz.correct') : t('quiz.incorrect', { answer: pick(q.options[q.correct], f.locale) })}
          </div>
        )}

        <div className="flex justify-end mt-5">
          {!submitted ? (
            <Button variant="primary" size="sm" onClick={onSubmit} disabled={selected === null}>
              {t('quiz.submit')}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onNext}>
              {step + 1 >= total ? t('quiz.finish') : t('quiz.next')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
