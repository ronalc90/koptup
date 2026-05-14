'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  FireIcon,
  PhoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { SEQUENCE_STEPS } from './mockData';
import { Channel, StepStatus } from './types';

const CHANNEL_META: Record<Channel, { icon: typeof EnvelopeIcon; color: string }> = {
  email: { icon: EnvelopeIcon, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  whatsapp: { icon: ChatBubbleLeftRightIcon, color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  call: { icon: PhoneIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  linkedin: { icon: UserGroupIcon, color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  task: { icon: CheckCircleIcon, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
};

export default function SequencesView() {
  const t = useTranslations('demoCrm');

  const statusMeta: Record<StepStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
    done: { variant: 'success', label: t('sequences.stepStatus.done') },
    current: { variant: 'warning', label: t('sequences.stepStatus.current') },
    pending: { variant: 'default', label: t('sequences.stepStatus.pending') },
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
          {t('sequences.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {t('sequences.subtitle')}
        </p>
      </div>

      <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <FireIcon className="h-3.5 w-3.5" />
                {t('sequences.activeSequence')}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Outbound · Fintech Q2
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {t('sequences.stepsCompleted', {
                done: SEQUENCE_STEPS.filter((s) => s.status === 'done').length,
                total: SEQUENCE_STEPS.length,
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-secondary-500">{t('sequences.enrolled')}</p>
              <p className="text-base sm:text-lg font-bold text-secondary-900 dark:text-white">128</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">{t('sequences.openRate')}</p>
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">62%</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">{t('sequences.replyRate')}</p>
              <p className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">18%</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {SEQUENCE_STEPS.map((step, idx) => {
            const ChannelIcon = CHANNEL_META[step.channel].icon;
            const channelColor = CHANNEL_META[step.channel].color;
            const sMeta = statusMeta[step.status];
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                  step.status === 'current'
                    ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-950/30 shadow-sm'
                    : step.status === 'done'
                    ? 'border-secondary-200 dark:border-secondary-800 bg-secondary-50/60 dark:bg-secondary-900/30 opacity-90'
                    : 'border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900'
                }`}
              >
                <div className="flex flex-col items-center flex-shrink-0 w-12">
                  <span className="text-xs text-secondary-500">
                    {t('sequences.stepDay', { day: step.day })}
                  </span>
                  <div
                    className={`mt-1 w-9 h-9 rounded-full flex items-center justify-center ${channelColor}`}
                  >
                    <ChannelIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-secondary-500 mb-0.5">
                    {t(`sequences.channels.${step.channel}`)}
                  </p>
                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {step.title}
                  </p>
                </div>
                <Badge variant={sMeta.variant} size="sm">
                  {sMeta.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
