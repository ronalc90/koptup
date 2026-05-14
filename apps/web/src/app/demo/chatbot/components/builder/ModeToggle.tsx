'use client';

import { useTranslations } from 'next-intl';
import { BeakerIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export type ChatbotMode = 'playground' | 'builder';

interface ModeToggleProps {
  mode: ChatbotMode;
  onChange: (m: ChatbotMode) => void;
}

/**
 * Toggle de dos modos: Playground RAG (showcase enterprise) y Builder & Embed (personalización).
 * Se renderiza inmediatamente debajo del TopBar.
 */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const t = useTranslations('demoChatbot.modes');

  const tabs: { key: ChatbotMode; label: string; hint: string; Icon: typeof BeakerIcon }[] = [
    { key: 'playground', label: t('playground'), hint: t('playgroundHint'), Icon: BeakerIcon },
    { key: 'builder', label: t('builder'), hint: t('builderHint'), Icon: WrenchScrewdriverIcon },
  ];

  return (
    <div
      className="flex items-stretch gap-1 border-b border-secondary-200 bg-white px-3 py-1.5 dark:border-secondary-800 dark:bg-secondary-900"
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
  );
}
