/**
 * wompi.service.ts — integración OPCIONAL con Wompi (Colombia) para cobrar el
 * anticipo de una propuesta en COP con el Web Checkout.
 *
 * Se activa solo si existen WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET,
 * WOMPI_EVENTS_SECRET y WOMPI_ENV (sandbox | production). Sin ellas el botón
 * "Pagar anticipo con Wompi" no aparece y el webhook responde 404.
 *
 * Fórmulas verificadas contra la documentación oficial (docs.wompi.co,
 * octubre de 2026):
 *  - Firma de integridad (Widget & Checkout Web): SHA-256 de
 *    `<referencia><montoEnCentavos><moneda>[<expiracion>]<secretoIntegridad>`,
 *    calculada en el servidor. El ejemplo de la documentación
 *    ("sk8-438k4-xmxm392-sn2m" + "2490000" + "COP" + secreto) da
 *    37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5 y lo
 *    reproduce la prueba unitaria.
 *  - Web Checkout: GET https://checkout.wompi.co/p/ con public-key,
 *    currency, amount-in-cents, reference, signature:integrity y
 *    redirect-url (el mismo URL para sandbox y producción: el ambiente lo da
 *    la llave pública pub_test_… / pub_prod_…).
 *  - Eventos (webhook): SHA-256 de los valores de `signature.properties`
 *    (rutas dentro de `data`, en ese orden) + `timestamp` + secreto de
 *    eventos; se compara con `signature.checksum` (también llega en la
 *    cabecera X-Event-Checksum). El checksum de ejemplo que muestra la
 *    documentación no corresponde a su propia cadena de ejemplo, así que la
 *    prueba usa la fórmula, no ese valor. `environment` es `test` en sandbox
 *    y `prod` en producción. Wompi reintenta si la respuesta no es 200.
 */
import crypto from 'crypto';

export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';
export const WOMPI_CURRENCY = 'COP';

export type WompiEnv = 'sandbox' | 'production';

export interface WompiConfig {
  publicKey: string;
  integritySecret: string;
  eventsSecret: string;
  env: WompiEnv;
}

export interface WompiConfigStatus {
  enabled: boolean;
  config: WompiConfig | null;
  /** Por qué está apagada (sin valores secretos). */
  reason?: 'faltan_variables' | 'ambiente_invalido' | 'llave_no_coincide_con_ambiente';
}

export function readWompiConfig(env: NodeJS.ProcessEnv = process.env): WompiConfigStatus {
  const publicKey = env.WOMPI_PUBLIC_KEY?.trim() ?? '';
  const integritySecret = env.WOMPI_INTEGRITY_SECRET?.trim() ?? '';
  const eventsSecret = env.WOMPI_EVENTS_SECRET?.trim() ?? '';
  const rawEnv = env.WOMPI_ENV?.trim().toLowerCase() ?? '';
  if (!publicKey || !integritySecret || !eventsSecret) return { enabled: false, config: null, reason: 'faltan_variables' };
  if (rawEnv !== 'sandbox' && rawEnv !== 'production') return { enabled: false, config: null, reason: 'ambiente_invalido' };
  // Una llave de pruebas con WOMPI_ENV=production (o al revés) haría que los
  // eventos nunca coincidan con el ambiente: mejor no ofrecer el botón.
  if ((rawEnv === 'sandbox' && publicKey.startsWith('pub_prod_')) || (rawEnv === 'production' && publicKey.startsWith('pub_test_'))) {
    return { enabled: false, config: null, reason: 'llave_no_coincide_con_ambiente' };
  }
  return { enabled: true, config: { publicKey, integritySecret, eventsSecret, env: rawEnv } };
}

