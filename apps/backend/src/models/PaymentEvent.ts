import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Evento de una pasarela de pago ya procesado (idempotencia del webhook).
 * `clave` es única: `wompi:<transaction.id>:<status>`. Si Wompi reintenta el
 * mismo evento, el índice único lo detecta y se responde 200 sin volver a
 * aplicarlo. Solo se guardan los campos necesarios (sin datos de tarjeta).
 */
export const PAYMENT_EVENT_RESULTS = [
  'aplicado',
  'ya_pagada',
  'no_aprobado',
  'referencia_desconocida',
  'monto_no_coincide',
  'moneda_no_coincide',
  'ambiente_no_coincide',
  'estado_no_permite',
  'ignorado',
] as const;
export type PaymentEventResult = (typeof PAYMENT_EVENT_RESULTS)[number];

export interface IPaymentEvent extends Document {
  proveedor: 'wompi';
  clave: string;
  evento: string;
  transaccionId?: string;
  referencia?: string;
  estado?: string;
  montoCentavos?: number;
  moneda?: string;
  ambiente?: string;
  propuesta?: Types.ObjectId | null;
  resultado: PaymentEventResult;
  createdAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    proveedor: { type: String, enum: ['wompi'], required: true },
    clave: { type: String, required: true, unique: true, maxlength: 300 },
    evento: { type: String, required: true, maxlength: 100 },
    transaccionId: { type: String, maxlength: 120 },
    referencia: { type: String, maxlength: 120 },
    estado: { type: String, maxlength: 40 },
    montoCentavos: { type: Number },
    moneda: { type: String, maxlength: 10 },
    ambiente: { type: String, maxlength: 20 },
    propuesta: { type: Schema.Types.ObjectId, ref: 'Proposal', default: null },
    resultado: { type: String, enum: [...PAYMENT_EVENT_RESULTS], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PaymentEventSchema.index({ referencia: 1 });

export default mongoose.model<IPaymentEvent>('PaymentEvent', PaymentEventSchema);
