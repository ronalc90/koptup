'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export interface PlaylistItem {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz';
}

export interface ChatMessage {
  id: number;
  from: 'user' | 'tutor';
  text: string;
}

interface PlayerPanelProps {
  courseTitle: string;
  playlist: PlaylistItem[];
  tutorReplies: string[];
}

export default function PlayerPanel({ courseTitle, playlist, tutorReplies }: PlayerPanelProps) {
  const t = useTranslations('demoLms');
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(34);
  const [speed, setSpeed] = useState('1x');
  const [subtitles, setSubtitles] = useState('es');
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { id: 1, from: 'tutor', text: t('tutor.welcome') },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const speeds = ['0.5x', '1x', '1.25x', '1.5x', '2x'];
  const langs = [
    { code: 'off', label: t('player.subtitlesOff') },
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
  ];

  const current = playlist[currentIdx];

  const togglePlay = () => {
    setPlaying((p) => !p);
    if (!playing) {
      // simulate progress tick once
      setTimeout(() => setProgress((v) => Math.min(100, v + 6)), 600);
    }
  };

  const nextLesson = () => {
    setCurrentIdx((i) => Math.min(playlist.length - 1, i + 1));
    setProgress(0);
    setPlaying(false);
  };

  const prevLesson = () => {
    setCurrentIdx((i) => Math.max(0, i - 1));
    setProgress(0);
    setPlaying(false);
  };

  const saveNote = () => {
    if (!note.trim()) return;
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1800);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: Date.now(), from: 'user', text };
    setChat((c) => [...c, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const reply = tutorReplies[Math.floor(Math.random() * tutorReplies.length)];
      setChat((c) => [...c, { id: Date.now() + 1, from: 'tutor', text: reply }]);
      setThinking(false);
    }, 900);
  };

  const sendSuggestion = (s: string) => {
    setInput(s);
    setTimeout(() => sendMessage(), 50);
  };

  const clearChat = () => {
    setChat([{ id: 1, from: 'tutor', text: t('tutor.welcome') }]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" />
            <button
              onClick={togglePlay}
              className="relative z-10 w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 ring-2 ring-white/40"
              aria-label={playing ? t('player.pause') : t('player.play')}
            >
              {playing ? (
                <PauseIcon className="w-10 h-10 text-white" />
              ) : (
                <PlayIcon className="w-10 h-10 text-white translate-x-0.5" />
              )}
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white/90 text-sm font-medium truncate">{courseTitle}</p>
              <p className="text-white text-base font-semibold truncate">{current?.title}</p>
              <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-wrap items-center gap-3 border-t border-secondary-200 dark:border-secondary-700">
            <Button variant="ghost" size="sm" onClick={prevLesson} aria-label={t('player.prev')}>
              <BackwardIcon className="w-5 h-5" />
            </Button>
            <Button variant="primary" size="sm" onClick={togglePlay}>
              {playing ? (
                <PauseIcon className="w-4 h-4 mr-1" />
              ) : (
                <PlayIcon className="w-4 h-4 mr-1" />
              )}
              {playing ? t('player.pause') : t('player.play')}
            </Button>
            <Button variant="ghost" size="sm" onClick={nextLesson} aria-label={t('player.next')}>
              <ForwardIcon className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-secondary-600 dark:text-secondary-400">
                {t('player.speed')}
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="text-sm rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-2 py-1 text-secondary-800 dark:text-secondary-100"
              >
                {speeds.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <SpeakerWaveIcon className="w-4 h-4 text-secondary-500" />
              <select
                value={subtitles}
                onChange={(e) => setSubtitles(e.target.value)}
                className="text-sm rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-2 py-1 text-secondary-800 dark:text-secondary-100"
              >
                {langs.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0">
            <h3 className="text-sm font-semibold text-secondary-800 dark:text-secondary-100 mb-3">
              {t('player.notes')}
            </h3>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('player.notesPlaceholder')}
              rows={3}
            />
            <div className="flex items-center justify-between mt-3">
              {noteSaved ? (
                <Badge variant="success" size="sm">
                  {t('player.noteSaved')}
                </Badge>
              ) : (
                <span />
              )}
              <Button variant="outline" size="sm" onClick={saveNote}>
                {t('player.saveNote')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card variant="bordered">
          <CardContent className="p-0">
            <h3 className="text-sm font-semibold text-secondary-800 dark:text-secondary-100 mb-3">
              {t('player.playlist')}
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {playlist.map((item, idx) => {
                const active = idx === currentIdx;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setProgress(0);
                      setPlaying(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700'
                        : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                        active
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-secondary-800 dark:text-secondary-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {item.duration} · {item.type}
                      </p>
                    </div>
                    {active && <PlayIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered" className="flex flex-col">
          <CardContent className="p-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-secondary-800 dark:text-secondary-100">
                    {t('tutor.title')}
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {t('tutor.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                title={t('tutor.clear')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 max-h-72 overflow-y-auto space-y-2 pr-1">
              {chat.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === 'user'
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
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

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[t('tutor.suggestion1'), t('tutor.suggestion2'), t('tutor.suggestion3')].map((s) => (
                <button
                  key={s}
                  onClick={() => sendSuggestion(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t('tutor.placeholder')}
                className="flex-1 text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-secondary-800 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="primary" size="sm" onClick={sendMessage} aria-label={t('tutor.send')}>
                <PaperAirplaneIcon className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
