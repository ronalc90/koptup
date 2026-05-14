'use client';

import { ReactNode } from 'react';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Pequeños componentes presentacionales reutilizados por la demo.

export function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colorMap: Record<typeof accent, string> = {
    primary: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300',
    warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300',
    info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return (
    <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-4">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${colorMap[accent]}`}>{icon}</span>
        <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-secondary-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

export function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      <p
        className={
          'tabular-nums ' +
          (highlight
            ? 'text-lg font-bold text-primary-700 dark:text-primary-300'
            : 'text-secondary-900 dark:text-white')
        }
      >
        {value}
      </p>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'success' | 'warning' | 'danger';
}) {
  const colorMap = {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };
  return (
    <div className="rounded-lg p-3 bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700">
      <p className="text-xs text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${colorMap[accent]}`}>{value}</p>
    </div>
  );
}

export function ValidationPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full ' +
        (ok
          ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300')
      }
    >
      {ok ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
      {label}
    </span>
  );
}

export function ReportRow({
  title,
  count,
  amount,
  tDocs,
  tAmount,
  tExport,
  tFormats,
}: {
  title: string;
  count: number;
  amount: string;
  tDocs: string;
  tAmount: string;
  tExport: string;
  tFormats: string[];
}) {
  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
      <p className="font-medium text-secondary-900 dark:text-white">{title}</p>
      <div className="mt-2 flex justify-between text-xs text-secondary-500">
        <span>
          {count} {tDocs}
        </span>
        <span>
          {tAmount}: <span className="font-semibold text-secondary-700 dark:text-secondary-200">{amount}</span>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-secondary-500">{tExport}:</span>
        {tFormats.map((fmt) => (
          <button
            key={fmt}
            type="button"
            className="text-xs px-2 py-1 rounded-md bg-secondary-100 dark:bg-secondary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-secondary-700 dark:text-secondary-200"
          >
            {fmt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StorageFeature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-secondary-700 dark:text-secondary-200">
      <span className="text-primary-600 dark:text-primary-300">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function EmissionSuccess({
  uuid,
  authority,
  onReset,
}: {
  uuid: string;
  authority: string;
  onReset: () => void;
}) {
  const t = useTranslations('demoBilling');
  return (
    <div className="text-center py-6 space-y-4 animate-[fadeIn_300ms_ease-out]">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40">
        <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-300" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
          {t('emission.result.accepted', { authority })}
        </h3>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('emission.result.acceptedSub')}</p>
      </div>
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-800">
        <span className="text-xs uppercase tracking-wide text-secondary-500">{t('emission.result.uuidLabel')}</span>
        <code className="font-mono text-sm text-primary-700 dark:text-primary-300">{uuid}</code>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline">
          <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('emission.result.downloadPdf')}
        </Button>
        <Button size="sm" variant="outline">
          <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('emission.result.downloadXml')}
        </Button>
        <Button size="sm" onClick={onReset}>
          {t('emission.result.newDoc')}
        </Button>
      </div>
    </div>
  );
}
