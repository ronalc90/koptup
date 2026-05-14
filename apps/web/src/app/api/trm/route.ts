/**
 * TRM (Tasa Representativa del Mercado) USD/COP en vivo.
 *
 * Fuentes (en orden de preferencia):
 *   1. datos.gov.co — portal oficial de datos abiertos del gobierno colombiano
 *      (TRM publicada por el Banco de la República).
 *   2. open.er-api.com — proveedor gratuito sin auth como respaldo.
 *   3. Fallback estático de $4.000 si ambas fuentes fallan.
 *
 * Se cachea por 6 horas (la TRM se actualiza una vez al día hábil).
 */

import { NextResponse } from 'next/server';

export const revalidate = 21600; // 6h en segundos

const FALLBACK_TRM = 4000;
const TRM_PRIMARY =
  'https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC';
const TRM_BACKUP = 'https://open.er-api.com/v6/latest/USD';
const FETCH_TIMEOUT_MS = 8000;

interface DatosGovRow {
  valor?: string;
  vigenciadesde?: string;
  vigenciahasta?: string;
}

interface ErApiResponse {
  rates?: { COP?: number };
}

function isReasonableRate(value: number): boolean {
  return Number.isFinite(value) && value > 100 && value < 100_000;
}

async function fetchPrimary(): Promise<number | null> {
  try {
    const res = await fetch(TRM_PRIMARY, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DatosGovRow[];
    const raw = data?.[0]?.valor ?? '';
    const value = parseFloat(raw);
    return isReasonableRate(value) ? value : null;
  } catch {
    return null;
  }
}

async function fetchBackup(): Promise<number | null> {
  try {
    const res = await fetch(TRM_BACKUP, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ErApiResponse;
    const value = data?.rates?.COP;
    return typeof value === 'number' && isReasonableRate(value) ? value : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const primary = await fetchPrimary();
  const backup = primary === null ? await fetchBackup() : null;
  const value = primary ?? backup ?? FALLBACK_TRM;
  const source: 'live' | 'fallback' =
    primary !== null || backup !== null ? 'live' : 'fallback';
  const provider =
    primary !== null ? 'datos.gov.co' : backup !== null ? 'open.er-api.com' : 'fallback';

  return NextResponse.json({
    rate: value,
    currency: 'COP',
    base: 'USD',
    source,
    provider,
    updatedAt: new Date().toISOString(),
  });
}
