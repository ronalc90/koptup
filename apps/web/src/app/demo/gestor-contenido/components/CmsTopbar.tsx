'use client';

import { useTranslations } from 'next-intl';
import {
  SparklesIcon,
  LanguageIcon,
  ChartBarIcon,
  BeakerIcon,
  CursorArrowRaysIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { SITE_KEYS, SiteKey, WorkflowStep, WORKFLOW_COLORS } from './CmsProShared';

interface CmsTopbarProps {
  site: SiteKey;
  onSiteChange: (s: SiteKey) => void;
  workflow: WorkflowStep;
  onWorkflowClick: () => void;
  onAiClick: () => void;
  onTranslateClick: () => void;
  onSeoClick: () => void;
  onPersonalizeClick: () => void;
  onTechConfigClick: () => void;
  seoScore: number;
  experimentMode: boolean;
  onExperimentToggle: () => void;
}

/**
 * Topbar del CMS — site selector, badge workflow, accesos a IA/Traducción/SEO,
 * toggle experimento, personalización y configuración técnica. Visible en todas
 * las vistas (templates y editor).
 */
export default function CmsTopbar({
  site,
  onSiteChange,
  workflow,
  onWorkflowClick,
  onAiClick,
  onTranslateClick,
  onSeoClick,
  onPersonalizeClick,
  onTechConfigClick,
  seoScore,
  experimentMode,
  onExperimentToggle,
}: CmsTopbarProps) {
  const t = useTranslations('demoCmsPro.topbar');
  const tWf = useTranslations('demoCmsPro.workflow.steps');
  const tSites = useTranslations('demoCmsPro.multisite.sites');

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Site selector */}
        <div className="flex items-center gap-2 min-w-0">
          <GlobeAltIcon className="w-5 h-5 text-pink-600 shrink-0" aria-hidden="true" />
          <label className="sr-only" htmlFor="cms-site-selector">
            {t('currentSite')}
          </label>
          <select
            id="cms-site-selector"
            value={site}
            onChange={(e) => onSiteChange(e.target.value as SiteKey)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-pink-500 dark:focus:border-pink-400"
            aria-label={t('currentSite')}
          >
            {SITE_KEYS.map((s) => (
              <option key={s} value={s}>
                {tSites(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden md:block" />

        {/* Workflow badge */}
        <button
          onClick={onWorkflowClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${WORKFLOW_COLORS[workflow]} hover:opacity-80`}
          aria-label={`${t('workflowBadge')}: ${tWf(workflow)}`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          {t('workflowBadge')}: {tWf(workflow)}
        </button>

        <div className="flex-1" />

        {/* SEO score */}
        <button
          onClick={onSeoClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          aria-label={`${t('seoScore')}: ${seoScore}/100`}
        >
          <ChartBarIcon className="w-4 h-4" />
          {t('seoScore')}: {seoScore}/100
        </button>

        {/* Translate */}
        <button
          onClick={onTranslateClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <LanguageIcon className="w-4 h-4" />
          {t('translate')}
        </button>

        {/* AI assistant */}
        <button
          onClick={onAiClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 transition-all"
        >
          <SparklesIcon className="w-4 h-4" />
          {t('aiAssistant')}
        </button>

        {/* Experiment mode toggle */}
        <button
          onClick={onExperimentToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            experimentMode
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-pressed={experimentMode}
        >
          <BeakerIcon className="w-4 h-4" />
          {t('experimentMode')}
        </button>

        {/* Personalize */}
        <button
          onClick={onPersonalizeClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <CursorArrowRaysIcon className="w-4 h-4" />
          {t('personalize')}
        </button>

        {/* Tech config */}
        <button
          onClick={onTechConfigClick}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('settings')}
          title={t('settings')}
        >
          <Cog6ToothIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      </div>
    </div>
  );
}
