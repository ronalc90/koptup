'use client';

import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  ShieldExclamationIcon,
  CpuChipIcon,
  UserGroupIcon,
  TrophyIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AIInsightsDrawer({ open, onClose }: Props) {
  const t = useTranslations('demoProjectsPro.drawer');
  const tStand = useTranslations('demoProjectsPro.standup');
  const tRisks = useTranslations('demoProjectsPro.risks');
  const tMc = useTranslations('demoProjectsPro.montecarlo');
  const tOkrs = useTranslations('demoProjectsPro.okrs');
  const tPrio = useTranslations('demoProjectsPro.aiPriority');
  const tEst = useTranslations('demoProjectsPro.aiEstimation');

  useModalClose(open, onClose);

  if (!open) return null;

  const people = [1, 2, 3] as const;
  const risks = [
    { id: 1, prob: 'high', impact: 'high' },
    { id: 2, prob: 'medium', impact: 'high' },
    { id: 3, prob: 'high', impact: 'medium' },
  ];
  const mc = [
    { key: 'p50' as const, color: 'from-emerald-500 to-emerald-600', pct: 50 },
    { key: 'p80' as const, color: 'from-amber-500 to-amber-600', pct: 80 },
    { key: 'p95' as const, color: 'from-red-500 to-red-600', pct: 95 },
  ];
  const okrs = [
    { key: 'org' as const, color: 'from-purple-500 to-indigo-500', Icon: TrophyIcon, align: 100, conf: 75 },
    { key: 'team' as const, color: 'from-teal-500 to-cyan-500', Icon: UserGroupIcon, align: 85, conf: 70 },
    { key: 'personal' as const, color: 'from-amber-500 to-orange-500', Icon: RocketLaunchIcon, align: 92, conf: 80 },
  ];
  const priorities = [1, 2, 3] as const;

  const levelClass = (lvl: string) =>
    lvl === 'high'
      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
      : lvl === 'medium'
      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[150] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label={t('title')}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 z-[200] shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {t('title')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="close-drawer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              {t('sectionEstimation')}
            </h3>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-3 mb-3">
                <CpuChipIcon className="w-6 h-6 text-teal-600" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{tEst('estimate')}</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{tEst('basis')}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-500">{tEst('confidence')}</span>
                <div className="flex-1 h-2 bg-white/70 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: '87%' }} />
                </div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">87%</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              {t('sectionStandup')}
            </h3>
            <div className="space-y-2">
              {people.map((i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold">
                      {(tStand(`person${i}`) as string).split(' ').map((s) => s[0]).join('')}
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{tStand(`person${i}`)}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-500 uppercase mr-1">{tStand('today')}:</span>
                    {tStand(`tod${i}`)}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    <span className="font-semibold text-red-600 uppercase mr-1">{tStand('blockers')}:</span>
                    {tStand(`block${i}`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              {t('sectionPriority')}
            </h3>
            <div className="space-y-2">
              {priorities.map((id) => {
                const scores: Record<number, number> = { 1: 96, 2: 89, 3: 74 };
                return (
                  <div key={id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-xl font-bold text-teal-600">{scores[id]}</div>
                      <div className="text-[9px] uppercase text-slate-500">{tPrio('score')}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tPrio(`task${id}`)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {tPrio(`reason${id}`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              {t('sectionRisks')}
            </h3>
            <div className="space-y-2">
              {risks.map((r) => (
                <div key={r.id} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <ShieldExclamationIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white">{tRisks(`risk${r.id}`)}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${levelClass(r.prob)}`}>
                        {tRisks('probability')}: {tRisks(r.prob)}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${levelClass(r.impact)}`}>
                        {tRisks('impact')}: {tRisks(r.impact)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              {t('sectionForecast')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {mc.map((it) => (
                <div key={it.key} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 text-center">
                  <div className={`text-xs font-bold uppercase mb-1 bg-gradient-to-r ${it.color} bg-clip-text text-transparent`}>
                    {tMc(it.key)}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{tMc(`${it.key}Date`)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{it.pct}%</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400">
              {tMc('interpretation')}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              {t('sectionOkrs')}
            </h3>
            <div className="space-y-2">
              {okrs.map(({ key, color, Icon, align }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color} flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold">{tOkrs(key)}</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{tOkrs(`${key}Goal`)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-500">{tOkrs('alignment')}</p>
                    <p className="text-sm font-bold text-teal-600">{align}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
