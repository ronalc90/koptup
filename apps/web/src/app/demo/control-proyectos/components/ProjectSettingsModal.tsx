'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, BoltIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

type SettingsTab = 'automations' | 'dependencies' | 'criticalPath' | 'resources';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProjectSettingsModal({ open, onClose }: Props) {
  const t = useTranslations('demoProjectsPro.settings');
  const [tab, setTab] = useState<SettingsTab>('automations');

  useModalClose(open, onClose);

  if (!open) return null;

  const tabKey = (id: SettingsTab) =>
    `tab${id.charAt(0).toUpperCase() + id.slice(1)}` as
      | 'tabAutomations'
      | 'tabDependencies'
      | 'tabCriticalPath'
      | 'tabResources';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[150]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
        <div
          role="dialog"
          aria-label={t('title')}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label={t('close')}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-1 overflow-x-auto" role="tablist">
              {(['automations', 'dependencies', 'criticalPath', 'resources'] as SettingsTab[]).map((id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 ${
                    tab === id
                      ? 'border-teal-600 text-teal-700 dark:text-teal-300'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t(tabKey(id))}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'automations' && <AutomationsTab />}
            {tab === 'dependencies' && <DependenciesTab />}
            {tab === 'criticalPath' && <CriticalPathTab />}
            {tab === 'resources' && <ResourcesTab />}
          </div>
        </div>
      </div>
    </>
  );
}

function AutomationsTab() {
  const t = useTranslations('demoProjectsPro.automations');
  const rules = [1, 2, 3, 4];
  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('subtitle')}</p>
      <div className="space-y-3">
        {rules.map((i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <BoltIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold text-slate-500 uppercase text-xs mr-1">IF</span>
                <span className="text-slate-900 dark:text-white">{t(`rule${i}If`)}</span>
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold text-teal-600 uppercase text-xs mr-1">THEN</span>
                <span className="text-slate-700 dark:text-slate-300">{t(`rule${i}Then`)}</span>
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                {t('active')}
              </span>
              {i === 4 && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                  {t('ai')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DependenciesTab() {
  const t = useTranslations('demoProjectsPro.dependencies');
  const links = [
    { from: 't1', to: 't2', type: 'FS', lag: 0 },
    { from: 't2', to: 't3', type: 'SS', lag: 2 },
    { from: 't2', to: 't4', type: 'FF', lag: 0 },
    { from: 't3', to: 't4', type: 'SF', lag: 1 },
  ];
  const tasks = [
    { id: 't1', label: t('task1') },
    { id: 't2', label: t('task2') },
    { id: 't3', label: t('task3') },
    { id: 't4', label: t('task4') },
  ];
  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('subtitle')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-200 dark:border-teal-800 text-sm font-medium text-slate-900 dark:text-white"
              >
                {task.label}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-slate-700">{l.from}</span>
                <span className="text-slate-400">→</span>
                <span className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-slate-700">{l.to}</span>
                <span className="ml-auto px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold text-xs">
                  {l.type}
                </span>
                <span className="text-xs text-slate-500">
                  {t('lag')}: {l.lag} {t('days')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CriticalPathTab() {
  const t = useTranslations('demoProjectsPro.criticalPath');
  const rows = [
    { label: 'Discovery', start: 0, len: 4, critical: true },
    { label: 'UX Design', start: 4, len: 3, critical: true },
    { label: 'API Design', start: 4, len: 2, critical: false },
    { label: 'Backend dev', start: 7, len: 6, critical: true },
    { label: 'Frontend dev', start: 7, len: 5, critical: false },
    { label: 'Integration', start: 13, len: 4, critical: true },
    { label: 'QA + Release', start: 17, len: 6, critical: true },
  ];
  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('subtitle')}</p>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 text-xs text-slate-700 dark:text-slate-300 truncate">{r.label}</div>
              <div className="flex-1 relative h-6 bg-white dark:bg-slate-900 rounded">
                <div
                  className={`absolute top-0 bottom-0 rounded ${
                    r.critical
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-teal-400 to-cyan-500'
                  }`}
                  style={{ left: `${(r.start / 23) * 100}%`, width: `${(r.len / 23) * 100}%` }}
                  title={r.critical ? t('critical') : t('slack')}
                />
              </div>
              <span className={`text-xs font-semibold ${r.critical ? 'text-red-600' : 'text-slate-500'}`}>
                {r.critical ? t('critical') : t('slack')}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm">
          <span className="text-slate-500">{t('duration')}</span>
          <span className="font-bold text-red-600">{t('totalDays')}</span>
        </div>
      </div>
    </div>
  );
}

function ResourcesTab() {
  const t = useTranslations('demoProjectsPro.resources');
  const people = [
    { name: 'María G.', assigned: 110, color: 'bg-red-500' },
    { name: 'Carlos R.', assigned: 85, color: 'bg-teal-500' },
    { name: 'Ana M.', assigned: 70, color: 'bg-cyan-500' },
    { name: 'Pedro L.', assigned: 60, color: 'bg-emerald-500' },
    { name: 'Laura F.', assigned: 45, color: 'bg-blue-500' },
  ];
  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('subtitle')}</p>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
        {people.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
              <span
                className={`font-semibold ${
                  p.assigned > 100 ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {p.assigned}%
              </span>
            </div>
            <div className="h-3 bg-white dark:bg-slate-900 rounded-full overflow-hidden relative">
              <div className={`h-full ${p.color} transition-all`} style={{ width: `${Math.min(p.assigned, 100)}%` }} />
              {p.assigned > 100 && (
                <div
                  className="absolute right-0 top-0 bottom-0 bg-red-700 animate-pulse"
                  style={{ width: `${p.assigned - 100}%` }}
                />
              )}
            </div>
          </div>
        ))}
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <ShieldExclamationIcon className="w-5 h-5" />
          {t('conflict')}
        </div>
      </div>
    </div>
  );
}
