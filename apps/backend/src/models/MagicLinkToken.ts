import mongoose, { Document, Schema, Types } from 'mongoose';
import { MAGIC_LINK_PURPOSES, type MagicLinkPurpose } from '../config/demos';

/**
 * Enlace mágico de un solo uso. Solo se guarda el hash SHA-256 del token: el
 * token en claro viaja en el email (o el admin lo copia del panel) y nunca se
 * persiste. Se consume con POST (no al abrir el enlace), de forma atómica:
 * `findOneAndUpdate({ tokenHash, usedAt: null, expiresAt > ahora })`.
 *
 *  - `activacion`: cuenta `invitado` creada al aprobar una demo (72 h).
 *  - `reset`: restablecer la contraseña desde "¿Olvidaste tu contraseña?" (1 h).
 *
 * El índice TTL borra el registro 7 días después de vencer.
 */
export interface IMagicLinkToken extends Document {
  tokenHash: string;
  user: Types.ObjectId;
  proposito: MagicLinkPurpose;
  expiresAt: Date;
  usedAt?: Date | null;
  /** true si se invalidó al emitir uno nuevo (no se usó). */
  invalidado?: boolean;
  creadoPor?: Types.ObjectId;
  request?: Types.ObjectId;
  createdAt: Date;
}

const MagicLinkTokenSchema = new Schema<IMagicLinkToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    proposito: { type: String, enum: [...MAGIC_LINK_PURPOSES], required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    invalidado: { type: Boolean, default: false },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    request: { type: Schema.Types.ObjectId, ref: 'DemoRequest' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MagicLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model<IMagicLinkToken>('MagicLinkToken', MagicLinkTokenSchema);
