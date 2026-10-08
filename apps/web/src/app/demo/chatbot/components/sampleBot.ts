/**
 * sampleBot.ts — prepara en el backend el bot de una empresa de ejemplo.
 *
 * La primera vez que eliges una empresa, el navegador crea un bot real
 * (`POST /api/chatbot/bots`) y le sube sus documentos como texto
 * (`POST /api/chatbot/bots/:id/docs`). El id del bot (y su token de dueño, si
 * el backend lo entrega) queda en localStorage para reutilizarlo en las
 * siguientes visitas. Si el bot ya no existe o le faltan documentos (p. ej.
 * el servidor se reinició sin su estado), se vuelve a crear.
 */
import {
  BotApiError,
  createBot,
  deleteBot,
  forgetBot,
  getBot,
  listOwnedBots,
  textToBase64,
  uploadBotDocs,
  type RemoteBotDoc,
} from './builder/api';
import { SAMPLE_KB_VERSION, type SampleCompany, type SampleLocale } from './sampleKnowledge';

export interface SampleBotState {
  botId: string;
  docs: RemoteBotDoc[];
}

const inflight = new Map<string, Promise<SampleBotState>>();

function sampleKeyFor(company: SampleCompany, locale: SampleLocale): string {
  return `${company.key}:${locale}:${SAMPLE_KB_VERSION}`;
}

async function createSampleBot(company: SampleCompany, locale: SampleLocale, sampleKey: string): Promise<SampleBotState> {
  const created = await createBot(
    {
      name: company.name,
      welcome: company.welcome,
      systemPrompt: company.systemPrompt,
      tone: 'friendly',
      color: '#4F46E5',
      position: 'br',
      avatar: '💬',
      languages: [locale],
    },
    { kind: 'sample', sampleKey },
  );
  const files = company.docs.map((d) => ({
    name: d.fileName,
    size: new TextEncoder().encode(d.text).length,
    mime: 'text/plain',
    contentBase64: textToBase64(d.text),
  }));
  const uploaded = await uploadBotDocs(created.botId, files);
  return { botId: created.botId, docs: uploaded.docs };
}

async function resolveSampleBot(company: SampleCompany, locale: SampleLocale): Promise<SampleBotState> {
  const sampleKey = sampleKeyFor(company, locale);
  const prefix = `${company.key}:${locale}:`;
  const owned = listOwnedBots('sample');

  // Versiones anteriores de los textos de esta empresa: se borran (best-effort).
  for (const old of owned.filter((b) => b.sampleKey?.startsWith(prefix) && b.sampleKey !== sampleKey)) {
    forgetBot(old.botId);
    void deleteBot(old.botId).catch(() => undefined);
  }

  const existing = owned.find((b) => b.sampleKey === sampleKey);
  if (existing) {
    try {
      const bot = await getBot(existing.botId);
      const docs = bot.docs ?? [];
      if (docs.length === company.docs.length) return { botId: existing.botId, docs };
      // Le faltan documentos: se descarta y se crea otro.
      forgetBot(existing.botId);
      void deleteBot(existing.botId).catch(() => undefined);
    } catch (err) {
      if (!(err instanceof BotApiError) || err.status !== 404) throw err;
      forgetBot(existing.botId);
    }
  }
  return createSampleBot(company, locale, sampleKey);
}

/** Devuelve el bot listo de la empresa (crea e indexa si hace falta). */
export function ensureSampleBot(company: SampleCompany, locale: SampleLocale): Promise<SampleBotState> {
  const key = sampleKeyFor(company, locale);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = resolveSampleBot(company, locale).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Olvida el bot de la empresa (p. ej. si el backend perdió sus documentos) para recrearlo. */
export function resetSampleBot(company: SampleCompany, locale: SampleLocale): void {
  const key = sampleKeyFor(company, locale);
  for (const b of listOwnedBots('sample').filter((x) => x.sampleKey === key)) forgetBot(b.botId);
}
