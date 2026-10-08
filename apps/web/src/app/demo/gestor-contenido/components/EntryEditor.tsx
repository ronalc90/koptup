'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { hasUnpublishedChanges, missingTranslations, pathOf, sameContent, titleOf, typeOf } from '../lib/models';
import { can, canDelete, canEdit } from '../lib/permissions';
import { blockingIssues } from '../lib/reducer';
import { useCms } from '../lib/store';
import { slugify } from '../lib/text';
import { atBogota, formatDateTime, fromLocalInput, iso, toLocalInput } from '../lib/time';
import { LOCALES, type Entry, type EntryContent, type FieldValue, type L10n } from '../lib/types';
import BlocksEditor from './BlocksEditor';
import { AiPanel, EntryApiPanel, HistoryPanel, SeoPanel } from './EditorPanels';
import { FieldInput, useFieldLabel } from './Fields';
import SitePreview from './SitePreview';
import { btn, card, inputCls, labelCls, Modal, Note, StatusBadge, TypeBadge } from './ui';

type Tab = 'preview' | 'seo' | 'api' | 'history' | 'ai';

function ScheduleModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const t = useTranslations('demoCms.editor.schedule');
  const { act, toast, contentLocale } = useCms();
  const now = Date.now();
  const [value, setValue] = useState(toLocalInput(entry.scheduledAt ? Date.parse(entry.scheduledAt) : atBogota(now, 1, 7)));
  const ms = fromLocalInput(value);
  const valid = ms !== null && ms > Date.now() + 5000;
  const confirm = () => {
    if (!valid || ms === null) return;
    act({ type: 'entry.schedule', id: entry.id, at: iso(ms) });
    toast(t('done', { date: formatDateTime(iso(ms), contentLocale) }));
    onClose();
  };
  return (
    <Modal
      title={t('title')}
      onClose={onClose}
      size="sm"
      labelId="cms-schedule"
      footer={
        <>
          <button type="button" className={btn.outline} onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" className={btn.primary} onClick={confirm} disabled={!valid}>
            <CalendarDaysIcon className="w-4 h-4" />
            {t('confirm')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="cms-schedule-at" className={labelCls}>
            {t('when')}
          </label>
          <input id="cms-schedule-at" type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
          {!valid && <p className="text-[11px] text-red-600 mt-0.5">{t('future')}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn.small} onClick={() => setValue(toLocalInput(Math.ceil((Date.now() + 45_000) / 60_000) * 60_000))}>
            {t('inOneMinute')}
          </button>
          <button type="button" className={btn.small} onClick={() => setValue(toLocalInput(atBogota(Date.now(), 1, 7)))}>
            {t('tomorrow7')}
          </button>
          <button type="button" className={btn.small} onClick={() => setValue(toLocalInput(atBogota(Date.now(), 7, 7)))}>
            {t('nextWeek')}
          </button>
        </div>
        <Note>{t('note')}</Note>
      </div>
    </Modal>
  );
}

export default function EntryEditor({ id }: { id: string }) {
  const t = useTranslations('demoCms.editor');
  const tRole = useTranslations('demoCms.roles');
  const tStatus = useTranslations('demoCms.status');
  const tIssues = useTranslations('demoCms.editor.issues');
  const { state, me, act, go, toast, contentLocale: locale, setContentLocale } = useCms();
  const fieldLabel = useFieldLabel();
  const [tab, setTab] = useState<Tab>('preview');
  const [previewMode, setPreviewMode] = useState<'draft' | 'live'>('draft');
  const [scheduling, setScheduling] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [note, setNote] = useState('');
  const [deleting, setDeleting] = useState(false);

  const entry = state.entries.find((e) => e.id === id);
  if (!entry) {
    return (
      <div className={`${card} p-6 max-w-xl`}>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{t('gone')}</p>
        <button type="button" className={btn.outline} onClick={() => go('entries')}>
          <ArrowLeftIcon className="w-4 h-4" />
          {t('back')}
        </button>
      </div>
    );
  }

  const type = typeOf(state.types, entry.type);
  const editable = canEdit(me.role, entry);
  const issues = blockingIssues(state, entry);
  const pending = missingTranslations(type, entry.content);
  const changes = hasUnpublishedChanges(entry);
  const person = (pid: string) => state.people.find((p) => p.id === pid)?.name ?? pid;
  const roleName = tRole(`${me.role}.name`);

  const edit = (fn: (c: EntryContent) => EntryContent) => {
    if (!editable) return;
    const next = fn(entry.content);
    act({ type: 'entry.edit', id: entry.id, content: next });
    if (entry.status === 'approved' || entry.status === 'scheduled' || entry.status === 'published') toast(t('backToDraft'), 'info');
  };
  const setField = (fid: string, v: FieldValue) => edit((c) => ({ ...c, fields: { ...c.fields, [fid]: v } }));
  const setBlockHtml = (bid: string, v: L10n) => edit((c) => ({ ...c, blocks: c.blocks.map((b) => (b.id === bid && b.kind === 'paragraph' ? { ...b, html: v } : b)) }));
  const issueText = (code: string) => {
    if (code === 'slug.invalid' || code === 'slug.taken') return tIssues(code === 'slug.invalid' ? 'slugInvalid' : 'slugTaken');
    const def = type.fields.find((f) => f.id === code);
    return tIssues('required', { field: def ? fieldLabel(entry.type, def) : code });
  };

  const doAct = (kind: 'entry.submit' | 'entry.approve' | 'entry.publish' | 'entry.unschedule' | 'entry.unpublish' | 'entry.discard' | 'entry.save', msg: string) => {
    act({ type: kind, id: entry.id });
    toast(msg);
  };

  const tabs: { id: Tab; show: boolean }[] = [
    { id: 'preview', show: true },
    { id: 'seo', show: type.hasSeo },
    { id: 'api', show: true },
    { id: 'history', show: true },
    { id: 'ai', show: true },
  ];

  const workflow = () => {
    const s = entry.status;
    const blocked = issues.length > 0;
    const out: JSX.Element[] = [];
    if (editable) {
      const last = entry.versions[entry.versions.length - 1];
      const unsaved = !last || !sameContent(last.content, entry.content);
      out.push(
        <button key="save" type="button" className={btn.outline} disabled={!unsaved} title={unsaved ? undefined : t('noChangesSinceVersion')} onClick={() => doAct('entry.save', t('saved'))}>
          <CheckIcon className="w-4 h-4" />
          {t('saveVersion')}
        </button>,
      );
    }
    if (s === 'draft') {
      out.push(
        <button key="submit" type="button" className={btn.primary} disabled={blocked || !can(me.role, 'entry.submit')} onClick={() => doAct('entry.submit', t('submitted'))}>
          <PaperAirplaneIcon className="w-4 h-4" />
          {t('submit')}
        </button>,
      );
      if (changes && editable)
        out.push(
          <button key="discard" type="button" className={btn.outline} onClick={() => doAct('entry.discard', t('discarded'))}>
            <ArrowUturnLeftIcon className="w-4 h-4" />
            {t('discard')}
          </button>,
        );
    }
    if (s === 'review') {
      if (can(me.role, 'entry.approve')) {
        out.push(
          <button key="approve" type="button" className={btn.success} disabled={blocked} onClick={() => doAct('entry.approve', t('approved'))}>
            <CheckIcon className="w-4 h-4" />
            {t('approve')}
          </button>,
          <button key="changes" type="button" className={btn.outline} onClick={() => setRequesting(true)}>
            {t('requestChanges')}
          </button>,
        );
      }
    }
    if (s === 'approved' || s === 'scheduled') {
      if (can(me.role, 'entry.publish')) {
        out.push(
          <button key="publish" type="button" className={btn.primary} disabled={blocked} onClick={() => doAct('entry.publish', t('published'))}>
            <CloudArrowUpIcon className="w-4 h-4" />
            {t('publishNow')}
          </button>,
        );
        if (s === 'approved')
          out.push(
            <button key="schedule" type="button" className={btn.outline} disabled={blocked} onClick={() => setScheduling(true)}>
              <CalendarDaysIcon className="w-4 h-4" />
              {t('scheduleBtn')}
            </button>,
          );
        else
          out.push(
            <button key="unschedule" type="button" className={btn.outline} onClick={() => doAct('entry.unschedule', t('unscheduled'))}>
              {t('unschedule')}
            </button>,
          );
      }
    }
    if (entry.live && can(me.role, 'entry.unpublish')) {
      out.push(
        <button key="unpublish" type="button" className={btn.outline} onClick={() => doAct('entry.unpublish', t('unpublished'))}>
          {t('unpublish')}
        </button>,
      );
    }
    if (canDelete(me.role, entry, me.id)) {
      out.push(
        <button key="delete" type="button" className={btn.ghost} onClick={() => setDeleting(true)} aria-label={t('delete')} title={t('delete')}>
          <TrashIcon className="w-5 h-5" />
        </button>,
      );
    }
    return out;
  };

  const waitingNote =
    entry.status === 'review' && !can(me.role, 'entry.approve')
      ? t('waitingApproval', { role: roleName })
      : (entry.status === 'approved' || entry.status === 'scheduled') && !can(me.role, 'entry.publish')
        ? t('waitingPublish', { role: roleName })
        : null;

  return (
    <div className="space-y-4">
      <button type="button" className="inline-flex items-center gap-1 text-sm text-pink-700 dark:text-pink-300 hover:underline" onClick={() => go('entries')}>
        <ArrowLeftIcon className="w-4 h-4" />
        {t('back')}
      </button>

      <div className={`${card} p-4 space-y-3`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <TypeBadge type={entry.type} />
              <StatusBadge entry={entry} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white break-words">{titleOf(entry, entry.content, locale) || t('untitled')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('meta', { author: person(entry.authorId), editor: person(entry.updatedBy), date: formatDateTime(entry.updatedAt, locale) })}
              {entry.publishedAt && ` · ${t('publishedOn', { date: formatDateTime(entry.publishedAt, locale) })}`}
              {entry.status === 'scheduled' && entry.scheduledAt && ` · ${t('scheduledFor', { date: formatDateTime(entry.scheduledAt, locale) })}`}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="group" aria-label={t('contentLanguage')}>
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={locale === l}
                onClick={() => setContentLocale(l)}
                className={`px-3 py-1.5 text-xs font-semibold ${locale === l ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
              >
                {l.toUpperCase()}
                {l === 'en' && pending.length > 0 && <span className="ml-1 opacity-80">· {pending.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">{workflow()}</div>

        {!editable && (
          <Note tone="warn">
            {t('readOnly', { role: roleName, status: tStatus(entry.status) })}
          </Note>
        )}
        {waitingNote && <Note>{waitingNote}</Note>}
        {entry.reviewNote && entry.status === 'draft' && <Note tone="warn">{t('reviewNote', { note: entry.reviewNote })}</Note>}
        {changes && entry.status !== 'published' && <Note>{t('changesNote')}</Note>}
        {issues.length > 0 && (entry.status === 'draft' || entry.status === 'review' || entry.status === 'approved') && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            <p className="font-semibold flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {t('issuesTitle')}
            </p>
            <ul className="list-disc pl-5 mt-1">
              {issues.map((c) => (
                <li key={c}>{issueText(c)}</li>
              ))}
            </ul>
          </div>
        )}
        {locale === 'en' && pending.length > 0 && <Note>{t('translationPending', { n: pending.length })}</Note>}
      </div>

      <div className="grid xl:grid-cols-2 gap-4 items-start">
        <section className={`${card} p-4 space-y-4 min-w-0`} aria-label={t('formLabel')}>
          <div>
            <label htmlFor="cms-slug" className={labelCls}>
              {t('slug')}
            </label>
            <div className="flex gap-2">
              <input id="cms-slug" value={entry.content.slug} readOnly={!editable} onChange={(e) => edit((c) => ({ ...c, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className={`${inputCls} font-mono`} />
              {editable && (
                <button type="button" className={btn.small} onClick={() => edit((c) => ({ ...c, slug: slugify(titleOf(entry, c, 'es')) || c.slug }))}>
                  {t('slugFromTitle')}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('slugPath', { path: pathOf(entry.type, entry.content.slug) })}</p>
          </div>
          {type.fields
            .filter((d) => d.kind !== 'blocks')
            .map((def) => (
              <FieldInput key={def.id} type={entry.type} def={def} value={entry.content.fields[def.id]} locale={locale} readOnly={!editable} onChange={(v) => setField(def.id, v)} />
            ))}
          {type.fields.some((d) => d.kind === 'blocks') && (
            <div>
              <p className={labelCls}>
                {fieldLabel(entry.type, type.fields.find((d) => d.kind === 'blocks')!)} ({locale.toUpperCase()})
              </p>
              <BlocksEditor blocks={entry.content.blocks} locale={locale} readOnly={!editable} onChange={(blocks) => edit((c) => ({ ...c, blocks }))} />
            </div>
          )}
        </section>

        <section className={`${card} p-4 min-w-0`} aria-label={t('panelLabel')}>
          <div className="flex gap-1 overflow-x-auto mb-4 -mx-1 px-1" role="tablist" aria-label={t('panelLabel')}>
            {tabs
              .filter((x) => x.show)
              .map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === x.id}
                  onClick={() => setTab(x.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === x.id ? 'bg-pink-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {t(`tabs.${x.id}`)}
                </button>
              ))}
          </div>
          {tab === 'preview' && (
            <div className="space-y-3">
              {entry.live && (
                <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="group" aria-label={t('previewVersion')}>
                  {(['draft', 'live'] as const).map((m) => (
                    <button key={m} type="button" aria-pressed={previewMode === m} onClick={() => setPreviewMode(m)} className={`px-3 py-1.5 text-xs font-semibold ${previewMode === m ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
                      {t(`previewModes.${m}`)}
                    </button>
                  ))}
                </div>
              )}
              <SitePreview entry={entry} content={previewMode === 'live' && entry.live ? entry.live : entry.content} mode={previewMode === 'live' && entry.live ? 'live' : 'draft'} />
            </div>
          )}
          {tab === 'seo' && <SeoPanel entry={entry} readOnly={!editable} onSeo={(key, v) => edit((c) => ({ ...c, seo: { ...c.seo, [key]: v } }))} />}
          {tab === 'api' && <EntryApiPanel entry={entry} />}
          {tab === 'history' && <HistoryPanel entry={entry} />}
          {tab === 'ai' && <AiPanel entry={entry} readOnly={!editable} onField={(fid, v) => setField(fid, v)} onBlockHtml={setBlockHtml} />}
        </section>
      </div>

      {scheduling && <ScheduleModal entry={entry} onClose={() => setScheduling(false)} />}
      {requesting && (
        <Modal
          title={t('requestTitle')}
          onClose={() => setRequesting(false)}
          size="sm"
          labelId="cms-request-changes"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setRequesting(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.primary}
                onClick={() => {
                  act({ type: 'entry.requestChanges', id: entry.id, note });
                  toast(t('changesRequested'));
                  setNote('');
                  setRequesting(false);
                }}
              >
                {t('send')}
              </button>
            </>
          }
        >
          <label htmlFor="cms-request-note" className={labelCls}>
            {t('requestNote')}
          </label>
          <textarea id="cms-request-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder={t('requestPlaceholder')} />
        </Modal>
      )}
      {deleting && (
        <Modal
          title={t('deleteTitle')}
          onClose={() => setDeleting(false)}
          size="sm"
          labelId="cms-delete-current"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setDeleting(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  act({ type: 'entry.delete', id: entry.id });
                  toast(t('deleted'));
                  setDeleting(false);
                  go('entries');
                }}
              >
                {t('deleteConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('deleteBody', { title: titleOf(entry, entry.content, locale) })}</p>
        </Modal>
      )}
    </div>
  );
}
