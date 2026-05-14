'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DocumentTextIcon,
  Bars3Icon,
  PhotoIcon,
  CheckCircleIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export type SidebarView = 'editor' | 'blocks' | 'dam' | 'workflow' | 'templates';

interface CmsSidebarProps {
  current: SidebarView;
  onSelect: (v: SidebarView) => void;
}

export default function CmsSidebar({ current, onSelect }: CmsSidebarProps) {
  const t = useTranslations('demoCmsPro.sidebar');
  const [collapsed, setCollapsed] = useState(false);

  const items: { key: SidebarView; icon: any; label: string }[] = [
    { key: 'editor', icon: DocumentTextIcon, label: t('editor') },
    { key: 'blocks', icon: Bars3Icon, label: t('blocks') },
    { key: 'dam', icon: PhotoIcon, label: t('dam') },
    { key: 'workflow', icon: CheckCircleIcon, label: t('workflow') },
    { key: 'templates', icon: FolderIcon, label: t('templates') },
  ];

  return (
    <nav
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      aria-label={t('title')}
    >
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
            {t('title')}
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={collapsed ? t('expand') : t('collapse')}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>
      <ul className="flex-1 p-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <li key={item.key}>
              <button
                onClick={() => onSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
