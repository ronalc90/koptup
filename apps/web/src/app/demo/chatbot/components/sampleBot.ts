/**
 * sampleBot.ts — bot del servidor para una empresa de ejemplo ("Prueba el asistente").
 *
 * - `findSampleBot` NO crea nada: busca el bot que este navegador ya indexó
 *   para esa empresa, idioma y versión de los textos (registro en
 *   localStorage) y comprueba en el servidor que siga ahí con todos sus
 *   documentos. Se usa al abrir la página o cambiar de empresa.
 * - `ensureSampleBot` lo prepara cuando hace falta (con la primera pregunta o
 *   con "Reintentar"): reutiliza el de este navegador; si el backend ofrece
 *   bots de ejemplo compartidos (POST /sample-bots), usa el del servidor; si
 *   no, crea uno (`kind: "sample"`) y le sube los textos.
 *
 * Así una visita que no pregunta nada (o un rastreador) no crea bots, y un
 * navegador no crea otro bot cada vez que vuelve a la página.
 */
import {
  BotApiError,
  createBot,
  deleteBot,
  docsCountOf,
  forgetBot,
  getBot,
  listOwnedBots,
  rememberBot,
  requestSharedSampleBot,
  textToBase64,
  uploadBotDocs,
  type UploadFilePayload,
} from './builder/api';
import { SAMPLE_KB_VERSION, type SampleCompany, type SampleLocale } from './sampleKnowledge';

export interface SampleBotState {
  botId: string;
  /** Documentos indexados en el servidor. */
  docsCount: number;
  /** Bot de ejemplo compartido por el servidor. */
  shared: boolean;
}

const inflight = new Map<string, Promise<SampleBotState>>();

export function sampleKeyFor(company: SampleCompany, locale: SampleLocale): string {
  return `${company.key}:${locale}:${SAMPLE_KB_VERSION}`;
}

const BOT_STYLE = { tone: 'friendly', color: '#4F46E5', position: 'br' as const, avatar: '💬' };

function sampleFiles(company: SampleCompany): UploadFilePayload[] {
  return company.docs.map((d) => ({
    name: d.fileName,
    size: new TextEncoder().encode(d.text).length,
    mime: 'text/plain',
    contentBase64: textToBase64(d.text),
  }));
}

/** Olvida el registro local y, si este navegador es el dueño, borra el bot del servidor (sin esperar). */
function discard(botId: string, ownerToken: string | null): void {
  forgetBot(botId);
  if (ownerToken) void deleteBot(botId, ownerToken).catch(() => undefined);
}

/**
 * Bot ya indexado por este navegador para la empresa (sin crear nada).
 * Devuelve null si no hay o si el servidor ya no lo tiene completo.
 * Lanza el error si el servidor no respondió (red, 5xx).
 */
export async function findSampleBot(company: SampleCompany, locale: SampleLocale): Promise<SampleBotState | null> {
  const sampleKey = sampleKeyFor(company, locale);
  const prefix = `${company.key}:${locale}:`;
  const owned = listOwnedBots('sample');

  // Versiones anteriores de los textos de esta empresa: se descartan.
  for (const old of owned.filter((b) => b.sampleKey?.startsWith(prefix) && b.sampleKey !== sampleKey)) {
    discard(old.botId, old.ownerToken);
  }

  const existing = owned.find((b) => b.sampleKey === sampleKey);
  if (!existing) return null;
  try {
    const bot = await getBot(existing.botId);
    const count = docsCountOf(bot);
    if (count >= company.docs.length) return { botId: existing.botId, docsCount: count, shared: !!existing.shared };
    // Le faltan documentos (p. ej. el servidor perdió parte de su estado): se descarta.
    discard(existing.botId, existing.ownerToken);
    return null;
  } catch (err) {
    if (err instanceof BotApiError && err.status === 404) {
      forgetBot(existing.botId);
      return null;
    }
    throw err;
  }
}

async function createSampleBot(company: SampleCompany, locale: SampleLocale, sampleKey: string): Promise<SampleBotState> {
  const config = {
    name: company.name,
    welcome: company.welcome,
    systemPrompt: company.systemPrompt,
    languages: [locale],
    ...BOT_STYLE,
  };
  const files = sampleFiles(company);

  const shared = await requestSharedSampleBot({ sampleKey, config, files });
  if (shared) {
    rememberBot(shared.botId, { name: company.name, kind: 'sample', sampleKey, shared: true, ownerToken: null });
    return { botId: shared.botId, docsCount: shared.docs?.length ?? files.length, shared: true };
  }

  const created = await createBot(config, { kind: 'sample', sampleKey });
  try {
    const uploaded = await uploadBotDocs(created.botId, files);
    return { botId: created.botId, docsCount: uploaded.docs.length, shared: false };
  } catch (err) {
    // Sin documentos el bot no sirve: se borra para no dejarlo a medias.
    discard(created.botId, created.ownerToken ?? null);
    throw err;
  }
}

/** Devuelve el bot listo de la empresa (lo reutiliza, lo pide al servidor o lo crea e indexa). */
export function ensureSampleBot(company: SampleCompany, locale: SampleLocale): Promise<SampleBotState> {
  const key = sampleKeyFor(company, locale);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = (async () => (await findSampleBot(company, locale)) ?? createSampleBot(company, locale, key))().finally(() =>
    inflight.delete(key),
  );
  inflight.set(key, p);
  return p;
}

/** Olvida el bot de la empresa (p. ej. si el servidor perdió sus documentos) para volver a prepararlo. */
export function resetSampleBot(company: SampleCompany, locale: SampleLocale): void {
  const key = sampleKeyFor(company, locale);
  for (const b of listOwnedBots('sample').filter((x) => x.sampleKey === key)) discard(b.botId, b.ownerToken);
}
