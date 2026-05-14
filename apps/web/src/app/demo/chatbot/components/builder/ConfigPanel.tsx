'use client';

/**
 * ConfigPanel — columna izquierda del Builder.
 *
 * Responsabilidad única: editar la `BuilderWidgetConfig`. No conoce ni el
 * preview ni el snippet de embed; sólo emite `onChange(patch)` con un
 * subset de campos. Esto cumple Single Responsibility + ISP.
 */

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import type {
  BuilderLangCode,
  BuilderToneKey,
  BuilderWidgetConfig,
  MockKnowledgeDoc,
  WidgetCornerPosition,
} from './widgetConfig';
import { MOCK_DOCS } from './widgetConfig';

interface ConfigPanelProps {
  config: BuilderWidgetConfig;
  onChange: (patch: Partial<BuilderWidgetConfig>) => void;
  avatarChoices: readonly string[];
  toneChoices: readonly BuilderToneKey[];
  langChoices: readonly { code: BuilderLangCode; label: string }[];
  positions: readonly WidgetCornerPosition[];
  /**
   * Subir archivos reales al backend. Si no se pasa, el panel cae al modo
   * mock (solo agrega chips locales) — útil para tests aislados.
   */
  onUpload?: (files: File[]) => void | Promise<void>;
  /** Eliminar doc en backend; si no se pasa, sólo borra local. */
  onRemoveDoc?: (docId: string) => void | Promise<void>;
  uploading?: boolean;
}

const POSITION_I18N_KEY: Record<WidgetCornerPosition, string> = {
  br: 'positionBR',
  bl: 'positionBL',
  tr: 'positionTR',
  tl: 'positionTL',
};

export default function ConfigPanel({
  config,
  onChange,
  avatarChoices,
  toneChoices,
  langChoices,
  positions,
  onUpload,
  onRemoveDoc,
  uploading,
}: ConfigPanelProps) {
  const t = useTranslations('demoChatbot.builder');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLang = useCallback(
    (code: BuilderLangCode) => {
      const isOn = config.languages.includes(code);
      const next = isOn
        ? config.languages.filter((c) => c !== code)
        : [...config.languages, code];
      // Mantener al menos un idioma para no romper el bot.
      onChange({ languages: next.length === 0 ? config.languages : next });
    },
    [config.languages, onChange],
  );

  const addMockDoc = useCallback(() => {
    const used = new Set(config.docs.map((d) => d.id));
    const candidate = MOCK_DOCS.find((d) => !used.has(d.id));
    if (!candidate) return;
    onChange({ docs: [...config.docs, candidate] });
  }, [config.docs, onChange]);

  const removeDoc = useCallback(
    (id: string) => {
      if (onRemoveDoc) {
        void onRemoveDoc(id);
        return;
      }
      onChange({ docs: config.docs.filter((d) => d.id !== id) });
    },
    [config.docs, onChange, onRemoveDoc],
  );

  /**
   * Recibe archivos del usuario y delega al callback `onUpload` (que va al
   * backend) o, si no se pasó, los muestra como chips locales mock.
   */
  const ingestFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      if (onUpload) {
        void onUpload(files);
        return;
      }
      const newDocs: MockKnowledgeDoc[] = files.map((f, i) => ({
        id: `dnd-${Date.now()}-${i}`,
        name: f.name,
        sizeKb: Math.max(1, Math.round(f.size / 1024)),
        chunks: Math.max(2, Math.round(f.size / 4096)),
      }));
      onChange({ docs: [...config.docs, ...newDocs] });
    },
    [config.docs, onChange, onUpload],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files ?? []);
      if (files.length === 0) {
        addMockDoc();
        return;
      }
      ingestFiles(files);
    },
    [addMockDoc, ingestFiles],
  );

  const openPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-secondary-200 bg-white p-4 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header>
        <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
          {t('configTitle')}
        </h3>
      </header>

      {/* Identidad */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.identity')}
        </legend>

        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.botName')}
          </span>
          <input
            type="text"
            value={config.botName}
            onChange={(e) => onChange({ botName: e.target.value })}
            placeholder={t('fields.botNamePh')}
            className="mt-1 w-full rounded-md border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.welcome')}
          </span>
          <textarea
            value={config.welcome}
            onChange={(e) => onChange({ welcome: e.target.value })}
            placeholder={t('fields.welcomePh')}
            rows={2}
            className="mt-1 w-full rounded-md border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
          />
        </label>
      </fieldset>

      {/* Apariencia */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.appearance')}
        </legend>

        <div className="flex items-center gap-3">
          <label className="flex flex-1 items-center gap-2">
            <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
              {t('fields.primaryColor')}
            </span>
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
        </div>

        <div>
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.position')}
          </span>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {positions.map((pos) => (
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
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.avatar')}
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {avatarChoices.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ avatar: emoji })}
                aria-pressed={config.avatar === emoji}
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

      {/* Comportamiento */}
      <fieldset className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.behavior')}
        </legend>

        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.systemPrompt')}
          </span>
          <textarea
            value={config.systemPrompt}
            onChange={(e) => onChange({ systemPrompt: e.target.value })}
            placeholder={t('fields.systemPromptPh')}
            rows={6}
            className="mt-1 w-full rounded-md border border-secondary-300 bg-white px-2.5 py-1.5 font-mono text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.tone')}
          </span>
          <select
            value={config.tone}
            onChange={(e) => onChange({ tone: e.target.value as BuilderToneKey })}
            className="mt-1 w-full rounded-md border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
          >
            {toneChoices.map((tk) => (
              <option key={tk} value={tk}>
                {t(`fields.tones.${tk}`)}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('fields.languages')}
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {langChoices.map((l) => {
              const checked = config.languages.includes(l.code);
              return (
                <label
                  key={l.code}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                    checked
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200'
                      : 'border-secondary-300 text-secondary-600 dark:border-secondary-700 dark:text-secondary-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary-600"
                    checked={checked}
                    onChange={() => toggleLang(l.code)}
                  />
                  {l.label}
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* Knowledge base */}
      <fieldset className="space-y-2">
        <legend className="text-[11px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {t('sections.knowledge')}
        </legend>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-secondary-300 bg-secondary-50 px-3 py-4 text-center text-xs text-secondary-600 transition hover:border-primary-400 hover:bg-primary-50/50 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:border-primary-500"
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openPicker();
          }}
          aria-busy={uploading ? 'true' : 'false'}
        >
          <ArrowUpTrayIcon className="h-5 w-5" />
          <span className="font-medium">
            {uploading ? t('knowledge.uploading') : t('knowledge.drop')}
          </span>
          <span className="text-[10px] text-secondary-500 dark:text-secondary-400">
            {t('knowledge.hint')}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                ingestFiles(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
        </div>

        {config.docs.length === 0 ? (
          <p className="text-[11px] italic text-secondary-500 dark:text-secondary-400">
            {t('knowledge.empty')}
          </p>
        ) : (
          <ul className="space-y-1">
            {config.docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-md bg-secondary-100 px-2 py-1.5 text-xs dark:bg-secondary-800"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <DocumentIcon className="h-4 w-4 shrink-0 text-secondary-500 dark:text-secondary-400" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-secondary-800 dark:text-secondary-100">
                      {d.name}
                    </div>
                    <div className="text-[10px] text-secondary-500 dark:text-secondary-400">
                      {d.sizeKb} KB · {d.chunks} {t('knowledge.chunks')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(d.id)}
                  aria-label={t('knowledge.remove')}
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
