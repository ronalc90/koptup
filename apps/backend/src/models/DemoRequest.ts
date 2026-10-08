import mongoose, { Document, Schema, Types } from 'mongoose';
import { COMPANY_SIZES, DEMO_REQUEST_STATES, type DemoRequestState } from '../config/demos';

/**
 * Solicitud de demo enviada desde el formulario "Solicitar demo"
 * (POST /api/demo-requests). La revisa el equipo en Admin › Solicitudes de
 * demo: se aprueba (crea la cuenta `prospect` y un DemoGrant por demo) o se
 * rechaza con motivo.
 */
export interface IDemoRequestNote {
  texto: string;
  autor?: Types.ObjectId;
  autorEmail?: string;
  fecha: Date;
}

export interface IDemoRequest extends Document {
  /** Código visible para el solicitante, p. ej. DR-2026-7K3QZP. */
  codigo: string;
  nombre: string;
  empresa: string;
  cargo?: string;
  /** Normalizado igual que el login (minúsculas; en Gmail sin puntos ni +alias). */
  email: string;
  telefono?: string;
  pais: string;
  tamanoEmpresa: (typeof COMPANY_SIZES)[number];
  /** Slugs de las demos de interés (DemoCatalogItem.slug). */
  demos: string[];
  casoDeUso: string;
  consentimiento: {
    aceptado: boolean;
    fecha: Date;
    /** IP del titular en hash SHA-256 (minimización de datos). */
    ipHash?: string;
    userAgent?: string;
    versionPolitica: string;
  };
  origen?: {
    pagina?: string;
    referrer?: string;
    utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  };
  estado: DemoRequestState;
  motivoRechazo?: string;
  notas: IDemoRequestNote[];
  revisadoPor?: Types.ObjectId;
  revisadoEn?: Date;
  /** Datos de la aprobación. */
  decision?: {
    demos: string[];
    dias: number;
    grants: Types.ObjectId[];
  };
  /** Cuenta creada o vinculada al aprobar. */
  user?: Types.ObjectId;
  /** Lead registrado por el canal de leads (Contact, source `demo-request`). */
  lead?: Types.ObjectId;
  /** Veces que el mismo email volvió a enviar el formulario con la solicitud abierta. */
  reenvios: number;
  /** Qué avisos se enviaron de verdad (false si el canal no está configurado o falló). */
  notificaciones: {
    equipoEmail?: boolean;
    equipoWhatsapp?: boolean;
    acuseSolicitante?: boolean;
    decisionSolicitante?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<IDemoRequestNote>(
  {
    texto: { type: String, required: true, maxlength: 2000 },
    autor: { type: Schema.Types.ObjectId, ref: 'User' },
    autorEmail: { type: String },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false },
);

const DemoRequestSchema = new Schema<IDemoRequest>(
  {
    codigo: { type: String, required: true, unique: true },
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    empresa: { type: String, required: true, trim: true, maxlength: 160 },
    cargo: { type: String, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    telefono: { type: String, trim: true, maxlength: 40 },
    pais: { type: String, required: true, trim: true, maxlength: 60 },
    tamanoEmpresa: { type: String, enum: [...COMPANY_SIZES], required: true },
    demos: { type: [String], required: true },
    casoDeUso: { type: String, required: true, maxlength: 2000 },
    consentimiento: {
      aceptado: { type: Boolean, required: true },
      fecha: { type: Date, required: true },
      ipHash: { type: String },
      userAgent: { type: String, maxlength: 300 },
      versionPolitica: { type: String, required: true, maxlength: 40 },
    },
    origen: {
      pagina: { type: String, maxlength: 300 },
      referrer: { type: String, maxlength: 300 },
      utm: {
        source: { type: String, maxlength: 120 },
        medium: { type: String, maxlength: 120 },
        campaign: { type: String, maxlength: 120 },
        term: { type: String, maxlength: 120 },
        content: { type: String, maxlength: 120 },
      },
    },
    estado: { type: String, enum: [...DEMO_REQUEST_STATES], default: 'pendiente' },
    motivoRechazo: { type: String, maxlength: 1000 },
    notas: { type: [NoteSchema], default: [] },
    revisadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    revisadoEn: { type: Date },
    decision: {
      demos: { type: [String], default: undefined },
      dias: { type: Number },
      grants: { type: [Schema.Types.ObjectId], ref: 'DemoGrant', default: undefined },
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    lead: { type: Schema.Types.ObjectId, ref: 'Contact' },
    reenvios: { type: Number, default: 0 },
    notificaciones: {
      equipoEmail: { type: Boolean },
      equipoWhatsapp: { type: Boolean },
      acuseSolicitante: { type: Boolean },
      decisionSolicitante: { type: Boolean },
    },
  },
  { timestamps: true },
);

DemoRequestSchema.index({ estado: 1, createdAt: -1 });
DemoRequestSchema.index({ email: 1, createdAt: -1 });
DemoRequestSchema.index({ demos: 1 });

export default mongoose.model<IDemoRequest>('DemoRequest', DemoRequestSchema);
