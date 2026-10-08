'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PaperAirplaneIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clock } from '../lib/dates';
import { lessonsOf, localSearch, pick } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import { askTutor, hasMaterial, TutorError, type TutorSource } from '../lib/tutor';
import type { Course } from '../lib/types';
import { useFmt } from './ui';

type Mode = 'llm' | 'extractive' | 'local' | 'error';

interface Msg {
  id: number;
  from: 'user' | 'tutor';
  text: string;
  sources?: TutorSource[];
  mode?: Mode;
  model?: string;
  degraded?: string;
}

export default function TutorPanel({ course, onJump }: { course: Course; onJump: (lessonId: string, at: number) => void }) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { dispatch } = useLmsReady();
  const [chat, setChat] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const seq = useRef(1);
  const box = useRef<HTMLDivElement>(null);
  const lessons = lessonsOf(course);
  const enabled = hasMaterial(course);

  useEffect(() => {
    setChat([]);
    setInput('');
  }, [course.id]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' });
  }, [chat, thinking]);

  const lessonLabel = (s: { lessonId: string | null; at: number | null; name: string }) => {
    const ls = lessons.find((x) => x.id === s.lessonId);
    if (!ls) return s.name;
    return `${t('detail.lessonN', { n: ls.n })} · ${pick(ls.title, f.locale)}${s.at !== null ? ` · ${t('tutor.minute', { time: clock(s.at) })}` : ''}`;
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || thinking || !enabled) return;
    const history = chat.filter((m) => m.mode !== 'error').map((m) => ({ role: m.from === 'user' ? ('user' as const) : ('assistant' as const), content: m.text }));
    setChat((c) => [...c, { id: seq.current++, from: 'user', text }]);
    setInput('');
    setThinking(true);
    dispatch({ type: 'tutor.asked' });
    try {
      const a = await askTutor(course, f.locale, text, history);
      setChat((c) => [
        ...c,
        { id: seq.current++, from: 'tutor', text: a.reply, sources: a.sources, mode: a.llm ? 'llm' : 'extractive', model: a.model, degraded: a.degraded },
      ]);
    } catch (err) {
      if (err instanceof TutorError && err.kind === 'rateLimited') {
        setChat((c) => [...c, { id: seq.current++, from: 'tutor', text: t('tutor.rateLimited'), mode: 'error' }]);
      } else {
        const hits = localSearch(course, text, f.locale);
        const sources: TutorSource[] = hits.map((h, i) => ({ index: i + 1, lessonId: h.lesson.id, at: h.at, name: pick(h.lesson.title, f.locale), chunk: h.text }));
        const reply = hits.length ? hits.map((h, i) => `[${i + 1}] ${h.text}`).join('\n\n') : t('tutor.localNone');
        setChat((c) => [...c, { id: seq.current++, from: 'tutor', text: reply, sources, mode: 'local' }]);
      }
    } finally {
      setThinking(false);
    }
  };

  const renderText = (m: Msg) => {
    const parts = m.text.split(/(\[\d+\])/g);
    return parts.map((p, i) => {
      const mm = p.match(/^\[(\d+)\]$/);
      if (!mm) return <Fragment key={i}>{p}</Fragment>;
      const src = m.sources?.find((s) => s.index === Number(mm[1]));
      if (!src?.lessonId) return <Fragment key={i}>{p}</Fragment>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onJump(src.lessonId as string, src.at ?? 0)}
          className="mx-0.5 px-1 rounded bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-[11px] font-semibold align-baseline hover:underline"
          title={lessonLabel(src)}
        >
          {mm[1]}
        </button>
      );
    });
  };

  const last = [...chat].reverse().find((m) => m.from === 'tutor' && m.mode);
  const status = !enabled
    ? t('tutor.noMaterial')
    : !last
      ? t('tutor.statusIdle')
      : last.mode === 'llm'
        ? t('tutor.statusLlm', { model: last.model ?? '' })
        : last.mode === 'extractive'
          ? t(`tutor.statusExtractive_${last.degraded === 'budget' ? 'budget' : last.degraded === 'provider' ? 'provider' : 'noKey'}`)
          : last.mode === 'local'
            ? t('tutor.statusLocal')
            : t('tutor.statusIdle');

  return (
    <Card variant="bordered" className="flex flex-col">
      <CardContent className="p-0 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-secondary-800 dark:text-secondary-100">{t('tutor.title')}</h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('tutor.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChat([])}
            disabled={chat.length === 0}
            className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 disabled:opacity-40"
            title={t('tutor.clear')}
            aria-label={t('tutor.clear')}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mb-3" aria-live="polite">
          {status}
        </p>

        <div ref={box} className="flex-1 min-h-[8rem] max-h-80 overflow-y-auto space-y-2 pr-1">
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100">
              {t('tutor.welcome', { course: pick(course.title, f.locale) })}
            </div>
          </div>
          {chat.map((m) => (
            <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  m.from === 'user'
                    ? 'bg-primary-500 text-white rounded-br-sm'
                    : m.mode === 'error'
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-bl-sm'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 rounded-bl-sm'
                }`}
              >
                {m.from === 'tutor' && m.mode && m.mode !== 'error' && (
                  <span className="block text-[10px] font-semibold uppercase tracking-wide mb-1 text-secondary-500 dark:text-secondary-400">
                    {t(`tutor.badge_${m.mode}`)}
                  </span>
                )}
                {m.from === 'tutor' ? renderText(m) : m.text}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-700 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t('tutor.sources')}</p>
                    {m.sources.slice(0, 4).map((s) => (
                      <button
                        key={s.index}
                        type="button"
                        disabled={!s.lessonId}
                        onClick={() => s.lessonId && onJump(s.lessonId, s.at ?? 0)}
                        className="block w-full text-left text-[11px] text-cyan-800 dark:text-cyan-200 hover:underline disabled:no-underline disabled:text-secondary-500"
                        title={s.lessonId ? t('tutor.openSource') : undefined}
                      >
                        [{s.index}] {lessonLabel(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start" role="status">
              <div className="bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-2xl px-3 py-2 text-sm inline-flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:0.3s]" />
                </span>
                {t('tutor.thinking')}
              </div>
            </div>
          )}
        </div>

        {enabled && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {course.suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                disabled={thinking}
                onClick={() => send(pick(s, f.locale))}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition text-left disabled:opacity-50"
              >
                {pick(s, f.locale)}
              </button>
            ))}
          </div>
        )}

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tutor.placeholder')}
            aria-label={t('tutor.placeholder')}
            disabled={!enabled}
            maxLength={500}
            className="flex-1 min-w-0 text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-secondary-800 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
          />
          <Button type="submit" variant="primary" size="sm" disabled={!enabled || thinking || !input.trim()} aria-label={t('tutor.send')}>
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-secondary-400 dark:text-secondary-500 mt-2">{t('tutor.privacy')}</p>
      </CardContent>
    </Card>
  );
}
