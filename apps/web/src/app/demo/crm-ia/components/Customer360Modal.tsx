'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useModalClose } from '@/hooks/useModalClose';
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserGroupIcon,
  BriefcaseIcon,
  TicketIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Contact, TimelineEvent, formatCurrency, scoreTier } from './types';

interface Customer360ModalProps {
  contact: Contact;
  onClose: () => void;
}

const TIMELINE_TYPE_META: Record<
  TimelineEvent['type'],
  { icon: typeof EnvelopeIcon; color: string }
> = {
  emailSent: { icon: EnvelopeIcon, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950' },
  callMade: { icon: PhoneIcon, color: 'text-green-600 bg-green-100 dark:bg-green-950' },
  meetingHeld: { icon: UserGroupIcon, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950' },
  dealCreated: { icon: BriefcaseIcon, color: 'text-primary-600 bg-primary-100 dark:bg-primary-950' },
  ticketOpened: { icon: TicketIcon, color: 'text-orange-600 bg-orange-100 dark:bg-orange-950' },
  transactionCompleted: {
    icon: CurrencyDollarIcon,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950',
  },
};

export default function Customer360Modal({ contact, onClose }: Customer360ModalProps) {
  const t = useTranslations('demoCrm');
  const [activeTab, setActiveTab] = useState<'timeline' | 'deals' | 'tickets' | 'files'>('timeline');
  useModalClose(true, onClose);

  const timeline: TimelineEvent[] = [
    { id: 1, type: 'meetingHeld', date: '2026-05-12', summary: t('customer360.summaries.discovery') },
    { id: 2, type: 'emailSent', date: '2026-05-09', summary: t('customer360.summaries.proposalSent') },
    { id: 3, type: 'callMade', date: '2026-05-07', summary: t('customer360.summaries.followUp') },
    { id: 4, type: 'transactionCompleted', date: '2026-04-20', summary: t('customer360.summaries.renewal') },
    { id: 5, type: 'ticketOpened', date: '2026-04-15', summary: t('customer360.summaries.supportApi') },
    { id: 6, type: 'dealCreated', date: '2026-03-30', summary: t('customer360.summaries.newDeal', { value: formatCurrency(contact.dealValue) }) },
    { id: 7, type: 'emailSent', date: '2026-03-22', summary: t('customer360.summaries.firstOutbound') },
  ];

  const tier = scoreTier(contact.score);
  const tierBadge: Record<typeof tier, { variant: 'danger' | 'warning' | 'info'; label: string }> = {
    hot: { variant: 'danger', label: t('contacts.scoreLabels.hot') },
    warm: { variant: 'warning', label: t('contacts.scoreLabels.warm') },
    cold: { variant: 'info', label: t('contacts.scoreLabels.cold') },
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'timeline', label: t('customer360.tabs.timeline') },
    { id: 'deals', label: t('customer360.tabs.deals') },
    { id: 'tickets', label: t('customer360.tabs.tickets') },
    { id: 'files', label: t('customer360.tabs.files') },
  ];

  const insights = [
    t('customer360.insight1'),
    t('customer360.insight2'),
    t('customer360.insight3'),
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crm-customer360-title"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-50 bg-white dark:bg-secondary-900 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {contact.avatar}
            </div>
            <div className="min-w-0">
              <h2 id="crm-customer360-title" className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white truncate">
                {contact.name}
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                {contact.company} · {contact.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors flex-shrink-0"
            aria-label={t('customer360.close')}
          >
            <XMarkIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-300" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 sm:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
              {t('customer360.score')}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">
                {contact.score}
              </span>
              <Badge variant={tierBadge[tier].variant} size="sm">
                {tierBadge[tier].label}
              </Badge>
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
              {t('customer360.lifetimeValue')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">
              {formatCurrency(contact.dealValue * 3.2)}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
              {t('customer360.totalDeals')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">4</p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
              {t('customer360.openTickets')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">1</p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-secondary-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="font-semibold text-secondary-900 dark:text-white">
                {t('customer360.aiInsights')}
              </h3>
            </div>
            <ul className="space-y-2">
              {insights.map((text, i) => (
                <li key={i} className="flex gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                  <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 border-b border-secondary-200 dark:border-secondary-800">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {timeline.map((event) => {
                const meta = TIMELINE_TYPE_META[event.type];
                const Icon = meta.icon;
                return (
                  <div
                    key={event.id}
                    className="flex gap-3 p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="font-medium text-secondary-900 dark:text-white text-sm">
                          {t(`customer360.timeline.${event.type}`)}
                        </p>
                        <span className="text-xs text-secondary-500">{event.date}</span>
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {event.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="space-y-3">
              {[
                { name: t('customer360.deals.q2', { company: contact.company }), value: contact.dealValue, stage: t(`pipeline.stages.${contact.stage}`), prob: contact.probability },
                { name: t('customer360.deals.annualRenewal'), value: contact.dealValue * 0.6, stage: t('pipeline.stages.closed'), prob: 100 },
                { name: t('customer360.deals.expansion'), value: contact.dealValue * 0.35, stage: t('pipeline.stages.qualified'), prob: 45 },
              ].map((deal, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-secondary-900 dark:text-white truncate">{deal.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="primary" size="sm">{deal.stage}</Badge>
                        <span className="text-xs text-secondary-500 flex items-center gap-1">
                          <ChartBarIcon className="h-3.5 w-3.5" />
                          {deal.prob}%
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                      {formatCurrency(deal.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {[
                { titleKey: 'customer360.tickets.t1', statusKey: 'open', priorityKey: 'high' },
                { titleKey: 'customer360.tickets.t2', statusKey: 'resolved', priorityKey: 'medium' },
              ].map((tk, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700"
                >
                  <div className="flex items-start gap-3">
                    <TicketIcon className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 dark:text-white">{t(tk.titleKey)}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={tk.statusKey === 'open' ? 'warning' : 'success'} size="sm">
                          {t(`customer360.ticketStatus.${tk.statusKey}`)}
                        </Badge>
                        <Badge variant="outline" size="sm">{t(`customer360.priorities.${tk.priorityKey}`)}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="text-center py-12 text-secondary-500 dark:text-secondary-400">
              <ClockIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('customer360.noFiles')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('customer360.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
