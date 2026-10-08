'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import {
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  BackwardIcon,
  CheckCircleIcon,
  ForwardIcon,
  LanguageIcon,
  PauseIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { clock } from '../lib/dates';
import { lessonsOf, pick } from '../lib/engine';
import { downloadText, slugify } from '../lib/files';
import { useLmsReady } from '../lib/store';
import type { Course, Locale } from '../lib/types';
import { KIND_ICON } from './CourseModal';
import { SimNote, useFmt } from './ui';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
type Subs = 'off' | Locale;

export default function PlayerPanel({
  course,
  lessonId,
  onLesson,
  onJump,
  seek,
  onGoQuiz,
}: {
  course: Course;
  lessonId: string;
  onLesson: (id: string) => void;
  onJump: (id: string, at: number) => void;
  seek: { at: number; nonce: number } | null;
  onGoQuiz: () => void;
}) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, dispatch } = useLmsReady();
  const enr = state.enrollments[course.id];
  const lessons = useMemo(() => lessonsOf(course), [course]);
  const idx = Math.max(0, lessons.findIndex((x) => x.id === lessonId));
  const lesson = lessons[idx];
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [subs, setSubs] = useState<Subs>(f.locale);
  const [note, setNote] = useState('');
  const timeRef = useRef(0);
  timeRef.current = time;

  const done = !!(lesson && enr?.completed[lesson.id]);
  const isVideo = lesson?.kind === 'video';

  // Al cambiar de lección: retoma donde quedó y pausa.
  useEffect(() => {
    if (!lesson) return;
    setPlaying(false);
    const saved = enr?.position[lesson.id] ?? 0;
    setTime(saved >= lesson.duration ? 0 : saved);
    // Solo al cambiar de lección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // Saltos pedidos por el tutor o por una nota (lección + minuto).
  useEffect(() => {
    if (!seek) return;
    setTime(seek.at);
    setPlaying(false);
  }, [seek]);

  // Reloj del video simulado: avanza según la velocidad elegida.
  const duration = lesson?.duration ?? 0;
  useEffect(() => {
    if (!playing || !isVideo) return;
    const id = setInterval(() => setTime((v) => Math.min(duration, v + 0.25 * speed)), 250);
    return () => clearInterval(id);
  }, [playing, speed, isVideo, duration]);

  // Al llegar al final mientras se reproduce: la lección queda completada.
  useEffect(() => {
    if (!playing || !lesson || !isVideo || time < lesson.duration) return;
    setPlaying(false);
    setTime(lesson.duration);
    dispatch({ type: 'lesson.position', courseId: course.id, lessonId: lesson.id, sec: 0 });
    if (!enr?.completed[lesson.id]) {
      dispatch({ type: 'lesson.complete', courseId: course.id, lessonId: lesson.id });
      toast.success(t('player.completedToast', { lesson: pick(lesson.title, f.locale) }));
    }
  }, [time, playing, lesson, isVideo, dispatch, course.id, enr, t, f.locale]);

  if (!lesson) return null;

  const savePosition = () => dispatch({ type: 'lesson.position', courseId: course.id, lessonId: lesson.id, sec: timeRef.current });

  const go = (i: number) => {
    const target = lessons[Math.max(0, Math.min(lessons.length - 1, i))];
    if (!target || target.id === lesson.id) return;
    if (isVideo) savePosition();
    onLesson(target.id);
  };

  const togglePlay = () => {
    if (playing) savePosition();
    else if (time >= lesson.duration) setTime(0);
    setPlaying((p) => !p);
  };

  const complete = () => {
    if (done) return;
    dispatch({ type: 'lesson.complete', courseId: course.id, lessonId: lesson.id });
    toast.success(t('player.completedToast', { lesson: pick(lesson.title, f.locale) }));
  };

  const caption = isVideo && subs !== 'off' ? [...lesson.lines].reverse().find((ln) => ln.at <= time) : undefined;
  const courseNotes = state.notes.filter((n) => n.courseId === course.id);

  const saveNote = () => {
    const text = note.trim();
    if (!text) return;
    dispatch({ type: 'note.add', courseId: course.id, lessonId: lesson.id, at: isVideo ? time : 0, text });
    setNote('');
    toast.success(t('player.noteSaved'));
  };

  const exportNotes = () => {
    const lines = courseNotes
      .slice()
      .reverse()
      .map((n) => {
        const ls = lessons.find((x) => x.id === n.lessonId);
        const where = ls ? `${t('detail.lessonN', { n: ls.n })} - ${pick(ls.title, f.locale)}${ls.kind === 'video' ? ` (${clock(n.at)})` : ''}` : '';
        return `[${f.date(n.createdAt)}] ${where}\n${n.text}\n`;
      });
    downloadText(`notas-${slugify(pick(course.title, f.locale))}.txt`, `${pick(course.title, f.locale)}\n\n${lines.join('\n')}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card variant="elevated" padding="none" className="overflow-hidden">
          {isVideo ? (
            <div className="relative aspect-video bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/40 text-white/90 text-[10px] font-medium">{t('player.simulatedVideo')}</span>
              <button
                type="button"
                onClick={togglePlay}
                className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 ring-2 ring-white/40"
                aria-label={playing ? t('player.pause') : t('player.play')}
              >
                {playing ? <PauseIcon className="w-9 h-9 text-white" /> : <PlayIcon className="w-9 h-9 text-white translate-x-0.5" />}
              </button>
              {caption && (
                <p className="absolute left-1/2 -translate-x-1/2 bottom-[4.5rem] sm:bottom-20 w-[92%] text-center text-white text-xs sm:text-sm bg-black/70 rounded px-2 py-1" aria-live="polite">
                  {pick(caption.text, subs as Locale)}
                </p>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white/90 text-xs sm:text-sm font-medium truncate">{pick(course.title, f.locale)}</p>
                <p className="text-white text-sm sm:text-base font-semibold truncate">
                  {t('detail.lessonN', { n: lesson.n })}. {pick(lesson.title, f.locale)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="range"
                    min={0}
                    max={lesson.duration}
                    step={1}
                    value={Math.min(time, lesson.duration)}
                    onChange={(e) => setTime(Number(e.target.value))}
                    onMouseUp={savePosition}
                    onTouchEnd={savePosition}
                    aria-label={t('player.seek')}
                    className="flex-1 accent-pink-400 h-1.5"
                  />
                  <span className="text-[11px] text-white/90 tabular-nums shrink-0">
                    {clock(time)} / {clock(lesson.duration)}
                  </span>
                </div>
              </div>
            </div>
          ) : lesson.kind === 'reading' ? (
            <div className="sm:aspect-video max-h-[70vh] overflow-y-auto bg-white dark:bg-secondary-900 p-5 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                {t('kind.reading')} · {t('detail.minutes', { n: Math.round(lesson.duration / 60) })}
              </p>
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white mt-1">
                {t('detail.lessonN', { n: lesson.n })}. {pick(lesson.title, f.locale)}
              </h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary-700 dark:text-secondary-200">
                {lesson.lines.length > 0 ? lesson.lines.map((ln, i) => <p key={i}>{pick(ln.text, f.locale)}</p>) : <p>{t('player.noContent')}</p>}
              </div>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-br from-cyan-700 to-cyan-900 text-white p-6">
              <QuestionMarkCircleIcon className="w-12 h-12 opacity-80" />
              <p className="text-lg font-bold">{pick(lesson.title, f.locale)}</p>
              <p className="text-sm opacity-90 max-w-md">{t('player.quizLesson', { count: course.quiz.length })}</p>
              <button type="button" onClick={onGoQuiz} className="px-4 py-2 rounded-lg bg-white text-cyan-800 text-sm font-semibold hover:bg-cyan-50">
                {t('player.goToQuiz')}
              </button>
            </div>
          )}

          <div className="p-4 flex flex-wrap items-center gap-2 sm:gap-3 border-t border-secondary-200 dark:border-secondary-700">
            <Button variant="ghost" size="sm" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label={t('player.prev')}>
              <BackwardIcon className="w-5 h-5" />
            </Button>
            {isVideo && (
              <>
                <Button variant="primary" size="sm" onClick={togglePlay}>
                  {playing ? <PauseIcon className="w-4 h-4 mr-1" /> : <PlayIcon className="w-4 h-4 mr-1" />}
                  {playing ? t('player.pause') : t('player.play')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setTime((v) => Math.max(0, v - 10))} aria-label={t('player.back10')} title={t('player.back10')}>
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => go(idx + 1)} disabled={idx === lessons.length - 1} aria-label={t('player.next')}>
              <ForwardIcon className="w-5 h-5" />
            </Button>
            {lesson.kind !== 'quiz' &&
              (done ? (
                <Badge variant="success" size="sm">
                  <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                  {t('player.completed')}
                </Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={complete}>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  {lesson.kind === 'reading' ? t('player.markRead') : t('player.markDone')}
                </Button>
              ))}
            {isVideo && (
              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                <label className="text-xs text-secondary-600 dark:text-secondary-400" htmlFor="lms-speed">
                  {t('player.speed')}
                </label>
                <select
                  id="lms-speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="text-sm rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 pl-2 pr-8 py-1 text-secondary-800 dark:text-secondary-100"
                >
                  {SPEEDS.map((s) => (
                    <option key={s} value={s}>
                      {f.dec(s)}x
                    </option>
                  ))}
                </select>
                <LanguageIcon className="w-4 h-4 text-secondary-500" aria-hidden="true" />
                <label className="sr-only" htmlFor="lms-subs">
                  {t('player.subtitles')}
                </label>
                <select
                  id="lms-subs"
                  value={subs}
                  onChange={(e) => setSubs(e.target.value as Subs)}
                  className="text-sm rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 pl-2 pr-8 py-1 text-secondary-800 dark:text-secondary-100"
                  title={t('player.subtitles')}
                >
                  <option value="off">{t('player.subtitlesOff')}</option>
                  <option value="es">{t('player.subtitlesEs')}</option>
                  <option value="en">{t('player.subtitlesEn')}</option>
                </select>
              </div>
            )}
          </div>
          {isVideo && (
            <div className="px-4 pb-4">
              <SimNote>{t('player.simNote')}</SimNote>
            </div>
          )}
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h3 className="text-sm font-semibold text-secondary-800 dark:text-secondary-100">{t('player.notes')}</h3>
              {courseNotes.length > 0 && (
                <button type="button" onClick={exportNotes} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  {t('player.exportNotes')}
                </button>
              )}
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('player.notesPlaceholder')} rows={3} aria-label={t('player.notes')} />
            <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
              <span className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('player.notesHint')}</span>
              <Button variant="outline" size="sm" onClick={saveNote} disabled={!note.trim()}>
                {isVideo ? t('player.saveNoteAt', { time: clock(time) }) : t('player.saveNote')}
              </Button>
            </div>
            {courseNotes.length > 0 && (
              <ul className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                {courseNotes.map((n) => {
                  const ls = lessons.find((x) => x.id === n.lessonId);
                  return (
                    <li key={n.id} className="p-2.5 rounded-lg bg-secondary-50 dark:bg-secondary-800/50 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline text-left"
                          onClick={() => ls && onJump(ls.id, n.at)}
                          title={t('player.goToNote')}
                        >
                          {ls ? `${t('detail.lessonN', { n: ls.n })} · ${pick(ls.title, f.locale)}${ls.kind === 'video' ? ` · ${clock(n.at)}` : ''}` : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'note.remove', id: n.id })}
                          className="p-1 rounded text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label={t('player.deleteNote')}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-secondary-800 dark:text-secondary-100 whitespace-pre-wrap break-words mt-0.5">{n.text}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardContent className="p-0">
          <h3 className="text-sm font-semibold text-secondary-800 dark:text-secondary-100 mb-3">{t('player.playlist')}</h3>
          <div className="space-y-1">
            {lessons.map((item, i) => {
              const active = item.id === lesson.id;
              const isDone = !!enr?.completed[item.id];
              const Icon = KIND_ICON[item.kind];
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => go(i)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                    active ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : active
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'
                    }`}
                  >
                    {isDone ? <CheckCircleIcon className="w-4 h-4" /> : item.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-secondary-800 dark:text-secondary-100">{pick(item.title, f.locale)}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 inline-flex items-center gap-1">
                      <Icon className="w-3.5 h-3.5" />
                      {t(`kind.${item.kind}`)} · {item.kind === 'video' ? clock(item.duration) : t('detail.minutes', { n: Math.round(item.duration / 60) })}
                    </p>
                  </div>
                  {active && <PlayIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
