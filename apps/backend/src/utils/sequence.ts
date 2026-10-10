/**
 * sequence.ts — consecutivos legibles de los registros del portal
 * (ORD-0001, FAC-2026-0001, DEL-0001, CONV-0001, MSG-000001).
 *
 * Se asignan en `pre('validate')` (antes, se generaban en `pre('save')`, que
 * corre DESPUÉS de validar: el campo era obligatorio y todo guardado fallaba).
 * El número sale del contador atómico de `models/Counter.ts`: dos guardados
 * simultáneos nunca reciben el mismo número.
 *
 * Compatibilidad con los registros anteriores (numerados contando
 * documentos): la primera vez que el proceso usa un contador, lo sube hasta
 * el número de documentos existentes con ese prefijo, y si aun así el número
 * ya existe, pide el siguiente (pocas veces, nunca en bucle infinito).
 */
import mongoose from 'mongoose';
import { Counter, nextSequence } from '../models/Counter';

const MAX_ATTEMPTS = 25;
const synced = new Set<string>();

export interface SequenceSpec {
  /** Nombre del modelo (p. ej. `Invoice`). */
  model: string;
  /** Campo donde va el consecutivo (p. ej. `invoiceNumber`). */
  field: string;
  /** Clave del contador (p. ej. `invoice:2026`). */
  key: string;
  /** Prefijo del número (p. ej. `FAC-2026-`). */
  prefix: string;
  /** Dígitos con ceros a la izquierda. */
  pad: number;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sube el contador hasta los documentos que ya existen con el prefijo (una vez por proceso). */
async function syncCounter(spec: SequenceSpec): Promise<void> {
  if (synced.has(spec.key)) return;
  const Model = mongoose.model(spec.model);
  const existing = await Model.countDocuments({ [spec.field]: { $regex: `^${escapeRegex(spec.prefix)}` } });
  if (existing > 0) {
    await Counter.updateOne({ _id: spec.key }, { $max: { seq: existing } }, { upsert: true });
  }
  synced.add(spec.key);
}

/** Siguiente número libre del consecutivo (`FAC-2026-0007`). */
export async function nextSequentialId(spec: SequenceSpec): Promise<string> {
  await syncCounter(spec);
  const Model = mongoose.model(spec.model);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const seq = await nextSequence(spec.key);
    const candidate = `${spec.prefix}${String(seq).padStart(spec.pad, '0')}`;
    if (!(await Model.exists({ [spec.field]: candidate }))) return candidate;
  }
  throw new Error(`No se pudo asignar un consecutivo libre para ${spec.model}.${spec.field}`);
}

/** Solo para pruebas: olvida qué contadores ya se sincronizaron en este proceso. */
export function resetSequenceSyncCache(): void {
  synced.clear();
}
