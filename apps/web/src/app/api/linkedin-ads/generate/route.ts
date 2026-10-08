import { NextRequest, NextResponse } from 'next/server';
import { API_BASE } from '@/lib/backend-url';

/**
 * Proxy fino hacia el backend: POST /api/linkedin-ads/generate.
 *
 * La generación con OpenAI vive en el backend (apps/backend/src/routes/
 * linkedin-ads.routes.ts), que aplica el acceso a la demo, el límite por cuenta (o por IP) en
 * Redis y el tope de gasto mensual (LINKEDIN_ADS_MONTHLY_BUDGET_USD). Esta
 * ruta solo reenvía:
 *  - el cuerpo JSON tal cual,
 *  - la sesión (cookie `accessToken` → `Authorization: Bearer`),
 *  - la IP del visitante (`X-Forwarded-For`, y `X-Client-IP` firmada con
 *    INTERNAL_API_KEY si está configurada en ambos lados).
 * Si el backend no responde, devuelve 503 con un mensaje honesto y la demo
 * sigue mostrando su generador local.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;
const BACKEND_TIMEOUT_MS = 60_000;

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || req.ip || null;
}

async function refreshAccessToken(refreshToken: string, baseHeaders: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { accessToken?: string } };
    return json?.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

function withRenewedCookie(res: NextResponse, req: NextRequest, token: string | null): NextResponse {
  if (token) {
    res.cookies.set('accessToken', token, {
      path: '/',
      maxAge: 15 * 60,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
    });
  }
  return res;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'La solicitud es demasiado grande.' }, { status: 413 });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const ip = clientIp(req);
  if (ip) {
    headers['X-Forwarded-For'] = ip;
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey) {
      headers['X-Internal-Key'] = internalKey;
      headers['X-Client-IP'] = ip;
    }
  }
  // Sesión: el access token dura 15 min; si su cookie ya venció pero hay
  // refresh token, se renueva aquí (como hace el middleware de /dashboard).
  let token = req.cookies.get('accessToken')?.value;
  let renewedToken: string | null = null;
  const refreshToken = req.cookies.get('refreshToken')?.value;
  if (!token && refreshToken) {
    renewedToken = await refreshAccessToken(refreshToken, headers);
    if (renewedToken) token = renewedToken;
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/linkedin-ads/generate`, {
      method: 'POST',
      headers,
      body: raw,
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: 'El servicio de generación con IA no está disponible en este momento. Usa el generador local.' },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!json || typeof json !== 'object') {
    return NextResponse.json(
      { error: 'El servicio de generación con IA respondió de forma inesperada. Usa el generador local.' },
      { status: upstream.ok ? 502 : upstream.status >= 500 ? 503 : upstream.status },
    );
  }

  // Los errores del backend traen `message` o `error`; la demo muestra `error`
  // seguido de ". Mostrando versión local…", así que va sin punto final.
  const body = json as Record<string, unknown>;
  if (!upstream.ok) {
    const message = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : null;
    if (message) body.error = message.replace(/[.\s]+$/, '');
  }
  const res = NextResponse.json(body, { status: upstream.status });
  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter) res.headers.set('Retry-After', retryAfter);
  return withRenewedCookie(res, req, renewedToken);
}
