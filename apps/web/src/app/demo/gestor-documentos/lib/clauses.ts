/**
 * Detección de cláusulas por reglas sobre el texto del documento abierto
 * (en el navegador). Separa el texto en cláusulas por su encabezado
 * ("CLÁUSULA QUINTA – PLAZO." o "QUINTA.") y clasifica cada una por palabras
 * clave; el nivel de riesgo sale de reglas simples (porcentaje de la cláusula
 * penal, prórroga automática, indemnización sin tope…). En un proyecto real se
 * hace con IA y la revisa un abogado.
 */
import { normalize } from './search';

export type ClauseType =
  | 'payment'
  | 'penalty'
  | 'renewal'
  | 'termination'
  | 'confidentiality'
  | 'indemnity'
  | 'guarantee'
  | 'term'
  | 'dispute';

export type Risk = 'low' | 'medium' | 'high';

export interface DetectedClause {
  type: ClauseType;
  heading: string;
  excerpt: string;
  risk: Risk;
  /** Clave del motivo del riesgo (textos en messages) y su porcentaje si aplica. */
  reason: string;
  percent?: number;
}

const HEADING = /^\s*(CL[ÁA]USULA\s+[A-ZÁÉÍÓÚÑ]+[^\n.]*\.|(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA)[^\n.]*\.)/;

/** Separa el texto en bloques que empiezan por un encabezado de cláusula. */
export function splitClauses(text: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = [];
  let current: { heading: string; body: string } | null = null;
  for (const line of text.split('\n')) {
    const m = HEADING.exec(line);
    if (m) {
      if (current) out.push(current);
      current = { heading: m[1].replace(/\.$/, '').trim(), body: line.slice(m[0].length).trim() };
    } else if (current && line.trim()) {
      current.body += ` ${line.trim()}`;
    }
  }
  if (current) out.push(current);
  return out;
}

function maxPercent(norm: string): number | undefined {
  const nums = Array.from(norm.matchAll(/(\d{1,3}(?:[.,]\d+)?)\s*(?:%|por ciento)/g)).map((m) => Number(m[1].replace(',', '.')));
  return nums.length ? Math.max(...nums) : undefined;
}

const AUTO_RENEWAL = /prorroga automatica|prorrogara automaticamente|renovara automaticamente|renovacion automatica/;

function classify(norm: string): ClauseType | null {
  if (/clausula penal|penalidad|\bmultas?\b/.test(norm)) return 'penalty';
  if (/indemni|mantendra indemne/.test(norm)) return 'indemnity';
  if (/confidencial|reserva/.test(norm)) return 'confidentiality';
  if (/terminacion|dar por terminado|terminar el contrato|preaviso/.test(norm)) return 'termination';
  if (/poliza|garantia|amparo/.test(norm)) return 'guarantee';
  if (/controversia|conciliacion|arbitraje|tribunal/.test(norm)) return 'dispute';
  if (/\bpago|anticipo|factura|canon|honorario|precio|remuneracion|salario|\bvalor/.test(norm)) return 'payment';
  if (/plazo|vigencia|duracion/.test(norm)) return 'term';
  return null;
}

function assess(type: ClauseType, norm: string): { risk: Risk; reason: string; percent?: number } {
  const pct = maxPercent(norm);
  switch (type) {
    case 'penalty':
      if (pct === undefined) return { risk: 'medium', reason: 'penaltyNoPercent' };
      return { risk: pct >= 15 ? 'high' : pct >= 10 ? 'medium' : 'low', reason: 'penaltyPercent', percent: pct };
    case 'renewal':
      return { risk: 'medium', reason: 'renewal' };
    case 'indemnity':
      return /todo dano|sin limite|ilimitad/.test(norm) ? { risk: 'high', reason: 'indemnityUnlimited' } : { risk: 'medium', reason: 'indemnity' };
    case 'termination':
      if (/sin (lugar a )?(penalidad|indemnizacion)/.test(norm)) return { risk: 'medium', reason: 'terminationFree' };
      if (/indemnizacion|penalidad|pagara/.test(norm)) return { risk: 'medium', reason: 'terminationCost' };
      return { risk: 'low', reason: 'termination' };
    case 'payment': {
      const days = /(\d{1,3})\s*dias/.exec(norm);
      if (days && Number(days[1]) > 45) return { risk: 'medium', reason: 'paymentLong' };
      return { risk: 'low', reason: 'payment' };
    }
    case 'guarantee':
      return { risk: 'low', reason: 'guarantee' };
    case 'confidentiality':
      return { risk: 'low', reason: 'confidentiality' };
    case 'dispute':
      return { risk: 'low', reason: 'dispute' };
    default:
      return { risk: 'low', reason: 'term' };
  }
}

export function detectClauses(text: string): DetectedClause[] {
  const out: DetectedClause[] = [];
  for (const { heading, body } of splitClauses(text)) {
    const norm = normalize(`${heading} ${body}`);
    // La prórroga automática pesa más que el tema del encabezado; si no hay,
    // manda el encabezado ("CLÁUSULA OCTAVA – CLÁUSULA PENAL") y luego el cuerpo.
    const type = AUTO_RENEWAL.test(norm) ? 'renewal' : classify(normalize(heading)) ?? classify(normalize(body));
    if (!type) continue;
    const { risk, reason, percent } = assess(type, norm);
    const excerpt = body.length > 220 ? `${body.slice(0, 217).replace(/\s+\S*$/, '')}…` : body;
    out.push({ type, heading, excerpt, risk, reason, percent });
  }
  return out;
}

export function hasClauses(text: string | undefined): boolean {
  return Boolean(text) && splitClauses(text as string).length > 0;
}
