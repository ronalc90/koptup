'use client';

import { useTranslations } from 'next-intl';
import {
  BuildingOffice2Icon,
  CpuChipIcon,
  PlayCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { FALLBACK_MODELS } from './data';
import type { SampleCompany, SampleCompanyKey } from './sampleKnowledge';
import type { DeviceKind } from './ui/DeviceFrame';
import Tooltip from './ui/Tooltip';
import type { RemoteModelMeta } from './builder/api';

/** Estado de la IA según `GET /api/chatbot/models`. */
/** `degraded`: hay clave de IA, pero la última llamada al proveedor falló (modo extractivo). */
export type AiStatus = 'checking' | 'generative' | 'degraded' | 'extractive' | 'offline';

interface TopBarProps {
  aiStatus: AiStatus;
  /** Controles del Playground (empresa, modelo, dispositivo y pregunta de ejemplo). */
  showPlaygroundControls: boolean;
  companies: SampleCompany[];
  companyKey: SampleCompanyKey;
  onCompanyChange: (k: SampleCompanyKey) => void;
  models: RemoteModelMeta[];
  modelId: string;
  onModelChange: (m: string) => void;
  onAskSample: () => void;
  askDisabled: boolean;
  device: DeviceKind;
  onDeviceChange: (d: DeviceKind) => void;
}

const fieldClass =
  'inline-flex min-w-0 items-center gap-1.5 rounded-md border border-secondary-200 bg-white px-2 py-1 text-xs transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 hover:border-secondary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-secondary-600';

const selectClass =
  'min-w-0 max-w-[13rem] cursor-pointer truncate border-0 bg-transparent py-0.5 pl-0 pr-6 text-xs text-secondary-800 focus:outline-none focus:ring-0 dark:bg-secondary-900 dark:text-secondary-100';

/**
 * Barra superior: título de la demo, rótulo "Datos de ejemplo", estado real
 * de la IA y, en el Playground, empresa de ejemplo, modelo, vista
 * escritorio/celular y "Pregunta de ejemplo".
 */
export default function TopBar({
  aiStatus,
  showPlaygroundControls,
  companies,
  companyKey,
  onCompanyChange,
  models,
  modelId,
  onModelChange,
  onAskSample,
  askDisabled,
  device,
  onDeviceChange,
}: TopBarProps) {
  const t = useTranslations('demoChatbot');

  const modelOptions: RemoteModelMeta[] =
    models.length > 0
      ? models
      : FALLBACK_MODELS.map((m) => ({
          id: m.id,
          name: m.name,
          provider: 'openai' as const,
          enabled: false,
          costInputUSDper1M: 0,
          costOutputUSDper1M: 0,
        }));

  const status = (() => {
    switch (aiStatus) {
      case 'generative':
        return {
          label: t('models.activeModel'),
          tip: t('models.activeModelTooltip'),
          Icon: CheckCircleIcon,
          cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/40',
        };
      case 'degraded':
        return {
          label: t('models.degraded'),
          tip: t('models.degradedTooltip'),
          Icon: ExclamationTriangleIcon,
          cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/40',
        };
      case 'extractive':
        return {
          label: t('models.extractiveMode'),
          tip: t('models.extractiveModeTooltip'),
          Icon: ExclamationTriangleIcon,
          cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/40',
        };
      case 'offline':
        return {
          label: t('models.offline'),
          tip: t('models.offlineTooltip'),
          Icon: NoSymbolIcon,
          cls: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/40',
        };
      default:
        return {
          label: t('models.checking'),
          tip: t('models.checking'),
          Icon: ArrowPathIcon,
          cls: 'bg-secondary-50 text-secondary-600 ring-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:ring-secondary-700',
        };
    }
  })();

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-secondary-200 bg-white/95 px-4 py-2.5 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/95">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 font-bold text-white shadow-sm">
          K
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h1 className="text-[15px] font-bold leading-tight tracking-tight text-secondary-900 dark:text-white">
              {t('pageTitle')}
            </h1>
            <Tooltip content={t('sampleDataTooltip')} side="bottom">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-semibold text-secondary-600 ring-1 ring-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:ring-secondary-700">
                <BeakerIcon className="h-3 w-3" aria-hidden="true" />
                {t('sampleDataBadge')}
              </span>
            </Tooltip>
          </div>
          <p className="mt-0.5 hidden max-w-2xl text-[11px] leading-snug text-secondary-500 dark:text-secondary-400 sm:block">
            {t('pageSubtitle')}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Tooltip content={status.tip} side="bottom">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${status.cls}`}
            data-ai-status={aiStatus}
          >
            <status.Icon className={`h-3 w-3 ${aiStatus === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
            {status.label}
          </span>
        </Tooltip>

        {showPlaygroundControls ? (
          <>
            <Tooltip content={t('topBar.companyTooltip')} side="bottom">
              <label className={fieldClass}>
                <BuildingOffice2Icon className="h-3.5 w-3.5 shrink-0 text-secondary-500" aria-hidden="true" />
                <span className="hidden text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 xl:inline">
                  {t('topBar.company')}
                </span>
                <select
                  value={companyKey}
                  onChange={(e) => onCompanyChange(e.target.value as SampleCompanyKey)}
                  className={selectClass}
                  aria-label={t('topBar.company')}
                >
                  {companies.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name} ({c.sector})
                    </option>
                  ))}
                </select>
              </label>
            </Tooltip>

            <Tooltip content={t('topBar.modelTooltip')} side="bottom">
              <label className={fieldClass}>
                <CpuChipIcon className="h-3.5 w-3.5 shrink-0 text-secondary-500" aria-hidden="true" />
                <span className="hidden text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 xl:inline">
                  {t('topBar.model')}
                </span>
                <select
                  value={modelId}
                  onChange={(e) => onModelChange(e.target.value)}
                  className={selectClass}
                  aria-label={t('topBar.model')}
                >
                  {modelOptions.map((m) => (
                    <option key={m.id} value={m.id} disabled={!m.enabled}>
                      {m.name}
                      {m.recommended ? ` (${t('models.recommended')})` : ''}
                      {!m.enabled ? ` · ${t('models.providerRequires')}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </Tooltip>

            <div
              role="group"
              aria-label={t('topBar.device.label')}
              className="hidden items-center rounded-md border border-secondary-200 bg-white p-0.5 dark:border-secondary-700 dark:bg-secondary-900 md:inline-flex"
            >
              <Tooltip content={t('topBar.device.switchToDesktop')} side="bottom">
                <button
                  type="button"
                  onClick={() => onDeviceChange('desktop')}
                  aria-pressed={device === 'desktop'}
                  aria-label={t('topBar.device.switchToDesktop')}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                    device === 'desktop'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white'
                  }`}
                >
                  <ComputerDesktopIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden lg:inline">{t('topBar.device.desktop')}</span>
                </button>
              </Tooltip>
              <Tooltip content={t('topBar.device.switchToMobile')} side="bottom">
                <button
                  type="button"
                  onClick={() => onDeviceChange('mobile')}
                  aria-pressed={device === 'mobile'}
                  aria-label={t('topBar.device.switchToMobile')}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                    device === 'mobile'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden lg:inline">{t('topBar.device.mobile')}</span>
                </button>
              </Tooltip>
            </div>

            <Tooltip content={t('topBar.askSampleTooltip')} side="bottom" align="end">
              <button
                type="button"
                onClick={onAskSample}
                disabled={askDisabled}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlayCircleIcon className="h-4 w-4" aria-hidden="true" />
                {t('topBar.askSample')}
              </button>
            </Tooltip>
          </>
        ) : null}
      </div>
    </div>
  );
}
