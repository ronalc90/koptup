'use client';

/**
 * PreviewModeToggle — modos de la vista previa del Builder: sitio web de
 * ejemplo con el widget real, el mismo sitio en un celular, o el enlace
 * directo al chat (/embed/chatbot/<id>).
 */

import { useTranslations } from 'next-intl';
import { ComputerDesktopIcon, DevicePhoneMobileIcon, LinkIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type PreviewMode = 'desktop' | 'mobile' | 'page';

interface PreviewModeToggleProps {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
  disabled?: boolean;
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export default function PreviewModeToggle({ mode, onChange, disabled }: PreviewModeToggleProps) {
  const t = useTranslations('demoChatbot.builder.preview');

  const modes: ReadonlyArray<{ id: PreviewMode; label: string; Icon: IconType }> = [
    { id: 'desktop', label: t('modes.desktop'), Icon: ComputerDesktopIcon },
    { id: 'mobile', label: t('modes.mobile'), Icon: DevicePhoneMobileIcon },
    { id: 'page', label: t('modes.page'), Icon: LinkIcon },
  ];

  return (
    <div
      role="tablist"
      aria-label={t('modeLabel')}
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-secondary-200 bg-white p-1 shadow-sm dark:border-secondary-700 dark:bg-secondary-900"
    >
      {modes.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? 'bg-primary-600 text-white shadow'
                : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
