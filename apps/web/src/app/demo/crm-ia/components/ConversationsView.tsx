'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  MinusCircleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { CONTACTS, CONVERSATIONS } from './mockData';
import { Sentiment } from './types';

const SENTIMENT_META: Record<
  Sentiment,
  { icon: typeof HandThumbUpIcon; variant: 'success' | 'info' | 'danger' }
> = {
  positive: { icon: HandThumbUpIcon, variant: 'success' },
  neutral: { icon: MinusCircleIcon, variant: 'info' },
  negative: { icon: HandThumbDownIcon, variant: 'danger' },
};

export default function ConversationsView() {
  const t = useTranslations('demoCrm');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
          {t('conversations.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {t('conversations.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3" />
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3" />
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : CONVERSATIONS.length === 0 ? (
        <div className="text-center py-12 text-sm text-secondary-500">
          {t('conversations.noConversations')}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {CONVERSATIONS.map((conv) => {
            const contact = CONTACTS.find((c) => c.id === conv.contactId);
            if (!contact) return null;
            const meta = SENTIMENT_META[conv.sentiment];
            const SentimentIcon = meta.icon;
            return (
              <div
                key={conv.id}
                className="p-4 sm:p-5 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {contact.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-secondary-500 truncate">{contact.company}</p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={meta.variant} size="sm" className="flex items-center gap-1">
                        <SentimentIcon className="h-3.5 w-3.5" />
                        {t(`conversations.sentiment.${conv.sentiment}`)}
                      </Badge>
                      <span className="text-xs text-secondary-500 flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {conv.date}
                      </span>
                      <span className="text-xs text-secondary-500 flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {conv.duration}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1.5">
                        {t('conversations.topics')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {conv.topics.map((tp) => (
                          <span
                            key={tp}
                            className="px-2 py-0.5 text-xs rounded-md bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300"
                          >
                            {tp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1.5">
                        {t('conversations.actionItems')}
                      </p>
                      <ul className="space-y-1">
                        {conv.actionItems.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2 text-sm text-secondary-700 dark:text-secondary-300"
                          >
                            <CheckCircleIcon className="h-4 w-4 mt-0.5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-secondary-100 dark:border-secondary-800">
                      <div className="flex items-center gap-3 text-xs text-secondary-500">
                        <span>{t('conversations.talkRatio')}:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {t('conversations.rep')} {conv.talkRatioRep}%
                          </span>
                          <span>·</span>
                          <span>
                            {t('conversations.client')} {100 - conv.talkRatioRep}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <PlayCircleIcon className="h-4 w-4" />
                          {t('conversations.playRecording')}
                        </button>
                        <button className="flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <DocumentTextIcon className="h-4 w-4" />
                          {t('conversations.viewTranscript')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
