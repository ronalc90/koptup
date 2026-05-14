'use client';

import { useTranslations } from 'next-intl';
import {
  ViewColumnsIcon,
  ListBulletIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  Squares2X2Icon,
  ShareIcon,
  RectangleStackIcon,
  ChartPieIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { ViewId } from '../types';

interface Props {
  active: ViewId;
  onChange: (v: ViewId) => void;
}

const VIEWS: Array<{ id: ViewId; icon: typeof ViewColumnsIcon; labelNs: 'views' | 'shell'; labelKey: string }> = [
  { id: 'kanban', icon: ViewColumnsIcon, labelNs: 'views', labelKey: 'kanban' },
  { id: 'list', icon: ListBulletIcon, labelNs: 'views', labelKey: 'list' },
  { id: 'gantt', icon: ChartBarIcon, labelNs: 'views', labelKey: 'gantt' },
  { id: 'timeline', icon: ClockIcon, labelNs: 'views', labelKey: 'timeline' },
  { id: 'calendar', icon: CalendarIcon, labelNs: 'views', labelKey: 'calendar' },
  { id: 'board', icon: Squares2X2Icon, labelNs: 'views', labelKey: 'board' },
  { id: 'mindmap', icon: ShareIcon, labelNs: 'views', labelKey: 'mindmap' },
  { id: 'swimlanes', icon: RectangleStackIcon, labelNs: 'views', labelKey: 'swimlanes' },
  { id: 'analytics', icon: ChartPieIcon, labelNs: 'shell', labelKey: 'analyticsTab' },
  { id: 'wiki', icon: DocumentTextIcon, labelNs: 'shell', labelKey: 'wikiTab' },
];

export default function ViewSelector({ active, onChange }: Props) {
  const tViews = useTranslations('demoProjectsPro.views');
  const tShell = useTranslations('demoProjectsPro.shell');

  const labelFor = (item: (typeof VIEWS)[number]) =>
    item.labelNs === 'views' ? tViews(item.labelKey) : tShell(item.labelKey);

  return (
    <>
      {/* Desktop: horizontal tab bar */}
      <div
        role="tablist"
        aria-label={tShell('viewsLabel')}
        className="hidden md:flex gap-1 overflow-x-auto px-4 sm:px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      >
        {VIEWS.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                selected
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {labelFor(item)}
            </button>
          );
        })}
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <label htmlFor="view-select-mobile" className="text-xs font-semibold text-slate-500">
          {tShell('viewsLabel')}:
        </label>
        <select
          id="view-select-mobile"
          value={active}
          onChange={(e) => onChange(e.target.value as ViewId)}
          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        >
          {VIEWS.map((item) => (
            <option key={item.id} value={item.id}>
              {labelFor(item)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
