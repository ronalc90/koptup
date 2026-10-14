/**
 * admin-bootstrap.service.ts — el primer admin (o la recuperación del panel)
 * con ADMIN_EMAIL, y el registro en la bitácora de los cambios de rol hechos
 * fuera del panel (arranque y script `set-admin`).
 *
 * Regla conservadora del arranque: ADMIN_EMAIL solo da el rol admin si la
 * cuenta existe, está activa y **no hay ningún otro admin**. Sirve para crear
 * el primer admin o para recuperar el panel si nadie más lo tiene; si un admin
 * le quita el rol a esa cuenta desde el panel, el siguiente arranque no lo
 * devuelve. Cada cambio queda en AuditLog (`user.role_change`).
 */
import User from '../models/User';
import { recordAudit } from './audit.service';

export type AdminBootstrapResult =
  | 'sin_variable'
  | 'no_existe'
  | 'cuenta_invitada'
  | 'ya_es_admin'
  | 'hay_otro_admin'
  | 'promovida';

/** Texto del log para cada resultado (sin el email: los logs de Railway no lo necesitan). */
export const ADMIN_BOOTSTRAP_MESSAGES: Record<AdminBootstrapResult, string> = {
  sin_variable: 'ADMIN_EMAIL no definido: el arranque no modifica roles.',
  no_existe: 'ADMIN_EMAIL no corresponde a ningún usuario registrado (no se cambió ningún rol).',
  cuenta_invitada: 'ADMIN_EMAIL corresponde a una cuenta sin activar: actívala antes de darle el rol (no se cambió ningún rol).',
  ya_es_admin: 'ADMIN_EMAIL ya tiene el rol admin.',
  hay_otro_admin:
    'ADMIN_EMAIL no es admin y ya existe otra cuenta admin: el arranque no cambia roles (usa Admin › Usuarios o el script set-admin).',
  promovida: 'Rol admin asignado a ADMIN_EMAIL (no había ningún admin). Queda en la bitácora.',
};

/** Registra en la bitácora un cambio de rol hecho fuera del panel. */
export async function recordSystemRoleChange(params: {
  userId: string;
  email: string;
  antes: string | null;
  despues: string;
  origen: 'ADMIN_EMAIL' | 'set-admin';
}): Promise<void> {
  await recordAudit({
    actor: { email: params.origen === 'ADMIN_EMAIL' ? 'sistema (ADMIN_EMAIL al arrancar)' : 'sistema (script set-admin)', role: 'system' },
    accion: 'user.role_change',
    entidad: { tipo: 'User', id: params.userId },
    detalle: { email: params.email, antes: params.antes, despues: params.despues, origen: params.origen },
  });
}

/**
 * Aplica la regla de ADMIN_EMAIL. Necesita MongoDB conectado; si falla, lanza
 * (el arranque lo registra y sigue).
 */
export async function ensureAdminFromEnv(rawEmail: string | undefined = process.env.ADMIN_EMAIL): Promise<AdminBootstrapResult> {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return 'sin_variable';

  const user = await User.findOne({ email }).select('email role accountStatus').lean();
  if (!user) return 'no_existe';
  if (user.role === 'admin') return 'ya_es_admin';
  if (user.accountStatus === 'invitado') return 'cuenta_invitada';

  const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } });
  if (otherAdmins > 0) return 'hay_otro_admin';

  // Condición atómica: solo si sigue sin ser admin (dos instancias arrancando
  // a la vez no duplican el registro en la bitácora).
  const updated = await User.findOneAndUpdate(
    { _id: user._id, role: { $ne: 'admin' } },
    { $set: { role: 'admin' } },
    { new: true },
  ).lean();
  if (!updated) return 'ya_es_admin';

  await recordSystemRoleChange({ userId: String(user._id), email: user.email, antes: user.role, despues: 'admin', origen: 'ADMIN_EMAIL' });
  return 'promovida';
}
