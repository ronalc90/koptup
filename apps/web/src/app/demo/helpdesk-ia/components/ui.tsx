'use client';

import { ReactNode, useEffect } from 'react';
import {
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { useModalClose } from '@/hooks/useModalClose';
import type { Channel, Priority } from './data';

export const channelIcon: Record<Channel, typeof EnvelopeIcon> = {
  email: EnvelopeIcon,
  webchat: GlobeAltIcon,
  whatsapp: ChatBubbleBottomCenterTextIcon,
  messenger: ChatBubbleLeftEllipsisIcon,
  telegram: PaperAirplaneIcon,
  voice: PhoneIcon,
};

export const channelColor: Record<Channel, string> = {
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  webchat: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
  messenger: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
  telegram: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  voice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
};

export const priorityVariant: Record<Priority, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function ChannelBadge({ channel, label }: { channel: Channel; label: string }) {
  const Icon = channelIcon[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${channelColor[channel]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, label }: { priority: Priority; label: string }) {
  return (
    <Badge variant={priorityVariant[priority]} size="sm" className="whitespace-nowrap">
      {label}
    </Badge>
  );
}

/** Aviso discreto de qué es simulado o cómo se calcula algo. */
export function Note({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex gap-1.5 text-[11px] leading-snug text-secondary-600 dark:text-secondary-400 ${className}`}>
      <InformationCircleIcon className="h-3.5 w-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [message, onDone]);
  return (
    <div aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {message && (
        <div className="pointer-events-auto flex items-start gap-2 rounded-xl bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 px-4 py-3 shadow-xl text-sm">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-400 dark:text-green-600" aria-hidden="true" />
          <span className="flex-1">{message}</span>
        </div>
      )}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  closeLabel,
  children,
  footer,
  labelId,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  labelId: string;
}) {
  useModalClose(true, onClose);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-secondary-900 rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={labelId} className="text-lg font-bold text-secondary-900 dark:text-white">
              {title}
            </h2>
            {subtitle && <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors flex-shrink-0"
            aria-label={closeLabel}
          >
            <XMarkIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-300" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-3 flex flex-wrap justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
export const smallInputCls =
  'w-full px-2.5 py-1.5 text-xs rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500';
export const labelCls = 'block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5';
export const sectionTitleCls =
  'text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 flex items-center gap-1.5';
