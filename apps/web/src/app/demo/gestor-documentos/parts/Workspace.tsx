'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArchiveBoxIcon, ArrowPathIcon, DocumentIcon, ExclamationTriangleIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDocs } from '../lib/store';
import type { DocItem, Filters, SortKey, View } from '../lib/types';
import { downloadBlob, ruleFor } from '../lib/util';
import { allTags, selectDocs } from '../lib/view';
import AuditModal, { useInventoryRow } from './AuditModal';
import ClausesModal from './ClausesModal';
import { ConfirmDialog, NewFolderDialog, RenameDialog } from './Dialogs';
import DocGrid from './DocGrid';
import DocPanel from './DocPanel';
import OcrModal from './OcrModal';
import RetentionModal from './RetentionModal';
import SemanticModal from './SemanticModal';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import UploadArea, { AccessButtons, AccessCard } from './UploadArea';
import VersionsModal from './VersionsModal';
import { Drawer, btnSecondary, focusRing } from './ui';

type ConfirmState = { kind: 'trash' | 'destroy' | 'empty' | 'reset'; doc?: DocItem } | null;

const NO_FILTERS: Filters = { type: 'all', date: 'all', tag: '' };

export default function Workspace() {
  const t = useTranslations('demoDocs');
  const store = useDocs();
  const { ready, mode, hasSession, docs, serverStatus, serverError, reloadServer, now, folderLabel, retention, trash, destroy, emptyTrash, resetSample, toast, apiErrorText } = store;

  const [view, setView] = useState<View>('all');
  const [folder, setFolder] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocItem | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [retentionFocus, setRetentionFocus] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [ocrDoc, setOcrDoc] = useState<DocItem | null>(null);
  const [clausesDoc, setClausesDoc] = useState<DocItem | null>(null);
  const [versionsDoc, setVersionsDoc] = useState<DocItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { csv } = useInventoryRow();

  // Al cambiar de fuente se vuelve a la vista general.
  useEffect(() => {
    setView('all');
    setFolder('');
    setQuery('');
    setFilters(NO_FILTERS);
    setOpenId(null);
  }, [mode]);

  // Si la carpeta abierta deja de existir (p. ej. al restablecer), vuelve a "Todos".
  useEffect(() => {
    if (view === 'folder' && !store.folders.includes(folder)) {
      setView('all');
      setFolder('');
    }
  }, [view, folder, store.folders]);

  const visible = useMemo(() => selectDocs(docs, { view, folder, query, filters, sort, now }), [docs, view, folder, query, filters, sort, now]);
  const tags = useMemo(() => allTags(docs), [docs]);
  const openDoc = openId ? docs.find((d) => d.id === openId) ?? null : null;
  const trashCount = docs.filter((d) => d.deleted).length;
  const uploadFolder = view === 'folder' && folder ? folder : mode === 'sample' ? '@contracts' : 'General';

  const select = (v: View, f?: string) => {
    setView(v);
    setFolder(f || '');
    setMenuOpen(false);
  };

  const exportCsv = () => {
    downloadBlob(csv(visible.map((x) => x.doc)), `inventario-documentos-${now.slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    toast('success', t('toasts.exported', { count: visible.length }));
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      if (confirm.kind === 'trash' && confirm.doc) {
        if (await trash(confirm.doc)) setOpenId(null);
      } else if (confirm.kind === 'destroy' && confirm.doc) {
        if (await destroy(confirm.doc)) setOpenId(null);
      } else if (confirm.kind === 'empty') {
        await emptyTrash();
      } else if (confirm.kind === 'reset') {
        resetSample();
        setOpenId(null);
        select('all');
      }
    } finally {
      setConfirmBusy(false);
      setConfirm(null);
    }
  };

  const sidebar = (
    <Sidebar
      view={view}
      folder={folder}
      onSelect={select}
      onNewFolder={() => {
        setMenuOpen(false);
        setNewFolderOpen(true);
      }}
      onRetention={() => {
        setMenuOpen(false);
        setRetentionFocus('');
      }}
      onUpload={() => {
        setMenuOpen(false);
        inputRef.current?.click();
      }}
      onReset={() => {
        setMenuOpen(false);
        setConfirm({ kind: 'reset' });
      }}
    />
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-16 text-center sm:px-6" role="status">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('shell.loading')}</p>
      </div>
    );
  }

  if (mode === 'server' && !hasSession) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <AccessCard />
      </div>
    );
  }

  const folderRule = view === 'folder' ? ruleFor(retention, folder) : null;
  const emptyKey = query.trim() || filters.type !== 'all' || filters.date !== 'all' || filters.tag ? 'search' : view;

  let content: ReactNode;
  if (mode === 'server' && serverStatus !== 'ready' && serverStatus !== 'error') {
    content = (
      <div className="py-16 text-center" role="status">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('server.loading')}</p>
      </div>
    );
  } else if (mode === 'server' && serverStatus === 'error') {
    content = (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
        <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
        <p className="mt-2 font-semibold text-slate-900 dark:text-white">{t('server.errorTitle')}</p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{apiErrorText(serverError || 'server')}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {serverError === 'login' ? (
            <AccessButtons />
          ) : (
            <button type="button" onClick={reloadServer} className={btnSecondary}>
              <ArrowPathIcon className="h-4 w-4" />
              {t('server.retry')}
            </button>
          )}
        </div>
      </div>
    );
  } else {
    content = (
      <>
        {view === 'folder' && folderRule && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/40 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <ArchiveBoxIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-indigo-900 dark:text-indigo-200">{folderLabel(folder)}</p>
                <p className="text-xs text-indigo-800 dark:text-indigo-300">
                  {t('list.folderPolicy', { policy: t(`retention.policies.${folderRule.policy}`) })}
                  {folderRule.hold && (
                    <span className="ml-2 inline-flex items-center gap-1 font-semibold text-red-700 dark:text-red-300">
                      <LockClosedIcon className="h-3 w-3" />
                      {t('sidebar.holdBadge')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setRetentionFocus(folder)} className={`shrink-0 self-start rounded text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300 sm:self-auto ${focusRing}`}>
              {t('list.changeRetention')}
            </button>
          </div>
        )}
        {view === 'trash' && trashCount > 0 && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/40 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-orange-800 dark:text-orange-300">{t('list.trashNote')}</p>
            <button type="button" onClick={() => setConfirm({ kind: 'empty' })} className={`${btnSecondary} shrink-0 border-red-200 text-red-700 dark:border-red-900 dark:text-red-300`}>
              <TrashIcon className="h-4 w-4" />
              {t('list.emptyTrash')}
            </button>
          </div>
        )}
        {visible.length === 0 ? (
          <div className="py-12 text-center">
            <DocumentIcon className="mx-auto mb-3 h-16 w-16 text-slate-300 dark:text-slate-700" />
            <p className="text-slate-600 dark:text-slate-400">{mode === 'server' && docs.length === 0 && view === 'all' ? t('server.emptyText') : t(`list.empty.${emptyKey}`)}</p>
          </div>
        ) : (
          <DocGrid items={visible} trashView={view === 'trash'} onOpen={(d) => setOpenId(d.id)} onRename={setRenameDoc} onDestroy={(d) => setConfirm({ kind: 'destroy', doc: d })} />
        )}
      </>
    );
  }

  const confirmDoc = confirm?.doc;
  const heldInTrash = docs.filter((d) => d.deleted && ruleFor(retention, d.folder).hold).length;

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">{sidebar}</aside>
        <section aria-label={t('list.label')} className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <Toolbar
              query={query}
              onQuery={(q) => {
                setQuery(q);
                if (q.trim() && sort !== 'relevance') setSort('relevance');
              }}
              filters={filters}
              onFilters={setFilters}
              sort={sort}
              onSort={setSort}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((v) => !v)}
              tags={tags}
              resultCount={visible.length}
              onSemantic={() => query.trim() && setSemanticQuery(query.trim())}
              onExport={exportCsv}
              onAudit={() => setAuditOpen(true)}
              onMenu={() => setMenuOpen(true)}
              showSuggestions={!query}
            />
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <UploadArea inputRef={inputRef} targetFolder={uploadFolder} />
            {content}
          </div>
        </section>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} label={t('shell.menu')} side="left" widthCls="max-w-[300px]">
        {sidebar}
      </Drawer>

      <DocPanel
        doc={openDoc}
        onClose={() => setOpenId(null)}
        onOcr={setOcrDoc}
        onClauses={setClausesDoc}
        onVersions={setVersionsDoc}
        onRetention={(f) => setRetentionFocus(f)}
        onTrash={(d) => setConfirm({ kind: 'trash', doc: d })}
        onDestroy={(d) => setConfirm({ kind: 'destroy', doc: d })}
      />

      <OcrModal doc={ocrDoc} onClose={() => setOcrDoc(null)} />
      <ClausesModal doc={clausesDoc} onClose={() => setClausesDoc(null)} />
      <VersionsModal doc={versionsDoc} onClose={() => setVersionsDoc(null)} />
      <RetentionModal open={retentionFocus !== null} focus={retentionFocus || undefined} onClose={() => setRetentionFocus(null)} />
      <AuditModal open={auditOpen} onClose={() => setAuditOpen(false)} />
      <SemanticModal
        query={semanticQuery}
        onClose={() => setSemanticQuery(null)}
        onOpenDoc={(d) => {
          setSemanticQuery(null);
          setOpenId(d.id);
        }}
      />
      <RenameDialog doc={renameDoc} onClose={() => setRenameDoc(null)} />
      <NewFolderDialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreated={(name) => select('folder', name)} />

      <ConfirmDialog
        open={confirm?.kind === 'trash'}
        title={t('confirm.trashTitle')}
        confirmLabel={t('confirm.trashOk')}
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onClose={() => setConfirm(null)}
      >
        {t('confirm.trashText', { name: confirmDoc?.name || '' })}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm?.kind === 'destroy'}
        title={t('confirm.destroyTitle')}
        confirmLabel={t('confirm.destroyOk')}
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onClose={() => setConfirm(null)}
      >
        {mode === 'sample' ? t('confirm.destroyTextSample', { name: confirmDoc?.name || '' }) : t('confirm.destroyTextServer', { name: confirmDoc?.name || '' })}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm?.kind === 'empty'}
        title={t('confirm.emptyTitle')}
        confirmLabel={t('confirm.emptyOk')}
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onClose={() => setConfirm(null)}
      >
        <p>{t('confirm.emptyText', { count: trashCount - heldInTrash })}</p>
        {heldInTrash > 0 && <p className="mt-2">{t('confirm.emptyHeld', { count: heldInTrash })}</p>}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm?.kind === 'reset'}
        title={t('confirm.resetTitle')}
        confirmLabel={t('confirm.resetOk')}
        danger={false}
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onClose={() => setConfirm(null)}
      >
        {t('confirm.resetText')}
      </ConfirmDialog>
    </>
  );
}
