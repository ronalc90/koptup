'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowUpRightIcon,
  ArrowUturnLeftIcon,
  BoltIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { highlightSpans } from '../lib/classifier';
import { isAutomatic } from '../lib/logic';
import { POLICIES } from '../lib/samples';
import { useModeration, type CaseView } from '../lib/store';
import { CATEGORIES, type ContentType, type Label, type Measure, type Team } from '../lib/types';
import AiExplain from './AiExplain';
import { CategoryChip, ConfidenceBar, Field, Highlighted, Modal, PriorityChip, SectionTitle, chipBtn, focusRing, inputCls, labelCls, selectCls } from './ui';
import { useText } from './useText';

type Dialog = { kind: 'reject' | 'escalate' | 'recategorize'; id: string } | null;

function RouteChip({ v }: { v: CaseView }) {
  const t = useTranslations('demoModeration');
  const auto = isAutomatic(v.route.action);
  const text = v.corrected
    ? t('queue.routeCorrected')
    : v.route.ruleNo
      ? t('queue.routeRule', { n: v.route.ruleNo, action: t(`actions.${v.route.action}`) })
      : t('queue.routeDefault');
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
        auto ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200' : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300'
      }`}
    >
      {auto && <BoltIcon className="h-3 w-3" aria-hidden />}
      {text}
    </span>
  );
}

function Preview({ v, lines = 1 }: { v: CaseView; lines?: 1 | 2 }) {
  const t = useTranslations('demoModeration.queue');
  const { isRevealed, toggleReveal } = useModeration();
  const visible = isRevealed(v);
  return (
    <div className="flex min-w-0 items-start gap-2">
      <p
        className={`min-w-0 text-secondary-800 dark:text-secondary-200 ${lines === 1 ? 'line-clamp-1' : 'line-clamp-2'} ${visible ? '' : 'select-none blur-sm'}`}
        aria-hidden={!visible}
      >
        {v.text}
      </p>
      {!visible && <span className="sr-only">{t('blurredSr')}</span>}
      {v.sensitive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleReveal(v.id);
          }}
          className={`inline-flex shrink-0 items-center gap-1 rounded text-xs text-secondary-500 hover:text-secondary-900 dark:hover:text-white ${focusRing}`}
        >
          {visible ? <EyeSlashIcon className="h-4 w-4" aria-hidden /> : <EyeIcon className="h-4 w-4" aria-hidden />}
          {visible ? t('hide') : t('show')}
        </button>
      )}
    </div>
  );
}

function RowActions({ v, onDialog, labels = false }: { v: CaseView; onDialog: (d: Dialog) => void; labels?: boolean }) {
  const t = useTranslations('demoModeration.queue');
  const { approve, toast } = useModeration();
  const btn = `inline-flex items-center gap-1 rounded-md p-1.5 text-xs font-medium ${focusRing}`;
  const label = (key: string) => (labels ? <span>{t(key)}</span> : null);
  return (
    <div className={`flex gap-1 ${labels ? 'flex-wrap justify-between' : 'justify-end'}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => {
          approve(v.id);
          toast(t('approved', { id: v.id }));
        }}
        className={`${btn} text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30`}
        title={t('approve')}
        aria-label={t('approveCase', { id: v.id })}
      >
        <CheckIcon className="h-4 w-4" aria-hidden />
        {label('approve')}
      </button>
      <button type="button" onClick={() => onDialog({ kind: 'reject', id: v.id })} className={`${btn} text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30`} title={t('reject')} aria-label={t('rejectCase', { id: v.id })}>
        <XMarkIcon className="h-4 w-4" aria-hidden />
        {label('reject')}
      </button>
      <button
        type="button"
        onClick={() => onDialog({ kind: 'escalate', id: v.id })}
        className={`${btn} text-orange-700 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/30`}
        title={t('escalate')}
        aria-label={t('escalateCase', { id: v.id })}
      >
        <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
        {label('escalate')}
      </button>
      <button
        type="button"
        onClick={() => onDialog({ kind: 'recategorize', id: v.id })}
        className={`${btn} text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700`}
        title={t('recategorize')}
        aria-label={t('recategorizeCase', { id: v.id })}
      >
        <PencilSquareIcon className="h-4 w-4" aria-hidden />
        {label('recategorizeShort')}
      </button>
    </div>
  );
}

