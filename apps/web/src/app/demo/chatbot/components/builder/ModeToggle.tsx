'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon, BeakerIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export type ChatbotMode = 'playground' | 'builder';

interface ModeToggleProps {
  mode: ChatbotMode;
  onChange: (m: ChatbotMode) => void;
}

/**
 * Toggle de dos modos: Playground RAG (showcase enterprise) y Builder & Embed (personalización).
 * Se renderiza inmediatamente debajo del TopBar. A la derecha, fuera del
 * tablist, enlaza a /rag (página de sistemas RAG para empresas).
 */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const t = useTranslations('demoChatbot.modes');
  const tDemo = useTranslations('demoChatbot');

  const tabs: { key: ChatbotMode; label: string; hint: string; Icon: typeof BeakerIcon }[] = [
    { key: 'playground', label: t('playground'), hint: t('playgroundHint'), Icon: BeakerIcon },
    { key: 'builder', label: t('builder'), hint: t('builderHint'), Icon: WrenchScrewdriverIcon },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-secondary-200 bg-white px-3 py-1.5 dark:border-secondary-800 dark:bg-secondary-900">
      <div
        className="flex flex-1 items-stretch gap-1"
        role="tablist"
        aria-label="Chatbot demo modes"
      >
        {tabs.map(({ key, label, hint, Icon }) => {
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(key)}
              className={`group flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition md:flex-none ${
                active
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold leading-tight">{label}</div>
                <div
                  className={`hidden text-[10px] leading-tight md:block ${
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
        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-950 dark:hover:text-primary-300"
      >
        <span className="md:hidden">{tDemo('ragLinkShort')}</span>
        <span className="hidden md:inline">{tDemo('ragLink')}</span>
        <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
