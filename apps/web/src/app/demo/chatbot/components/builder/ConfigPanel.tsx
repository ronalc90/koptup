'use client';

/**
 * ConfigPanel — columna izquierda del Builder: edita la configuración del bot
 * y gestiona sus documentos (subida real a `POST /api/chatbot/bots/:id/docs`).
 */

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpTrayIcon, DocumentIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';

import type { RemoteBotDoc } from './api';
import type { BuilderToneKey, BuilderWidgetConfig, WidgetCornerPosition } from './widgetConfig';
import { AVATAR_CHOICES, POSITIONS, TONE_CHOICES, TEXT_EXTENSIONS, formatBytes } from './widgetConfig';
import type { SampleCompany, SampleCompanyKey } from '../sampleKnowledge';

interface ConfigPanelProps {
  config: BuilderWidgetConfig;
  onChange: (patch: Partial<BuilderWidgetConfig>) => void;
  docs: RemoteBotDoc[];
  onUpload: (files: File[]) => void;
  onRemoveDoc: (docId: string) => void;
  onLoadSample: (key: SampleCompanyKey) => void;
  sampleCompanies: SampleCompany[];
  uploading: boolean;
}

const POSITION_I18N_KEY: Record<WidgetCornerPosition, string> = {
  br: 'positionBR',
  bl: 'positionBL',
  tr: 'positionTR',
  tl: 'positionTL',
};

const inputClass =
  'mt-1 w-full rounded-md border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white';

export default function ConfigPanel({
  config,
  onChange,
  docs,
  onUpload,
  onRemoveDoc,
  onLoadSample,
  sampleCompanies,
  uploading,
}: ConfigPanelProps) {
  const t = useTranslations('demoChatbot.builder');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files ?? []);
      if (files.length > 0) onUpload(files);
    },
    [onUpload],
  );

  const openPicker = useCallback(() => {
    if (!uploading) fileInputRef.current?.click();
  }, [uploading]);

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-secondary-200 bg-white p-4 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header>
        <h3 className="text-sm font-bold text-secondary-900 dark:text-white">{t('configTitle')}</h3>
      </header>

      <fieldset className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.identity')}
        </legend>
        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.botName')}</span>
          <input
            type="text"
            value={config.botName}
            maxLength={60}
            onChange={(e) => onChange({ botName: e.target.value })}
            placeholder={t('fields.botNamePh')}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.welcome')}</span>
          <textarea
            value={config.welcome}
            maxLength={300}
            onChange={(e) => onChange({ welcome: e.target.value })}
            placeholder={t('fields.welcomePh')}
            rows={2}
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.appearance')}
        </legend>
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.primaryColor')}</span>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border border-secondary-300 bg-white dark:border-secondary-700"
            aria-label={t('fields.primaryColor')}
          />
          <span
            className="ml-1 inline-block rounded px-2 py-0.5 font-mono text-[11px] text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.primaryColor.toUpperCase()}
          </span>
        </label>

        <div>
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.position')}</span>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {POSITIONS.map((pos) => (
              <label
                key={pos}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                  config.position === pos
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200'
                    : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800'
                }`}
              >
                <input
                  type="radio"
                  name="widget-position"
                  className="accent-primary-600"
                  checked={config.position === pos}
                  onChange={() => onChange({ position: pos })}
                />
                <span>{t(`fields.${POSITION_I18N_KEY[pos]}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.avatar')}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {AVATAR_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ avatar: emoji })}
                aria-pressed={config.avatar === emoji}
                aria-label={`${t('fields.avatar')} ${emoji}`}
                className={`h-9 w-9 rounded-md border text-lg transition ${
                  config.avatar === emoji
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-secondary-300 bg-white hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800 dark:hover:bg-secondary-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.behavior')}
        </legend>
        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.instructions')}</span>
          <textarea
            value={config.instructions}
            maxLength={1500}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder={t('fields.instructionsPh')}
            rows={4}
            className={`${inputClass} text-xs`}
          />
          <span className="mt-1 block text-[10.5px] leading-snug text-secondary-500 dark:text-secondary-400">
            {t('fields.instructionsHint')}
          </span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">{t('fields.tone')}</span>
          <select
            value={config.tone}
            onChange={(e) => onChange({ tone: e.target.value as BuilderToneKey })}
            className={inputClass}
          >
            {TONE_CHOICES.map((tk) => (
              <option key={tk} value={tk}>
                {t(`fields.tones.${tk}`)}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.knowledge')}
        </legend>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          aria-busy={uploading ? 'true' : 'false'}
          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-secondary-300 bg-secondary-50 px-3 py-4 text-center text-xs text-secondary-600 transition hover:border-primary-400 hover:bg-primary-50/50 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:border-primary-500"
        >
          <ArrowUpTrayIcon className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">{uploading ? t('knowledge.uploading') : t('knowledge.drop')}</span>
          <span className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('knowledge.hint')}</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={TEXT_EXTENSIONS.join(',')}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
        </div>
        <p className="text-[10.5px] text-secondary-500 dark:text-secondary-400">{t('knowledge.pdfHint')}</p>

        <div className="rounded-md border border-secondary-200 bg-secondary-50 px-2.5 py-2 dark:border-secondary-700 dark:bg-secondary-800/60">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-secondary-700 dark:text-secondary-200">
            <SparklesIcon className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
            {t('knowledge.loadSample')}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sampleCompanies.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => onLoadSample(c.key)}
                disabled={uploading}
                className="rounded-md border border-secondary-300 bg-white px-2 py-1 text-[11px] font-medium text-secondary-700 transition hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800"
              >
                {t('knowledge.loadSampleOf', { company: c.name })}
              </button>
            ))}
          </div>
        </div>

        {docs.length === 0 ? (
          <p className="text-[11px] italic text-secondary-500 dark:text-secondary-400">{t('knowledge.empty')}</p>
        ) : (
          <ul className="space-y-1">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-md bg-secondary-100 px-2 py-1.5 text-xs dark:bg-secondary-800"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <DocumentIcon className="h-4 w-4 shrink-0 text-secondary-500 dark:text-secondary-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-secondary-800 dark:text-secondary-100">{d.name}</div>
                    <div className="text-[10px] text-secondary-500 dark:text-secondary-400">{formatBytes(d.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveDoc(d.id)}
                  aria-label={`${t('knowledge.remove')}: ${d.name}`}
                  className="rounded p-1 text-secondary-400 hover:bg-secondary-200 hover:text-red-500 dark:hover:bg-secondary-700"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  );
}
