'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useModalClose } from '@/hooks/useModalClose';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  CreditCardIcon,
  UserPlusIcon,
  DocumentMagnifyingGlassIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

type Cat = 'all' | 'sales' | 'ops' | 'ai' | 'data' | 'marketing';

interface Template {
  id: string;
  category: Cat;
  icon: React.ComponentType<{ className?: string }>;
  installs: string;
  color: string;
}

const TEMPLATES: Template[] = [
  { id: 'crm', category: 'sales', icon: BuildingOffice2Icon, installs: '12.4k', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/40' },
  { id: 'emailAi', category: 'ai', icon: EnvelopeIcon, installs: '8.7k', color: 'from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/40' },
  { id: 'stripeAlert', category: 'ops', icon: CreditCardIcon, installs: '6.1k', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40' },
  { id: 'leadEnrich', category: 'sales', icon: UserPlusIcon, installs: '4.9k', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40' },
  { id: 'rag', category: 'ai', icon: DocumentMagnifyingGlassIcon, installs: '3.2k', color: 'from-violet-500/20 to-violet-600/10 border-violet-500/40' },
  { id: 'etl', category: 'data', icon: CircleStackIcon, installs: '2.6k', color: 'from-rose-500/20 to-rose-600/10 border-rose-500/40' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MarketplaceModal({ open, onClose }: Props) {
  const t = useTranslations('demoAutomation.marketplace');
  const [cat, setCat] = useState<Cat>('all');
  useModalClose(open, onClose);

  if (!open) return null;

  const cats: Cat[] = ['all', 'sales', 'ops', 'ai', 'data', 'marketing'];
  const filtered = cat === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-modal-title"
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative z-50 bg-secondary-900 border border-secondary-800 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-secondary-800">
          <div>
            <h2 id="marketplace-modal-title" className="text-base font-semibold text-white">{t('title')}</h2>
            <p className="text-xs text-secondary-500">{t('subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="text-secondary-500 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-secondary-800 flex gap-2 overflow-x-auto">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                cat === c
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-800 text-secondary-300 hover:bg-secondary-700'
              }`}
            >
              {t(`categories.${c}`)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.id}
                className={`rounded-lg border bg-gradient-to-br ${tpl.color} p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-md bg-secondary-950/60 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[10px] text-secondary-300 font-mono">
                    {tpl.installs} {t('installs')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {t(`templates.${tpl.id}.name`)}
                </h3>
                <p className="text-[11px] text-secondary-300 flex-1 leading-relaxed">
                  {t(`templates.${tpl.id}.desc`)}
                </p>
                <button className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur-sm transition-colors">
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  {t('use')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
