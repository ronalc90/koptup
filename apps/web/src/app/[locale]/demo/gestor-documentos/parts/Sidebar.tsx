'use client';

import { useTranslations } from 'next-intl';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ClockIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderPlusIcon,
  LockClosedIcon,
  StarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { fmtBytes } from '../lib/dates';
import { useDocs } from '../lib/store';
import type { View } from '../lib/types';
import { focusRing } from './ui';

interface SidebarProps {
  view: View;
  folder: string;
  onSelect: (view: View, folder?: string) => void;
  onNewFolder: () => void;
  onRetention: () => void;
  onUpload: () => void;
  onReset: () => void;
}

export default function Sidebar({ view, folder, onSelect, onNewFolder, onRetention, onUpload, onReset }: SidebarProps) {
  const t = useTranslations('demoDocs');
  const { docs, folders, folderCounts, folderLabel, retention, mode, hasSession, loc, uploading } = useDocs();
  const active = docs.filter((d) => !d.deleted);
  const counts: Record<Exclude<View, 'folder'>, number> = {
    all: active.length,
    favorites: active.filter((d) => d.favorite).length,
    recent: Math.min(10, active.length),
    trash: docs.filter((d) => d.deleted).length,
  };
  const items: { id: Exclude<View, 'folder'>; icon: typeof StarIcon }[] = [
    { id: 'all', icon: DocumentTextIcon },
    { id: 'favorites', icon: StarIcon },
    { id: 'recent', icon: ClockIcon },
    { id: 'trash', icon: TrashIcon },
  ];
  const totalSize = active.reduce((s, d) => s + d.sizeBytes, 0);
  const canUpload = mode === 'server' && hasSession;
  const itemCls = (on: boolean) =>
    `flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${focusRing} ${
      on ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900 dark:text-white">{t('sidebar.brand')}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{mode === 'sample' ? t('shell.modes.sample') : t('shell.modes.server')}</p>
          </div>
        </div>
        {canUpload ? (
          <button type="button" onClick={onUpload} disabled={Boolean(uploading)} className={`w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 ${focusRing} flex items-center justify-center gap-2`}>
            <CloudArrowUpIcon className="h-5 w-5" />
            {t('sidebar.upload')}
          </button>
        ) : mode === 'sample' ? (
          <button type="button" onClick={onReset} className={`flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}>
            <ArrowPathIcon className="h-4 w-4" />
            {t('sidebar.resetSample')}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={t('sidebar.navLabel')}>
        {items.map(({ id, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onSelect(id)} aria-current={view === id ? 'page' : undefined} className={itemCls(view === id)}>
            <span className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{t(`sidebar.views.${id}`)}</span>
            </span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">{counts[id]}</span>
          </button>
        ))}

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between gap-2 px-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('sidebar.foldersTitle')}</h3>
            <div className="flex items-center gap-1">
              <button type="button" onClick={onRetention} title={t('sidebar.retention')} aria-label={t('sidebar.retention')} className={`rounded p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 ${focusRing}`}>
                <ArchiveBoxIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={onNewFolder} title={t('sidebar.newFolder')} aria-label={t('sidebar.newFolder')} className={`rounded p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 ${focusRing}`}>
                <FolderPlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {folders.map((f) => {
            const on = view === 'folder' && folder === f;
            const hold = retention[f]?.hold;
            return (
              <button key={f} type="button" onClick={() => onSelect('folder', f)} aria-current={on ? 'page' : undefined} className={itemCls(on)}>
                <span className="flex min-w-0 items-center gap-3">
                  <FolderIcon className="h-5 w-5 shrink-0" />
                  <span className="truncate text-sm font-medium">{folderLabel(f)}</span>
                  {hold && <LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" aria-label={t('sidebar.holdBadge')} />}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">{folderCounts[f] || 0}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{t('sidebar.storage')}</p>
        <p className="mt-1">{t('sidebar.storageUsed', { size: fmtBytes(totalSize, loc), count: active.length })}</p>
        {mode === 'sample' && <p className="mt-1 text-slate-500">{t('sidebar.storageSample')}</p>}
      </div>
    </div>
  );
}
