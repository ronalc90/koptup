'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BuildingOffice2Icon,
  CpuChipIcon,
  LanguageIcon,
  PlayCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { MODELS, TENANTS, type ScenarioKey } from './data';
import type { DeviceKind } from './ui/DeviceFrame';
import Tooltip from './ui/Tooltip';
import { listModels, type RemoteModelMeta } from './builder/api';

interface TopBarProps {
  tenant: typeof TENANTS[number]['id'];
  onTenantChange: (t: typeof TENANTS[number]['id']) => void;
  modelId: string;
  onModelChange: (m: string) => void;
  locale: 'es' | 'en';
  onLocaleChange: (l: 'es' | 'en') => void;
  onRunSample: (k: ScenarioKey) => void;
  isStreaming: boolean;
  device?: DeviceKind;
  onDeviceChange?: (d: DeviceKind) => void;
  onOpenSettings?: () => void;
}

/**
 * Top bar: tenant + model + locale selectors + acción rápida + device toggle.
 * Cada control trae un tooltip explicativo al hover.
 */
export default function TopBar({
  tenant,
  onTenantChange,
  modelId,
  onModelChange,
  locale,
  onLocaleChange,
  onRunSample,
  isStreaming,
  device,
  onDeviceChange,
  onOpenSettings,
}: TopBarProps) {
  const t = useTranslations('demoChatbot');

  /**
   * Catálogo real de modelos desde el backend. Si la fetch falla (offline o
   * 404), caemos al catálogo estático de `MODELS` con `enabled=false` para
   * que la UI no se rompa pero el usuario vea claramente el estado "sin LLM".
   */
  const [remoteModels, setRemoteModels] = useState<RemoteModelMeta[]>([]);
  const [activeProvider, setActiveProvider] = useState<'openai' | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await listModels();
        if (cancelled) return;
        setRemoteModels(data.available);
        setActiveProvider(data.activeProvider);
      } catch {
        if (cancelled) return;
        setRemoteModels(
          MODELS.map((m) => ({
            id: m.id,
            name: m.label,
            provider: 'openai' as const,
            enabled: false,
            costInputUSDper1M: 0,
            costOutputUSDper1M: 0,
          })),
        );
        setActiveProvider(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackOptions: RemoteModelMeta[] = remoteModels.length > 0
    ? remoteModels
    : MODELS.map((m) => ({
        id: m.id,
        name: m.label,
        provider: 'openai' as const,
        enabled: false,
        costInputUSDper1M: 0,
        costOutputUSDper1M: 0,
      }));

  const fieldClass =
    'inline-flex items-center gap-1.5 rounded-md border border-secondary-200 bg-white px-2.5 py-1.5 text-xs transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 hover:border-secondary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-secondary-600';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/95">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 font-bold text-white shadow-sm">
            K
          </span>
          <div>
            <h1 className="text-[15px] font-bold leading-tight tracking-tight text-secondary-900 dark:text-white">
              {t('pageTitle')}
            </h1>
            <p className="text-[10.5px] leading-tight text-secondary-500 dark:text-secondary-400">
              {t('pageSubtitle')}
            </p>
          </div>
        </div>
        <Tooltip content={t('ux.tooltips.online')} side="bottom">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/40 md:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {t('topBar.online')}
          </span>
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Device toggle */}
        {device && onDeviceChange ? (
          <div
            role="group"
            aria-label={t('ux.device.label')}
            className="inline-flex items-center rounded-md border border-secondary-200 bg-white p-0.5 dark:border-secondary-700 dark:bg-secondary-900"
          >
            <Tooltip content={t('ux.device.switchToDesktop')} side="bottom">
              <button
                type="button"
                onClick={() => onDeviceChange('desktop')}
                aria-pressed={device === 'desktop'}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                  device === 'desktop'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white'
                }`}
              >
                <ComputerDesktopIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('ux.device.desktop')}</span>
              </button>
            </Tooltip>
            <Tooltip content={t('ux.device.switchToMobile')} side="bottom">
              <button
                type="button"
                onClick={() => onDeviceChange('mobile')}
                aria-pressed={device === 'mobile'}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                  device === 'mobile'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white'
                }`}
              >
                <DevicePhoneMobileIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('ux.device.mobile')}</span>
              </button>
            </Tooltip>
          </div>
        ) : null}

        <Tooltip content={t('ux.tooltips.tenant')} side="bottom">
          <label className={fieldClass}>
            <BuildingOffice2Icon className="h-3.5 w-3.5 text-secondary-500" />
            <span className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('topBar.tenant')}
            </span>
            <select
              value={tenant}
              onChange={(e) => onTenantChange(e.target.value as typeof TENANTS[number]['id'])}
              className="bg-transparent text-secondary-800 focus:outline-none dark:text-secondary-100"
              aria-label={t('topBar.tenant')}
            >
              {TENANTS.map((tn) => (
                <option key={tn.id} value={tn.id}>
                  {t(`tenants.${tn.id}`)}
                </option>
              ))}
            </select>
          </label>
        </Tooltip>

        {/* Badge de estado del LLM */}
        {activeProvider === 'openai' ? (
          <Tooltip content={t('models.activeModelTooltip')} side="bottom">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/40">
              <CheckCircleIcon className="h-3 w-3" />
              {t('models.activeModel', { name: modelId })}
            </span>
          </Tooltip>
        ) : (
          <Tooltip content={t('models.extractiveModeTooltip')} side="bottom">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/40">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {t('models.extractiveMode')}
            </span>
          </Tooltip>
        )}

        <Tooltip content={t('ux.tooltips.model')} side="bottom">
          <label className={fieldClass}>
            <CpuChipIcon className="h-3.5 w-3.5 text-secondary-500" />
            <span className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('topBar.model')}
            </span>
            <select
              value={modelId}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-secondary-800 focus:outline-none dark:text-secondary-100"
              aria-label={t('topBar.model')}
            >
              {fallbackOptions.map((m) => (
                <option key={m.id} value={m.id} disabled={!m.enabled}>
                  {m.name}
                  {m.recommended ? ' ⭐' : ''}
                  {!m.enabled ? ` · ${t('models.providerRequires')}` : ''}
                </option>
              ))}
            </select>
          </label>
        </Tooltip>

        <Tooltip content={t('ux.tooltips.language')} side="bottom">
          <label className={fieldClass}>
            <LanguageIcon className="h-3.5 w-3.5 text-secondary-500" />
            <select
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value as 'es' | 'en')}
              className="bg-transparent text-secondary-800 focus:outline-none dark:text-secondary-100"
              aria-label={t('topBar.language')}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
        </Tooltip>

        {onOpenSettings ? (
          <Tooltip content={t('ux.tooltips.settings')} side="bottom">
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={t('ux.tooltips.settings')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-secondary-200 bg-white text-secondary-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white"
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        ) : null}

        <Tooltip content={t('ux.tooltips.runSample')} side="bottom" align="end">
          <button
            type="button"
            onClick={() => onRunSample('docs')}
            disabled={isStreaming}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircleIcon className="h-4 w-4" />
            {t('topBar.runSample')}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
