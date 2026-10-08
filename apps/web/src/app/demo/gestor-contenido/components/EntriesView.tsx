'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, DocumentDuplicateIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { downloadBlob } from '@/lib/utils';
import { missingTranslations, pathOf, titleOf, typeOf } from '../lib/models';
import { can, canDelete } from '../lib/permissions';
import { useCms } from '../lib/store';
import { normalize, slugify, toCsv } from '../lib/text';
import { formatDateTime } from '../lib/time';
import { STATUSES, TYPE_IDS, type Entry, type Status, type TypeId } from '../lib/types';
import { btn, card, Empty, inputCls, labelCls, Modal, selectCls, StatusBadge, TypeBadge } from './ui';

type Sort = 'updated' | 'title' | 'type';
type LangFilter = 'all' | 'complete' | 'missing';

export function NewEntryModal({ onClose, initialType = 'location' }: { onClose: () => void; initialType?: TypeId }) {
  const t = useTranslations('demoCms.entries');
  const tTypes = useTranslations('demoCms.types');
  const { act, newId, openEntry, toast } = useCms();
  const [type, setType] = useState<TypeId>(initialType);
  const [title, setTitle] = useState('');
  const create = () => {
    if (!title.trim()) return;
    const id = newId('e');
    act({ type: 'entry.create', id, entryType: type, title: title.trim(), slug: slugify(title) });
    toast(t('created'));
    onClose();
    openEntry(id);
  };
  return (
    <Modal
      title={t('newTitle')}
      onClose={onClose}
      labelId="cms-new-entry"
      size="sm"
      footer={
        <>
          <button type="button" className={btn.outline} onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" className={btn.primary} onClick={create} disabled={!title.trim()}>
            {t('create')}
          </button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <div>
          <label htmlFor="cms-new-type" className={labelCls}>
            {t('typeLabel')}
          </label>
          <select id="cms-new-type" value={type} onChange={(e) => setType(e.target.value as TypeId)} className={selectCls}>
            {TYPE_IDS.map((id) => (
              <option key={id} value={id}>
                {tTypes(`${id}.name`)}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tTypes(`${type}.desc`)}</p>
        </div>
        <div>
          <label htmlFor="cms-new-title" className={labelCls}>
            {t('titleLabel')}
          </label>
          <input id="cms-new-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder={tTypes(`${type}.example`)} autoFocus />
          {title.trim() && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('slugPreview', { path: pathOf(type, slugify(title)) })}</p>}
        </div>
      </form>
    </Modal>
  );
}

export default function EntriesView() {
  const t = useTranslations('demoCms.entries');
  const tTypes = useTranslations('demoCms.types');
  const tStatus = useTranslations('demoCms.status');
  const { state, me, act, openEntry, newId, toast, statusPreset, contentLocale } = useCms();
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeId | 'all'>('all');
  const [status, setStatus] = useState<Status | 'all'>(statusPreset ?? 'all');
  const [lang, setLang] = useState<LangFilter>('all');
  const [author, setAuthor] = useState<string>('all');
  const [sort, setSort] = useState<Sort>('updated');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Entry | null>(null);

  useEffect(() => {
    if (statusPreset) setStatus(statusPreset);
  }, [statusPreset]);

  const person = (id: string) => state.people.find((p) => p.id === id)?.name ?? id;
  const rows = useMemo(() => {
    const nq = normalize(q.trim());
    const list = state.entries.filter((e) => {
      if (type !== 'all' && e.type !== type) return false;
      if (status !== 'all' && e.status !== status) return false;
      if (author !== 'all' && e.authorId !== author) return false;
      if (lang !== 'all') {
        const missing = missingTranslations(typeOf(state.types, e.type), e.content).length > 0;
        if (lang === 'missing' ? !missing : missing) return false;
      }
      if (nq) {
        const hay = normalize(`${titleOf(e, e.content, 'es')} ${titleOf(e, e.content, 'en')} ${e.content.slug}`);
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
    const title = (e: Entry) => titleOf(e, e.content, contentLocale);
    return [...list].sort((a, b) => {
      if (sort === 'title') return title(a).localeCompare(title(b), contentLocale);
      if (sort === 'type') return a.type.localeCompare(b.type) || title(a).localeCompare(title(b), contentLocale);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [state, q, type, status, author, lang, sort, contentLocale]);

  const filtersOn = q || type !== 'all' || status !== 'all' || author !== 'all' || lang !== 'all';
  const clear = () => {
    setQ('');
    setType('all');
    setStatus('all');
    setAuthor('all');
    setLang('all');
  };

  const exportCsv = () => {
    const header = [t('csv.title'), t('csv.type'), t('csv.status'), t('csv.path'), t('csv.enMissing'), t('csv.author'), t('csv.updated'), t('csv.published')];
    const data = rows.map((e) => [
      titleOf(e, e.content, contentLocale),
      tTypes(`${e.type}.name`),
      tStatus(e.status),
      pathOf(e.type, e.content.slug),
      missingTranslations(typeOf(state.types, e.type), e.content).length,
      person(e.authorId),
      formatDateTime(e.updatedAt, contentLocale),
      e.publishedAt ? formatDateTime(e.publishedAt, contentLocale) : '',
    ]);
    downloadBlob(new Blob([toCsv([header, ...data])], { type: 'text/csv;charset=utf-8' }), 'entradas-cms-montana-azul.csv');
    toast(t('csvDone', { n: rows.length }));
  };

  const duplicate = (e: Entry) => {
    const id = newId('e');
    act({ type: 'entry.duplicate', id: e.id, newId: id });
    toast(t('duplicated'));
  };

  const LangCell = ({ e }: { e: Entry }) => {
    const missing = missingTranslations(typeOf(state.types, e.type), e.content).length;
    return (
      <span className="inline-flex gap-1 text-[11px] font-semibold">
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">ES</span>
        <span className={`px-1.5 py-0.5 rounded ${missing ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`} title={missing ? t('enMissing', { n: missing }) : t('enComplete')}>
          EN{missing ? ` · ${missing}` : ''}
        </span>
      </span>
    );
  };

  const Actions = ({ e }: { e: Entry }) => (
    <div className="flex items-center gap-1">
      <button type="button" className={btn.ghost} onClick={() => openEntry(e.id)} aria-label={t('edit')} title={t('edit')}>
        <PencilSquareIcon className="w-4 h-4" />
      </button>
      <button type="button" className={btn.ghost} onClick={() => duplicate(e)} disabled={!can(me.role, 'entry.create')} aria-label={t('duplicate')} title={t('duplicate')}>
        <DocumentDuplicateIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={btn.ghost}
        onClick={() => setDeleting(e)}
        disabled={!canDelete(me.role, e, me.id)}
        aria-label={t('delete')}
        title={canDelete(me.role, e, me.id) ? t('delete') : t('deleteNotAllowed')}
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('subtitle', { shown: rows.length, total: state.entries.length })}</p>
        </div>
        <button type="button" className={btn.outline} onClick={exportCsv} disabled={rows.length === 0}>
          <ArrowDownTrayIcon className="w-4 h-4" />
          {t('exportCsv')}
        </button>
        <button type="button" className={btn.primary} onClick={() => setCreating(true)} disabled={!can(me.role, 'entry.create')}>
          <PlusIcon className="w-4 h-4" />
          {t('new')}
        </button>
      </div>

      <div className={`${card} p-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6`}>
        <div className="relative sm:col-span-2">
          <label htmlFor="cms-q" className="sr-only">
            {t('search')}
          </label>
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="cms-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className={`${inputCls} pl-9`} />
        </div>
        <select aria-label={t('filterType')} value={type} onChange={(e) => setType(e.target.value as TypeId | 'all')} className={selectCls}>
          <option value="all">{t('allTypes')}</option>
          {TYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {tTypes(`${id}.name`)}
            </option>
          ))}
        </select>
        <select aria-label={t('filterStatus')} value={status} onChange={(e) => setStatus(e.target.value as Status | 'all')} className={selectCls}>
          <option value="all">{t('allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </select>
        <select aria-label={t('filterLang')} value={lang} onChange={(e) => setLang(e.target.value as LangFilter)} className={selectCls}>
          <option value="all">{t('allLangs')}</option>
          <option value="complete">{t('langComplete')}</option>
          <option value="missing">{t('langMissing')}</option>
        </select>
        <select aria-label={t('filterAuthor')} value={author} onChange={(e) => setAuthor(e.target.value)} className={selectCls}>
          <option value="all">{t('allAuthors')}</option>
          {state.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center gap-2">
          <label htmlFor="cms-sort" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('sortBy')}
          </label>
          <select id="cms-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="pl-2 pr-8 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white">
            <option value="updated">{t('sort.updated')}</option>
            <option value="title">{t('sort.title')}</option>
            <option value="type">{t('sort.type')}</option>
          </select>
          {filtersOn && (
            <button type="button" className={btn.small} onClick={clear}>
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={card}>
          <Empty>{t('empty')}</Empty>
        </div>
      ) : (
        <>
          <div className={`${card} relative hidden md:block overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">{t('col.title')}</th>
                  <th className="text-left px-3 py-2 font-semibold">{t('col.type')}</th>
                  <th className="text-left px-3 py-2 font-semibold">{t('col.status')}</th>
                  <th className="text-left px-3 py-2 font-semibold">{t('col.langs')}</th>
                  <th className="text-left px-3 py-2 font-semibold">{t('col.author')}</th>
                  <th className="text-left px-3 py-2 font-semibold">{t('col.updated')}</th>
                  <th className="px-3 py-2">
                    <span className="sr-only">{t('col.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-pink-50/40 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2 max-w-xs">
                      <button type="button" onClick={() => openEntry(e.id)} className="font-medium text-slate-900 dark:text-white hover:underline text-left break-words">
                        {titleOf(e, e.content, contentLocale) || t('untitled')}
                      </button>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{pathOf(e.type, e.content.slug)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <TypeBadge type={e.type} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge entry={e} />
                    </td>
                    <td className="px-3 py-2">
                      <LangCell e={e} />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{person(e.authorId)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDateTime(e.updatedAt, contentLocale)}</td>
                    <td className="px-3 py-2">
                      <Actions e={e} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden space-y-2">
            {rows.map((e) => (
              <li key={e.id} className={`${card} p-3`}>
                <div className="flex items-start gap-2">
                  <button type="button" onClick={() => openEntry(e.id)} className="flex-1 min-w-0 text-left">
                    <span className="block font-medium text-slate-900 dark:text-white break-words">{titleOf(e, e.content, contentLocale) || t('untitled')}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{pathOf(e.type, e.content.slug)}</span>
                  </button>
                  <Actions e={e} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <TypeBadge type={e.type} />
                  <StatusBadge entry={e} />
                  <LangCell e={e} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {person(e.authorId)} · {formatDateTime(e.updatedAt, contentLocale)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {creating && <NewEntryModal onClose={() => setCreating(false)} initialType={type === 'all' ? 'location' : type} />}
      {deleting && (
        <Modal
          title={t('deleteTitle')}
          onClose={() => setDeleting(null)}
          size="sm"
          labelId="cms-delete-entry"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setDeleting(null)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  act({ type: 'entry.delete', id: deleting.id });
                  toast(t('deleted'));
                  setDeleting(null);
                }}
              >
                {t('deleteConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('deleteBody', { title: titleOf(deleting, deleting.content, contentLocale) })}</p>
          {deleting.live && <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">{t('deleteLive')}</p>}
        </Modal>
      )}
    </div>
  );
}
