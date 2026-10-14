'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EyeSlashIcon, EyeIcon, HeartIcon, PauseCircleIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { BREAK_EVERY_MIN, BREAK_MINUTES } from '../lib/data';
import { fmtClock, fmtTime, minutesBetween } from '../lib/format';
import { useModeration } from '../lib/store';
import { focusRing, Modal } from './ui';

function PauseModal() {
  const t = useTranslations('demoModeration.wellness');
  const { pauseUntil, endPause, toast } = useModeration();
  const [left, setLeft] = useState(BREAK_MINUTES * 60);
  useEffect(() => {
    if (!pauseUntil) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((pauseUntil - Date.now()) / 1000));
      setLeft(secs);
      if (secs === 0) {
        endPause();
        toast(t('pauseOver'), 'info');
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [pauseUntil, endPause, toast, t]);
  return (
    <Modal open={pauseUntil !== null} onClose={endPause} title={t('pauseTitle')}>
      <div className="space-y-4 text-center">
        <p className="font-mono text-5xl font-bold text-emerald-700 dark:text-emerald-300" aria-live="off">
          {fmtClock(left)}
        </p>
        <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('pauseText', { minutes: BREAK_MINUTES })}</p>
        <Button onClick={endPause} data-autofocus>
          {t('endPause')}
        </Button>
      </div>
    </Modal>
  );
}

function CheckinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoModeration.wellness');
  const tc = useTranslations('demoModeration.common');
  const { addCheckin, toast } = useModeration();
  const [mood, setMood] = useState<number | null>(null);
  const [rotate, setRotate] = useState<boolean | null>(null);
  const [talk, setTalk] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (open) {
      setMood(null);
      setRotate(null);
      setTalk(null);
      setError(false);
    }
  }, [open]);
  const yesNo = (value: boolean | null, set: (v: boolean) => void, name: string) => (
    <div className="flex gap-2" role="radiogroup" aria-label={name}>
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => set(v)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${focusRing} ${
            value === v ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-secondary-300 text-secondary-700 dark:border-secondary-600 dark:text-secondary-200'
          }`}
        >
          {v ? tc('yes') : tc('no')}
        </button>
      ))}
    </div>
  );
  const save = () => {
    if (mood === null || rotate === null || talk === null) {
      setError(true);
      return;
    }
    addCheckin({ mood, rotate, talk });
    onClose();
    toast(t('checkinSaved'));
    if (rotate) toast(t('rotationOn'), 'info');
    if (talk) toast(t('talkNote'), 'info');
    if (mood <= 2) toast(t('lowMood'), 'warn');
  };
  return (
    <Modal open={open} onClose={onClose} title={t('checkinTitle')}>
      <div className="space-y-4 text-sm">
        <p className="text-secondary-600 dark:text-secondary-400">{t('checkinIntro')}</p>
        <div>
          <p className="mb-2 font-medium text-secondary-800 dark:text-secondary-100">{t('q1')}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('q1')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={mood === n}
                onClick={() => setMood(n)}
                data-autofocus={n === 1 ? true : undefined}
                className={`min-w-[3.25rem] rounded-lg border px-2 py-1.5 text-sm ${focusRing} ${
                  mood === n ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-secondary-300 text-secondary-700 dark:border-secondary-600 dark:text-secondary-200'
                }`}
              >
                {n} · {t(`mood${n}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-medium text-secondary-800 dark:text-secondary-100">{t('q2')}</p>
          {yesNo(rotate, setRotate, t('q2'))}
        </div>
        <div>
          <p className="mb-2 font-medium text-secondary-800 dark:text-secondary-100">{t('q3')}</p>
          {yesNo(talk, setTalk, t('q3'))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {t('checkinMissing')}
          </p>
        )}
        <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('checkinPrivacy')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button size="sm" onClick={save}>
            {t('checkinSave')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Wellness() {
  const t = useTranslations('demoModeration.wellness');
  const { s, now, lang, startPause, toggleBlurDefault, setRotation, hiddenByRotation } = useModeration();
  const [checkin, setCheckin] = useState(false);
  const worked = minutesBetween(s.session.startedAt, now);
  const sinceBreak = minutesBetween(s.session.lastBreakAt, now);
  const nextBreak = Math.max(0, BREAK_EVERY_MIN - sinceBreak);
  const last = s.wellness.checkins[0];
  const chip = 'rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100';
  return (
    <section className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-900/10" aria-label={t('title')}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HeartIcon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">{t('title')}</p>
            <p className="mt-0.5 text-sm text-emerald-800/90 dark:text-emerald-100/80">{t('message')}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className={chip}>{t('worked', { minutes: worked })}</span>
              <span className={chip}>{nextBreak > 0 ? t('nextBreak', { minutes: nextBreak }) : t('breakDue')}</span>
              <span className={chip}>{t('reveals', { n: s.session.reveals })}</span>
              {last && <span className={chip}>{t('lastCheckin', { time: fmtTime(last.at, lang), mood: last.mood })}</span>}
              {s.wellness.rotation && (
                <span className={chip}>
                  {t('rotationChip', { n: hiddenByRotation })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={s.wellness.blurDefault}
            onClick={toggleBlurDefault}
            className="gap-1 text-emerald-800 dark:text-emerald-100"
            title={t('blurHint')}
          >
            {s.wellness.blurDefault ? <EyeSlashIcon className="h-4 w-4" aria-hidden /> : <EyeIcon className="h-4 w-4" aria-hidden />}
            {s.wellness.blurDefault ? t('blurOn') : t('blurOff')}
          </Button>
          {s.wellness.rotation && (
            <Button variant="ghost" size="sm" onClick={() => setRotation(false)} className="gap-1 text-emerald-800 dark:text-emerald-100">
              <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden />
              {t('rotationOff')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startPause} className="gap-1 border-emerald-600 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-100 dark:hover:bg-emerald-900/40">
            <PauseCircleIcon className="h-5 w-5" aria-hidden />
            {t('takeBreak')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCheckin(true)} className="text-emerald-800 dark:text-emerald-100">
            {t('checkin')}
          </Button>
        </div>
      </div>
      <PauseModal />
      <CheckinModal open={checkin} onClose={() => setCheckin(false)} />
    </section>
  );
}
