'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { TEMPLATE_KEYS, templateSteps } from '../lib/samples';
import { useAutomation } from '../lib/store';
import type { TemplateKey } from '../lib/types';
import { TYPE_ICONS } from './icons';
import { Modal, btnPrimary } from './ui';

type Cat = 'all' | 'finance' | 'sales' | 'service' | 'other';

const TEMPLATE_CAT: Record<TemplateKey, Exclude<Cat, 'all'>> = {
  invoices: 'finance',
  collections: 'finance',
  leads: 'sales',
  assistant: 'service',
  blank: 'other',
};

export default function TemplatesModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (wfId: string) => void }) {
  const t = useTranslations('demoAutomation');
  const { text, createFromTemplate, toast, live } = useAutomation();
  const [cat, setCat] = useState<Cat>('all');
  const cats: Cat[] = ['all', 'finance', 'sales', 'service', 'other'];
  const list = TEMPLATE_KEYS.filter((k) => cat === 'all' || TEMPLATE_CAT[k] === cat);
  const previews = useMemo(() => Object.fromEntries(TEMPLATE_KEYS.map((k) => [k, templateSteps(k, text)])), [text]);

  return (
    <Modal open={open} onClose={onClose} title={t('templates.title')} subtitle={t('templates.subtitle')} size="xl">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('templates.filter')}>
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors ${cat === c ? 'bg-primary-600 text-white' : 'bg-secondary-800 text-secondary-300 hover:bg-secondary-700'}`}
          >
            {t(`templates.categories.${c}`)} ({c === 'all' ? TEMPLATE_KEYS.length : TEMPLATE_KEYS.filter((k) => TEMPLATE_CAT[k] === c).length})
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((key) => {
          const steps = previews[key];
          return (
            <article key={key} className="flex flex-col gap-2 rounded-lg border border-secondary-700 bg-secondary-950/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-secondary-800 px-2 py-0.5 text-[10px] text-secondary-300">{t(`templates.categories.${TEMPLATE_CAT[key]}`)}</span>
                <span className="text-[10px] text-secondary-400">{t('templates.steps', { count: steps.length })}</span>
              </div>
              <h3 className="text-sm font-semibold text-white">{text.templates[key].name}</h3>
              <p className="flex-1 text-[11px] leading-relaxed text-secondary-300">{t(`templates.desc.${key}`)}</p>
              <ol className="flex flex-wrap gap-1">
                {steps.map((st, i) => {
                  const Icon = TYPE_ICONS[st.type];
                  return (
                    <li key={st.id} className="inline-flex max-w-full items-center gap-1 rounded border border-secondary-700 px-1.5 py-0.5 text-[10px] text-secondary-300" title={st.name}>
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {i + 1}. {st.name}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                disabled={live.running}
                onClick={() => {
                  const id = createFromTemplate(key);
                  if (!id) return;
                  toast(t('templates.created', { name: text.templates[key].name }));
                  onCreated(id);
                  onClose();
                }}
                className={`${btnPrimary} mt-1`}
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                {t('templates.use')}
              </button>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-secondary-400">{t('templates.note')}</p>
    </Modal>
  );
}
