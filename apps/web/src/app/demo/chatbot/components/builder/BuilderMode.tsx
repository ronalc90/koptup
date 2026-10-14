'use client';

/**
 * BuilderMode — modo "Configura el tuyo" de /demo/chatbot.
 *
 * Todo es real:
 *  - Guardar crea o actualiza el bot en el backend (`POST`/`PATCH /api/chatbot/bots`),
 *    con el token de dueño si el backend lo entrega (ver `api.ts`).
 *  - Los documentos (TXT, MD, CSV, PDF o DOCX) se suben a `POST /api/chatbot/bots/:id/docs` y se
 *    pueden borrar; las páginas web públicas se indexan con `POST …/urls`.
 *  - Un bot de otro navegador (`?botId=` sin su llave) se muestra en solo
 *    lectura: el servidor no aceptaría cambios ni muestra sus documentos.
 *  - La vista previa usa el widget real (`/widget.js` + `/embed/chatbot/<id>`).
 *  - El código para insertar solo ofrece lo que funciona (script e iframe).
 *  - "Conversaciones" lee el historial real del bot y lo exporta a CSV.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowTopRightOnSquareIcon, LinkIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';
import { RAG_PLANS_PATH, ragPlanContactHref } from '@/lib/rag-plans';

import ConfigPanel from './ConfigPanel';
import LivePreview from './LivePreview';
import EmbedCode from './EmbedCode';
import ConversationsPanel from './ConversationsPanel';
import MyBotsMenu from './MyBotsMenu';
import {
  BotApiError,
  createBot,
  deleteBotDoc,
  fileToBase64,
  forgetBot,
  docsCountOf,
  getBot,
  ingestBotUrls,
  listOwnedBots,
  patchBot,
  rememberBot,
  textToBase64,
  uploadBotDocs,
  type RemoteBotConfig,
  type RemoteBotDoc,
} from './api';
import {
  DOC_EXTENSIONS,
  MAX_DOC_FILE_BYTES,
  MAX_FILES_PER_UPLOAD,
  composeSystemPrompt,
  fromRemote,
  sameConfig,
  type BuilderWidgetConfig,
} from './widgetConfig';
import { getSampleCompanies, getSampleCompany, type SampleCompanyKey, type SampleLocale } from '../sampleKnowledge';
import { kbErrorReason, type KbErrorReason } from '../errors';
import { normalizeUrl, urlErrorMessage } from './urlIngest';

/** Mensaje de "Guardar bot" según la causa real (límite de creación, capacidad, servidor o red). */
const SAVE_ERROR_KEY: Record<KbErrorReason, string> = {
  rateLimited: 'actions.saveRateLimited',
  capacity: 'actions.saveCapacity',
  unavailable: 'actions.saveUnavailable',
  network: 'actions.saveNetwork',
  generic: 'actions.saveFailed',
};

const MIME_BY_EXT: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

/** Actualiza ?mode=builder&botId=… sin recargar ni navegar. */
function syncUrl(botId: string | null) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'builder');
    if (botId) url.searchParams.set('botId', botId);
    else url.searchParams.delete('botId');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  } catch {
    /* sin History API */
  }
}

