'use client';

import { useTranslations } from 'next-intl';
import {
  CheckIcon,
  XMarkIcon,
  ArrowUpRightIcon,
  PencilSquareIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Field } from './Atoms';
import { CATEGORY_COLORS, PRIORITY_COLORS, type ContentType, type QueueItem } from './mockData';

interface Props {
  items: QueueItem[];
  selected: QueueItem | null;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  typeFilter: ContentType | 'all';
  setTypeFilter: (f: ContentType | 'all') => void;
  revealedIds: Set<string>;
  toggleReveal: (id: string) => void;
  resolveItem: (id: string) => void;
}

export default function QueueTab(props: Props) {
  const t = useTranslations('demoModeration');
  const {
    items,
    selected,
    selectedId,
    setSelectedId,
    typeFilter,
    setTypeFilter,
    revealedIds,
    toggleReveal,
    resolveItem,
  } = props;

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
            {t('queue.title')}
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {t('queue.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'text', 'image', 'video', 'audio'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                typeFilter === f
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border-secondary-200 dark:border-secondary-700 hover:border-primary-400'
              }`}
            >
              {t(`queue.filter${f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card variant="bordered" padding="none" className="lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 dark:bg-secondary-800/60 text-secondary-600 dark:text-secondary-300">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{t('queue.priority')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('queue.type')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('queue.preview')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('queue.classification')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('queue.confidence')}</th>
                  <th className="text-right px-3 py-2 font-medium">{t('queue.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const isSelected = selectedId === it.id;
                  const revealed = revealedIds.has(it.id);
                  return (
                    <tr
                      key={it.id}
                      onClick={() => setSelectedId(it.id)}
                      className={`border-t border-secondary-100 dark:border-secondary-800 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-50/60 dark:bg-primary-900/20'
                          : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/40'
                      }`}
                    >
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_COLORS[it.priority]}`}>
                          {t(`queue.priorities.${it.priority}`)}
                        </span>
                      </td>
                      <td className="px-3 py-3 uppercase text-xs text-secondary-600 dark:text-secondary-400">
                        {it.type}
                      </td>
                      <td className="px-3 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-secondary-800 dark:text-secondary-200 line-clamp-1 ${
                              it.needsBlur && !revealed ? 'blur-sm select-none' : ''
                            }`}
                          >
                            {it.preview}
                          </p>
                          {it.needsBlur && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReveal(it.id);
                              }}
                              className="shrink-0 text-xs inline-flex items-center gap-1 text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                            >
                              {revealed ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                              {revealed ? t('queue.hidePreview') : t('queue.showPreview')}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[it.category]}`}>
                          {t(`queue.classifications.${it.category}`)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-secondary-100 dark:bg-secondary-700 overflow-hidden">
                            <div
                              className={`h-full ${
                                it.confidence >= 90
                                  ? 'bg-red-500'
                                  : it.confidence >= 75
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${it.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-secondary-700 dark:text-secondary-300">
                            {it.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => resolveItem(it.id)}
                            className="p-1.5 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                            title={t('queue.approve')}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => resolveItem(it.id)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                            title={t('queue.reject')}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => resolveItem(it.id)}
                            className="p-1.5 rounded-md text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                            title={t('queue.escalate')}
                          >
                            <ArrowUpRightIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                            title={t('queue.editTag')}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-secondary-500 text-sm">
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900 dark:text-white">
                  {t('queue.details')} · {selected.id}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selected.category]}`}>
                  {t(`queue.classifications.${selected.category}`)}
                </span>
              </div>

              <div className="text-sm text-secondary-700 dark:text-secondary-200 bg-secondary-50 dark:bg-secondary-800/60 rounded-lg p-3">
                <p
                  className={`${
                    selected.needsBlur && !revealedIds.has(selected.id) ? 'blur-sm select-none' : ''
                  }`}
                >
                  {selected.preview}
                </p>
                {selected.needsBlur && (
                  <button
                    onClick={() => toggleReveal(selected.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-300"
                  >
                    {revealedIds.has(selected.id) ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                    {revealedIds.has(selected.id) ? t('queue.hidePreview') : t('queue.showPreview')}
                    <span className="ml-1 text-secondary-500">· {t('queue.blurred')}</span>
                  </button>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <Field label={t('queue.user')} value={selected.user} />
                <Field label={t('queue.channel')} value={selected.channel} />
                <Field label={t('queue.reporter')} value={selected.reporter} />
                <Field label={t('queue.submittedAt')} value={new Date(selected.submittedAt).toLocaleString()} />
                <Field label={t('queue.previousStrikes')} value={`${selected.previousStrikes}`} />
                <Field label={t('queue.accountAge')} value={selected.accountAge} />
              </dl>

              <div className="flex flex-col gap-2 pt-2">
                <Button variant="primary" fullWidth onClick={() => resolveItem(selected.id)}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {t('queue.approve')}
                </Button>
                <Button variant="danger" fullWidth onClick={() => resolveItem(selected.id)}>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  {t('queue.reject')}
                </Button>
                <Button variant="outline" fullWidth onClick={() => resolveItem(selected.id)}>
                  <ArrowUpRightIcon className="h-4 w-4 mr-2" />
                  {t('queue.escalate')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {t('queue.selectItem')}
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}
