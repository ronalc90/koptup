import mongoose, { Document, Schema, Types } from 'mongoose';
import { DEMO_GRANT_STATES, type DemoGrantState } from '../config/demos';

/**
 * Acceso de un usuario a una demo. Lo crea la aprobación de una solicitud o
 * la invitación directa del admin. La vigencia real es `expiresAt` comparado
 * con la hora actual en cada consulta (GET /api/demo-access y el middleware
 * de las APIs de demos): el job de expiración solo cambia la etiqueta
 * `estado` a `expirado` y envía el recordatorio.
 */
export interface IDemoGrantExtension {
  dias: number;
  desde: Date;
  hasta: Date;
  por?: Types.ObjectId;
  fecha: Date;
}

export interface IDemoGrant extends Document {
  user: Types.ObjectId;
  demoSlug: string;
  /** Solicitud que lo originó (null en una invitación directa). */
  request?: Types.ObjectId | null;
  estado: DemoGrantState;
  expiresAt: Date;
  otorgadoPor?: Types.ObjectId;
  nota?: string;
  ultimoAcceso?: Date;
  /** Visitas a la demo con este acceso: un uso tras 30 min (o más) sin actividad cuenta una nueva. */
  accesos: number;
  extensiones: IDemoGrantExtension[];
  revocadoPor?: Types.ObjectId;
  revocadoEn?: Date;
  motivoRevocacion?: string;
  expiradoEn?: Date;
  /** Recordatorio de vencimiento enviado (una sola vez por vigencia). */
  recordatorioEnviadoEn?: Date | null;
  /** Conversión a cliente: propuesta que la cerró y cuándo. */
  convertidoEn?: Date | null;
  propuesta?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExtensionSchema = new Schema<IDemoGrantExtension>(
  {
    dias: { type: Number, required: true },
    desde: { type: Date, required: true },
    hasta: { type: Date, required: true },
    por: { type: Schema.Types.ObjectId, ref: 'User' },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false },
);

const DemoGrantSchema = new Schema<IDemoGrant>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    demoSlug: { type: String, required: true, lowercase: true, trim: true },
    request: { type: Schema.Types.ObjectId, ref: 'DemoRequest', default: null },
    estado: { type: String, enum: [...DEMO_GRANT_STATES], default: 'activo' },
    expiresAt: { type: Date, required: true },
    otorgadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    nota: { type: String, maxlength: 2000 },
    ultimoAcceso: { type: Date },
    accesos: { type: Number, default: 0 },
    extensiones: { type: [ExtensionSchema], default: [] },
    revocadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    revocadoEn: { type: Date },
    motivoRevocacion: { type: String, maxlength: 1000 },
    expiradoEn: { type: Date },
    recordatorioEnviadoEn: { type: Date, default: null },
    convertidoEn: { type: Date, default: null },
    propuesta: { type: Schema.Types.ObjectId, ref: 'Proposal', default: null },
  },
  { timestamps: true },
);

// Un solo acceso `activo` por usuario y demo (aprobar dos veces extiende el existente).
DemoGrantSchema.index(
  { user: 1, demoSlug: 1 },
  { unique: true, partialFilterExpression: { estado: 'activo' }, name: 'un_acceso_activo_por_demo' },
);
DemoGrantSchema.index({ estado: 1, expiresAt: 1 });
DemoGrantSchema.index({ request: 1 });
DemoGrantSchema.index({ demoSlug: 1, estado: 1 });

export default mongoose.model<IDemoGrant>('DemoGrant', DemoGrantSchema);
