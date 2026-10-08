/**
 * safe-fetch.service.ts — descarga de URLs públicas con protección SSRF.
 *
 * Lo usa la ingesta de URLs del chatbot. Reglas:
 *  - Solo http/https, sin usuario:contraseña en la URL y solo puertos 80/443.
 *  - El nombre se resuelve por DNS y se rechaza si CUALQUIER dirección es
 *    privada, loopback, link-local (incluido 169.254.169.254, metadatos de la
 *    nube), multicast o reservada (IPv4 e IPv6, también IPv4 mapeada).
 *  - La conexión usa exactamente la dirección validada (función `lookup`
 *    propia), así un cambio de DNS entre la validación y la conexión
 *    (DNS rebinding) no lleva a una IP interna.
 *  - Redirecciones manuales (máximo 3), validando cada destino.
 *  - Tope de bytes (se corta la descarga al superarlo), tiempo máximo y tipos
 *    de contenido permitidos (HTML y texto).
 */
import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';

export class SafeFetchError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(reason);
    this.reason = reason;
  }
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function isBlockedIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

/** Expande una IPv6 a 8 grupos de 16 bits. */
function expandIPv6(ip: string): number[] | null {
  let addr = ip.split('%')[0].toLowerCase();
  // IPv4 incrustada al final (::ffff:1.2.3.4)
  const v4Match = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match) {
    const v4 = ipv4ToInt(v4Match[1]);
    addr = addr.replace(v4Match[1], `${((v4 >>> 16) & 0xffff).toString(16)}:${(v4 & 0xffff).toString(16)}`);
  }
  const [head, tail] = addr.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined && tail !== '' ? tail.split(':') : [];
  if (addr.includes('::')) {
    const missing = 8 - headParts.length - tailParts.length;
    if (missing < 0) return null;
    const groups = [...headParts, ...Array(missing).fill('0'), ...tailParts];
    return groups.map((g) => parseInt(g, 16));
  }
  if (headParts.length !== 8) return null;
  return headParts.map((g) => parseInt(g, 16));
}

function isBlockedIPv6(ip: string): boolean {
  const g = expandIPv6(ip);
  if (!g || g.some((x) => !Number.isFinite(x))) return true;
  const allZeroPrefix = (n: number) => g.slice(0, n).every((x) => x === 0);
  // :: y ::1
  if (allZeroPrefix(7) && (g[7] === 0 || g[7] === 1)) return true;
  // IPv4 mapeada (::ffff:a.b.c.d) o compatible (::a.b.c.d)
  if (allZeroPrefix(5) && (g[5] === 0xffff || g[5] === 0)) {
    const v4 = `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
    return isBlockedIPv4(v4);
  }
  // NAT64 64:ff9b::/96
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    const v4 = `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
    return isBlockedIPv4(v4);
  }
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 (ULA, incluye metadatos de AWS IPv6)
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (obsoleta)
  if ((g[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentación
  if (g[0] === 0x0100 && g.slice(1, 4).every((x) => x === 0)) return true; // 100::/64 descarte
  return false;
}

/** true si la dirección no es pública (no se debe contactar). */
export function isBlockedAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedIPv4(ip);
  if (family === 6) return isBlockedIPv6(ip);
  return true;
}

type LookupFn = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

const defaultLookup: LookupFn = (hostname) => dns.promises.lookup(hostname, { all: true, verbatim: true });

/** Valida la URL y devuelve la dirección pública a la que se conectará. */
export async function resolvePublicTarget(
  rawUrl: string,
  lookup: LookupFn = defaultLookup,
): Promise<{ url: URL; address: string; family: number }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError('invalid_url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new SafeFetchError('invalid_url');
  if (url.username || url.password) throw new SafeFetchError('invalid_url');
  if (url.port && url.port !== '80' && url.port !== '443') throw new SafeFetchError('blocked_port');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host) throw new SafeFetchError('invalid_url');

  let addresses: Array<{ address: string; family: number }>;
  if (net.isIP(host)) {
    addresses = [{ address: host, family: net.isIP(host) }];
  } else {
    try {
      addresses = await lookup(host);
    } catch {
      throw new SafeFetchError('dns_failed');
    }
  }
  if (addresses.length === 0) throw new SafeFetchError('dns_failed');
  if (addresses.some((a) => isBlockedAddress(a.address))) throw new SafeFetchError('blocked_address');
  return { url, address: addresses[0].address, family: addresses[0].family };
}

export interface SafeFetchOptions {
  maxBytes: number;
  timeoutMs: number;
  maxRedirects?: number;
  allowedContentTypes?: string[];
  lookup?: LookupFn;
  userAgent?: string;
}

export interface SafeFetchResult {
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
}

function requestOnce(
  target: { url: URL; address: string; family: number },
  opts: SafeFetchOptions,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const isHttps = target.url.protocol === 'https:';
    const mod = isHttps ? https : http;
    const req = mod.request(
      {
        protocol: target.url.protocol,
        hostname: target.url.hostname.replace(/^\[|\]$/g, ''),
        port: target.url.port || (isHttps ? 443 : 80),
        path: `${target.url.pathname}${target.url.search}`,
        method: 'GET',
        headers: {
          'User-Agent': opts.userAgent ?? 'Koptup-Chatbot-Indexer/1.0',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
          'Accept-Encoding': 'identity',
        },
        // Conecta SIEMPRE a la dirección ya validada (evita DNS rebinding).
        lookup: (_hostname: string, options: any, cb: any) => {
          if (options && options.all) cb(null, [{ address: target.address, family: target.family }]);
          else cb(null, target.address, target.family);
        },
        timeout: opts.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > opts.maxBytes) {
            req.destroy(new SafeFetchError('too_large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on('error', reject);
      },
    );
    const deadline = setTimeout(() => req.destroy(new SafeFetchError('timeout')), opts.timeoutMs);
    req.on('timeout', () => req.destroy(new SafeFetchError('timeout')));
    req.on('error', (err) => {
      clearTimeout(deadline);
      reject(err instanceof SafeFetchError ? err : new SafeFetchError('fetch_failed'));
    });
    req.on('close', () => clearTimeout(deadline));
    req.end();
  });
}

/** GET de una URL pública con las reglas del encabezado. */
export async function safeFetchText(rawUrl: string, opts: SafeFetchOptions): Promise<SafeFetchResult> {
  const maxRedirects = opts.maxRedirects ?? 3;
  const allowed = opts.allowedContentTypes ?? ['text/html', 'application/xhtml+xml', 'text/plain'];
  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const target = await resolvePublicTarget(current, opts.lookup);
    const res = await requestOnce(target, opts);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      current = new URL(String(res.headers.location), target.url).toString();
      continue;
    }
    if (res.status < 200 || res.status >= 300) throw new SafeFetchError(`http_${res.status}`);
    const contentType = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (contentType && !allowed.includes(contentType)) throw new SafeFetchError('unsupported_content_type');
    return { finalUrl: target.url.toString(), status: res.status, contentType, body: res.body.toString('utf-8') };
  }
  throw new SafeFetchError('too_many_redirects');
}
