'use client';

import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export type Mode = 'live' | 'self-paced' | 'cohort';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: number;
  titleKey: string;
  descKey: string;
  instructorKey: string;
  duration: string;
  rating: number;
  students: number;
  mode: Mode;
  level: Level;
  progress: number;
  gradient: string;
  modules: { titleKey: string; lessons: number; done: number }[];
  skillsKeys: string[];
}

interface CatalogGridProps {
  courses: Course[];
  search: string;
  setSearch: (s: string) => void;
  levelFilter: Level | 'all';
  setLevelFilter: (l: Level | 'all') => void;
  onOpenDetails: (c: Course) => void;
  onStart: (c: Course) => void;
}

export function modeBadgeFor(mode: Mode, t: (k: string) => string) {
  const map = {
    live: { variant: 'danger' as const, label: t('catalog.modeLive') },
    'self-paced': { variant: 'info' as const, label: t('catalog.modeSelfPaced') },
    cohort: { variant: 'warning' as const, label: t('catalog.modeCohort') },
  };
  return map[mode];
}

export function levelLabelFor(l: Level, t: (k: string) => string) {
  return l === 'beginner'
    ? t('catalog.levelBeginner')
    : l === 'intermediate'
      ? t('catalog.levelIntermediate')
      : t('catalog.levelAdvanced');
}

export default function CatalogGrid({
  courses,
  search,
  setSearch,
  levelFilter,
  setLevelFilter,
  onOpenDetails,
  onStart,
}: CatalogGridProps) {
  const t = useTranslations('demoLms');

  const filtered = courses.filter((c) => {
    const matchSearch =
      !search ||
      t(c.titleKey).toLowerCase().includes(search.toLowerCase()) ||
      t(c.instructorKey).toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'all' || c.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t('catalog.title')}
          </h2>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {t('catalog.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
              className="pl-9 pr-3 py-2 w-64 max-w-full text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as Level | 'all')}
            className="text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-secondary-800 dark:text-secondary-100"
          >
            <option value="all">{t('catalog.all')}</option>
            <option value="beginner">{t('catalog.levelBeginner')}</option>
            <option value="intermediate">{t('catalog.levelIntermediate')}</option>
            <option value="advanced">{t('catalog.levelAdvanced')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="p-0 text-center text-secondary-500 dark:text-secondary-400 py-10">
            {t('catalog.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const mb = modeBadgeFor(c.mode, t);
            return (
              <Card
                key={c.id}
                variant="elevated"
                padding="none"
                className="overflow-hidden group flex flex-col"
              >
                <div className={`relative aspect-[16/9] bg-gradient-to-br ${c.gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant={mb.variant} size="sm">
                      {mb.label}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {levelLabelFor(c.level, t)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm text-white text-xs">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {c.duration}
                  </div>
                  <AcademicCapIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-white/40" />
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-secondary-900 dark:text-white line-clamp-2">
                    {t(c.titleKey)}
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">
                    {t(c.descKey)}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-2">
                    {t('catalog.instructor')}:{' '}
                    <span className="font-medium">{t(c.instructorKey)}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-secondary-600 dark:text-secondary-300">
                    <span className="inline-flex items-center gap-1">
                      <StarSolid className="w-3.5 h-3.5 text-amber-400" />
                      {c.rating}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5" />
                      {c.students.toLocaleString()}
                    </span>
                  </div>
                  {c.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-secondary-500 dark:text-secondary-400">
                          {t('detail.progress')}
                        </span>
                        <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                          {c.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onOpenDetails(c)}
                    >
                      {t('catalog.viewDetails')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => onStart(c)}
                    >
                      {c.progress > 0 ? t('catalog.continue') : t('catalog.enroll')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
