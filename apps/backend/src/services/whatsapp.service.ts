/**
 * whatsapp.service.ts — avisos al dueño por WhatsApp con la API oficial de
 * Meta (WhatsApp Cloud API) y una plantilla aprobada.
 *
 * Por qué plantilla: con ~1 aviso al mes la ventana de 24 h casi nunca está
 * abierta, y fuera de ella Meta solo acepta plantillas aprobadas (el texto
 * libre falla con 131047). La plantilla (categoría UTILITY, idioma `es`)
 * se llama por defecto `koptup_aviso` y su cuerpo tiene 2 variables:
 *
 *   Aviso de KopTup: {{1}}. Detalle: {{2}}. Revisa tu correo o el panel de
 *   KopTup para ver todo y responder.
 *
 * Todos los usos (contacto nuevo, pipeline/propuestas, pedidos, prueba y
 * latido) pasan por `sendTemplate(titulo, detalle)`.
 *
 * Proveedor único: `meta` (acepta el valor heredado `whatsapp-business`).
 * Twilio y UltraMsg se retiraron (sandbox que vence a los 3 días / sesión
 * de WhatsApp Web no oficial): con WHATSAPP_PROVIDER=twilio|ultramsg el
 * canal queda "no configurado" y config/env.ts lo avisa al arrancar.
 *
 * Éxito = 2xx con `messages[0].id` (wamid). Si no, el error trae `code`,
 * `error_subcode`, `error_data.details` y `fbtrace_id` del JSON de Meta (sin
 * el token). Timeout 15 s; un reintento inmediato ante 5xx, 429 o red. Si la
 * plantilla propia falla por un error de plantilla (132xxx) y
 * WHATSAPP_HELLO_WORLD_FALLBACK no es `false`, se envía la plantilla de
 * ejemplo `hello_world` (en_US) para que al menos suene el teléfono.
 */
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { cleanErrorText, maskPhone, phoneDigits } from '../utils/mask';
import { providerBaseUrl } from '../utils/provider-url';

export const DEFAULT_GRAPH_URL = 'https://graph.facebook.com';
export const DEFAULT_GRAPH_VERSION = 'v25.0';
export const DEFAULT_TEMPLATE_NAME = 'koptup_aviso';
export const DEFAULT_TEMPLATE_LANG = 'es';
export const HELLO_WORLD_TEMPLATE = 'hello_world';
/** Errores de plantilla de Meta que activan el respaldo `hello_world`. */
export const TEMPLATE_ERROR_CODES = [132000, 132001, 132005, 132007, 132012, 132015, 132016, 132018] as const;
export const TITLE_MAX = 120;
export const DETAIL_MAX = 700;
const DEFAULT_TIMEOUT_MS = 15_000;
const SUPPORTED_PROVIDERS = ['meta', 'whatsapp-business'];

/** Qué revisar según el código de error de Meta (los más comunes). */
const ERROR_HINTS: Record<number, string> = {
  190: 'el token venció o es inválido: crea un token permanente de un usuario del sistema (System User) en el Business Manager',
  100: 'parámetro inválido: revisa WHATSAPP_PHONE_NUMBER_ID y la plantilla',
  10: 'la app no tiene el permiso whatsapp_business_messaging',
  200: 'la app no tiene el permiso whatsapp_business_messaging',
  131030: 'el número de destino no está en la lista de destinatarios permitidos del número de prueba',
  131047: 'pasaron más de 24 h desde el último mensaje: hace falta una plantilla aprobada',
  131026: 'el destinatario no puede recibir el mensaje (¿tiene WhatsApp ese número?)',
  131042: 'problema de pago en la cuenta de WhatsApp Business',
  132000: 'la cantidad de variables no coincide con la plantilla',
  132001: 'la plantilla no existe en ese idioma o aún no está aprobada',
  132005: 'el texto de la plantilla quedó demasiado largo',
  132007: 'la plantilla incumple una política de Meta',
  132012: 'el formato de las variables no coincide con la plantilla',
  132015: 'la plantilla está pausada por baja calidad',
  132016: 'la plantilla está deshabilitada',
  132018: 'una variable de la plantilla trae saltos de línea, tabs o más de 4 espacios seguidos',
  133010: 'el número emisor no está registrado en la Cloud API',
};

export interface WhatsAppSendResult {
  ok: boolean;
  configurado: boolean;
  /** wamid del mensaje (también del respaldo hello_world). */
  id?: string;
  /** Motivo del fallo (sin token). Con respaldo, el error de la plantilla propia. */
  error?: string;
  /** Código de error de Meta (`error.code`). */
  codigo?: number;
  respaldo?: 'hello_world';
}

