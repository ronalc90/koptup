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

/**
 * Avisos por correo del portal que la persona quiere recibir (Portal ›
 * Configuración). Las notificaciones dentro del portal (la campana) se crean
 * siempre; estas casillas deciden si además sale un correo (solo si el
 * servidor tiene correo configurado). Sin el campo, todas valen `true`.
 */
export const NOTIFICATION_EMAIL_CATEGORIES = ['pedidos', 'facturacion', 'proyectos', 'mensajes'] as const;
export type NotificationEmailCategory = (typeof NOTIFICATION_EMAIL_CATEGORIES)[number];
export type NotificationPreferences = { email: Record<NotificationEmailCategory, boolean> };

export function resolveNotificationPreferences(raw: unknown): NotificationPreferences {
  const email = (raw as { email?: Record<string, unknown> } | null | undefined)?.email ?? {};
  const out = {} as Record<NotificationEmailCategory, boolean>;
  for (const c of NOTIFICATION_EMAIL_CATEGORIES) out[c] = email[c] !== false;
  return { email: out };
}

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
  /** Avisos por correo del portal (ver NOTIFICATION_EMAIL_CATEGORIES). */
  notificationPrefs?: Partial<NotificationPreferences> | null;
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
    notificationPrefs: {
      email: {
        pedidos: { type: Boolean },
        facturacion: { type: Boolean },
        proyectos: { type: Boolean },
        mensajes: { type: Boolean },
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes are already defined in the schema with unique: true and sparse: true
// No need to define them again here to avoid duplicate index warnings

export default mongoose.model<IUser>('User', UserSchema);
