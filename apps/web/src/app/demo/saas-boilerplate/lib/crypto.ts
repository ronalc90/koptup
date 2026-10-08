/**
 * Cálculos criptográficos reales con Web Crypto (en tu navegador):
 * - CUFE de ejemplo: SHA-384 con la fórmula del anexo técnico de factura
 *   electrónica de la DIAN, pero con una clave técnica ficticia y ambiente de
 *   pruebas, así que NO es válido ante la DIAN.
 * - Firma de webhooks: HMAC SHA-256 de "timestamp.cuerpo".
 * - Segundo factor: TOTP (RFC 6238, HMAC-SHA1, 6 dígitos, 30 s).
 */
import { VENDOR } from './data';
import type { Invoice, Tenant } from './types';

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function subtle(): SubtleCrypto | null {
  return typeof crypto !== 'undefined' && crypto.subtle ? crypto.subtle : null;
}

export async function sha384Hex(input: string): Promise<string | null> {
  const s = subtle();
  if (!s) return null;
  return toHex(await s.digest('SHA-384', enc.encode(input)));
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string | null> {
  const s = subtle();
  if (!s) return null;
  const key = await s.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await s.sign('HMAC', key, enc.encode(message)));
}

export const DEMO_TECH_KEY = 'clave-tecnica-ficticia-demo';
export const DEMO_ENVIRONMENT = '2';

/** Cadena de entrada del CUFE (NumFac+FecFac+HorFac+ValFac+impuestos+ValTot+NitOFE+NumAdq+ClTec+TipoAmb). */
export function cufeInput(inv: Invoice, buyer: Tenant): string {
  const f2 = (n: number) => n.toFixed(2);
  const [date, time] = inv.issuedAt.split('T');
  return [
    inv.number,
    date,
    `${time}:00-05:00`,
    f2(inv.subtotal),
    '01', f2(inv.iva),
    '04', f2(0),
    '03', f2(0),
    f2(inv.total),
    VENDOR.nit,
    buyer.nit,
    DEMO_TECH_KEY,
    DEMO_ENVIRONMENT,
  ].join('');
}

function base32Decode(s: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = s.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/** Código TOTP de 6 dígitos para el instante dado (ms). */
export async function totp(secretBase32: string, atMs: number, step = 30): Promise<string | null> {
  const s = subtle();
  if (!s) return null;
  const counter = Math.floor(atMs / 1000 / step);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const key = await s.importKey('raw', base32Decode(secretBase32), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const mac = new Uint8Array(await s.sign('HMAC', key, msg));
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 1_000_000).padStart(6, '0');
}
