'use client';

/**
 * Estado de la demo. Dos fuentes con la misma interfaz:
 * - "sample": corpus de ejemplo armado en el navegador; los cambios del
 *   visitante (favoritos, nombres, carpetas, papelera) se guardan en
 *   localStorage y se pueden restablecer.
 * - "server": documentos de la cuenta con sesión, vía /api/documents.
 * Nada se calcula con la hora ni con localStorage durante el primer render:
 * todo se arma en un efecto (sin errores de hidratación).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import { asLoc, bogotaNow } from './dates';
import { buildSampleDocs, SAMPLE_FOLDERS, SAMPLE_RETENTION, type SampleOverlay } from './sample';
import * as server from './serverApi';
import { checkUpload, NO_RULE } from './util';
import type { DocItem, Loc, Mode, RetentionMap, RetentionRule, Stamp } from './types';

const STORAGE_KEY = 'koptup.demo.gestorDocumentos.v1';

interface Persisted {
  mode?: Mode;
  overlay: SampleOverlay;
  customFolders: Record<Mode, string[]>;
  retention: Record<Mode, RetentionMap>;
}

const EMPTY: Persisted = { overlay: {}, customFolders: { sample: [], server: [] }, retention: { sample: {}, server: {} } };

function readPersisted(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      mode: p.mode === 'server' || p.mode === 'sample' ? p.mode : undefined,
      overlay: p.overlay && typeof p.overlay === 'object' ? p.overlay : {},
      customFolders: {
        sample: Array.isArray(p.customFolders?.sample) ? p.customFolders!.sample.filter((x) => typeof x === 'string') : [],
        server: Array.isArray(p.customFolders?.server) ? p.customFolders!.server.filter((x) => typeof x === 'string') : [],
      },
      retention: {
        sample: p.retention?.sample && typeof p.retention.sample === 'object' ? p.retention.sample : {},
        server: p.retention?.server && typeof p.retention.server === 'object' ? p.retention.server : {},
      },
    };
  } catch {
    return EMPTY;
  }
}

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export type ServerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UploadState {
  index: number;
  total: number;
  name: string;
  pct: number;
  phase: 'upload' | 'process';
}

interface DocsContext {
  ready: boolean;
  loc: Loc;
  now: Stamp;
  hasSession: boolean;
  userName: string | null;
  mode: Mode;
  setMode: (m: Mode) => void;
  docs: DocItem[];
  serverStatus: ServerStatus;
  serverError: server.ApiErrorCode | null;
  reloadServer: () => void;
  folders: string[];
  folderCounts: Record<string, number>;
  folderLabel: (folder: string) => string;
  retention: RetentionMap;
  setRule: (folder: string, rule: RetentionRule) => void;
  resetRetention: () => void;
  busy: (id: string) => boolean;
  toggleFavorite: (doc: DocItem) => Promise<void>;
  rename: (doc: DocItem, name: string) => Promise<boolean>;
  move: (doc: DocItem, folder: string) => Promise<void>;
  trash: (doc: DocItem) => Promise<boolean>;
  restore: (doc: DocItem) => Promise<void>;
  destroy: (doc: DocItem) => Promise<boolean>;
  emptyTrash: () => Promise<void>;
  createFolder: (name: string) => 'empty' | 'exists' | 'tooLong' | null;
  upload: (files: File[], folder: string) => Promise<void>;
  uploading: UploadState | null;
  resetSample: () => void;
  toasts: Toast[];
  toast: (kind: ToastKind, text: string) => void;
  dismissToast: (id: number) => void;
  apiErrorText: (code: server.ApiErrorCode) => string;
}

const Ctx = createContext<DocsContext | null>(null);

export function useDocs(): DocsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDocs fuera de DocsProvider');
  return ctx;
}

export function DocsProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('demoDocs');
  const loc = asLoc(useLocale());
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Stamp>('2026-01-01T00:00:00');
  const [hasSession, setHasSession] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>('sample');
  const [persisted, setPersisted] = useState<Persisted>(EMPTY);
  const [serverDocs, setServerDocs] = useState<DocItem[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');
  const [serverError, setServerError] = useState<server.ApiErrorCode | null>(null);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState<UploadState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  // Arranque en el navegador: hora, sesión, preferencias guardadas.
  useEffect(() => {
    const p = readPersisted();
    const session = Boolean(Cookies.get('accessToken') || Cookies.get('refreshToken'));
    let name: string | null = null;
    try {
      const u = JSON.parse(window.localStorage.getItem('user') || 'null') as { name?: string; email?: string } | null;
      name = u?.name || u?.email || null;
    } catch {
      name = null;
    }
    setNow(bogotaNow());
    setHasSession(session);
    setUserName(name);
    setPersisted(p);
    setModeState(session && p.mode !== 'sample' ? 'server' : 'sample');
    setReady(true);
  }, []);

  const save = useCallback((updater: (p: Persisted) => Persisted) => {
    setPersisted((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* sin almacenamiento (modo privado): los cambios duran hasta recargar */
      }
      return next;
    });
  }, []);

  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 5000);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const apiErrorText = useCallback((code: server.ApiErrorCode) => t(`errors.${code}`), [t]);

  const setMode = useCallback(
    (m: Mode) => {
      setModeState(m);
      save((p) => ({ ...p, mode: m }));
    },
    [save],
  );

  /* ------------------------------ Servidor ------------------------------ */

  const loadingRef = useRef(false);
  const reloadServer = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setServerStatus((s) => (s === 'ready' ? 'ready' : 'loading'));
    try {
      const docs = await server.fetchAll();
      setServerDocs(docs);
      setServerError(null);
      setServerStatus('ready');
    } catch (err) {
      const code = err instanceof server.DocsApiError ? err.code : 'server';
      setServerError(code);
      setServerStatus('error');
      if (code === 'login') setHasSession(false);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (ready && mode === 'server' && hasSession && serverStatus === 'idle') void reloadServer();
  }, [ready, mode, hasSession, serverStatus, reloadServer]);

  /* ----------------------------- Documentos ----------------------------- */

  const sampleDocs = useMemo(() => (ready ? buildSampleDocs(now, loc, persisted.overlay) : []), [ready, now, loc, persisted.overlay]);
  const docs = useMemo<DocItem[]>(() => (mode === 'sample' ? sampleDocs : hasSession ? serverDocs : []), [mode, sampleDocs, hasSession, serverDocs]);

  const retention = useMemo<RetentionMap>(
    () => (mode === 'sample' ? { ...SAMPLE_RETENTION, ...persisted.retention.sample } : { ...persisted.retention.server }),
    [mode, persisted.retention],
  );

  const folders = useMemo(() => {
    const set = new Set<string>();
    if (mode === 'sample') SAMPLE_FOLDERS.forEach((f) => set.add(f));
    else set.add('General');
    persisted.customFolders[mode].forEach((f) => set.add(f));
    docs.forEach((d) => set.add(d.folder));
    const builtin = mode === 'sample' ? (SAMPLE_FOLDERS as readonly string[]) : ['General'];
    return Array.from(set).sort((a, b) => {
      const ia = builtin.indexOf(a);
      const ib = builtin.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b, 'es');
    });
  }, [mode, persisted.customFolders, docs]);

  const folderCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const d of docs) if (!d.deleted) out[d.folder] = (out[d.folder] || 0) + 1;
    return out;
  }, [docs]);

  const folderLabel = useCallback(
    (folder: string) => {
      if (folder.startsWith('@')) return t(`folders.${folder.slice(1)}`);
      if (folder === 'General') return t('folders.general');
      return folder;
    },
    [t],
  );

  const setRule = useCallback(
    (folder: string, rule: RetentionRule) => save((p) => ({ ...p, retention: { ...p.retention, [mode]: { ...p.retention[mode], [folder]: rule } } })),
    [save, mode],
  );

  const resetRetention = useCallback(() => save((p) => ({ ...p, retention: { ...p.retention, [mode]: {} } })), [save, mode]);

  const patchOverlay = useCallback(
    (id: string, patch: SampleOverlay[string]) => save((p) => ({ ...p, overlay: { ...p.overlay, [id]: { ...p.overlay[id], ...patch } } })),
    [save],
  );

  const busy = useCallback((id: string) => busyIds.includes(id), [busyIds]);

  /** Ejecuta una acción del servidor con el documento marcado como ocupado. */
  const withServer = useCallback(
    async (id: string, fn: () => Promise<void>, apply: (list: DocItem[]) => DocItem[]): Promise<boolean> => {
      setBusyIds((b) => [...b, id]);
      try {
        await fn();
        setServerDocs(apply);
        return true;
      } catch (err) {
        const code = err instanceof server.DocsApiError ? err.code : 'server';
        toast('error', t(`errors.${code}`));
        if (code === 'login') setHasSession(false);
        if (code === 'notFound') void reloadServer();
        return false;
      } finally {
        setBusyIds((b) => b.filter((x) => x !== id));
      }
    },
    [t, toast, reloadServer],
  );

  const ruleOf = useCallback((folder: string) => retention[folder] ?? NO_RULE, [retention]);

  const toggleFavorite = useCallback(
    async (doc: DocItem) => {
      const fav = !doc.favorite;
      if (doc.source === 'sample') {
        patchOverlay(doc.id, { favorite: fav });
        return;
      }
      await withServer(doc.id, () => server.patchDoc(doc.id, { is_favorite: fav }), (list) => list.map((d) => (d.id === doc.id ? { ...d, favorite: fav } : d)));
    },
    [patchOverlay, withServer],
  );

  const rename = useCallback(
    async (doc: DocItem, name: string) => {
      const clean = name.trim().slice(0, 200);
      if (!clean || clean === doc.name) return false;
      if (doc.source === 'sample') {
        patchOverlay(doc.id, { name: clean });
        toast('success', t('toasts.renamed'));
        return true;
      }
      const ok = await withServer(doc.id, () => server.patchDoc(doc.id, { filename: clean }), (list) => list.map((d) => (d.id === doc.id ? { ...d, name: clean } : d)));
      if (ok) toast('success', t('toasts.renamed'));
      return ok;
    },
    [patchOverlay, withServer, toast, t],
  );

  const move = useCallback(
    async (doc: DocItem, folder: string) => {
      if (folder === doc.folder) return;
      if (doc.source === 'sample') {
        patchOverlay(doc.id, { folder });
        toast('success', t('toasts.moved', { folder: folderLabel(folder) }));
        return;
      }
      const ok = await withServer(doc.id, () => server.patchDoc(doc.id, { folder }), (list) => list.map((d) => (d.id === doc.id ? { ...d, folder } : d)));
      if (ok) toast('success', t('toasts.moved', { folder: folderLabel(folder) }));
    },
    [patchOverlay, withServer, toast, t, folderLabel],
  );

  const trash = useCallback(
    async (doc: DocItem) => {
      if (ruleOf(doc.folder).hold) {
        toast('error', t('toasts.onHold', { folder: folderLabel(doc.folder) }));
        return false;
      }
      const at = bogotaNow();
      if (doc.source === 'sample') {
        patchOverlay(doc.id, { deletedAt: at });
        toast('success', t('toasts.trashed'));
        return true;
      }
      const ok = await withServer(doc.id, () => server.trashDoc(doc.id), (list) => list.map((d) => (d.id === doc.id ? { ...d, deleted: true, deletedAt: at } : d)));
      if (ok) toast('success', t('toasts.trashed'));
      return ok;
    },
    [ruleOf, toast, t, folderLabel, patchOverlay, withServer],
  );

  const restore = useCallback(
    async (doc: DocItem) => {
      if (doc.source === 'sample') {
        patchOverlay(doc.id, { deletedAt: null });
        toast('success', t('toasts.restored'));
        return;
      }
      const ok = await withServer(doc.id, () => server.restoreDoc(doc.id), (list) => list.map((d) => (d.id === doc.id ? { ...d, deleted: false, deletedAt: undefined } : d)));
      if (ok) toast('success', t('toasts.restored'));
    },
    [patchOverlay, withServer, toast, t],
  );

  const destroy = useCallback(
    async (doc: DocItem) => {
      if (ruleOf(doc.folder).hold) {
        toast('error', t('toasts.onHold', { folder: folderLabel(doc.folder) }));
        return false;
      }
      if (doc.source === 'sample') {
        patchOverlay(doc.id, { removed: true });
        toast('success', t('toasts.destroyed'));
        return true;
      }
      const ok = await withServer(doc.id, () => server.destroyDoc(doc.id), (list) => list.filter((d) => d.id !== doc.id));
      if (ok) toast('success', t('toasts.destroyed'));
      return ok;
    },
    [ruleOf, toast, t, folderLabel, patchOverlay, withServer],
  );

  const emptyTrash = useCallback(async () => {
    const targets = docs.filter((d) => d.deleted && !ruleOf(d.folder).hold);
    const held = docs.filter((d) => d.deleted && ruleOf(d.folder).hold).length;
    if (mode === 'sample') {
      save((p) => {
        const overlay = { ...p.overlay };
        for (const d of targets) overlay[d.id] = { ...overlay[d.id], removed: true };
        return { ...p, overlay };
      });
    } else {
      for (const d of targets) {
        // Uno por uno: el servidor no tiene borrado masivo.
        const ok = await withServer(d.id, () => server.destroyDoc(d.id), (list) => list.filter((x) => x.id !== d.id));
        if (!ok) return;
      }
    }
    toast('success', held ? t('toasts.trashEmptiedHeld', { count: targets.length, held }) : t('toasts.trashEmptied', { count: targets.length }));
  }, [docs, ruleOf, mode, save, withServer, toast, t]);

  const createFolder = useCallback(
    (name: string): 'empty' | 'exists' | 'tooLong' | null => {
      const clean = name.trim().replace(/\s+/g, ' ');
      if (!clean) return 'empty';
      if (clean.length > 60) return 'tooLong';
      const exists = folders.some((f) => f.toLowerCase() === clean.toLowerCase() || folderLabel(f).toLowerCase() === clean.toLowerCase());
      if (exists || clean.startsWith('@')) return 'exists';
      save((p) => ({ ...p, customFolders: { ...p.customFolders, [mode]: [...p.customFolders[mode], clean] } }));
      toast('success', t('toasts.folderCreated', { folder: clean }));
      return null;
    },
    [folders, folderLabel, save, mode, toast, t],
  );

  const upload = useCallback(
    async (files: File[], folder: string) => {
      const valid: File[] = [];
      for (const f of files) {
        const problem = checkUpload(f);
        if (problem) toast('error', t(`upload.problem.${problem}`, { name: f.name }));
        else valid.push(f);
      }
      if (!valid.length || mode !== 'server' || !hasSession) return;
      let done = 0;
      let withoutAi = 0;
      for (let i = 0; i < valid.length; i++) {
        const f = valid[i];
        setUploading({ index: i + 1, total: valid.length, name: f.name, pct: 0, phase: 'upload' });
        try {
          const res = await server.uploadFile(f, folder, (pct) =>
            setUploading({ index: i + 1, total: valid.length, name: f.name, pct, phase: pct >= 100 ? 'process' : 'upload' }),
          );
          done++;
          if (res.analyzed === false) withoutAi++;
        } catch (err) {
          const code = err instanceof server.DocsApiError ? err.code : 'server';
          toast('error', `${f.name}: ${t(`errors.${code}`)}`);
          if (code === 'login') {
            setHasSession(false);
            break;
          }
        }
      }
      setUploading(null);
      if (done) {
        toast('success', t('toasts.uploaded', { count: done }));
        if (withoutAi) toast('info', t('toasts.uploadedNoAi', { count: withoutAi }));
        await reloadServer();
      }
    },
    [mode, hasSession, toast, t, reloadServer],
  );

  const resetSample = useCallback(() => {
    save((p) => ({ ...p, overlay: {}, customFolders: { ...p.customFolders, sample: [] }, retention: { ...p.retention, sample: {} } }));
    toast('success', t('toasts.sampleReset'));
  }, [save, toast, t]);

  const value: DocsContext = {
    ready,
    loc,
    now,
    hasSession,
    userName,
    mode,
    setMode,
    docs,
    serverStatus,
    serverError,
    reloadServer: () => void reloadServer(),
    folders,
    folderCounts,
    folderLabel,
    retention,
    setRule,
    resetRetention,
    busy,
    toggleFavorite,
    rename,
    move,
    trash,
    restore,
    destroy,
    emptyTrash,
    createFolder,
    upload,
    uploading,
    resetSample,
    toasts,
    toast,
    dismissToast,
    apiErrorText,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