function Detail({ v, onDialog }: { v: CaseView; onDialog: (d: Dialog) => void }) {
  const t = useTranslations('demoModeration');
  const { lang, isRevealed, toggleReveal, approve, toast } = useModeration();
  const { ago, accountAge } = useText();
  const visible = isRevealed(v);
  const spans = highlightSpans(v.cls, v.label);
  const signals = v.label === 'none' ? [] : v.cls.hits.filter((h) => v.cls.signalsBy[v.label as (typeof CATEGORIES)[number]].includes(h.id));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-secondary-900 dark:text-white">{t('queue.details', { id: v.id })}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityChip priority={v.priority} />
          <CategoryChip label={v.label} />
        </div>
      </div>

      <div className="rounded-lg bg-secondary-50 p-3 text-sm text-secondary-800 dark:bg-secondary-800/60 dark:text-secondary-100">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t(`contentKind.${v.type}`)}</p>
        <p className={visible ? '' : 'select-none blur-sm'} aria-hidden={!visible}>
          <Highlighted text={v.text} spans={visible ? spans : []} />
        </p>
        {!visible && <span className="sr-only">{t('queue.blurredSr')}</span>}
        {v.sensitive && (
          <button type="button" onClick={() => toggleReveal(v.id)} className={`mt-2 inline-flex items-center gap-1 rounded text-xs text-primary-700 dark:text-primary-300 ${focusRing}`}>
            {visible ? <EyeSlashIcon className="h-4 w-4" aria-hidden /> : <EyeIcon className="h-4 w-4" aria-hidden />}
            {visible ? t('queue.hide') : t('queue.show')}
            <span className="ml-1 text-secondary-500">· {t('queue.blurNote')}</span>
          </button>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <p className="flex flex-wrap items-center gap-2 text-secondary-700 dark:text-secondary-300">
          <span className="font-medium">{v.corrected ? t('queue.correctedConfidence') : t('queue.confidence')}</span>
          <ConfidenceBar score={v.score} />
        </p>
        <p className="flex flex-wrap items-center gap-2 text-secondary-700 dark:text-secondary-300">
          <span className="font-medium">{t('queue.rulesSay')}</span>
          <RouteChip v={v} />
        </p>
      </div>

      {v.label !== 'none' && (
        <div className="text-sm">
          <p className="font-medium text-secondary-800 dark:text-secondary-100">{t('queue.why')}</p>
          {visible ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-secondary-700 dark:text-secondary-300">
              {signals.map((h) => (
                <li key={h.id}>
                  {t(`signals.${h.id}`)}: <span className="italic">«{h.fragments[0]}»</span>
                </li>
              ))}
              {!signals.length && <li>{t('queue.whyCorrected')}</li>}
            </ul>
          ) : (
            <p className="mt-1 text-secondary-500 dark:text-secondary-400">{t('queue.whyHidden')}</p>
          )}
          <p className="mt-2 font-medium text-secondary-800 dark:text-secondary-100">{t('queue.policy')}</p>
          <p className="mt-0.5 text-secondary-700 dark:text-secondary-300">{POLICIES[v.label][lang]}</p>
        </div>
      )}
      {v.label === 'none' && <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('queue.noViolation')}</p>}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <Field label={t('queue.user')} value={v.user} />
        <Field label={t('queue.channel')} value={t(`channels.${v.channel}`)} />
        <Field label={t('queue.reporter')} value={t(`reporters.${v.reporter}`)} />
        <Field label={t('queue.received')} value={ago(v.receivedAt)} />
        <Field label={t('queue.strikes')} value={String(v.strikes)} />
        <Field label={t('queue.accountAge')} value={accountAge(v.accountAgeDays)} />
      </dl>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            approve(v.id);
            toast(t('queue.approved', { id: v.id }));
          }}
          className="gap-1 px-2"
        >
          <CheckIcon className="h-4 w-4" aria-hidden />
          {t('queue.approve')}
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDialog({ kind: 'reject', id: v.id })} className="gap-1 px-2">
          <XMarkIcon className="h-4 w-4" aria-hidden />
          {t('queue.rejectEllipsis')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onDialog({ kind: 'escalate', id: v.id })} className="col-span-2 gap-1 px-2">
          <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
          {t('queue.escalateEllipsis')}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => onDialog({ kind: 'recategorize', id: v.id })}
        className={`inline-flex items-center gap-1 rounded text-sm font-medium text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white ${focusRing}`}
      >
        <PencilSquareIcon className="h-4 w-4" aria-hidden />
        {t('queue.recategorizeEllipsis')}
      </button>
      <AiExplain text={v.text} compact />
    </div>
  );
}

