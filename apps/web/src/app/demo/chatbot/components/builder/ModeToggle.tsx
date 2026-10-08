'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRightIcon,
  BeakerIcon,
  DocumentArrowUpIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export type ChatbotMode = 'playground' | 'upload' | 'builder';

interface ModeToggleProps {
  mode: ChatbotMode;
  onChange: (m: ChatbotMode) => void;
}

/**
 * Modos de la demo: "Prueba el asistente" (empresas de ejemplo, sin
 * registro), "Prueba con tu documento" (subida propia con email) y
 * "Configura el tuyo" (bot propio + código para insertar). A la derecha,
 * fuera del tablist, enlaza a /rag.
 */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const t = useTranslations('demoChatbot.modes');
  const tDemo = useTranslations('demoChatbot');

  const tabs: { key: ChatbotMode; label: string; hint: string; Icon: typeof BeakerIcon }[] = [
    { key: 'playground', label: t('playground'), hint: t('playgroundHint'), Icon: BeakerIcon },
    { key: 'upload', label: t('upload'), hint: t('uploadHint'), Icon: DocumentArrowUpIcon },
    { key: 'builder', label: t('builder'), hint: t('builderHint'), Icon: WrenchScrewdriverIcon },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-secondary-200 bg-white px-3 py-1.5 dark:border-secondary-800 dark:bg-secondary-900">
      <div className="flex w-full items-stretch gap-1 md:w-auto md:flex-1" role="tablist" aria-label={t('ariaLabel')}>
        {tabs.map(({ key, label, hint, Icon }) => {
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(key)}
              className={`group flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition md:flex-none ${
                active
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
              }`}
            >
              <Icon className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-semibold leading-tight">{label}</div>
                <div
                  className={`hidden text-[10px] leading-tight lg:block ${
                    active ? 'text-white/80' : 'text-secondary-500 dark:text-secondary-400'
                  }`}
                >
                  {hint}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <Link
        href="/rag"
        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-950 dark:hover:text-primary-300"
      >
        <span className="md:hidden">{tDemo('ragLinkShort')}</span>
        <span className="hidden md:inline">{tDemo('ragLink')}</span>
        <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
