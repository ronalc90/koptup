'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftOnRectangleIcon, HandRaisedIcon, LanguageIcon, PuzzlePieceIcon, UsersIcon } from '@heroicons/react/24/outline';
import { CLASSMATES, COURSES, type LiveTemplate } from '../lib/catalog';
import { pick } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import type { Locale } from '../lib/types';
import { Modal, SimNote, btn, useFmt } from './ui';

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

/**
 * Sala de clase simulada: guion del anfitrión con subtítulos en español o
 * inglés, salas de trabajo y registro de asistencia al salir. En un proyecto
 * real la sesión se crea en Zoom, Google Meet o Microsoft Teams.
 */
export default function LiveRoomModal({ session, startMs, onClose }: { session: LiveTemplate; startMs: number; onClose: (attended: boolean) => void }) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state } = useLmsReady();
  const [elapsed, setElapsed] = useState(0);
  const [subs, setSubs] = useState<'off' | Locale>(f.locale);
  const [myRoom, setMyRoom] = useState<number | null>(null);
  const [hand, setHand] = useState(false);
  const course = COURSES.find((c) => c.id === session.courseId);
  const people = [...CLASSMATES.map((c) => c.name), state.profile.name];
  const roomOf = (i: number) => i % session.rooms;
  const assigned = roomOf(people.length - 1);

  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs]);

  // Cada 6 s avanza una línea del guion del anfitrión (subtítulos).
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (session.script.length === 0) return;
    const id = setInterval(() => setLine((v) => (v + 1) % session.script.length), 6000);
    return () => clearInterval(id);
  }, [session.script.length]);

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <Modal open onClose={() => onClose(true)} title={pick(session.title, f.locale)} labelledBy="lms-live-room" size="xl" closeLabel={t('live.leave')}>
      <div className="p-4 sm:p-5 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {t('live.live')} · {mm}:{ss}
            </span>
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/40 text-white/90 text-[10px]">{t('live.simRoom')}</span>
            {myRoom === null ? (
              <div className="text-center text-white">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto">
                  {initials(course?.instructor ?? 'AQ')}
                </div>
                <p className="mt-2 text-sm font-semibold">{course?.instructor}</p>
                <p className="text-[11px] opacity-70">{t('live.hostSpeaking')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-4 w-full max-w-md">
                {people
                  .map((p, i) => ({ p, i }))
                  .filter((x) => roomOf(x.i) === myRoom)
                  .map((x) => (
                    <div key={x.p} className="aspect-video rounded-lg bg-white/10 flex flex-col items-center justify-center text-white">
                      <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{initials(x.p)}</span>
                      <span className="text-[10px] mt-1 truncate max-w-full px-1">{x.p}</span>
                    </div>
                  ))}
              </div>
            )}
            {myRoom === null && subs !== 'off' && session.script.length > 0 && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[92%] text-center text-white text-xs sm:text-sm bg-black/70 rounded px-2 py-1" aria-live="polite">
                {pick(session.script[line], subs)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <LanguageIcon className="w-4 h-4 text-secondary-500" aria-hidden="true" />
            <label className="sr-only" htmlFor="lms-live-subs">
              {t('player.subtitles')}
            </label>
            <select
              id="lms-live-subs"
              value={subs}
              onChange={(e) => setSubs(e.target.value as 'off' | Locale)}
              className="text-sm rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 pl-2 pr-8 py-1 text-secondary-800 dark:text-secondary-100"
            >
              <option value="off">{t('player.subtitlesOff')}</option>
              <option value="es">{t('player.subtitlesEs')}</option>
              <option value="en">{t('player.subtitlesEn')}</option>
            </select>
            <button type="button" className={btn.outline} aria-pressed={hand} onClick={() => setHand((h) => !h)}>
              <HandRaisedIcon className={`w-4 h-4 ${hand ? 'text-amber-500' : ''}`} />
              {hand ? t('live.lowerHand') : t('live.raiseHand')}
            </button>
            <button type="button" className={`${btn.outline} sm:ml-auto`} onClick={() => onClose(true)}>
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
              {t('live.leave')}
            </button>
          </div>
          {hand && <p className="text-xs text-amber-700 dark:text-amber-300">{t('live.handRaised')}</p>}
          <SimNote>{t('live.roomNote')}</SimNote>
        </div>

        <aside className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white flex items-center gap-1.5 mb-2">
              <PuzzlePieceIcon className="w-4 h-4" />
              {t('live.breakoutTitle')}
            </h3>
            <ul className="space-y-1.5">
              {Array.from({ length: session.rooms }).map((_, r) => {
                const members = people.filter((_, i) => roomOf(i) === r);
                const here = myRoom === r;
                return (
                  <li key={r} className={`p-2 rounded-lg border text-xs ${here ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'border-secondary-200 dark:border-secondary-700'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-secondary-800 dark:text-secondary-100">
                        {t('live.roomN', { n: r + 1 })}
                        {r === assigned ? ` · ${t('live.yourRoom')}` : ''}
                      </span>
                      {here ? (
                        <button type="button" className={btn.small} onClick={() => setMyRoom(null)}>
                          {t('live.backMain')}
                        </button>
                      ) : (
                        <button type="button" className={btn.small} onClick={() => setMyRoom(r)}>
                          {t('live.enterRoom')}
                        </button>
                      )}
                    </div>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1 truncate">{members.join(', ')}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white flex items-center gap-1.5 mb-2">
              <UsersIcon className="w-4 h-4" />
              {t('live.participants', { count: session.attendees + 1 })}
            </h3>
            <ul className="text-xs text-secondary-600 dark:text-secondary-300 space-y-1 max-h-40 overflow-y-auto">
              <li className="font-semibold">{course?.instructor} ({t('live.host')})</li>
              {people.map((p) => (
                <li key={p}>{p === state.profile.name ? `${p} (${t('gamification.you')})` : p}</li>
              ))}
              <li className="text-secondary-400">{t('live.andMore', { count: session.attendees - people.length + 1 })}</li>
            </ul>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
