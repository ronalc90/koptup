import { SCENARIO_IDS } from './scenarios';
import { CALL_RESULTS, INTENT_KEYS, SENTIMENTS } from './types';
import type { CallResult, CallRow, ScenarioId, Sentiment } from './types';

/**
 * Fila de «Tu prueba» guardada en el navegador con la forma y los valores
 * esperados. Descarta lo que no se puede mostrar bien (por ejemplo, un motivo
 * o un resultado que no existe en los textos de la demo).
 */
export function isCallRow(x: unknown): x is CallRow {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.time === 'string' &&
    /^\d{2}:\d{2}$/.test(r.time) &&
    (r.date === undefined || (typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date))) &&
    typeof r.number === 'string' &&
    (r.direction === 'inbound' || r.direction === 'outbound') &&
    typeof r.intent === 'string' &&
    INTENT_KEYS.includes(r.intent) &&
    typeof r.durationSec === 'number' &&
    Number.isFinite(r.durationSec) &&
    r.durationSec >= 0 &&
    CALL_RESULTS.includes(r.result as CallResult) &&
    SENTIMENTS.includes(r.sentiment as Sentiment) &&
    (r.csat === null || (typeof r.csat === 'number' && r.csat >= 1 && r.csat <= 5)) &&
    (r.scenario === undefined || SCENARIO_IDS.includes(r.scenario as ScenarioId))
  );
}