export function getWompiConfig(env: NodeJS.ProcessEnv = process.env): WompiConfig | null {
  return readWompiConfig(env).config;
}

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Firma de integridad del Web Checkout. */
export function integritySignature(
  args: { reference: string; amountInCents: number; currency: string; expirationTime?: string },
  integritySecret: string,
): string {
  if (!Number.isInteger(args.amountInCents) || args.amountInCents <= 0) throw new Error('amountInCents debe ser un entero positivo');
  return sha256Hex(`${args.reference}${args.amountInCents}${args.currency}${args.expirationTime ?? ''}${integritySecret}`);
}

export function buildCheckoutUrl(args: {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  redirectUrl?: string;
  customerEmail?: string;
  customerName?: string;
}): string {
  const params = new URLSearchParams();
  params.set('public-key', args.publicKey);
  params.set('currency', args.currency);
  params.set('amount-in-cents', String(args.amountInCents));
  params.set('reference', args.reference);
  params.set('signature:integrity', args.signature);
  if (args.redirectUrl) params.set('redirect-url', args.redirectUrl);
  if (args.customerEmail) params.set('customer-data:email', args.customerEmail);
  if (args.customerName) params.set('customer-data:full-name', args.customerName);
  return `${WOMPI_CHECKOUT_URL}?${params.toString()}`;
}

/** Referencia única por intento de pago: `<número de propuesta>-<sufijo>`. */
export function makePaymentReference(numero: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (const b of crypto.randomBytes(8)) suffix += alphabet[b % alphabet.length];
  return `${numero}-${suffix}`;
}

/** Número de propuesta de una referencia (null si no tiene el formato). */
export function proposalNumberFromReference(reference: string): string | null {
  const m = /^(KOP-\d{4}-\d{4,})-[A-Z0-9]{6,16}$/.exec(reference);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
//   Eventos
// ---------------------------------------------------------------------------

export interface WompiTransaction {
  id?: string;
  amount_in_cents?: number;
  reference?: string;
  currency?: string;
  status?: string;
  customer_email?: string;
  payment_method_type?: string;
}

export interface WompiEvent {
  event?: string;
  data?: { transaction?: WompiTransaction } & Record<string, unknown>;
  environment?: string;
  signature?: { properties?: unknown; checksum?: unknown };
  timestamp?: unknown;
  sent_at?: string;
}

function valueAtPath(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * Checksum esperado de un evento, o null si el evento no trae lo necesario
 * (propiedades, valores escalares y timestamp).
 */
export function computeEventChecksum(event: WompiEvent, eventsSecret: string): string | null {
  const props = event?.signature?.properties;
  if (!Array.isArray(props) || props.length === 0 || props.length > 20) return null;
  const ts = event.timestamp;
  if (typeof ts !== 'number' && typeof ts !== 'string') return null;
  let concatenated = '';
  for (const prop of props) {
    if (typeof prop !== 'string' || !/^[A-Za-z0-9_.]{1,100}$/.test(prop)) return null;
    const value = valueAtPath(event.data, prop);
    if (value === undefined || value === null || typeof value === 'object') return null;
    concatenated += String(value);
  }
  return sha256Hex(`${concatenated}${ts}${eventsSecret}`);
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a.toLowerCase(), 'utf8');
  const y = Buffer.from(b.toLowerCase(), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Verifica el checksum de un evento (el del cuerpo y, si llega, el de la
 * cabecera X-Event-Checksum deben coincidir con el calculado).
 */
export function verifyEventChecksum(event: WompiEvent, eventsSecret: string, headerChecksum?: string | null): boolean {
  const expected = computeEventChecksum(event, eventsSecret);
  if (!expected) return false;
  const bodyChecksum = typeof event.signature?.checksum === 'string' ? event.signature.checksum : '';
  if (!bodyChecksum || !safeEqualHex(expected, bodyChecksum)) return false;
  if (headerChecksum && !safeEqualHex(expected, headerChecksum)) return false;
  return true;
}

/** Valor de `environment` de los eventos para un ambiente. */
export function eventEnvironmentFor(env: WompiEnv): 'test' | 'prod' {
  return env === 'production' ? 'prod' : 'test';
}