function DecisionDialogs({ dialog, onClose }: { dialog: Dialog; onClose: () => void }) {
  const t = useTranslations('demoModeration');
  const { views, reject, escalate, recategorize, toast } = useModeration();
  const v = dialog ? views.find((x) => x.id === dialog.id) : undefined;
  const [policy, setPolicy] = useState<Label>('none');
  const [measure, setMeasure] = useState<Measure>('removeWarn');
  const [team, setTeam] = useState<Team>('lead');
  const [to, setTo] = useState<Label>('none');
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!v || !dialog) return;
    setPolicy(v.label);
    setMeasure('removeWarn');
    setTeam(v.label === 'minors' ? 'minors' : v.label === 'scam' || v.label === 'illegalLending' || v.label === 'impersonation' ? 'fraud' : v.label === 'hate' || v.label === 'selfHarm' ? 'legal' : 'lead');
    setTo(v.label);
    setNote('');
    setError(false);
    // Solo al abrir el diálogo de un caso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog?.kind, dialog?.id]);

  if (!dialog || !v) return null;
  const close = () => onClose();
  const labels: Label[] = [...CATEGORIES, 'none'];
  const noteField = (
    <label className="block">
      <span className={labelCls}>{t('decision.note')}</span>
      <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} rows={2} className={inputCls} placeholder={t('decision.notePlaceholder')} />
    </label>
  );

  if (dialog.kind === 'reject') {
    return (
      <Modal open onClose={close} title={t('decision.rejectTitle', { id: v.id })}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className={labelCls}>{t('decision.policy')}</span>
            <select data-autofocus value={policy} onChange={(e) => setPolicy(e.target.value as Label)} className={selectCls}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}.name`)}
                </option>
              ))}
              <option value="none">{t('decision.choosePolicy')}</option>
            </select>
          </label>
          <fieldset>
            <legend className={labelCls}>{t('decision.measure')}</legend>
            <div className="space-y-1.5">
              {(['remove', 'removeWarn', 'suspend'] as Measure[]).map((m) => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="measure" checked={measure === m} onChange={() => setMeasure(m)} className="h-4 w-4 accent-red-600" />
                  <span className="text-secondary-800 dark:text-secondary-100">{t(`measures.${m}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {noteField}
          {error && (
            <p role="alert" className="text-red-700 dark:text-red-300">
              {t('decision.policyRequired')}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (policy === 'none') {
                  setError(true);
                  return;
                }
                reject(v.id, { policy, measure, note: note.trim() });
                toast(t('queue.rejected', { id: v.id }));
                close();
              }}
            >
              {t('decision.confirmReject')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (dialog.kind === 'escalate') {
    return (
      <Modal open onClose={close} title={t('decision.escalateTitle', { id: v.id })}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className={labelCls}>{t('decision.team')}</span>
            <select data-autofocus value={team} onChange={(e) => setTeam(e.target.value as Team)} className={selectCls}>
              {(['minors', 'legal', 'fraud', 'lead'] as Team[]).map((x) => (
                <option key={x} value={x}>
                  {t(`teams.${x}`)}
                </option>
              ))}
            </select>
          </label>
          {noteField}
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('decision.escalateNote')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                escalate(v.id, { team, note: note.trim() });
                toast(t('queue.escalated', { id: v.id, team: t(`teams.${team}`) }));
                close();
              }}
            >
              {t('decision.confirmEscalate')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={close} title={t('decision.recategorizeTitle', { id: v.id })}>
      <div className="space-y-3 text-sm">
        <p className="text-secondary-600 dark:text-secondary-400">{t('decision.recategorizeHint')}</p>
        <label className="block">
          <span className={labelCls}>{t('decision.newCategory')}</span>
          <select data-autofocus value={to} onChange={(e) => setTo(e.target.value as Label)} className={selectCls}>
            {labels.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}.name`)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={to === v.label}
            onClick={() => {
              recategorize(v.id, to);
              toast(t('queue.recategorized', { id: v.id, category: t(`categories.${to}.name`) }));
              close();
            }}
          >
            {t('decision.confirmRecategorize')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Resolved() {
  const t = useTranslations('demoModeration');
  const { resolved, reopen, simulateAppeal, s, toast, go } = useModeration();
  const { ago } = useText();
  const [showAll, setShowAll] = useState(false);
  if (!resolved.length) return null;
  const list = showAll ? resolved : resolved.slice(0, 6);
  const statusText = (v: CaseView) => {
    const d = v.decision;
    if (v.status === 'auto') return t('queue.statusAuto', { n: d?.ruleNo ?? 0, action: t(`actions.${d?.ruleAction ?? 'humanReview'}`) });
    return t(`queue.status.${v.status}`);
  };
  return (
    <div className="mt-6 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
      <h3 className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('queue.resolvedTitle', { n: resolved.length })}</h3>
      <p className="mb-3 text-xs text-secondary-500 dark:text-secondary-400">{t('queue.resolvedHint')}</p>
      <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
        {list.map((v) => {
          const appealed = s.appeals.some((a) => a.caseRef === v.id);
          return (
            <li key={v.id} className="flex flex-col gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-secondary-600 dark:text-secondary-400">{v.id}</span>
                <CategoryChip label={v.decision?.policy ?? v.label} />
                <span className="text-secondary-800 dark:text-secondary-100">{statusText(v)}</span>
                <span className="text-xs text-secondary-500">{v.decision ? ago(v.decision.at) : ''}</span>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {v.status === 'rejected' && !appealed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const id = simulateAppeal(v.id);
                      if (id) toast(t('queue.appealCreated', { id }), 'info');
                    }}
                  >
                    {t('queue.simulateAppeal')}
                  </Button>
                )}
                {appealed && (
                  <Button size="sm" variant="ghost" onClick={() => go('appeals')}>
                    {t('queue.seeAppeal')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() => {
                    reopen(v.id);
                    toast(t('queue.reopened', { id: v.id }), 'info');
                  }}
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />
                  {t('queue.reopen')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {resolved.length > 6 && (
        <button type="button" onClick={() => setShowAll((x) => !x)} className={`mt-2 rounded text-xs font-medium text-primary-700 dark:text-primary-300 ${focusRing}`}>
          {showAll ? t('common.showLess') : t('common.showAll', { n: resolved.length })}
        </button>
      )}
    </div>
  );
}

export default function QueueTab() {
  const t = useTranslations('demoModeration');
  const { queue, selectedId, select, applyRules, toast, hiddenByRotation, setRotation, go, s, setPlatform, pauseUntil } = useModeration();
  const [type, setType] = useState<ContentType | 'all'>('all');
  const [dialog, setDialog] = useState<Dialog>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => queue.filter((v) => type === 'all' || v.type === type), [queue, type]);
  const selected = items.find((v) => v.id === selectedId) ?? items[0] ?? null;
  const autoCount = queue.filter((v) => !v.corrected && isAutomatic(v.route.action)).length;

  const open = (id: string) => {
    select(id);
    if (window.innerWidth < 1024) window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // Cuenta el tiempo de decisión desde que el caso se ve en el detalle.
  useEffect(() => {
    if (selected && selected.id !== selectedId) select(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <section aria-hidden={pauseUntil !== null} className={pauseUntil !== null ? 'pointer-events-none select-none blur-md' : ''}>
      <SectionTitle
        title={t('queue.title')}
        subtitle={t('queue.subtitle')}
        actions={
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('queue.typeFilter')}>
              {(['all', 'text', 'image', 'video', 'audio'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={type === f}
                  onClick={() => setType(f)}
                  className={`${chipBtn} ${
                    type === f
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-400 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300'
                  }`}
                >
                  {f === 'all' ? t('queue.allTypes') : t(`types.${f}`)}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={autoCount === 0}
              title={t('queue.applyHint')}
              onClick={() => {
                const n = applyRules();
                toast(t('queue.applied', { n }), n ? 'ok' : 'info');
              }}
            >
              <BoltIcon className="h-4 w-4" aria-hidden />
              {t('queue.apply', { n: autoCount })}
            </Button>
          </>
        }
      />

      {hiddenByRotation > 0 && (
        <p className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
          {t('queue.rotationNotice', { n: hiddenByRotation })}
          <button type="button" onClick={() => setRotation(false)} className={`rounded font-medium underline ${focusRing}`}>
            {t('wellness.rotationOff')}
          </button>
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-secondary-300 bg-white p-8 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <p className="font-medium text-secondary-800 dark:text-secondary-100">{type === 'all' ? t('queue.emptyTitle') : t('queue.emptyType')}</p>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">{t('queue.emptyText')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => go('classifier')}>
              {t('queue.emptyTry')}
            </Button>
            {s.platform !== 'all' && (
              <Button size="sm" variant="outline" onClick={() => setPlatform('all')}>
                {t('queue.emptyAll')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {/* Escritorio: tabla */}
            <div className="hidden overflow-hidden rounded-xl border border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900 md:block">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-secondary-50 text-secondary-600 dark:bg-secondary-800/60 dark:text-secondary-300">
                  <tr>
                    <th className="w-[5.5rem] px-3 py-2 text-left font-medium">{t('queue.priority')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('queue.content')}</th>
                    <th className="w-[10.5rem] px-3 py-2 text-left font-medium">{t('queue.classification')}</th>
                    <th className="w-[8.5rem] px-3 py-2 text-right font-medium">{t('queue.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((v) => {
                    const isSel = selected?.id === v.id;
                    return (
                      <tr
                        key={v.id}
                        onClick={() => open(v.id)}
                        className={`cursor-pointer border-t border-secondary-100 align-top transition-colors dark:border-secondary-800 ${
                          isSel ? 'bg-primary-50/70 dark:bg-primary-900/20' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/40'
                        }`}
                      >
                        <td className="px-3 py-3">
                          <PriorityChip priority={v.priority} />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              open(v.id);
                            }}
                            aria-current={isSel ? 'true' : undefined}
                            className={`mb-1 flex items-center gap-2 rounded text-xs text-secondary-500 dark:text-secondary-400 ${focusRing}`}
                          >
                            <span className="font-mono">{v.id}</span>
                            <span>· {t(`types.${v.type}`)}</span>
                            <span className="sr-only">{t('queue.openCase')}</span>
                          </button>
                          <Preview v={v} />
                          <div className="mt-1.5">
                            <RouteChip v={v} />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-start gap-1.5">
                            <CategoryChip label={v.label} wrap />
                            <ConfidenceBar score={v.score} />
                            {v.corrected && <span className="text-[11px] text-secondary-500">{t('queue.correctedBadge')}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <RowActions v={v} onDialog={setDialog} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Celular: tarjetas con las acciones a la vista */}
            <ul className="space-y-3 md:hidden">
              {items.map((v) => {
                const isSel = selected?.id === v.id;
                return (
                  <li
                    key={v.id}
                    className={`rounded-xl border bg-white p-3 dark:bg-secondary-900 ${isSel ? 'border-primary-400 ring-1 ring-primary-400' : 'border-secondary-200 dark:border-secondary-700'}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <PriorityChip priority={v.priority} />
                      <CategoryChip label={v.label} />
                      <ConfidenceBar score={v.score} />
                    </div>
                    <Preview v={v} lines={2} />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <RouteChip v={v} />
                      <button type="button" onClick={() => open(v.id)} className={`rounded text-xs font-medium text-primary-700 underline dark:text-primary-300 ${focusRing}`}>
                        {t('queue.openDetail', { id: v.id })}
                      </button>
                    </div>
                    <div className="mt-2 border-t border-secondary-100 pt-2 dark:border-secondary-800">
                      <RowActions v={v} onDialog={setDialog} labels />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div ref={detailRef} className="scroll-mt-4 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
            {selected ? <Detail v={selected} onDialog={setDialog} /> : <p className="text-sm text-secondary-500">{t('queue.selectItem')}</p>}
          </div>
        </div>
      )}

      <Resolved />
      <DecisionDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </section>
  );
}