export default function BuilderMode() {
  const t = useTranslations('demoChatbot.builder');
  const locale: SampleLocale = useLocale() === 'en' ? 'en' : 'es';
  const sampleCompanies = useMemo(() => getSampleCompanies(locale), [locale]);

  const defaults = useMemo<BuilderWidgetConfig>(
    () => ({
      botName: t('defaults.botName'),
      primaryColor: '#4F46E5',
      position: 'br',
      avatar: '💬',
      welcome: t('defaults.welcome'),
      instructions: t('defaults.instructions'),
      tone: 'friendly',
    }),
    [t],
  );

  const [config, setConfig] = useState<BuilderWidgetConfig>(defaults);
  const [savedConfig, setSavedConfig] = useState<BuilderWidgetConfig | null>(null);
  const [botId, setBotId] = useState<string | null>(null);
  const [docs, setDocs] = useState<RemoteBotDoc[]>([]);
  /** El bot cargado es de otro navegador: solo lectura (con su número de documentos). */
  const [readOnly, setReadOnly] = useState(false);
  const [publicDocsCount, setPublicDocsCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [origin, setOrigin] = useState(SITE_URL);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const applyRemote = useCallback((remote: RemoteBotConfig) => {
    const cfg = fromRemote(remote);
    setConfig(cfg);
    setSavedConfig(cfg);
    setBotId(remote.botId);
    setDocs(remote.docs ?? []);
    // `owned: false`: el servidor no reconoce la llave de este navegador.
    setReadOnly(remote.owned === false);
    setPublicDocsCount(docsCountOf(remote));
    setNonce((n) => n + 1);
    syncUrl(remote.botId);
  }, []);

  const loadBot = useCallback(
    async (id: string, opts?: { silent?: boolean }) => {
      try {
        const remote = await getBot(id);
        applyRemote(remote);
        if (!opts?.silent) toast.success(t('myBots.selected', { name: remote.name }));
      } catch (err) {
        if (err instanceof BotApiError && err.status === 404) {
          const name = listOwnedBots('builder').find((b) => b.botId === id)?.name ?? id;
          forgetBot(id);
          toast.error(t('myBots.removedMissing', { name }));
          syncUrl(null);
        } else {
          toast.error(t('myBots.loadFailed'));
        }
      }
    },
    [applyRemote, t],
  );

  // Al entrar: el bot de la URL (?botId=) o el último bot propio de este navegador.
  useEffect(() => {
    let fromUrl: string | null = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get('botId');
    } catch {
      fromUrl = null;
    }
    const id = fromUrl && /^[a-zA-Z0-9_-]{3,64}$/.test(fromUrl) ? fromUrl : listOwnedBots('builder')[0]?.botId;
    if (id) void loadBot(id, { silent: true });
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchConfig = useCallback((patch: Partial<BuilderWidgetConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
  }, []);

  const dirty = !sameConfig(config, savedConfig);

  /** Guarda el bot (crea o actualiza) y devuelve su id. */
  const save = useCallback(async (): Promise<string | null> => {
    if (readOnly) return null;
    setSaving(true);
    const payload: Partial<RemoteBotConfig> = {
      name: config.botName.trim() || t('defaults.botName'),
      color: config.primaryColor,
      position: config.position,
      avatar: config.avatar,
      welcome: config.welcome.trim() || t('preview.defaultWelcome'),
      systemPrompt: composeSystemPrompt(config.instructions, t('toneLine', { tone: t(`fields.tones.${config.tone}`) })),
      tone: config.tone,
      languages: [locale],
    };
    try {
      const remote = botId ? await patchBot(botId, payload) : await createBot(payload, { kind: 'builder' });
      rememberBot(remote.botId, { name: remote.name, kind: 'builder' });
      const cfg = { ...config, botName: remote.name, welcome: remote.welcome };
      setConfig(cfg);
      setSavedConfig(cfg);
      setBotId(remote.botId);
      setReadOnly(false);
      if (remote.docs) setDocs(remote.docs);
      setNonce((n) => n + 1);
      syncUrl(remote.botId);
      toast.success(t('actions.saved'));
      return remote.botId;
    } catch (err) {
      if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
      else toast.error(t(SAVE_ERROR_KEY[kbErrorReason(err)]), { duration: 6000 });
      return null;
    } finally {
      setSaving(false);
    }
  }, [botId, config, locale, readOnly, t]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      const valid: File[] = [];
      for (const f of files.slice(0, MAX_FILES_PER_UPLOAD)) {
        if (!DOC_EXTENSIONS.includes(extOf(f.name))) toast.error(t('knowledge.unsupported', { name: f.name }));
        else if (f.size > MAX_DOC_FILE_BYTES) toast.error(t('knowledge.tooBig', { name: f.name }));
        else valid.push(f);
      }
      if (valid.length === 0) return;
      setUploading(true);
      try {
        const id = botId ?? (await save());
        if (!id) return;
        const payload = await Promise.all(
          valid.map(async (f) => ({
            name: f.name,
            size: f.size,
            mime: f.type || MIME_BY_EXT[extOf(f.name)] || 'text/plain',
            contentBase64: await fileToBase64(f),
          })),
        );
        const result = await uploadBotDocs(id, payload);
        setDocs(result.docs);
        // El servidor indexa los que pudo leer y dice cuáles no (p. ej. un PDF escaneado).
        for (const e of result.errors ?? []) toast.error(t('knowledge.unreadable', { name: e.name }));
        if (result.added.length > 0) toast.success(t('knowledge.uploaded', { count: result.added.length }));
      } catch (err) {
        if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
        else if (err instanceof BotApiError && err.code === 'no_valid_files') toast.error(t('knowledge.noneReadable'));
        else toast.error(t('knowledge.uploadFailed'));
      } finally {
        setUploading(false);
      }
    },
    [botId, save, t],
  );

  const handleLoadSample = useCallback(
    async (key: SampleCompanyKey) => {
      const company = getSampleCompany(key, locale);
      // No se suben dos veces los mismos documentos de ejemplo (duplicarían las citas).
      const loaded = new Set(docs.map((d) => d.name));
      const pending = company.docs.filter((d) => !loaded.has(d.fileName));
      if (pending.length === 0) {
        toast(t('knowledge.sampleAlready', { company: company.name }));
        return;
      }
      setUploading(true);
      try {
        const id = botId ?? (await save());
        if (!id) return;
        const result = await uploadBotDocs(
          id,
          pending.map((d) => ({
            name: d.fileName,
            size: new TextEncoder().encode(d.text).length,
            mime: 'text/plain',
            contentBase64: textToBase64(d.text),
          })),
        );
        setDocs(result.docs);
        toast.success(t('knowledge.sampleLoaded'));
      } catch (err) {
        if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
        else toast.error(t('knowledge.uploadFailed'));
      } finally {
        setUploading(false);
      }
    },
    [botId, docs, locale, save, t],
  );

  /** Indexa una página web pública (el servidor la descarga con protección SSRF). */
  const handleAddUrl = useCallback(
    async (raw: string): Promise<boolean> => {
      const url = normalizeUrl(raw);
      if (!url) {
        toast.error(t('knowledge.urlErrors.invalid_url', { url: raw }), { duration: 6000 });
        return false;
      }
      setUploading(true);
      try {
        const id = botId ?? (await save());
        if (!id) return false;
        const result = await ingestBotUrls(id, [url]);
        setDocs(result.docs);
        for (const e of result.errors ?? []) {
          const { key, status } = urlErrorMessage(e.reason);
          toast.error(t(`knowledge.urlErrors.${key}`, { url: e.url, status: status ?? '' }), { duration: 7000 });
        }
        for (const a of result.added) toast.success(t('knowledge.urlAdded', { host: a.name }));
        return result.added.length > 0;
      } catch (err) {
        if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
        else if (err instanceof BotApiError && err.code === 'too_many_docs') toast.error(t('knowledge.tooManyDocs'));
        else toast.error(t('knowledge.urlFailed'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [botId, save, t],
  );

  const handleRemoveDoc = useCallback(
    async (docId: string) => {
      if (!botId) return;
      try {
        const result = await deleteBotDoc(botId, docId);
        setDocs(result.docs);
        toast.success(t('knowledge.removed'));
      } catch (err) {
        if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
        else toast.error(t('knowledge.removeFailed'));
      }
    },
    [botId, t],
  );

  const resetToNew = useCallback(() => {
    setConfig(defaults);
    setSavedConfig(null);
    setBotId(null);
    setDocs([]);
    setReadOnly(false);
    setPublicDocsCount(0);
    syncUrl(null);
  }, [defaults]);

  const handleCreateNew = useCallback(() => {
    resetToNew();
    toast.success(t('myBots.newReady'));
  }, [resetToNew, t]);

  const handleDeleted = useCallback(
    (deletedId: string) => {
      if (deletedId === botId) resetToNew();
    },
    [botId, resetToNew],
  );

  const chatUrl = botId ? `${origin}/embed/chatbot/${encodeURIComponent(botId)}` : '';

  const handleCopyLink = useCallback(async () => {
    if (!chatUrl) return;
    try {
      await navigator.clipboard.writeText(chatUrl);
      toast.success(t('actions.linkCopied', { url: chatUrl }));
    } catch {
      toast(t('actions.copyFailed', { url: chatUrl }));
    }
  }, [chatUrl, t]);

  return (
    <div className="flex flex-1 flex-col bg-secondary-50 dark:bg-secondary-950">
      <header className="flex flex-col gap-3 border-b border-secondary-200 bg-white px-4 py-3 dark:border-secondary-800 dark:bg-secondary-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('subtitle')}</p>
          <p className="mt-1 max-w-3xl text-[11px] leading-snug text-secondary-500 dark:text-secondary-400">{t('storageNote')}</p>
          <p className="mt-1 text-[11px] text-secondary-600 dark:text-secondary-300">
            {t('cta.text')}{' '}
            <Link href={RAG_PLANS_PATH} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              {t('cta.plans')}
            </Link>
            {' · '}
            <Link href={ragPlanContactHref('piloto')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              {t('cta.quotePilot')}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MyBotsMenu
            currentBotId={botId}
            refreshKey={nonce}
            onSelect={(id) => void loadBot(id)}
            onCreateNew={handleCreateNew}
            onDeleted={handleDeleted}
          />
          {botId ? (
            <span className="max-w-full truncate rounded-md bg-secondary-100 px-2 py-1 font-mono text-[11px] text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">
              {botId}
            </span>
          ) : null}
          {dirty && botId ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {t('actions.unsaved')}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || readOnly}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
          {botId ? (
            <>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="inline-flex items-center gap-1 rounded-md border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950"
              >
                <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('actions.copyLink')}
              </button>
              <a
                href={`/embed/chatbot/${encodeURIComponent(botId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('actions.openChat')}
              </a>
            </>
          ) : null}
        </div>
      </header>

      {readOnly ? (
        <div
          role="status"
          className="mx-4 mt-4 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">{t('readOnly.title')}</span> {t('readOnly.body')}
            </span>
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
          >
            {t('readOnly.createOwn')}
          </button>
        </div>
      ) : null}

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        <section className="min-w-0 lg:col-span-4" aria-label={t('configTitle')}>
          <ConfigPanel
            config={config}
            onChange={patchConfig}
            docs={docs}
            onUpload={(files) => void handleUpload(files)}
            onRemoveDoc={(id) => void handleRemoveDoc(id)}
            onLoadSample={(key) => void handleLoadSample(key)}
            onAddUrl={handleAddUrl}
            sampleCompanies={sampleCompanies}
            uploading={uploading}
            readOnly={readOnly}
            publicDocsCount={publicDocsCount}
          />
        </section>

        <section className="min-w-0 lg:col-span-5" aria-label={t('preview.title')}>
          <LivePreview
            config={config}
            botId={botId}
            dirty={dirty}
            nonce={nonce}
            origin={origin}
            saving={saving}
            onSave={() => void save()}
          />
        </section>

        <section className="flex min-w-0 flex-col gap-4 lg:col-span-3" aria-label={t('embed.title')}>
          <EmbedCode config={config} botId={botId} origin={origin} />
        </section>

        <section className="min-w-0 lg:col-span-12" aria-label={t('conversations.title')}>
          <ConversationsPanel botId={botId} refreshKey={nonce} />
        </section>
      </div>
    </div>
  );
}
