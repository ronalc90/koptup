import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  CURRENCIES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATES,
  PROPOSAL_ITEM_TYPES,
  PROPOSAL_MODALITIES,
  PROPOSAL_STATES,
  type Currency,
  type PaymentProvider,
  type ProposalItemType,
  type ProposalModality,
  type ProposalState,
} from '../config/commerce';

/**
 * Propuesta comercial (wiki 05 §9, "Quote ampliado"; el `Quote` heredado del
 * formulario de cotización sigue aparte).
 *
 *  - `numero`: consecutivo KOP-AAAA-NNNN (contador atómico por año).
 *  - Montos: los calcula SIEMPRE el servidor (services/proposal-calc.ts) a
 *    partir de los ítems; el cliente nunca los envía.
 *  - Enlace público: token aleatorio de 32 bytes; solo se guarda su hash
 *    SHA-256 (`tokenHash`). Reenviar emite un token nuevo (el anterior deja
 *    de servir).
 *  - Estados: borrador → enviada → vista → aceptada | rechazada | vencida;
 *    aceptada + anticipo recibido → convertida (Project creado).
 *  - Pago del anticipo: enlace externo pegado por el admin, instrucciones de
 *    transferencia, confirmación manual con referencia y, si está
 *    configurado, Wompi (webhook idempotente).
 */
export interface IProposalItem {
  tipo: ProposalItemType;
  planRag?: string;
  offeringSlug?: string;
  plan?: string;
  modalidad: ProposalModality;
  descripcion: string;
  cantidad: number;
  setup: number;
  mensualidad: number;
  descuentoPct: number;
  precioLista: { setup: number; mensualidad: number; fuente: 'plan_rag' | 'catalogo' | 'manual' };
  notaPrecio?: string;
  /** Calculados en el servidor. */
  setupTotal: number;
  mensualTotal: number;
  descuento: number;
}

export interface IProposalTotals {
  bruto: number;
  descuento: number;
  subtotal: number;
  iva: number;
  total: number;
  mensualBruto: number;
  mensualDescuento: number;
  mensualSubtotal: number;
  mensualIva: number;
  mensualTotal: number;
  anticipo: number;
}

export interface IProposalPayment {
  enlacePago?: string | null;
  instrucciones?: string | null;
  estado: 'pendiente' | 'recibido';
  referencia?: string | null;
  proveedor?: PaymentProvider | null;
  confirmadoPor?: Types.ObjectId | null;
  confirmadoPorEmail?: string | null;
  fecha?: Date | null;
  nota?: string | null;
  monto?: number | null;
  wompi?: {
    referencias: Array<{ referencia: string; montoCentavos: number; creadaEn: Date }>;
    transaccionId?: string | null;
    estado?: string | null;
  };
}

