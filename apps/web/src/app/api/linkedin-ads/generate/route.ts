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
 *
 * Errores: el formato único de la API `{ success: false, code, message }`
 * (los del backend pasan tal cual: `budget_exhausted`, `limits_unavailable`,
 * `ai_not_configured`, `rate_limited`…). Además se agrega `error` (el mismo
 * `message` sin punto final) porque la demo lo muestra seguido de
 * ". Mostrando versión local…"; se puede quitar cuando la demo lea `message`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;
const BACKEND_TIMEOUT_MS = 60_000;

/** Respuesta de error con el formato único (y `error` para la demo). */
function errorResponse(status: number, code: string, message: string, extra: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ ...extra, success: false, code, message, error: message.replace(/[.\s]+$/, '') }, { status });
}

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
    return errorResponse(413, 'payload_too_large', 'La solicitud es demasiado grande.');
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
    return errorResponse(503, 'service_unavailable', 'El servicio de generación con IA no está disponible en este momento. Usa el generador local.');
  }

  const text = await upstream.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!json || typeof json !== 'object') {
    return errorResponse(
      upstream.ok ? 502 : upstream.status >= 500 ? 503 : upstream.status,
      'unexpected_response',
      'El servicio de generación con IA respondió de forma inesperada. Usa el generador local.',
    );
  }

  const body = json as Record<string, unknown>;
  let res: NextResponse;
  if (upstream.ok) {
    res = NextResponse.json(body, { status: upstream.status });
  } else {
    // Errores del backend: formato único; se completa si faltara algún campo.
    const code = typeof body.code === 'string' ? body.code : 'upstream_error';
    const message =
      typeof body.message === 'string' && body.message.trim()
        ? body.message
        : 'No pudimos generar el contenido con IA. Usa el generador local.';
    const { success: _success, code: _code, message: _message, error: _error, ...extra } = body;
    res = errorResponse(upstream.status, code, message, extra);
  }
  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter) res.headers.set('Retry-After', retryAfter);
  return withRenewedCookie(res, req, renewedToken);
}
