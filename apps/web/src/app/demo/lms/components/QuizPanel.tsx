'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface QuizPanelProps {
  questions: QuizQuestion[];
}

export default function QuizPanel({ questions }: QuizPanelProps) {
  const t = useTranslations('demoLms');
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const q = questions[step];

  const onSelect = (i: number) => {
    if (submitted) return;
    setSelected(i);
  };

  const onSubmit = () => {
    if (selected === null) return;
    if (selected === q.correct) setScore((s) => s + 1);
    setSubmitted(true);
  };

  const onNext = () => {
    if (step + 1 >= total) {
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const restart = () => {
    setStep(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    const earned = pct >= 70;
    return (
      <Card variant="elevated">
        <CardContent className="p-0 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <TrophyIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
            {t('quiz.complete')}
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            {t('quiz.score')}: {score}/{total} ({pct}%)
          </p>
          {earned && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium">
              <TrophyIcon className="w-4 h-4" />
              {t('quiz.earnedBadge')}
            </div>
          )}
          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={restart}>
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              {t('quiz.restart')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
              {t('quiz.title')}
            </h3>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {t('quiz.question')} {step + 1} {t('quiz.of')} {total}
            </p>
          </div>
          <Badge variant="primary">
            {score}/{total}
          </Badge>
        </div>

        <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((step + (submitted ? 1 : 0)) / total) * 100}%` }}
          />
        </div>

        <p className="text-base font-medium text-secondary-900 dark:text-white mb-4">
          {q.question}
        </p>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = submitted && i === q.correct;
            const isWrong = submitted && isSelected && i !== q.correct;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
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
                <span className="flex-1">{opt}</span>
                {isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                {isWrong && <XCircleIcon className="w-5 h-5 text-red-600" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              selected === q.correct
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {selected === q.correct
              ? t('quiz.correct')
              : `${t('quiz.incorrect')} ${q.options[q.correct]}`}
          </div>
        )}

        <div className="flex justify-end mt-5">
          {!submitted ? (
            <Button variant="primary" size="sm" onClick={onSubmit} disabled={selected === null}>
              {t('quiz.submit')}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onNext}>
              {step + 1 >= total ? t('quiz.complete') : t('quiz.next')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