export interface IProposal extends Document {
  numero: string;
  titulo: string;
  lead: Types.ObjectId;
  usuario?: Types.ObjectId | null;
  cliente: { nombre: string; email: string; empresa?: string; telefono?: string };
  responsable?: Types.ObjectId | null;
  creadoPor?: Types.ObjectId | null;
  moneda: Currency;
  fxRate: number;
  ivaAplica: boolean;
  ivaPct: number;
  items: IProposalItem[];
  totales: IProposalTotals;
  anticipoPct: number;
  validezDias: number;
  validaHasta?: Date | null;
  alcance?: string;
  condiciones?: string;
  exclusiones?: string;
  estado: ProposalState;
  tokenHash?: string | null;
  tokenEmitidoEn?: Date | null;
  enviadaEn?: Date | null;
  ultimoEnvioEn?: Date | null;
  envios: number;
  vistas: { total: number; primera?: Date | null; ultima?: Date | null };
  aceptacion?: { nombre: string; email: string; fecha: Date; ipHash?: string; userAgent?: string } | null;
  rechazo?: { motivo?: string | null; fecha: Date; ipHash?: string } | null;
  vencidaEn?: Date | null;
  pago: IProposalPayment;
  conversion?: {
    enCursoDesde?: Date | null;
    convertidaEn?: Date | null;
    convertidaPor?: Types.ObjectId | null;
  } | null;
  projectId?: Types.ObjectId | null;
  duplicadaDe?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IProposalItem>(
  {
    tipo: { type: String, enum: [...PROPOSAL_ITEM_TYPES], required: true },
    planRag: { type: String },
    offeringSlug: { type: String },
    plan: { type: String },
    modalidad: { type: String, enum: [...PROPOSAL_MODALITIES], required: true },
    descripcion: { type: String, required: true, maxlength: 1000 },
    cantidad: { type: Number, required: true, min: 1 },
    setup: { type: Number, required: true, min: 0 },
    mensualidad: { type: Number, required: true, min: 0 },
    descuentoPct: { type: Number, default: 0, min: 0, max: 100 },
    precioLista: {
      setup: { type: Number, default: 0 },
      mensualidad: { type: Number, default: 0 },
      fuente: { type: String, enum: ['plan_rag', 'catalogo', 'manual'], default: 'manual' },
    },
    notaPrecio: { type: String, maxlength: 300 },
    setupTotal: { type: Number, required: true },
    mensualTotal: { type: Number, required: true },
    descuento: { type: Number, default: 0 },
  },
  { _id: false },
);

const TotalsSchema = new Schema<IProposalTotals>(
  {
    bruto: { type: Number, default: 0 },
    descuento: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    iva: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    mensualBruto: { type: Number, default: 0 },
    mensualDescuento: { type: Number, default: 0 },
    mensualSubtotal: { type: Number, default: 0 },
    mensualIva: { type: Number, default: 0 },
    mensualTotal: { type: Number, default: 0 },
    anticipo: { type: Number, default: 0 },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IProposalPayment>(
  {
    enlacePago: { type: String, maxlength: 1000, default: null },
    instrucciones: { type: String, maxlength: 4000, default: null },
    estado: { type: String, enum: [...PAYMENT_STATES], default: 'pendiente' },
    referencia: { type: String, maxlength: 200, default: null },
    proveedor: { type: String, enum: [...PAYMENT_PROVIDERS, null], default: null },
    confirmadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    confirmadoPorEmail: { type: String, default: null },
    fecha: { type: Date, default: null },
    nota: { type: String, maxlength: 1000, default: null },
    monto: { type: Number, default: null },
    wompi: {
      referencias: {
        type: [
          new Schema(
            { referencia: { type: String, required: true }, montoCentavos: { type: Number, required: true }, creadaEn: { type: Date, default: Date.now } },
            { _id: false },
          ),
        ],
        default: [],
      },
      transaccionId: { type: String, default: null },
      estado: { type: String, default: null },
    },
  },
  { _id: false },
);

const ProposalSchema = new Schema<IProposal>(
  {
    numero: { type: String, required: true, unique: true },
    titulo: { type: String, required: true, trim: true, maxlength: 200 },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    cliente: {
      nombre: { type: String, required: true, maxlength: 160 },
      email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
      empresa: { type: String, maxlength: 160 },
      telefono: { type: String, maxlength: 40 },
    },
    responsable: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    moneda: { type: String, enum: [...CURRENCIES], required: true },
    fxRate: { type: Number, required: true },
    ivaAplica: { type: Boolean, default: false },
    ivaPct: { type: Number, default: 19 },
    items: { type: [ItemSchema], default: [] },
    totales: { type: TotalsSchema, default: () => ({}) },
    anticipoPct: { type: Number, required: true, min: 0, max: 100 },
    validezDias: { type: Number, required: true, min: 1 },
    validaHasta: { type: Date, default: null },
    alcance: { type: String, maxlength: 8000 },
    condiciones: { type: String, maxlength: 8000 },
    exclusiones: { type: String, maxlength: 8000 },
    estado: { type: String, enum: [...PROPOSAL_STATES], default: 'borrador', index: true },
    tokenHash: { type: String, default: null },
    tokenEmitidoEn: { type: Date, default: null },
    enviadaEn: { type: Date, default: null },
    ultimoEnvioEn: { type: Date, default: null },
    envios: { type: Number, default: 0 },
    vistas: {
      total: { type: Number, default: 0 },
      primera: { type: Date, default: null },
      ultima: { type: Date, default: null },
    },
    aceptacion: {
      type: new Schema(
        {
          nombre: { type: String, required: true, maxlength: 160 },
          email: { type: String, required: true, maxlength: 254 },
          fecha: { type: Date, required: true },
          ipHash: { type: String },
          userAgent: { type: String, maxlength: 300 },
        },
        { _id: false },
      ),
      default: null,
    },
    rechazo: {
      type: new Schema(
        {
          motivo: { type: String, maxlength: 2000, default: null },
          fecha: { type: Date, required: true },
          ipHash: { type: String },
        },
        { _id: false },
      ),
      default: null,
    },
    vencidaEn: { type: Date, default: null },
    pago: { type: PaymentSchema, default: () => ({}) },
    conversion: {
      type: new Schema(
        {
          enCursoDesde: { type: Date, default: null },
          convertidaEn: { type: Date, default: null },
          convertidaPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        },
        { _id: false },
      ),
      default: null,
    },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    duplicadaDe: { type: Schema.Types.ObjectId, ref: 'Proposal', default: null },
  },
  { timestamps: true },
);

// Solo un token vigente por propuesta; búsqueda por hash del enlace público.
ProposalSchema.index({ tokenHash: 1 }, { unique: true, partialFilterExpression: { tokenHash: { $type: 'string' } } });
ProposalSchema.index({ estado: 1, validaHasta: 1 });
ProposalSchema.index({ 'cliente.email': 1 });
ProposalSchema.index({ 'pago.wompi.referencias.referencia': 1 });
ProposalSchema.index({ createdAt: -1 });

export default mongoose.model<IProposal>('Proposal', ProposalSchema);
