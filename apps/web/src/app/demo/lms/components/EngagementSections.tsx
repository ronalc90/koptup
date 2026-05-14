'use client';

import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  PuzzlePieceIcon,
  VideoCameraIcon,
  FireIcon,
  BoltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export interface LiveSession {
  id: number;
  titleKey: string;
  hostKey: string;
  whenKey: 'today' | 'tomorrow';
  time: string;
  attendees: number;
  rooms: number;
  live: boolean;
  countdown: string;
}

export interface BadgeDef {
  key: string;
  icon: any;
  color: string;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  you?: boolean;
}

export interface Certificate {
  id: string;
  titleKey: string;
  instructorKey: string;
  date: string;
  gradient: string;
}

export function LiveSection({ sessions }: { sessions: LiveSession[] }) {
  const t = useTranslations('demoLms');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
          {t('live.title')}
        </h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('live.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.map((s) => (
          <Card key={s.id} variant="elevated" padding="none" className="overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.2),transparent_60%)]" />
              {s.live ? (
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  {t('live.live')}
                </div>
              ) : (
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {t(`live.${s.whenKey}`)} {s.time}
                </div>
              )}
              <VideoCameraIcon className="absolute inset-0 m-auto w-16 h-16 text-white/40" />
            </div>
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-secondary-900 dark:text-white line-clamp-1">
                {t(s.titleKey)}
              </h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                {t('live.host')}: {t(s.hostKey)}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-secondary-600 dark:text-secondary-300">
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="w-3.5 h-3.5" />
                  {s.attendees}
                </span>
                <span className="inline-flex items-center gap-1">
                  <PuzzlePieceIcon className="w-3.5 h-3.5" />
                  {s.rooms} {t('live.rooms')}
                </span>
                {!s.live && (
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {s.countdown}
                  </span>
                )}
              </div>
              <Button
                variant={s.live ? 'danger' : 'primary'}
                size="sm"
                fullWidth
                className="mt-3"
              >
                {s.live ? t('live.join') : `${t('live.joinIn')} ${s.countdown}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface GamificationProps {
  xp: number;
  level: number;
  nextLevelXp: number;
  streak: number;
  badges: BadgeDef[];
  leaderboard: LeaderboardEntry[];
}

export function GamificationSection({
  xp,
  level,
  nextLevelXp,
  streak,
  badges,
  leaderboard,
}: GamificationProps) {
  const t = useTranslations('demoLms');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
          {t('gamification.title')}
        </h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {t('gamification.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card variant="elevated" className="md:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex flex-col items-center justify-center text-white shadow-lg">
                <p className="text-[10px] opacity-80 uppercase tracking-wide">
                  {t('gamification.level')}
                </p>
                <p className="text-3xl font-black leading-none">{level}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-secondary-800 dark:text-secondary-100">
                    {xp.toLocaleString()} {t('gamification.xp')}
                  </span>
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    {(nextLevelXp - xp).toLocaleString()} {t('gamification.xp')}{' '}
                    {t('gamification.nextLevel')}
                  </span>
                </div>
                <div className="h-3 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-1000"
                    style={{ width: `${(xp / nextLevelXp) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center gap-3">
                    <FireIcon className="w-7 h-7 text-rose-500" />
                    <div>
                      <p className="text-xl font-bold text-rose-600 dark:text-rose-300">
                        {streak}
                      </p>
                      <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80">
                        {t('gamification.streak')} ({t('gamification.days')})
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center gap-3">
                    <BoltIcon className="w-7 h-7 text-indigo-500" />
                    <div>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
                        +320
                      </p>
                      <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80">
                        {t('gamification.weeklyChallenge')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">
                {t('gamification.badges')}
              </h3>
              <Badge variant="primary" size="sm">
                {badges.filter((b) => b.unlocked).length}/{badges.length}{' '}
                {t('gamification.unlocked')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.key}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center transition ${
                      b.unlocked
                        ? `bg-gradient-to-br ${b.color} text-white shadow-md hover:scale-105`
                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-400'
                    }`}
                    title={t(`badges.${b.key}Desc`)}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-semibold leading-tight">
                      {t(`badges.${b.key}`)}
                    </span>
                    {!b.unlocked && (
                      <LockClosedIcon className="absolute top-1 right-1 w-3 h-3" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardContent className="p-0">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">
            {t('gamification.leaderboard')}
          </h3>
          <div className="space-y-1.5">
            {leaderboard.map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 p-2.5 rounded-lg ${
                  u.you
                    ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700'
                    : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    u.rank === 1
                      ? 'bg-amber-400 text-white'
                      : u.rank === 2
                        ? 'bg-secondary-300 dark:bg-secondary-500 text-white'
                        : u.rank === 3
                          ? 'bg-orange-400 text-white'
                          : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'
                  }`}
                >
                  {u.rank}
                </div>
                <p className="flex-1 text-sm font-medium text-secondary-800 dark:text-secondary-100">
                  {u.name}
                  {u.you && (
                    <span className="ml-2 text-[11px] text-primary-600 dark:text-primary-400">
                      ({t('gamification.you')})
                    </span>
                  )}
                </p>
                <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-200">
                  {u.xp.toLocaleString()} {t('gamification.xp')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CertificatesSection({ certificates }: { certificates: Certificate[] }) {
  const t = useTranslations('demoLms');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
          {t('certificates.title')}
        </h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {t('certificates.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((c) => (
          <Card key={c.id} variant="elevated" padding="none" className="overflow-hidden">
            <div className={`p-6 bg-gradient-to-br ${c.gradient} text-white relative`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <ShieldCheckIcon className="w-10 h-10" />
                  <Badge
                    variant="default"
                    size="sm"
                    className="bg-white/20 text-white border-white/20"
                  >
                    {c.id}
                  </Badge>
                </div>
                <p className="text-xs uppercase tracking-widest opacity-80">
                  {t('certificates.completion')}
                </p>
                <h3 className="text-xl font-black mt-1">{t(c.titleKey)}</h3>
                <p className="text-sm opacity-90 mt-2">
                  {t('certificates.issuedTo')}: <strong>Ronald</strong>
                </p>
                <div className="flex items-end justify-between mt-6">
                  <div>
                    <p className="text-[10px] uppercase opacity-70">
                      {t('certificates.signedBy')}
                    </p>
                    <p className="text-sm font-semibold italic">{t(c.instructorKey)}</p>
                    <p className="text-[11px] opacity-80 mt-1">
                      {t('certificates.issued')}: {c.date}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-md bg-white p-1.5 flex items-center justify-center">
                    <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-px">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`${(i * 37 + i) % 3 === 0 ? 'bg-secondary-900' : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-4 flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <QrCodeIcon className="w-4 h-4 mr-1" />
                {t('certificates.verify')}
              </Button>
              <Button variant="ghost" size="sm" aria-label={t('certificates.download')}>
                <ArrowDownTrayIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" aria-label={t('certificates.share')}>
                <ShareIcon className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
