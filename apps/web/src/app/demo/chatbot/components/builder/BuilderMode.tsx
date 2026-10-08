'use client';

/**
 * BuilderMode — modo "Configura el tuyo" de /demo/chatbot.
 *
 * Todo es real:
 *  - Guardar crea o actualiza el bot en el backend (`POST`/`PATCH /api/chatbot/bots`),
 *    con el token de dueño si el backend lo entrega (ver `api.ts`).
 *  - Los documentos de texto se suben a `POST /api/chatbot/bots/:id/docs` y se
 *    pueden borrar.
 *  - La vista previa usa el widget real (`/widget.js` + `/embed/chatbot/<id>`).
 *  - El código para insertar solo ofrece lo que funciona (script e iframe).
 *  - "Conversaciones" lee el historial real del bot y lo exporta a CSV.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/react/24/outline';
import { SITE_URL } from '@/lib/site';

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
  getBot,
  listOwnedBots,
  patchBot,
  rememberBot,
  textToBase64,
  uploadBotDocs,
  type RemoteBotConfig,
  type RemoteBotDoc,
} from './api';
import {
  MAX_FILES_PER_UPLOAD,
  MAX_TEXT_FILE_BYTES,
  TEXT_EXTENSIONS,
  composeSystemPrompt,
  fromRemote,
  sameConfig,
  type BuilderWidgetConfig,
} from './widgetConfig';
import { getSampleCompanies, getSampleCompany, type SampleCompanyKey, type SampleLocale } from '../sampleKnowledge';

const MIME_BY_EXT: Record<string, string> = { '.txt': 'text/plain', '.md': 'text/markdown', '.csv': 'text/csv' };

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
      if (remote.docs) setDocs(remote.docs);
      setNonce((n) => n + 1);
      syncUrl(remote.botId);
      toast.success(t('actions.saved'));
      return remote.botId;
    } catch (err) {
      if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
      else toast.error(t('actions.saveFailed'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [botId, config, locale, t]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      const valid: File[] = [];
      for (const f of files.slice(0, MAX_FILES_PER_UPLOAD)) {
        if (!TEXT_EXTENSIONS.includes(extOf(f.name))) toast.error(t('knowledge.unsupported', { name: f.name }));
        else if (f.size > MAX_TEXT_FILE_BYTES) toast.error(t('knowledge.tooBig', { name: f.name }));
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
        toast.success(t('knowledge.uploaded', { count: valid.length }));
      } catch (err) {
        if (err instanceof BotApiError && (err.status === 401 || err.status === 403)) toast.error(t('actions.notOwner'));
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
      setUploading(true);
      try {
        const id = botId ?? (await save());
        if (!id) return;
        const result = await uploadBotDocs(
          id,
          company.docs.map((d) => ({
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
    [botId, locale, save, t],
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
            disabled={saving}
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

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        <section className="min-w-0 lg:col-span-4" aria-label={t('configTitle')}>
          <ConfigPanel
            config={config}
            onChange={patchConfig}
            docs={docs}
            onUpload={(files) => void handleUpload(files)}
            onRemoveDoc={(id) => void handleRemoveDoc(id)}
            onLoadSample={(key) => void handleLoadSample(key)}
            sampleCompanies={sampleCompanies}
            uploading={uploading}
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
