'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  ctaLabel: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  title?: string;
  subtitle?: string;
  storageKey?: string;
  onDismiss?: () => void;
}

// TODO: extract to i18n
export default function OnboardingChecklist({
  steps,
  title = 'Tus primeros pasos en Koptup',
  subtitle = 'Completá estos 3 pasos para sacarle el máximo provecho a tu cuenta.',
  storageKey = 'koptup.onboarding.dismissed',
  onDismiss,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      setDismissed(stored === '1');
    }
  }, [storageKey]);

  // Detectar pasos completados para animación
  useEffect(() => {
    const lastDone = steps.filter((s) => s.done).pop();
    if (lastDone) {
      setRecentlyCompleted(lastDone.id);
      const t = setTimeout(() => setRecentlyCompleted(null), 1500);
      return () => clearTimeout(t);
    }
  }, [steps]);

  if (!mounted || dismissed) return null;

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, '1');
    }
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card
      variant="bordered"
      className="bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-primary-950 dark:via-secondary-950 dark:to-primary-950 border-primary-200 dark:border-primary-800 shadow-sm"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
              {title}
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {subtitle}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-secondary-400 hover:text-secondary-700 dark:hover:text-white transition-colors p-1 rounded"
            aria-label="Cerrar checklist"
            title="Cerrar checklist"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progreso */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400 mb-2">
            <span className="font-medium">
              {completedCount} de {totalCount} pasos completados
            </span>
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pasos */}
        <ol className="space-y-3">
          {steps.map((step, idx) => {
            const isAnimating = recentlyCompleted === step.id;
            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  step.done
                    ? 'bg-green-50/60 dark:bg-green-950/30 border-green-200 dark:border-green-900'
                    : 'bg-white/60 dark:bg-secondary-900/40 border-secondary-200 dark:border-secondary-800',
                  isAnimating && 'animate-pulse'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.done ? (
                    <CheckCircleSolid className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-secondary-300 dark:border-secondary-700 flex items-center justify-center text-xs font-semibold text-secondary-500 dark:text-secondary-400">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-semibold text-sm',
                      step.done
                        ? 'text-green-800 dark:text-green-300 line-through decoration-green-600/40'
                        : 'text-secondary-900 dark:text-white'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">
                    {step.description}
                  </p>
                </div>
                {!step.done && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={step.href} className="whitespace-nowrap">
                      {step.ctaLabel}
                      <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                )}
                {step.done && (
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400 self-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-950">
                    Listo
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {allDone && (
          <div className="mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-950 border border-green-200 dark:border-green-900 text-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              ¡Listo! Ya tenés todo configurado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
