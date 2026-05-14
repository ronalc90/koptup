'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { LAYERS, type LayerKey } from './data';
import Tooltip from './ui/Tooltip';

interface CapabilityPanelProps {
  layerKey: LayerKey | null;
  onClose: () => void;
}

/**
 * Panel modal de detalle para una capa de la plataforma.
 * El callsite controla cuándo abrir/cerrar; este componente es presentacional.
 */
export default function CapabilityPanel({ layerKey, onClose }: CapabilityPanelProps) {
  const t = useTranslations('demoChatbot');
  if (!layerKey) return null;

  const layer = LAYERS.find((l) => l.key === layerKey);
  if (!layer) return null;

  // Leemos los bullets como `raw` (array) para no inflar el JSON con keys numéricas.
  const raw = t.raw(`layers.${layerKey}.items`);
  const items: string[] = Array.isArray(raw) ? (raw as string[]) : [];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`layer-${layer.key}-title`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-secondary-200 px-6 py-5 dark:border-secondary-800">
          <div className="flex items-start gap-3.5">
            <span className="inline-flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-mono text-base font-bold text-white shadow-sm">
              {layer.glyph}
            </span>
            <div>
              <h2
                id={`layer-${layer.key}-title`}
                className="text-[22px] font-bold leading-tight tracking-tight text-secondary-900 dark:text-white"
              >
                {t(`layers.${layer.key}.title`)}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-secondary-600 dark:text-secondary-400">
                {t(`layers.${layer.key}.summary`)}
              </p>
            </div>
          </div>
          <Tooltip content={t('sourcePanel.close')} side="left">
            <button
              type="button"
              onClick={onClose}
              aria-label={t('sourcePanel.close')}
              className="rounded-md p-1.5 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </header>

        <ul className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border border-secondary-100 bg-secondary-50/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-secondary-700 transition hover:border-primary-200 hover:bg-white dark:border-secondary-800 dark:bg-secondary-800/40 dark:text-secondary-200 dark:hover:border-primary-800/60 dark:hover:bg-secondary-800"
            >
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
