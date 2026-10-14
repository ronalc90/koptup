import mongoose, { Schema } from 'mongoose';

/**
 * Contadores atómicos para consecutivos (p. ej. `proposal:2026` → número de
 * propuesta KOP-2026-0001). Se incrementan con
 * `findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { upsert: true, new: true })`:
 * dos peticiones simultáneas nunca reciben el mismo número.
 */
export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);

/** Siguiente valor del contador `key` (1, 2, 3…). */
export async function nextSequence(key: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { upsert: true, new: true }).lean();
  return doc!.seq;
}

export default Counter;
