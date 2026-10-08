'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ArrowDownTrayIcon,
  BellAlertIcon,
  BellIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  LinkIcon,
  LockClosedIcon,
  PencilSquareIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { ACADEMY, CLASSMATES, COURSES, LIVE, type LiveTemplate } from '../lib/catalog';
import { achievements, icsFor, LEVEL_XP, pick, sessionStart, verifyUrl, WEEKLY_GOAL, XP, type CertPayload } from '../lib/engine';
import { downloadText } from '../lib/files';
import { certificatePdf } from '../lib/pdf';
import { encodeQr, qrSvgPath } from '../lib/qr';
import { useLmsReady } from '../lib/store';
import { courseById } from '../lib/selectors';
import type { Certificate } from '../lib/types';
import LiveRoomModal from './LiveRoomModal';
import { Empty, SectionTitle, SimNote, btn, inputCls, labelCls, useFmt } from './ui';

// ---------------------------------------------------------------------------
// Clases en vivo
// ---------------------------------------------------------------------------
function useNow(intervalMs: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function countdown(ms: number, t: (k: string, v?: Record<string, number>) => string) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return d > 0 ? t('live.inDays', { d, h }) : h > 0 ? t('live.inHours', { h, m }) : t('live.inMinutes', { m });
}

export function LiveSection({ onOpenCourse }: { onOpenCourse: (id: string) => void }) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, today, dispatch } = useLmsReady();
  const now = useNow(30000);
  const [room, setRoom] = useState<LiveTemplate | null>(null);
  const [startedAt, setStartedAt] = useState<Record<string, number>>({});

  // El inicio de la clase "en vivo" se fija al montar para que no se mueva.
  useEffect(() => {
    if (now === null || Object.keys(startedAt).length > 0) return;
    setStartedAt(Object.fromEntries(LIVE.map((x) => [x.id, sessionStart(x, now, today)])));
  }, [now, startedAt, today]);

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(f.locale === 'en' ? 'en-US' : 'es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Bogota',
      }),
    [f.locale],
  );

  const ready = now !== null && Object.keys(startedAt).length > 0;

  const addToCalendar = (x: LiveTemplate, start: number) => {
    const course = COURSES.find((c) => c.id === x.courseId);
    const ics = icsFor({
      uid: `${x.id}-${start}@academia-quinde.demo`,
      title: `${pick(x.title, f.locale)} (${ACADEMY.name})`,
      description: `${course ? pick(course.title, f.locale) : ''}\n${t('live.icsNote')}`,
      startMs: start,
      durationMin: x.durationMin,
      stampMs: now ?? start,
    });
    downloadText(`clase-${x.id}.ics`, ics, 'text/calendar;charset=utf-8');
    toast.success(t('live.icsDone'));
  };

  return (
    <div className="space-y-5">
      <SectionTitle title={t('live.title')} subtitle={t('live.subtitle')} />
      {!ready ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true">
          {LIVE.map((x) => (
            <div key={x.id} className="h-80 rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LIVE.map((x) => {
            const start = startedAt[x.id];
            const end = start + x.durationMin * 60000;
            const status = now < start ? 'upcoming' : now < end ? 'live' : 'ended';
            const course = COURSES.find((c) => c.id === x.courseId);
            const enrolled = !!state.enrollments[x.courseId];
            const mine = state.live[x.id] ?? {};
            return (
              <Card key={x.id} variant="elevated" padding="none" className="overflow-hidden flex flex-col">
                <div className="relative aspect-video bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.2),transparent_60%)]" />
                  {status === 'live' ? (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      {t('live.live')}
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      {fmt.format(new Date(start))}
                    </div>
                  )}
                  <VideoCameraIcon className="absolute inset-0 m-auto w-16 h-16 text-white/40" />
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-secondary-900 dark:text-white">{pick(x.title, f.locale)}</h3>
                  {course && (
                    <button type="button" onClick={() => onOpenCourse(course.id)} className="text-left text-xs text-primary-600 dark:text-primary-400 hover:underline mt-0.5">
                      {pick(course.title, f.locale)}
                    </button>
                  )}
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    {t('live.host')}: {course?.instructor}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-secondary-600 dark:text-secondary-300 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5" />
                      {t('live.attendees', { count: x.attendees })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <PuzzlePieceIcon className="w-3.5 h-3.5" />
                      {t('live.rooms', { count: x.rooms })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {t('live.duration', { min: x.durationMin })}
                    </span>
                  </div>
                  <p className="text-xs mt-2 text-secondary-600 dark:text-secondary-300">
                    {status === 'live'
                      ? t('live.startedAgo', { m: Math.max(0, Math.round((now - start) / 60000)) })
                      : status === 'upcoming'
                        ? t('live.startsIn', { when: countdown(start - now, t) })
                        : t('live.ended')}
                  </p>
                  <div className="mt-auto pt-3 space-y-2">
                    {status === 'live' && (
                      <>
                        <Button variant="danger" size="sm" fullWidth onClick={() => setRoom(x)}>
                          {mine.attended ? t('live.rejoin') : t('live.join')}
                        </Button>
                        {mine.attended && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            {t('live.attendanceSaved')}
                          </p>
                        )}
                      </>
                    )}
                    {status === 'upcoming' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={`${btn.outline} flex-1`}
                          aria-pressed={!!mine.reminder}
                          onClick={() => {
                            dispatch({ type: 'live.reminder', id: x.id, on: !mine.reminder });
                            toast.success(mine.reminder ? t('live.reminderOff') : t('live.reminderOn'));
                          }}
                        >
                          {mine.reminder ? <BellAlertIcon className="w-4 h-4 text-amber-500" /> : <BellIcon className="w-4 h-4" />}
                          {mine.reminder ? t('live.reminderSet') : t('live.remindMe')}
                        </button>
                        <button type="button" className={`${btn.outline} flex-1`} onClick={() => addToCalendar(x, start)}>
                          <CalendarDaysIcon className="w-4 h-4" />
                          {t('live.addCalendar')}
                        </button>
                      </div>
                    )}
                    {!enrolled && status !== 'ended' && <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('live.openClass')}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <SimNote>{t('live.simNote')}</SimNote>
      {room && now !== null && (
        <LiveRoomModal
          session={room}
          startMs={startedAt[room.id]}
          onClose={(attended) => {
            if (attended && !state.live[room.id]?.attended) {
              dispatch({ type: 'live.attend', id: room.id });
              toast.success(t('live.attendanceToast'));
            }
            setRoom(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logros
// ---------------------------------------------------------------------------
const BADGES = [
  { key: 'b1', icon: SparklesIcon, color: 'from-amber-400 to-orange-500' },
  { key: 'b2', icon: FireIcon, color: 'from-rose-400 to-pink-500' },
  { key: 'b3', icon: TrophyIcon, color: 'from-yellow-400 to-amber-500' },
  { key: 'b4', icon: ChatBubbleLeftRightIcon, color: 'from-indigo-400 to-purple-500' },
  { key: 'b5', icon: PencilSquareIcon, color: 'from-cyan-400 to-blue-500' },
  { key: 'b6', icon: ShieldCheckIcon, color: 'from-emerald-400 to-teal-500' },
] as const;

export function GamificationSection() {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, today } = useLmsReady();
  const a = achievements(state, today);
  const board = [...CLASSMATES.map((c) => ({ ...c, you: false })), { name: state.profile.name, xp: a.xp, you: true }].sort((x, y) => y.xp - x.xp);
  const unlocked = Object.values(a.badges).filter(Boolean).length;
  const inLevel = a.xp - a.levelFloor;

  return (
    <div className="space-y-6">
      <SectionTitle title={t('gamification.title')} subtitle={t('gamification.subtitle')} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card variant="elevated" className="md:col-span-2 md:self-start">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                <p className="text-[10px] opacity-80 uppercase tracking-wide">{t('gamification.level')}</p>
                <p className="text-3xl font-black leading-none">{a.level}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                  <span className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{t('gamification.xpTotal', { xp: f.int(a.xp) })}</span>
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">{t('gamification.toNext', { xp: f.int(a.nextLevelXp - a.xp) })}</span>
                </div>
                <div className="h-3 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-1000"
                    style={{ width: `${Math.round((inLevel / LEVEL_XP) * 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center gap-3">
                    <FireIcon className="w-7 h-7 text-rose-500 shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-rose-600 dark:text-rose-300">{t('gamification.days', { count: a.streak })}</p>
                      <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80">{t('gamification.streak')}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center gap-3">
                    <BoltIcon className="w-7 h-7 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
                        {Math.min(a.weekly, WEEKLY_GOAL)}/{WEEKLY_GOAL}
                      </p>
                      <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80">
                        {a.weeklyDone ? t('gamification.weeklyDone', { xp: XP.weekly }) : t('gamification.weekly', { goal: WEEKLY_GOAL, xp: XP.weekly })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <details className="mt-4 text-xs text-secondary-600 dark:text-secondary-300">
              <summary className="cursor-pointer font-semibold">{t('gamification.howTitle')}</summary>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>{t('gamification.howLessons', { n: a.lessonsDone, xp: XP.lesson })}</li>
                <li>{t('gamification.howQuiz', { n: a.quizzesPassed, xp: XP.quizPass, perfect: a.perfectQuizzes, bonus: XP.quizPerfect })}</li>
                <li>{t('gamification.howCerts', { n: state.certificates.length, xp: XP.certificate })}</li>
                <li>{t('gamification.howLevel', { xp: LEVEL_XP })}</li>
              </ul>
            </details>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('gamification.badges')}</h3>
              <Badge variant="primary" size="sm">
                {t('gamification.unlocked', { n: unlocked, total: BADGES.length })}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BADGES.map((b) => {
                const on = a.badges[b.key];
                return (
                  <div
                    key={b.key}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center transition ${
                      on ? `bg-gradient-to-br ${b.color} text-white shadow-md` : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-400'
                    }`}
                    title={t(`badges.${b.key}Desc`)}
                  >
                    <b.icon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-semibold leading-tight">{t(`badges.${b.key}`)}</span>
                    {!on && <LockClosedIcon className="absolute top-1 right-1 w-3 h-3" />}
                  </div>
                );
              })}
            </div>
            <ul className="mt-3 space-y-1">
              {BADGES.map((b) => (
                <li key={b.key} className="text-[11px] text-secondary-500 dark:text-secondary-400">
                  <strong className="text-secondary-700 dark:text-secondary-200">{t(`badges.${b.key}`)}:</strong> {t(`badges.${b.key}Desc`)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardContent className="p-0">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('gamification.leaderboard')}</h3>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mb-3">{t('gamification.leaderboardNote')}</p>
          <ol className="space-y-1.5">
            {board.map((u, i) => (
              <li
                key={u.name + i}
                className={`flex items-center gap-3 p-2.5 rounded-lg ${
                  u.you ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0
                      ? 'bg-amber-400 text-white'
                      : i === 1
                        ? 'bg-secondary-300 dark:bg-secondary-500 text-white'
                        : i === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'
                  }`}
                >
                  {i + 1}
                </div>
                <p className="flex-1 min-w-0 truncate text-sm font-medium text-secondary-800 dark:text-secondary-100">
                  {u.name}
                  {u.you && <span className="ml-2 text-[11px] text-primary-600 dark:text-primary-400">({t('gamification.you')})</span>}
                </p>
                <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-200 shrink-0">{t('gamification.xpShort', { xp: f.int(u.xp) })}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certificados
// ---------------------------------------------------------------------------
export function certPayload(c: Certificate, courseTitle: string): CertPayload {
  return { c: c.id, n: c.name, t: courseTitle, h: c.hours, f: c.date, o: ACADEMY.legalName };
}

function QrSvg({ text, className }: { text: string; className?: string }) {
  const modules = useMemo(() => encodeQr(text), [text]);
  const size = modules.length + 8;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="QR" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      <path d={qrSvgPath(modules)} fill="#111827" />
    </svg>
  );
}

export function useOrigin() {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

export async function downloadCertificate(c: Certificate, courseTitle: string, instructor: string, url: string, t: (k: string, v?: Record<string, string | number>) => string, longDate: string) {
  await certificatePdf({
    filename: `certificado-${c.id}.pdf`,
    heading: t('certificates.pdfHeading'),
    certifies: t('certificates.pdfCertifies', { org: ACADEMY.name }),
    name: c.name,
    completed: t('certificates.pdfCompleted'),
    course: courseTitle,
    details: t('certificates.pdfDetails', { hours: c.hours, score: c.score, total: c.total, date: longDate }),
    code: c.id,
    instructor,
    instructorRole: t('certificates.pdfInstructor'),
    director: t('certificates.pdfDirectorName'),
    directorRole: t('certificates.pdfDirector'),
    verifyCaption: t('certificates.pdfVerify'),
    verifyUrl: url,
    sample: t('certificates.pdfSample'),
  });
}

export function CertificatesSection({ onCatalog }: { onCatalog: () => void }) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, dispatch } = useLmsReady();
  const origin = useOrigin();
  const [name, setName] = useState(state.profile.name);

  const saveName = () => {
    const v = name.trim();
    if (v.length < 3) {
      toast.error(t('certificates.nameError'));
      return;
    }
    dispatch({ type: 'profile.update', profile: { ...state.profile, name: v } });
    toast.success(t('certificates.nameSaved'));
  };

  return (
    <div className="space-y-5">
      <SectionTitle title={t('certificates.title')} subtitle={t('certificates.subtitle')} />

      <Card variant="bordered">
        <CardContent className="p-0">
          <form
            className="flex flex-col sm:flex-row sm:items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <div className="flex-1">
              <label className={labelCls} htmlFor="lms-cert-name">
                {t('certificates.nameLabel')}
              </label>
              <input id="lms-cert-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>
            <button type="submit" className={btn.primary} disabled={name.trim() === state.profile.name}>
              {t('certificates.nameSave')}
            </button>
          </form>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-2">{t('certificates.nameHint')}</p>
        </CardContent>
      </Card>

      {state.certificates.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="p-0">
            <Empty>
              <p>{t('certificates.noCerts')}</p>
              <button type="button" className={`${btn.primary} mt-3`} onClick={onCatalog}>
                {t('learning.goCatalog')}
              </button>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.certificates.map((c) => {
            const course = courseById(state, c.courseId);
            const title = course ? pick(course.title, f.locale) : c.courseId;
            const url = origin ? verifyUrl(origin, certPayload(c, title)) : '';
            return (
              <Card key={c.id} variant="elevated" padding="none" className="overflow-hidden">
                <div className={`p-6 bg-gradient-to-br ${course?.gradient ?? 'from-slate-700 to-slate-900'} text-white relative`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheckIcon className="w-8 h-8 shrink-0" />
                        <span className="text-xs font-semibold truncate">{ACADEMY.name}</span>
                      </div>
                      <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/20 font-mono">
                        {c.id}
                      </Badge>
                    </div>
                    <p className="text-xs uppercase tracking-widest opacity-80">{t('certificates.completion')}</p>
                    <h3 className="text-xl font-black mt-1">{title}</h3>
                    <p className="text-sm opacity-90 mt-2">
                      {t('certificates.issuedTo')}: <strong>{c.name}</strong>
                    </p>
                    <div className="flex items-end justify-between mt-5 gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase opacity-70">{t('certificates.signedBy')}</p>
                        <p className="text-sm font-semibold italic">{course?.instructor}</p>
                        <p className="text-[11px] opacity-80 mt-1">
                          {t('certificates.issued')}: {f.date(c.date, 'long')} · {t('catalog.hours', { hours: c.hours })}
                        </p>
                      </div>
                      <div className="w-20 h-20 rounded-md bg-white p-1 shrink-0">
                        {url ? <QrSvg text={url} className="w-full h-full" /> : <QrCodeIcon className="w-full h-full text-secondary-300" />}
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 flex items-center gap-2 flex-wrap">
                  <a href={url || undefined} target="_blank" rel="noopener noreferrer" className={`${btn.outline} flex-1`} aria-disabled={!url}>
                    <QrCodeIcon className="w-4 h-4" />
                    {t('certificates.verify')}
                  </a>
                  <button
                    type="button"
                    className={`${btn.outline} flex-1`}
                    disabled={!url}
                    onClick={() => {
                      downloadCertificate(c, title, course?.instructor ?? '', url, t, f.date(c.date, 'long'))
                        .then(() => toast.success(t('certificates.downloaded')))
                        .catch(() => toast.error(t('common.pdfError')));
                    }}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {t('certificates.download')}
                  </button>
                  <button
                    type="button"
                    className={btn.outline}
                    disabled={!url}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success(t('certificates.linkCopied'));
                      } catch {
                        window.prompt(t('certificates.copyPrompt'), url);
                      }
                    }}
                    aria-label={t('certificates.share')}
                    title={t('certificates.share')}
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('certificates.share')}</span>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <SimNote>{t('certificates.simNote')}</SimNote>
    </div>
  );
}
