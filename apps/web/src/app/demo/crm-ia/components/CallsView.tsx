'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Deal, OWNERS, initials } from './crm';
import { CALLS, CallRecord } from './data';
import { Avatar, Note, PlanBadge, SectionHeader } from './ui';
import { useCrmText } from './useCrmText';

const SENTIMENT_META: Record<
  CallRecord['sentiment'],
  { icon: typeof HandThumbUpIcon; variant: 'success' | 'info' | 'danger' }
> = {
  positive: { icon: HandThumbUpIcon, variant: 'success' },
  neutral: { icon: MinusCircleIcon, variant: 'info' },
  negative: { icon: HandThumbDownIcon, variant: 'danger' },
};

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

interface Props {
  deals: Deal[];
  doneActions: string[];
  onToggleAction: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function CallsView({ deals, doneActions, onToggleAction, onOpen }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [openId, setOpenId] = useState<string | null>(null);

  const calls = CALLS.map((c) => ({ call: c, deal: deals.find((d) => d.id === c.dealId) })).filter(
    (x): x is { call: CallRecord; deal: Deal } => Boolean(x.deal),
  );

  return (
    <div>
      <SectionHeader
        title={t('calls.title')}
        subtitle={t('calls.subtitle')}
        aside={<PlanBadge label={t('plans.extra')} hint={t('plans.extraHint')} />}
      />
      <Note>{t('calls.simulatedNote')}</Note>

      {calls.length === 0 ? (
        <p className="text-center py-12 text-sm text-secondary-500">{t('calls.empty')}</p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {calls.map(({ call, deal }) => {
            const meta = SENTIMENT_META[call.sentiment];
            const SentimentIcon = meta.icon;
            const transcript = t.raw(`data.calls.${call.id}.transcript`) as string[];
            const topics = t.raw(`data.calls.${call.id}.topics`) as string[];
            const actions = t.raw(`data.calls.${call.id}.actions`) as string[];
            let repWords = 0;
            let total = 0;
            transcript.forEach((line, i) => {
              const n = words(line);
              total += n;
              if (call.speakers[i] === 'rep') repWords += n;
            });
            const repPct = total ? Math.round((repWords / total) * 100) : 0;
            const done = actions.filter((_, i) => doneActions.includes(`${call.id}-${i}`)).length;
            const expanded = openId === call.id;
            const owner = OWNERS[deal.owner];
            return (
              <article
                key={call.id}
                className="p-4 sm:p-5 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:w-48 sm:flex-shrink-0 min-w-0">
                    <Avatar text={initials(deal.contactName)} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{deal.contactName}</p>
                      <p className="text-xs text-secondary-500 truncate">{deal.company}</p>
                      <button
                        type="button"
                        onClick={() => onOpen(deal.id)}
                        className="text-xs text-primary-700 dark:text-primary-300 underline underline-offset-2 hover:no-underline"
                      >
                        {t('calls.openProfile')}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={meta.variant} size="sm" className="gap-1" title={t('calls.sentimentHint')}>
                        <SentimentIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(`calls.sentiment.${call.sentiment}`)}
                      </Badge>
                      <span className="text-xs text-secondary-600 dark:text-secondary-400 flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {tx.date(call.date)}
                      </span>
                      <span className="text-xs text-secondary-600 dark:text-secondary-400 flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('calls.duration', { value: call.duration })}
                      </span>
                      <span className="text-xs text-secondary-600 dark:text-secondary-400">· {owner.name}</span>
                    </div>

                    <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                      {t('calls.topics')}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {topics.map((tp) => (
                        <span
                          key={tp}
                          className="px-2 py-0.5 text-xs rounded-md bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300"
                        >
                          {tp}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                        {t('calls.actionItems')}
                      </p>
                      <span className="text-xs text-secondary-500">{t('calls.actionDone', { done, total: actions.length })}</span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {actions.map((item, i) => {
                        const id = `${call.id}-${i}`;
                        const checked = doneActions.includes(id);
                        return (
                          <li key={id}>
                            <label className="flex gap-2 text-sm text-secondary-700 dark:text-secondary-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleAction(id)}
                                className="mt-0.5 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className={checked ? 'line-through text-secondary-500' : ''}>{item}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-secondary-100 dark:border-secondary-800">
                      <div className="text-xs text-secondary-600 dark:text-secondary-400 min-w-0" title={t('calls.talkHint')}>
                        <span className="font-medium">{t('calls.talkTime')}:</span>{' '}
                        <span className="text-primary-700 dark:text-primary-300 font-medium">{t('calls.rep', { value: repPct })}</span>
                        {' · '}
                        <span>{t('calls.client', { value: 100 - repPct })}</span>
                        <div className="mt-1 h-1.5 w-40 max-w-full rounded-full bg-secondary-200 dark:bg-secondary-700 overflow-hidden" aria-hidden="true">
                          <div className="h-full bg-primary-600" style={{ width: `${repPct}%` }} />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-expanded={expanded}
                        onClick={() => setOpenId(expanded ? null : call.id)}
                        className="gap-1"
                      >
                        {expanded ? <ChevronUpIcon className="h-4 w-4" aria-hidden="true" /> : <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />}
                        {expanded ? t('calls.hideTranscript') : t('calls.viewTranscript')}
                      </Button>
                    </div>

                    {expanded && (
                      <ol className="mt-3 space-y-2 rounded-lg bg-secondary-50 dark:bg-secondary-800/60 p-3" aria-label={t('calls.transcriptLabel')}>
                        {transcript.map((line, i) => {
                          const rep = call.speakers[i] === 'rep';
                          return (
                            <li key={i} className="text-sm">
                              <span className={`font-semibold ${rep ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-900 dark:text-white'}`}>
                                {rep ? owner.name : deal.contactName}:
                              </span>{' '}
                              <span className="text-secondary-700 dark:text-secondary-300">{line}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
