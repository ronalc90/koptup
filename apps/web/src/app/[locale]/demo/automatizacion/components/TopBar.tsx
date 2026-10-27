'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  BookmarkSquareIcon,
  CheckIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  Squares2X2Icon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { fmtNit } from '../lib/format';
import { COMPANY_NIT } from '../lib/samples';
import { useAutomation } from '../lib/store';
import { ConfirmDialog, PromptDialog, btnGhost, btnPrimary, focusRing } from './ui';

interface Props {
  onOpenPalette: () => void;
  onOpenInspector: () => void;
  onOpenTemplates: () => void;
  onSaveVersion: () => void;
}

export default function TopBar({ onOpenPalette, onOpenInspector, onOpenTemplates, onSaveVersion }: Props) {
  const t = useTranslations('demoAutomation');
  const { s, wf, text, dirty, live, wfSamples, sampleId, setSampleId, run, cancel, setActive, renameWorkflow, duplicateWorkflow, deleteWorkflow, toast } = useAutomation();
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"], [role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const itemCls = `flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-secondary-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

  return (
    <header className="relative z-30 border-b border-secondary-800 bg-secondary-900/90">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-5">
        <button type="button" onClick={onOpenPalette} className={`rounded-md p-1.5 hover:bg-secondary-800 lg:hidden ${focusRing}`} aria-label={t('palette.open')}>
          <Bars3Icon className="h-5 w-5 text-secondary-300" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-orange-500/20">
            <Squares2X2Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-white">{t('pageTitle')}</h1>
            <p className="hidden truncate text-[11px] text-secondary-400 sm:block">
              {text.company} · NIT {fmtNit(COMPANY_NIT)}
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef} onKeyDown={onMenuKey}>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menu}
            disabled={live.running}
            className={`${btnGhost} max-w-[260px]`}
          >
            <span className="text-secondary-400">{t('flows.label')}</span>
            <span className="truncate font-medium text-white">{wf.name}</span>
            <ChevronDownIcon className="h-3 w-3 shrink-0" />
          </button>
          {menu && (
            <div role="menu" aria-label={t('flows.menu')} className="absolute left-0 top-full z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-secondary-700 bg-secondary-900 p-1 shadow-xl">
              <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-secondary-500">{t('flows.yours', { count: s.workflows.length })}</p>
              {s.workflows.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={w.id === wf.id}
                  onClick={() => {
                    setActive(w.id);
                    setMenu(false);
                  }}
                  className={`${itemCls} ${w.id === wf.id ? 'text-primary-200' : 'text-secondary-200'}`}
                >
                  <CheckIcon className={`h-3.5 w-3.5 shrink-0 ${w.id === wf.id ? '' : 'invisible'}`} />
                  <span className="min-w-0 flex-1 truncate">{w.name}</span>
                  <span className="shrink-0 text-[10px] text-secondary-500">{t('flows.steps', { count: w.steps.length })}</span>
                </button>
              ))}
              <div className="my-1 border-t border-secondary-800" />
              <button type="button" role="menuitem" onClick={() => { setMenu(false); setRenaming(true); }} className={`${itemCls} text-secondary-200`}>
                <PencilIcon className="h-3.5 w-3.5" />
                {t('flows.rename')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  duplicateWorkflow(wf.id);
                  toast(t('flows.duplicated', { name: wf.name }));
                }}
                className={`${itemCls} text-secondary-200`}
              >
                <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                {t('flows.duplicate')}
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); onOpenTemplates(); }} className={`${itemCls} text-secondary-200`}>
                <PlusIcon className="h-3.5 w-3.5" />
                {t('flows.new')}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={s.workflows.length <= 1}
                onClick={() => {
                  setMenu(false);
                  setDeleting(true);
                }}
                className={`${itemCls} text-rose-200`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {t('flows.delete')}
              </button>
            </div>
          )}
        </div>

        <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold md:inline ${dirty ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
          {dirty ? t('versions.unsaved') : t('versions.saved', { n: wf.versions[wf.versions.length - 1]?.n ?? 0 })}
        </span>

        <div className="hidden flex-1 lg:block" />

        <button type="button" onClick={onSaveVersion} disabled={!dirty || live.running} className={btnGhost} title={t('versions.save')}>
          <BookmarkSquareIcon className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">{t('versions.save')}</span>
          <span className="sr-only xl:hidden">{t('versions.save')}</span>
        </button>

        <button type="button" onClick={onOpenTemplates} disabled={live.running} className={btnGhost}>
          <Squares2X2Icon className="h-3.5 w-3.5" />
          <span>{t('templates.button')}</span>
        </button>

        <div className="flex min-w-0 items-center gap-1.5">
          <label htmlFor="run-sample" className="sr-only">
            {t('run.sample')}
          </label>
          <select
            id="run-sample"
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
            disabled={live.running || !wfSamples.length}
            title={t('run.sample')}
            className="min-w-0 max-w-[180px] rounded-md border border-secondary-700 bg-secondary-950 px-2 py-1.5 text-xs text-secondary-100 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60 sm:max-w-[260px]"
          >
            {wfSamples.length === 0 && <option value="">{t('run.noSamples')}</option>}
            {wfSamples.map((x) => (
              <option key={x.id} value={x.id}>
                {t(x.labelKey)}
              </option>
            ))}
          </select>
          {live.running ? (
            <button type="button" onClick={cancel} className={`${btnPrimary} bg-rose-600 hover:bg-rose-500`}>
              <StopIcon className="h-3.5 w-3.5" />
              {t('run.stop')}
            </button>
          ) : (
            <button type="button" onClick={() => run()} disabled={!wfSamples.length} className={btnPrimary}>
              <PlayIcon className="h-3.5 w-3.5" />
              {t('run.button')}
            </button>
          )}
        </div>

        <button type="button" onClick={onOpenInspector} className={`rounded-md p-1.5 hover:bg-secondary-800 lg:hidden ${focusRing}`} aria-label={t('inspector.open')}>
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-secondary-300" />
        </button>
      </div>

      <PromptDialog
        open={renaming}
        title={t('flows.renameTitle')}
        label={t('flows.nameLabel')}
        initial={wf.name}
        confirmLabel={t('flows.rename')}
        onClose={() => setRenaming(false)}
        onConfirm={(name) => renameWorkflow(wf.id, name)}
      />
      <ConfirmDialog
        open={deleting}
        title={t('flows.deleteTitle', { name: wf.name })}
        body={t('flows.deleteBody')}
        confirmLabel={t('flows.delete')}
        danger
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          const name = wf.name;
          deleteWorkflow(wf.id);
          toast(t('flows.deleted', { name }), 'info');
        }}
      />
    </header>
  );
}
