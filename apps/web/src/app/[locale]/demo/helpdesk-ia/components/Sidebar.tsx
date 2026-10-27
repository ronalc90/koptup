'use client';

import { useMemo, useState } from 'react';
import { AdjustmentsHorizontalIcon, BookOpenIcon, GlobeAltIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { CHANNELS, CHANNEL_PLAN, KB_ARTICLES, PRIORITIES, type Channel, type KbArticle, type Priority, type Ticket } from './data';
import { includesNorm, matchKeywords, normalize } from './engine';
import { Note, channelIcon, sectionTitleCls, smallInputCls } from './ui';
import type { HdText } from './useHelpdeskText';

interface Props {
  hd: HdText;
  tickets: Ticket[];
  channel: Channel | 'all';
  onChannel: (c: Channel | 'all') => void;
  priority: Priority | 'all';
  onPriority: (p: Priority | 'all') => void;
  selected: Ticket | null;
  /** Texto del cliente del ticket seleccionado (en el idioma activo). */
  selectedText: string;
  onUseArticle: (article: KbArticle) => void;
}

export default function Sidebar({ hd, tickets, channel, onChannel, priority, onPriority, selected, selectedText, onUseArticle }: Props) {
  const { t } = hd;
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = Object.fromEntries(CHANNELS.map((ch) => [ch, 0])) as Record<Channel, number>;
    for (const tk of tickets) if (tk.status !== 'resolved') c[tk.channel] += 1;
    return c;
  }, [tickets]);
  const activeTotal = tickets.filter((tk) => tk.status !== 'resolved').length;

  const contextual = useMemo(() => {
    if (!selected) return [] as KbArticle[];
    const norm = normalize(selectedText);
    return KB_ARTICLES.filter((a) => a.category === selected.category)
      .map((a) => ({ a, score: matchKeywords(norm, a.tags).length }))
      .sort((x, y) => y.score - x.score)
      .slice(0, 3)
      .map((x) => x.a);
  }, [selected, selectedText]);

  const searched = useMemo(
    () =>
      KB_ARTICLES.filter((a) =>
        includesNorm(
          `${t(`kb.articles.${a.id}.title`)} ${t(`kb.articles.${a.id}.body`)} ${a.tags.join(' ')} ${t(`categories.${a.category}`)}`,
          query,
        ),
      ),
    [query, t],
  );

  const list = query.trim() ? searched : contextual.length ? contextual : KB_ARTICLES;
  const canUse = !!selected && selected.status !== 'resolved';

  return (
    // En móvil (display: contents) los filtros van antes de la bandeja y la base de conocimiento después del detalle.
    <aside className="contents lg:block lg:col-span-3 lg:space-y-4 min-w-0">
      <div className="order-1 lg:order-none space-y-4 min-w-0">
        <Card variant="bordered" padding="sm">
          <h3 className={`${sectionTitleCls} mb-2`}>
            <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
            {t('channels.title')}
          </h3>
          <div className="flex flex-wrap gap-1.5 lg:block lg:space-y-1">
            {(['all', ...CHANNELS] as const).map((ch) => {
              const active = channel === ch;
              const Icon = ch === 'all' ? GlobeAltIcon : channelIcon[ch];
              const count = ch === 'all' ? activeTotal : counts[ch];
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onChannel(ch)}
                  aria-pressed={active}
                  title={
                    ch === 'all'
                      ? undefined
                      : t('channels.planHint', {
                          plan: t(`plans.${CHANNEL_PLAN[ch]}`),
                        })
                  }
                  className={`lg:w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200 font-medium'
                      : 'bg-secondary-50 lg:bg-transparent dark:bg-secondary-800/60 lg:dark:bg-transparent text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(`channels.${ch}`)}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-secondary-500 dark:text-secondary-400">{count}</span>
                </button>
              );
            })}
          </div>
          <Note className="mt-2">{t('channels.planNote')}</Note>
        </Card>

        <Card variant="bordered" padding="sm">
          <h3 className={`${sectionTitleCls} mb-2`}>{t('priorities.title')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...PRIORITIES] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPriority(p)}
                aria-pressed={priority === p}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  priority === p
                    ? 'bg-secondary-900 dark:bg-white text-white dark:text-secondary-900'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
              >
                {t(`priorities.${p}`)}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card variant="bordered" padding="sm" className="order-4 lg:order-none min-w-0">
        <h3 className={`${sectionTitleCls} mb-2`}>
          <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
          {t('kb.title')}
        </h3>
        <div className="relative mb-2">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-secondary-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('kb.search')}
            aria-label={t('kb.search')}
            className={`${smallInputCls} pl-7`}
          />
        </div>
        {!query.trim() && contextual.length > 0 && (
          <p className="text-[10px] uppercase tracking-wide font-semibold text-primary-600 dark:text-primary-400 mb-1 flex items-center gap-1">
            <SparklesIcon className="h-3 w-3" aria-hidden="true" />
            {t('kb.contextual', { id: selected?.id ?? '' })}
          </p>
        )}
        <div className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">
          {list.map((a) => {
            const open = openId === a.id;
            return (
              <div
                key={a.id}
                className="p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-200 dark:border-secondary-700"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : a.id)}
                  aria-expanded={open}
                  className="text-left w-full text-xs font-semibold text-secondary-900 dark:text-white leading-snug hover:text-primary-700 dark:hover:text-primary-300"
                >
                  {t(`kb.articles.${a.id}.title`)}
                </button>
                <p className={`text-[11px] text-secondary-600 dark:text-secondary-400 mt-0.5 ${open ? '' : 'line-clamp-2'}`}>
                  {t(`kb.articles.${a.id}.body`)}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[10px] text-secondary-500 truncate">
                    {t(`categories.${a.category}`)}
                    {a.autoReply ? ` · ${t('kb.autoReplyTag')}` : ''}
                  </span>
                  <button
                    type="button"
                    disabled={!canUse}
                    title={canUse ? undefined : t('kb.useDisabled')}
                    onClick={() => onUseArticle(a)}
                    className="text-[10px] font-medium text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {t('kb.useArticle')}
                  </button>
                </div>
              </div>
            );
          })}
          {query.trim() && searched.length === 0 && <p className="text-xs text-secondary-500">{t('kb.noResults')}</p>}
        </div>
      </Card>
    </aside>
  );
}
