import mongoose, { Schema, Document } from 'mongoose';

/**
 * Roles de una cuenta.
 *  - Equipo de KopTup: `admin`, `manager`, `sales` (gestiona solicitudes de
 *    demo), `developer`.
 *  - Externos: `prospect` (tiene accesos a demos), `client` (cliente con
 *    proyecto) y `user` (cuentas creadas antes de existir `client`; se tratan
 *    igual que un cliente).
 */
export const USER_ROLES = ['user', 'admin', 'manager', 'developer', 'sales', 'prospect', 'client'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Estado de la cuenta.
 *  - `invitado`: creada al aprobar una solicitud de demo (o por invitación
 *    directa); aún no tiene contraseña. Se activa con el enlace mágico.
 *  - `activo`: puede iniciar sesión (valor por defecto, también para las
 *    cuentas creadas antes de existir el campo).
 */
export const ACCOUNT_STATUSES = ['invitado', 'activo'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  accountStatus: AccountStatus;
  company?: string;
  phone?: string;
  emailVerifiedAt?: Date;
  google_id?: string;
  provider: 'local' | 'google';
  avatar?: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Obligatoria en cuentas locales activas. Una cuenta `invitado` la crea
      // al activarse con el enlace mágico.
      required: function (this: IUser) {
        return this.provider === 'local' && this.accountStatus !== 'invitado';
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [...USER_ROLES],
      default: 'user',
    },
    accountStatus: {
      type: String,
      enum: [...ACCOUNT_STATUSES],
      default: 'activo',
    },
    company: { type: String, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    emailVerifiedAt: { type: Date },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatar: {
      type: String,
    },
    last_login: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes are already defined in the schema with unique: true and sparse: true
// No need to define them again here to avoid duplicate index warnings

export default mongoose.model<IUser>('User', UserSchema);
