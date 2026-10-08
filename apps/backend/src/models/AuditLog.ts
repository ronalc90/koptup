import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Bitácora de auditoría de las acciones del equipo (y de la activación de
 * cuentas). Solo se agregan registros: no existe ningún endpoint para editar
 * ni borrar entradas. Se consulta en GET /api/admin/audit-log (solo admin).
 *
 * Acciones registradas: demo_request.update, demo_request.approve,
 * demo_request.reject, demo_grant.create, demo_grant.extend,
 * demo_grant.revoke, demo_grant.resend_activation, demo_catalog.update,
 * user.activate, user.role_change.
 */
export interface IAuditLog extends Document {
  actor?: Types.ObjectId | null;
  actorEmail?: string;
  actorRol?: string;
  accion: string;
  entidad: { tipo: string; id?: string };
  detalle?: Record<string, unknown>;
  /** IP en hash SHA-256 (no se guarda la IP en claro). */
  ipHash?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorEmail: { type: String },
    actorRol: { type: String },
    accion: { type: String, required: true, index: true },
    entidad: {
      tipo: { type: String, required: true },
      id: { type: String },
    },
    detalle: { type: Schema.Types.Mixed },
    ipHash: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ 'entidad.tipo': 1, 'entidad.id': 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
