'use client';

/**
 * PreviewModeToggle — selector visual de 3 modos de previsualización
 * (Desktop / Mobile / Bubble-embed) para el LivePreview del Builder.
 *
 * Componente puramente presentacional: no posee estado, recibe el modo
 * activo y un callback para emitir cambios (Dependency Inversion: el dueño
 * del estado decide qué hacer con el evento).
 */

import { useTranslations } from 'next-intl';
import {
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type PreviewMode = 'desktop' | 'mobile' | 'bubble';

interface PreviewModeToggleProps {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface ModeDescriptor {
  readonly id: PreviewMode;
  readonly label: string;
  readonly Icon: IconType;
}

export default function PreviewModeToggle({
  mode,
  onChange,
}: PreviewModeToggleProps) {
  const t = useTranslations('demoChatbot.builder.preview');

  const modes: ReadonlyArray<ModeDescriptor> = [
    { id: 'desktop', label: t('modes.desktop'), Icon: ComputerDesktopIcon },
    { id: 'mobile', label: t('modes.mobile'), Icon: DevicePhoneMobileIcon },
    { id: 'bubble', label: t('modes.bubble'), Icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div
      role="tablist"
      aria-label={t('modeLabel')}
      className="inline-flex items-center gap-1 rounded-lg border border-secondary-200 bg-white p-1 shadow-sm dark:border-secondary-700 dark:bg-secondary-900"
    >
      {modes.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
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
