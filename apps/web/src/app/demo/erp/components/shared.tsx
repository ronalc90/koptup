'use client';

import { useTranslations } from 'next-intl';

export const formatMoney = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-secondary-600 dark:text-secondary-400">{subtitle}</p>}
    </div>
  );
}

export function CountryBadge({ code }: { code: string }) {
  const colors: Record<string, string> = {
    CO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    MX: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    AR: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    CL: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    PE: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        colors[code] || 'bg-secondary-100 text-secondary-800'
      }`}
    >
      {code}
    </span>
  );
}

export function SelectField({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1 font-semibold">
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500 dark:text-secondary-400 pointer-events-none">
          {icon}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export function DetailModal({ reference, onClose }: { reference: string; onClose: () => void }) {
  const t = useTranslations('demoErp.modal');
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="erp-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-secondary-200 dark:border-secondary-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="erp-detail-title" className="text-lg font-bold text-secondary-900 dark:text-white">{t('transactionDetail')}</h3>
            <p className="font-mono text-xs text-primary-600 dark:text-primary-400 mt-0.5">{reference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
            aria-label={t('close')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="space-y-2.5 text-sm">
          <Row k={t('reference')} v={reference} />
          <Row k={t('createdBy')} v="María Gómez (CFO)" />
          <Row k={t('createdAt')} v="2026-05-14 09:24" />
          <Row k={t('approvedBy')} v="Carlos Ruiz" />
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">{t('notes')}</p>
          <p className="text-xs text-primary-800 dark:text-primary-200">{t('noteText')}</p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-secondary-100 dark:border-secondary-800 pb-1.5">
      <span className="text-secondary-600 dark:text-secondary-400">{k}</span>
      <span className="text-secondary-900 dark:text-white font-medium">{v}</span>
    </div>
  );
}