export interface WhatsAppStatus {
  proveedor: 'meta' | null;
  configurado: boolean;
  /** Destino enmascarado: `+57 *** *** 4567`. */
  destino: string | null;
  plantilla: string | null;
  /** Webhook de estados activo (WHATSAPP_WEBHOOK_VERIFY_TOKEN y WHATSAPP_APP_SECRET). */
  webhook: boolean;
  faltan: string[];
  /** true si WHATSAPP_PROVIDER pide un proveedor retirado (twilio, ultramsg u otro). */
  proveedorNoSoportado: boolean;
}

interface WhatsAppConfig {
  proveedor: 'meta' | null;
  noSoportado: boolean;
  token: string;
  phoneNumberId: string;
  to: string;
  template: string;
  lang: string;
  graphUrl: string;
  /** WHATSAPP_GRAPH_URL apunta a otro host (solo pruebas). */
  graphUrlCustom: boolean;
  /** WHATSAPP_GRAPH_URL se ignoró (en producción solo se acepta localhost). */
  graphUrlIgnored: boolean;
  graphVersion: string;
  helloWorldFallback: boolean;
  appSecret: string;
  verifyToken: string;
  timeoutMs: number;
}

function readConfig(env: NodeJS.ProcessEnv): WhatsAppConfig {
  const raw = env.WHATSAPP_PROVIDER?.trim().toLowerCase() ?? '';
  const token = env.WHATSAPP_API_TOKEN?.trim() ?? '';
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '';
  const noSoportado = raw !== '' && !SUPPORTED_PROVIDERS.includes(raw);
  const anyMetaVar = !!(token || phoneNumberId);
  const graph = providerBaseUrl(env.WHATSAPP_GRAPH_URL, DEFAULT_GRAPH_URL, env);
  return {
    proveedor: noSoportado ? null : raw !== '' || anyMetaVar ? 'meta' : null,
    noSoportado,
    token,
    phoneNumberId,
    to: phoneDigits(env.ADMIN_WHATSAPP_NUMBER),
    template: env.WHATSAPP_TEMPLATE_NAME?.trim() || DEFAULT_TEMPLATE_NAME,
    lang: env.WHATSAPP_TEMPLATE_LANG?.trim() || DEFAULT_TEMPLATE_LANG,
    graphUrl: graph.url,
    graphUrlCustom: graph.custom,
    graphUrlIgnored: graph.ignored,
    graphVersion: env.WHATSAPP_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION,
    helloWorldFallback: env.WHATSAPP_HELLO_WORLD_FALLBACK?.trim().toLowerCase() !== 'false',
    appSecret: env.WHATSAPP_APP_SECRET ?? '',
    verifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '',
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Deja un texto apto para una variable de plantilla de Meta (si no, Meta
 * responde 132018): sin saltos de línea ni tabs (se cambian por ` · ` o
 * espacio), con cualquier espacio Unicode (NBSP, espacios finos, separadores
 * de línea) convertido en espacio normal, sin espacios repetidos, recortado a
 * `max` caracteres y nunca vacío (`-`).
 */
export function sanitizeTemplateParam(value: unknown, max: number): string {
  let text = String(value ?? '')
    .replace(/\r\n?|[\u2028\u2029\u0085]/g, '\n')
    .replace(/\n+/g, ' · ')
    .replace(/\t/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[\u00a0\u1680\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/(?:\s*·\s*){2,}/g, ' · ')
    .replace(/^[\s·]+|[\s·]+$/g, '');
  const chars = Array.from(text);
  if (chars.length > max) text = `${chars.slice(0, max - 1).join('').trimEnd()}…`;
  return text || '-';
}

/** Quita los puntos (y espacios) del final: `Gracias.` → `Gracias`. */
export function withoutFinalPeriod(value: unknown): string {
  return String(value ?? '').replace(/[\s.]+$/u, '');
}

/** Valida la firma `X-Hub-Signature-256` (HMAC-SHA256 del cuerpo crudo) en tiempo constante. */
export function verifyMetaSignature(rawBody: Buffer, header: string | undefined, appSecret: string): boolean {
  if (!appSecret || !header || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(header.slice('sha256='.length), 'hex');
  } catch {
    return false;
  }
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

/** Texto de un error de Meta (`error` del JSON) con qué revisar. */
export function describeMetaError(error: any, httpStatus: number): { text: string; code?: number } {
  const code = typeof error?.code === 'number' ? error.code : undefined;
  const parts = [`Meta ${httpStatus || 'sin conexión'}`];
  if (code !== undefined) parts.push(`código ${code}${error?.error_subcode ? `/${error.error_subcode}` : ''}`);
  let text = parts.join(' ');
  const message = error?.error_user_msg || error?.message;
  if (message) text += `: ${message}`;
  const details = error?.error_data?.details;
  if (details && details !== message) text += ` (${details})`;
  if (code !== undefined && ERROR_HINTS[code]) text += ` → ${ERROR_HINTS[code]}`;
  if (error?.fbtrace_id) text += ` [fbtrace_id ${error.fbtrace_id}]`;
  return { text, code };
}

interface GraphAttempt {
  status: number;
  id?: string;
  error?: string;
  code?: number;
  networkError?: boolean;
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(env: NodeJS.ProcessEnv = process.env, opts: { timeoutMs?: number } = {}) {
    this.config = readConfig(env);
    if (opts.timeoutMs) this.config.timeoutMs = opts.timeoutMs;
  }

  private missing(): string[] {
    // Con un proveedor retirado se nombra WHATSAPP_PROVIDER (hay que
    // cambiarlo a meta) y, además, lo que falte de Meta.
    const faltan: string[] = this.config.noSoportado ? ['WHATSAPP_PROVIDER'] : [];
    if (!this.config.token) faltan.push('WHATSAPP_API_TOKEN');
    if (!this.config.phoneNumberId) faltan.push('WHATSAPP_PHONE_NUMBER_ID');
    if (this.config.to.length < 8 || this.config.to.length > 15) faltan.push('ADMIN_WHATSAPP_NUMBER');
    return faltan;
  }

  isConfigured(): boolean {
    return this.config.proveedor === 'meta' && this.missing().length === 0;
  }

  /** Webhook de estados activo (las dos variables definidas). */
  isWebhookEnabled(): boolean {
    return !!(this.config.appSecret && this.config.verifyToken);
  }

  getAppSecret(): string {
    return this.config.appSecret;
  }

  getVerifyToken(): string {
    return this.config.verifyToken;
  }

  getTemplateName(): string {
    return this.config.template;
  }

  /** Estado sin secretos (para el panel y el log de arranque). */
  getStatus(): WhatsAppStatus {
    const configurado = this.isConfigured();
    return {
      proveedor: this.config.proveedor,
      configurado,
      destino: this.config.to ? maskPhone(this.config.to) : null,
      plantilla: this.config.proveedor === 'meta' ? this.config.template : null,
      webhook: this.isWebhookEnabled(),
      faltan: configurado ? [] : this.missing(),
      proveedorNoSoportado: this.config.noSoportado,
    };
  }

  /** WHATSAPP_GRAPH_URL activa (solo pruebas) o ignorada por apuntar fuera de esta máquina en producción. */
  getGraphUrlOverride(): { custom: boolean; ignored: boolean } {
    return { custom: this.config.graphUrlCustom, ignored: this.config.graphUrlIgnored };
  }

  /** Cuerpo exacto de la petición a Meta para la plantilla propia. */
  buildTemplatePayload(titulo: string, detalle: string): Record<string, unknown> {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.config.to,
      type: 'template',
      template: {
        name: this.config.template,
        language: { code: this.config.lang },
        components: [
          {
            type: 'body',
            parameters: [
              // La plantilla pone un punto después de cada variable: se quita el
              // punto final del texto para no dejar «..».
              { type: 'text', text: sanitizeTemplateParam(withoutFinalPeriod(titulo), TITLE_MAX) },
              { type: 'text', text: sanitizeTemplateParam(withoutFinalPeriod(detalle), DETAIL_MAX) },
            ],
          },
        ],
      },
    };
  }

  private helloWorldPayload(): Record<string, unknown> {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.config.to,
      type: 'template',
      template: { name: HELLO_WORLD_TEMPLATE, language: { code: 'en_US' } },
    };
  }

  private clean(text: unknown): string {
    return cleanErrorText(text, [this.config.token, this.config.appSecret]);
  }

  private async post(body: Record<string, unknown>): Promise<GraphAttempt> {
    const url = `${this.config.graphUrl}/${this.config.graphVersion}/${encodeURIComponent(this.config.phoneNumberId)}/messages`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.config.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      const raw = await res.text().catch(() => '');
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }
      const wamid = json?.messages?.[0]?.id;
      if (res.ok && typeof wamid === 'string' && wamid) return { status: res.status, id: wamid };
      if (json?.error) {
        const { text, code } = describeMetaError(json.error, res.status);
        return { status: res.status, error: this.clean(text), code };
      }
      return { status: res.status, error: this.clean(res.ok ? 'Meta respondió sin id de mensaje (wamid)' : `Meta ${res.status}: ${raw || res.statusText}`) };
    } catch (err) {
      const e = err as Error;
      const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      return {
        status: 0,
        networkError: true,
        error: timeout
          ? `Meta sin respuesta en ${this.config.timeoutMs >= 1000 ? `${Math.round(this.config.timeoutMs / 1000)} s` : `${this.config.timeoutMs} ms`}`
          : this.clean(`Meta sin conexión: no se pudo conectar con el proveedor (${e?.message ?? err})`),
      };
    }
  }

  /** Una petición y, ante 5xx, 429 o error de red, un reintento inmediato. */
  private async postWithRetry(body: Record<string, unknown>): Promise<GraphAttempt> {
    const first = await this.post(body);
    if (first.id || !(first.networkError || first.status === 429 || first.status >= 500)) return first;
    logger.warn(`[whatsapp] ${first.error}. Reintento una vez.`);
    return this.post(body);
  }

  /**
   * Envía la plantilla de aviso con (titulo, detalle) al número del dueño.
   * Nunca lanza.
   */
  async sendTemplate(titulo: string, detalle: string): Promise<WhatsAppSendResult> {
    if (!this.isConfigured()) {
      const faltan = this.missing();
      const error = this.config.noSoportado
        ? 'WhatsApp no configurado: WHATSAPP_PROVIDER pide un proveedor retirado (usa meta)'
        : `WhatsApp no configurado: falta ${faltan.join(', ')}`;
      logger.warn(`[whatsapp] ${error}`);
      return { ok: false, configurado: false, error };
    }
    const dest = maskPhone(this.config.to);
    const first = await this.postWithRetry(this.buildTemplatePayload(titulo, detalle));
    if (first.id) {
      logger.info(`✅ WhatsApp (plantilla ${this.config.template}) enviado a ${dest} (wamid ${first.id})`);
      return { ok: true, configurado: true, id: first.id };
    }
    logger.error(`❌ WhatsApp (plantilla ${this.config.template}) a ${dest} falló: ${first.error}`);

    if (this.config.helloWorldFallback && first.code !== undefined && (TEMPLATE_ERROR_CODES as readonly number[]).includes(first.code)) {
      const fallback = await this.postWithRetry(this.helloWorldPayload());
      if (fallback.id) {
        logger.warn(`[whatsapp] Se envió la plantilla de respaldo hello_world a ${dest} (wamid ${fallback.id}). Revisa la plantilla ${this.config.template} en Meta.`);
        return { ok: true, configurado: true, id: fallback.id, respaldo: 'hello_world', codigo: first.code, error: first.error };
      }
      logger.error(`❌ WhatsApp respaldo hello_world también falló: ${fallback.error}`);
      return {
        ok: false,
        configurado: true,
        codigo: first.code,
        error: this.clean(`${first.error} | respaldo hello_world: ${fallback.error}`),
      };
    }
    return { ok: false, configurado: true, codigo: first.code, error: first.error };
  }

  /**
   * Aviso interno al equipo (pipeline comercial y propuestas). Devuelve
   * false, sin lanzar, si no está configurado o falla.
   */
  async sendTeamMessage(titulo: string, detalle: string): Promise<boolean> {
    return (await this.sendTemplate(titulo, detalle)).ok;
  }

  /** Aviso de un pedido nuevo del portal. Devuelve false, sin lanzar, si falla. */
  async sendOrderNotification(orderData: {
    orderId: string;
    name: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    hasAttachments: boolean;
  }): Promise<boolean> {
    const items = orderData.items
      .slice(0, 5)
      .map((i) => `${i.name} (x${i.quantity})`)
      .join(', ');
    const more = orderData.items.length > 5 ? ` y ${orderData.items.length - 5} más` : '';
    const detalle = [
      `${orderData.name}`,
      `Cliente: ${orderData.clientName}${orderData.clientEmail ? ` (${orderData.clientEmail})` : ''}`,
      `Monto: USD ${Number(orderData.amount || 0).toFixed(2)}`,
      items ? `Ítems: ${items}${more}` : '',
      orderData.hasAttachments ? 'Con adjuntos' : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return (await this.sendTemplate(`Nuevo pedido ${orderData.orderId}`, detalle)).ok;
  }
}

// Instancia única con la configuración del entorno.
export const whatsappService = new WhatsAppService();
export default whatsappService;
