'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { MagnifyingGlassIcon, ClockIcon, UsersIcon, AcademicCapIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { pick, progressOf } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import { studentsInCourse } from '../lib/selectors';
import type { Course, Level, Mode } from '../lib/types';
import { SectionTitle, useFmt } from './ui';

type Translate = (k: string) => string;

export function modeBadgeFor(mode: Mode, t: Translate) {
  const map = {
    live: { variant: 'danger' as const, label: t('catalog.modeLive') },
    'self-paced': { variant: 'info' as const, label: t('catalog.modeSelfPaced') },
    cohort: { variant: 'warning' as const, label: t('catalog.modeCohort') },
  };
  return map[mode];
}

export function levelLabelFor(l: Level, t: Translate) {
  return l === 'beginner' ? t('catalog.levelBeginner') : l === 'intermediate' ? t('catalog.levelIntermediate') : t('catalog.levelAdvanced');
}

type Show = 'all' | 'mine' | 'available';
type Sort = 'popular' | 'priceAsc' | 'priceDesc' | 'rating';

const selectCls =
  'flex-1 sm:flex-none min-w-[9.5rem] text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 pl-3 pr-9 py-2 text-secondary-800 dark:text-secondary-100';

export default function CatalogGrid({
  courses,
  onOpen,
  onBuy,
  onContinue,
}: {
  courses: Course[];
  onOpen: (id: string) => void;
  onBuy: (id: string) => void;
  onContinue: (id: string) => void;
}) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state } = useLmsReady();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [show, setShow] = useState<Show>('all');
  const [sort, setSort] = useState<Sort>('popular');

  const list = useMemo(() => {
    const qq = search
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const norm = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const rows = courses
      .filter((c) => {
        const hay = norm(`${pick(c.title, f.locale)} ${pick(c.desc, f.locale)} ${c.instructor} ${pick(c.category, f.locale)}`);
        const enrolled = !!state.enrollments[c.id];
        return (
          (!qq || hay.includes(qq)) &&
          (level === 'all' || c.level === level) &&
          (show === 'all' || (show === 'mine' ? enrolled : !enrolled))
        );
      })
      .map((c) => ({ c, students: studentsInCourse(state, c.id) }));
    rows.sort((a, b) =>
      sort === 'priceAsc'
        ? a.c.price - b.c.price
        : sort === 'priceDesc'
          ? b.c.price - a.c.price
          : sort === 'rating'
            ? b.c.rating - a.c.rating
            : b.students - a.students,
    );
    return rows;
  }, [courses, search, level, show, sort, state, f.locale]);

  return (
    <div className="space-y-5">
      <SectionTitle title={t('catalog.title')} subtitle={t('catalog.subtitle')} />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] sm:flex-none">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            aria-label={t('catalog.searchPlaceholder')}
            className="pl-9 pr-3 py-2 w-full sm:w-72 text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value as Level | 'all')} className={selectCls} aria-label={t('catalog.filterLevel')}>
          <option value="all">{t('catalog.allLevels')}</option>
          <option value="beginner">{t('catalog.levelBeginner')}</option>
          <option value="intermediate">{t('catalog.levelIntermediate')}</option>
          <option value="advanced">{t('catalog.levelAdvanced')}</option>
        </select>
        <select value={show} onChange={(e) => setShow(e.target.value as Show)} className={selectCls} aria-label={t('catalog.filterShow')}>
          <option value="all">{t('catalog.showAll')}</option>
          <option value="mine">{t('catalog.showMine')}</option>
          <option value="available">{t('catalog.showAvailable')}</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectCls} aria-label={t('catalog.sortLabel')}>
          <option value="popular">{t('catalog.sortPopular')}</option>
          <option value="priceAsc">{t('catalog.sortPriceAsc')}</option>
          <option value="priceDesc">{t('catalog.sortPriceDesc')}</option>
          <option value="rating">{t('catalog.sortRating')}</option>
        </select>
        <span className="text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
          {t('catalog.count', { count: list.length })}
        </span>
      </div>

      {list.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="p-0 text-center text-secondary-500 dark:text-secondary-400 py-10">{t('catalog.empty')}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map(({ c, students }) => {
            const mb = modeBadgeFor(c.mode, t);
            const enr = state.enrollments[c.id];
            const progress = progressOf(c, enr);
            return (
              <Card key={c.id} variant="elevated" padding="none" className="overflow-hidden group flex flex-col">
                <div className={`relative aspect-[16/9] bg-gradient-to-br ${c.gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap pr-3">
                    <Badge variant={mb.variant} size="sm">
                      {mb.label}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {levelLabelFor(c.level, t)}
                    </Badge>
                    {c.custom && (
                      <Badge variant="default" size="sm">
                        {t('catalog.newBadge')}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm text-white text-xs">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {t('catalog.hours', { hours: c.hours })}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-white/90 dark:bg-secondary-900/90 text-secondary-900 dark:text-white text-sm font-bold">
                    {enr ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                        <CheckBadgeIcon className="w-4 h-4" />
                        {t('catalog.enrolled')}
                      </span>
                    ) : c.price > 0 ? (
                      f.money(c.price)
                    ) : (
                      t('catalog.free')
                    )}
                  </div>
                  <AcademicCapIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-white/40" />
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{pick(c.category, f.locale)}</p>
                  <h3 className="text-base font-bold text-secondary-900 dark:text-white line-clamp-2">{pick(c.title, f.locale)}</h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">{pick(c.desc, f.locale)}</p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-2">
                    {t('catalog.instructor')}: <span className="font-medium">{c.instructor}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-secondary-600 dark:text-secondary-300">
                    {c.reviews > 0 && (
                      <span className="inline-flex items-center gap-1" title={t('catalog.ratingHint', { count: c.reviews })}>
                        <StarSolid className="w-3.5 h-3.5 text-amber-400" />
                        {f.dec(c.rating)} ({f.int(c.reviews)})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1" title={t('catalog.studentsHint')}>
                      <UsersIcon className="w-3.5 h-3.5" />
                      {t('catalog.studentsCount', { count: students })}
                    </span>
                  </div>
                  {enr && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('detail.progress')}</span>
                        <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">{f.pct(progress)}</span>
                      </div>
                      <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpen(c.id)}>
                      {t('catalog.viewDetails')}
                    </Button>
                    {enr ? (
                      <Button variant="primary" size="sm" className="flex-1" onClick={() => onContinue(c.id)}>
                        {progress >= 100 ? t('catalog.review') : t('catalog.continue')}
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" className="flex-1" onClick={() => onBuy(c.id)}>
                        {c.price > 0 ? t('catalog.buy') : t('catalog.enrollFree')}
                      </Button>
                    )}
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
