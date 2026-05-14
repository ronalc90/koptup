'use client';

/**
 * BuilderMode — modo "Builder & Embed" del demo de chatbot.
 *
 * Wires:
 *  - Identidad / apariencia / comportamiento (ConfigPanel)
 *  - Subida real de archivos al backend (`POST /api/chatbot/bots/:id/docs`)
 *  - Persistencia de bots en localStorage + backend (`POST /api/chatbot/bots`)
 *  - Live preview con iframe REAL apuntando a `/embed/chatbot/{botId}`
 *  - EmbedCode con URLs reales (iframe, script, react, webhook)
 *  - Compartir micrositio (`/chatbot/{botId}`)
 *
 * SOLID: cada panel sub-componente recibe sólo lo que necesita; el estado
 * vive en este orquestador y se serializa contra el backend.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import ConfigPanel from './ConfigPanel';
import LivePreview from './LivePreview';
import EmbedCode from './EmbedCode';
import type { BuilderWidgetConfig, MockKnowledgeDoc, WidgetCornerPosition } from './widgetConfig';
import {
  AVATAR_CHOICES,
  DEFAULT_BOT_ID,
  LANG_CHOICES,
  MOCK_DOCS,
  TONE_CHOICES,
} from './widgetConfig';
import {
  createBot,
  deleteBotDoc,
  fileToBase64,
  getBot,
  patchBot,
  uploadBotDocs,
  type RemoteBotConfig,
  type RemoteBotDoc,
} from './api';

const LOCAL_STORAGE_KEY = 'koptup.chatbot.builder.bots';

interface PersistedBots {
  [botId: string]: BuilderWidgetConfig;
}

function readLocal(): PersistedBots {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedBots;
  } catch {
    return {};
  }
}

function writeLocal(data: PersistedBots) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function toBuilderConfig(remote: RemoteBotConfig & { docs?: RemoteBotDoc[] }): BuilderWidgetConfig {
  return {
    botId: remote.botId,
    botName: remote.name,
    primaryColor: remote.color,
    position: remote.position,
    avatar: remote.avatar,
    welcome: remote.welcome,
    systemPrompt: remote.systemPrompt,
    tone: (['professional', 'friendly', 'technical', 'casual'].includes(remote.tone)
      ? remote.tone
      : 'professional') as BuilderWidgetConfig['tone'],
    languages: (remote.languages as BuilderWidgetConfig['languages']) ?? ['es', 'en'],
    docs: (remote.docs ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      sizeKb: Math.max(1, Math.round(d.size / 1024)),
      chunks: Math.max(1, Math.round(d.size / 4096) || 1),
    })),
  };
}

function toRemotePayload(c: BuilderWidgetConfig): Partial<RemoteBotConfig> {
  return {
    name: c.botName,
    color: c.primaryColor,
    position: c.position,
    avatar: c.avatar,
    welcome: c.welcome,
    systemPrompt: c.systemPrompt,
    tone: c.tone,
    languages: c.languages,
  };
}

const DEFAULT_CONFIG: BuilderWidgetConfig = {
  botName: 'Koptup Assistant',
  primaryColor: '#4F46E5',
  position: 'br',
  avatar: '🤖',
  welcome: '¡Hola! ¿En qué puedo ayudarte hoy?',
  systemPrompt:
    'You are a helpful enterprise assistant grounded in the uploaded knowledge base. Cite sources when possible.',
  tone: 'professional',
  languages: ['es', 'en'],
  docs: MOCK_DOCS.slice(0, 2),
  botId: DEFAULT_BOT_ID,
};

const POSITIONS: WidgetCornerPosition[] = ['br', 'bl', 'tr', 'tl'];

export default function BuilderMode() {
  const t = useTranslations('demoChatbot.builder');
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBotId = searchParams?.get('botId') ?? null;

  const [config, setConfig] = useState<BuilderWidgetConfig>(DEFAULT_CONFIG);
  const [persistedBotId, setPersistedBotId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hydrated = useRef(false);

  // Hidratar desde URL → backend o localStorage
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (!urlBotId) return;
    const local = readLocal();
    const cached = local[urlBotId];
    if (cached) {
      setConfig({ ...cached, botId: urlBotId });
      setPersistedBotId(urlBotId);
    }
    // Siempre intentar refrescar contra el backend para tener los docs actualizados.
    // Conservamos `avatarImage` (data URL) desde la cache local: el backend no
    // lo persiste (in-memory, sin BBDD), pero la UX del Builder lo necesita.
    getBot(urlBotId)
      .then((remote) => {
        const fromRemote = toBuilderConfig(remote);
        const preservedAvatarImage = cached?.avatarImage;
        setConfig(
          preservedAvatarImage
            ? { ...fromRemote, avatarImage: preservedAvatarImage }
            : fromRemote,
        );
        setPersistedBotId(remote.botId);
      })
      .catch(() => {
        /* offline ok, ya hidratamos de local */
      });
  }, [urlBotId]);

  const patchConfig = useCallback((patch: Partial<BuilderWidgetConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
  }, []);

  const persistLocal = useCallback((id: string, c: BuilderWidgetConfig) => {
    const all = readLocal();
    all[id] = { ...c, botId: id };
    writeLocal(all);
  }, []);

  /** Crea (o actualiza) el bot en el backend y devuelve el botId remoto. */
  const ensureSaved = useCallback(async (): Promise<string> => {
    setSaving(true);
    try {
      const payload = toRemotePayload(config);
      let remote: RemoteBotConfig;
      if (persistedBotId) {
        remote = await patchBot(persistedBotId, payload);
      } else {
        remote = await createBot(payload);
      }
      const newId = remote.botId;
      const nextLocal: BuilderWidgetConfig = { ...config, botId: newId };
      setConfig(nextLocal);
      setPersistedBotId(newId);
      persistLocal(newId, nextLocal);
      if (urlBotId !== newId) {
        router.replace(`?botId=${encodeURIComponent(newId)}`);
      }
      return newId;
    } finally {
      setSaving(false);
    }
  }, [config, persistedBotId, persistLocal, router, urlBotId]);

  const handleSave = useCallback(async () => {
    try {
      const id = await ensureSaved();
      toast.success(`Bot guardado · ID: ${id}`);
    } catch (err: any) {
      toast.error(`No pude guardar el bot: ${err?.message ?? 'error'}`);
    }
  }, [ensureSaved]);

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      const tid = toast.loading('Subiendo archivos...');
      try {
        const botId = persistedBotId ?? (await ensureSaved());
        const payload = await Promise.all(
          files.map(async (f) => ({
            name: f.name,
            size: f.size,
            mime: f.type || 'application/octet-stream',
            contentBase64: await fileToBase64(f),
          })),
        );
        const result = await uploadBotDocs(botId, payload);
        const newDocs: MockKnowledgeDoc[] = result.docs.map((d) => ({
          id: d.id,
          name: d.name,
          sizeKb: Math.max(1, Math.round(d.size / 1024)),
          chunks: Math.max(1, Math.round(d.size / 4096) || 1),
        }));
        const next = { ...config, botId, docs: newDocs };
        setConfig(next);
        persistLocal(botId, next);
        toast.success(`${files.length} archivo(s) subido(s)`, { id: tid });
      } catch (err: any) {
        toast.error(`Upload falló: ${err?.message ?? 'error'}`, { id: tid });
      } finally {
        setUploading(false);
      }
    },
    [config, ensureSaved, persistLocal, persistedBotId],
  );

  const handleRemoveDoc = useCallback(
    async (docId: string) => {
      if (!persistedBotId) {
        // doc local únicamente
        const next = { ...config, docs: config.docs.filter((d) => d.id !== docId) };
        setConfig(next);
        return;
      }
      try {
        const result = await deleteBotDoc(persistedBotId, docId);
        const newDocs: MockKnowledgeDoc[] = result.docs.map((d) => ({
          id: d.id,
          name: d.name,
          sizeKb: Math.max(1, Math.round(d.size / 1024)),
          chunks: Math.max(1, Math.round(d.size / 4096) || 1),
        }));
        const next = { ...config, docs: newDocs };
        setConfig(next);
        persistLocal(persistedBotId, next);
        toast.success('Documento eliminado');
      } catch (err: any) {
        toast.error(`No pude borrar el documento: ${err?.message ?? 'error'}`);
      }
    },
    [config, persistLocal, persistedBotId],
  );

  const handleShareMicrosite = useCallback(async () => {
    try {
      const id = persistedBotId ?? (await ensureSaved());
      const url = `https://koptup.com/chatbot/${id}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      toast.success(`Link copiado: ${url}`);
    } catch (err: any) {
      toast.error(`Compartir falló: ${err?.message ?? 'error'}`);
    }
  }, [ensureSaved, persistedBotId]);

  const headerTitle = useMemo(() => t('title'), [t]);
  const headerSubtitle = useMemo(() => t('subtitle'), [t]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-secondary-50 dark:bg-secondary-950">
      <header className="flex flex-col gap-3 border-b border-secondary-200 bg-white px-4 py-3 dark:border-secondary-800 dark:bg-secondary-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-secondary-900 dark:text-white">
            {headerTitle}
          </h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {headerSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {persistedBotId ? (
            <span className="rounded-md bg-secondary-100 px-2 py-1 font-mono text-[11px] text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">
              {persistedBotId}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
          <button
            type="button"
            onClick={handleShareMicrosite}
            className="rounded-md border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950"
          >
            {t('actions.share')}
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        <section className="lg:col-span-4" aria-label="builder-config">
          <ConfigPanel
            config={config}
            onChange={patchConfig}
            avatarChoices={AVATAR_CHOICES}
            toneChoices={TONE_CHOICES}
            langChoices={LANG_CHOICES}
            positions={POSITIONS}
            onUpload={handleUploadFiles}
            onRemoveDoc={handleRemoveDoc}
            uploading={uploading}
          />
        </section>

        <section className="lg:col-span-5" aria-label="builder-preview">
          <LivePreview config={config} botId={persistedBotId} />
        </section>

        <section className="lg:col-span-3" aria-label="builder-embed">
          <EmbedCode config={config} botId={persistedBotId} />
        </section>
      </div>
    </div>
  );
}
