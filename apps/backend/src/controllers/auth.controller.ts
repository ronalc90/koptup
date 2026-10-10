import { Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateAccessToken } from '../middleware/auth';
import { createSession, revokeAllSessions, revokeSession, validateRefreshToken } from '../services/session.service';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import emailService from '../services/email.service';
import User, { NOTIFICATION_EMAIL_CATEGORIES, resolveNotificationPreferences, type IUser } from '../models/User';
import {
  MAGIC_LINK_ERRORS,
  consumeMagicLink,
  inspectMagicLink,
  invalidatePendingMagicLinks,
  issueMagicLink,
  releaseMagicLink,
} from '../services/magic-link.service';
import { recordAudit } from '../services/audit.service';
import { maskEmail } from '../utils/email-address';

/** Mensajes de error de la cuenta (formato único: `{ success: false, code, message }`). */
const VALIDATION_MESSAGE = 'Revisa los datos del formulario: hay campos vacíos o con un formato inválido.';
const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';

/**
 * Emite la sesión (access + refresh) de un usuario: la misma respuesta que
 * POST /api/auth/login. La usan el login, la activación, Google y el cambio de
 * contraseña. Cada llamada es una sesión nueva (un dispositivo): las demás
 * siguen abiertas (services/session.service.ts).
 */
async function issueSession(user: IUser, opts: { remember?: boolean } = {}) {
  const session = await createSession(user, opts);
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    // Vida de la sesión renovable y si la web debe guardarla en una cookie persistente.
    expiresIn: session.expiresIn,
    remember: session.remember,
    user: session.user,
  };
}

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(VALIDATION_MESSAGE, 400, 'invalid_request');
  }

  const { email, password, name } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.', 400, 'email_taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
    role: 'user',
    provider: 'local',
  });

  logger.info(`User registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Login validation error');
    throw new AppError(VALIDATION_MESSAGE, 400, 'invalid_request');
  }

  const { email, password } = req.body;
  // "Recordarme": sin marcar, la sesión dura 1 día y la web la guarda en una
  // cookie de sesión (se borra al cerrar el navegador).
  const remember = req.body?.remember !== false && req.body?.remember !== 'false';

  // Get user
  const user = await User.findOne({ email }).select('+password');

  // Cuenta creada al aprobar una demo que aún no se activa: no tiene contraseña.
  if (user && user.accountStatus === 'invitado') {
    throw new AppError(
      'Tu cuenta aún no está activada. Usa el enlace de activación que te enviamos o pide uno nuevo al equipo de KopTup.',
      401,
      'account_not_activated',
    );
  }

  if (!user || !user.password) {
    throw new AppError('El correo o la contraseña no son correctos.', 401, 'invalid_credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('El correo o la contraseña no son correctos.', 401, 'invalid_credentials');
  }

  const session = await issueSession(user, { remember });

  // Update last login
  user.last_login = new Date();
  await user.save();

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: session,
  });
});

export const refreshToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Falta la sesión para renovar. Inicia sesión de nuevo.', 400, 'refresh_token_required');
    }

    // Firma, vencimiento y sesión abierta en Redis (inválido → 401, no 500).
    const check = await validateRefreshToken(String(refreshToken));
    if (!check.ok) {
      throw new AppError(SESSION_EXPIRED_MESSAGE, 401, 'invalid_refresh_token');
    }

    // Get user
    const user = await User.findById(check.userId);

    if (!user) {
      throw new AppError('No encontramos tu cuenta. Inicia sesión de nuevo.', 401, 'session_invalid');
    }

    // Nuevo token de acceso de la misma sesión (con el rol vigente).
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      ...(check.sid ? { sid: check.sid } : {}),
    });

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken,
      },
    });
  }
);

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Inicia sesión para continuar.', 401, 'unauthorized');
  }

  // Cierra solo la sesión de este dispositivo.
  await revokeSession(req.user.id, req.user.sid);

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Inicia sesión para continuar.', 401, 'unauthorized');
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      // La cuenta ya no existe: la sesión no sirve (401, no 404, para que la
      // web lo distinga de un servidor que no responde).
      throw new AppError('No encontramos tu cuenta. Inicia sesión de nuevo.', 401, 'session_invalid');
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: profileView(user) });
  }
);

/** Datos de la cuenta que ve su dueño (GET /me y /profile, PATCH /me). */
function profileView(user: IUser) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    company: user.company ?? null,
    provider: user.provider,
    avatar: user.avatar ?? null,
    accountStatus: user.accountStatus,
    notificationPrefs: resolveNotificationPreferences(user.notificationPrefs),
    created_at: user.created_at,
    last_login: user.last_login,
  };
}

const PreferencesSchema = z
  .object({
    email: z.object(Object.fromEntries(NOTIFICATION_EMAIL_CATEGORIES.map((c) => [c, z.boolean().optional()])) as Record<string, z.ZodOptional<z.ZodBoolean>>).strict(),
  })
  .strict();

/**
 * PATCH /api/auth/me/preferences { email: { pedidos?, facturacion?, proyectos?, mensajes? } }
 * — qué avisos del portal recibe la persona por correo. Los respeta
 * services/portal-notify.service.ts (la notificación del portal se crea siempre).
 */
export const updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Inicia sesión para continuar.', 401, 'unauthorized');
  const parsed = PreferencesSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw new AppError('Preferencias no válidas.', 400, 'invalid_preferences');
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('No encontramos tu cuenta. Inicia sesión de nuevo.', 401, 'session_invalid');
  const current = resolveNotificationPreferences(user.notificationPrefs);
  const next = { email: { ...current.email } };
  for (const [k, v] of Object.entries(parsed.data.email)) {
    if (typeof v === 'boolean') next.email[k as keyof typeof next.email] = v;
  }
  user.notificationPrefs = next;
  user.markModified('notificationPrefs');
  await user.save();
  res.json({ success: true, message: 'Preferencias guardadas.', data: { notificationPrefs: next } });
});

/**
 * GET /api/auth/providers — formas de iniciar sesión disponibles en este
 * servidor. La web muestra "Continuar con Google" solo si `google` es true.
 */
export const getAuthProviders = (_req: AuthRequest, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data: { google: isGoogleConfigured(), email: true } });
};

export function isGoogleConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const clientID = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  return !!clientID && !!clientSecret && !clientID.includes('tu-google');
}

const PROFILE_PHONE = /^[+0-9 ().-]{7,40}$/;
const optionalProfileText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

const UpdateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Escribe tu nombre (mínimo 2 caracteres).').max(120).optional(),
    phone: optionalProfileText(40).refine((v) => v === null || PROFILE_PHONE.test(v), 'Escribe un teléfono válido (solo números, espacios y +).'),
    company: optionalProfileText(160),
  })
  .strict();

/**
 * PATCH /api/auth/me { name?, phone?, company? } — el dueño de la cuenta
 * actualiza sus datos básicos. El email y el rol no se cambian aquí.
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Inicia sesión para continuar.', 401, 'unauthorized');
  const parsed = UpdateProfileSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path[0] ?? '');
    throw new AppError(issue?.message ?? 'Datos inválidos', 400, 'invalid_profile', { fields: field ? [field] : [] });
  }
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('No encontramos tu cuenta. Inicia sesión de nuevo.', 404, 'not_found');
  const { name, phone, company } = parsed.data;
  if (name !== undefined) user.name = name;
  if ('phone' in (req.body ?? {})) user.phone = phone ?? undefined;
  if ('company' in (req.body ?? {})) user.company = company ?? undefined;
  await user.save();
  res.json({ success: true, message: 'Datos actualizados.', data: profileView(user) });
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Escribe tu contraseña actual.').max(128),
  newPassword: z.string().min(8, 'La contraseña nueva debe tener al menos 8 caracteres.').max(128, 'La contraseña puede tener máximo 128 caracteres.'),
});

/**
 * POST /api/auth/change-password { currentPassword, newPassword } — cambia la
 * contraseña de una cuenta local verificando la actual. Emite una sesión
 * nueva: el refresh token anterior (de cualquier otro navegador) deja de servir.
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Inicia sesión para continuar.', 401, 'unauthorized');
  const parsed = ChangePasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError(issue?.message ?? 'Datos inválidos', 400, 'invalid_password', { fields: [String(issue?.path[0] ?? 'newPassword')] });
  }
  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('No encontramos tu cuenta. Inicia sesión de nuevo.', 404, 'not_found');
  if (!user.password) {
    throw new AppError('Tu cuenta entra con Google: no tiene una contraseña de KopTup para cambiar.', 400, 'no_local_password');
  }
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) throw new AppError('La contraseña actual no es correcta.', 400, 'wrong_password', { fields: ['currentPassword'] });
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    throw new AppError('La contraseña nueva debe ser distinta de la actual.', 400, 'invalid_password', { fields: ['newPassword'] });
  }
  user.password = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();
  await recordAudit({
    actor: { id: String(user._id), email: user.email, role: user.role },
    accion: 'user.change_password',
    entidad: { tipo: 'User', id: String(user._id) },
    req,
  });
  // Todas las sesiones abiertas (otros navegadores y dispositivos) se cierran;
  // esta recibe una sesión nueva.
  await revokeAllSessions(String(user._id));
  const session = await issueSession(user);
  logger.info('Password changed by the account owner');
  res.json({ success: true, message: 'Tu contraseña quedó actualizada.', data: session });
});

/**
 * Solicita el reseteo de contraseña. Por seguridad (evitar enumeración de
 * usuarios) responde siempre el mismo mensaje, exista o no la cuenta. Si la
 * cuenta existe y es de tipo `local`, emite un enlace mágico de un solo uso
 * (MagicLinkToken, propósito `reset`, 1 hora; solo se guarda su hash) y envía
 * el email con el enlace.
 */
export const forgotPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(VALIDATION_MESSAGE, 400, 'invalid_request');
    }

    const { email } = req.body;

    // Sin correo configurado no se emite ningún enlace (no llegaría, y además
    // anularía el que el equipo haya generado desde el panel). La respuesta es
    // la misma exista o no la cuenta: no revela qué correos están registrados.
    if (!emailService.isConfigured()) {
      logger.info('Password reset requested but email is not configured');
      return res.json({
        success: true,
        code: 'email_not_configured',
        message:
          'En este momento no podemos enviar correos. Escríbenos por WhatsApp o desde Contacto y el equipo de KopTup te dará un enlace para restablecer tu contraseña.',
        data: { correo: 'no_configurado' },
      });
    }

    const genericResponse = () =>
      res.json({
        success: true,
        message:
          'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.',
        data: { correo: 'enviado_si_existe' },
      });

    const user = await User.findOne({ email });

    // Solo cuentas locales pueden resetear (las de Google no).
    if (!user || user.provider !== 'local') {
      logger.info('Password reset requested for a non-resettable email');
      return genericResponse();
    }

    const link = await issueMagicLink({ userId: user._id as any, proposito: 'reset' });

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: link.url,
    });

    logger.info('Password reset email dispatched');
    return genericResponse();
  }
);

/**
 * Restablece la contraseña a partir de un enlace válido. El enlace es de un
 * solo uso (se consume de forma atómica) y se invalida la sesión vigente.
 * Si la cuenta estaba `invitado`, queda activa (probó que controla el email).
 */
export const resetPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(VALIDATION_MESSAGE, 400, 'invalid_request');
    }

    const { token, password } = req.body;

    const consumed = await consumeMagicLink(token, 'reset');
    if (!consumed.ok) {
      // Mensaje distinto por motivo: usado, reemplazado por uno más reciente, vencido o inválido.
      throw new AppError(RESET_LINK_ERRORS[consumed.reason], 400, consumed.reason);
    }

    const user = await User.findById(consumed.doc.user);
    if (!user) {
      throw new AppError('El enlace de recuperación es inválido o expiró', 400, 'token_invalid');
    }

    const wasInvited = user.accountStatus === 'invitado';
    try {
      user.password = await bcrypt.hash(password, 12);
      if (wasInvited) {
        user.accountStatus = 'activo';
        user.emailVerifiedAt = new Date();
      }
      await user.save();
    } catch (err) {
      await releaseMagicLink(consumed.doc._id as any);
      throw err;
    }
    // Ya tiene contraseña: el enlace de activación pendiente deja de servir.
    if (wasInvited) await invalidatePendingMagicLinks(user._id as any, 'activacion');

    // Cierra todas las sesiones abiertas: hay que entrar con la contraseña nueva.
    await revokeAllSessions(String(user._id));

    logger.info('Password reset completed');

    res.json({
      success: true,
      message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
    });
  }
);

/** Mensajes de un enlace de restablecimiento que no sirve (POST /reset-password). */
const RESET_LINK_ERRORS: Record<keyof typeof MAGIC_LINK_ERRORS, string> = {
  token_invalid: 'El enlace de recuperación no es válido. Revisa que lo hayas copiado completo o pide uno nuevo.',
  token_used: 'Este enlace de recuperación ya se usó. Si ya cambiaste tu contraseña, inicia sesión; si no, pide uno nuevo.',
  token_replaced: 'Este enlace fue reemplazado por uno más reciente. Usa el último enlace que recibiste.',
  token_expired: 'El enlace de recuperación venció (dura 1 hora). Pide uno nuevo.',
};

const ActivateSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128),
});

const TokenOnlySchema = z.object({ token: z.string().trim().min(1).max(200) });

/**
 * POST /api/auth/activate/check { token } — valida el enlace de activación
 * SIN consumirlo (la página /activar/<token> lo llama al cargar, y los
 * filtros de correo que abren enlaces no lo gastan). Devuelve el nombre y el
 * email enmascarado.
 */
export const checkActivation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = TokenOnlySchema.safeParse(req.body ?? {});
  if (!parsed.success) throw new AppError(MAGIC_LINK_ERRORS.token_invalid, 400, 'token_invalid');
  const found = await inspectMagicLink(parsed.data.token, 'activacion');
  if (!found.ok) throw new AppError(MAGIC_LINK_ERRORS[found.reason], 400, found.reason);
  const user = await User.findById(found.doc.user).select('email name').lean();
  if (!user) throw new AppError(MAGIC_LINK_ERRORS.token_invalid, 400, 'token_invalid');
  res.json({
    success: true,
    data: { nombre: user.name, emailEnmascarado: maskEmail(user.email), expiresAt: found.doc.expiresAt },
  });
});

/**
 * POST /api/auth/activate { token, password } — consume el enlace de
 * activación (un solo uso, 72 h), fija la contraseña, deja la cuenta activa y
 * devuelve la sesión igual que el login.
 */
export const activateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = ActivateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find((i) => i.path[0] === 'password');
    if (passwordIssue) throw new AppError(passwordIssue.message, 400, 'invalid_password', { fields: ['password'] });
    throw new AppError(MAGIC_LINK_ERRORS.token_invalid, 400, 'token_invalid');
  }

  const consumed = await consumeMagicLink(parsed.data.token, 'activacion');
  if (!consumed.ok) throw new AppError(MAGIC_LINK_ERRORS[consumed.reason], 400, consumed.reason);

  const user = await User.findById(consumed.doc.user);
  if (!user) throw new AppError(MAGIC_LINK_ERRORS.token_invalid, 400, 'token_invalid');

  const now = new Date();
  try {
    user.password = await bcrypt.hash(parsed.data.password, 12);
    user.accountStatus = 'activo';
    user.emailVerifiedAt = user.emailVerifiedAt ?? now;
    user.last_login = now;
    await user.save();
  } catch (err) {
    await releaseMagicLink(consumed.doc._id as any);
    throw err;
  }
  // Cualquier otro enlace de activación pendiente deja de servir.
  await invalidatePendingMagicLinks(user._id as any, 'activacion', now);

  await recordAudit({
    actor: { id: String(user._id), email: user.email, role: user.role },
    accion: 'user.activate',
    entidad: { tipo: 'User', id: String(user._id) },
    detalle: { via: 'enlace_activacion' },
    req,
  });

  const session = await issueSession(user);
  logger.info('Account activated with magic link');
  res.json({ success: true, message: 'Tu cuenta quedó activa.', data: session });
});

/**
 * Fin del inicio de sesión con Google (GET /api/auth/google/callback). Los
 * tokens de sesión NO viajan en la URL: se emite un código de un solo uso
 * (60 s, solo se guarda su hash) y se redirige a la web con el código en el
 * fragmento (`/auth/callback#code=…`, que el navegador no envía al servidor
 * ni en el Referer). La web lo canjea con POST /api/auth/google/exchange.
 */
export const googleCallback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('No pudimos iniciar sesión con Google. Intenta de nuevo.', 401, 'google_auth_failed');
    }

    const user = req.user as any;
    const link = await issueMagicLink({ userId: String(user.id ?? user._id), proposito: 'oauth' });
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(link.url);
  }
);

/**
 * POST /api/auth/google/exchange { code } — canjea el código de un solo uso
 * del inicio de sesión con Google por la sesión (misma respuesta que el
 * login). El código vence a los 60 s y sirve una sola vez.
 */
const OAuthCodeSchema = z.object({ code: z.string().trim().min(20).max(200) });

export const googleExchange = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = OAuthCodeSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw new AppError('El inicio de sesión con Google no es válido o venció. Intenta de nuevo.', 400, 'token_invalid');
  const consumed = await consumeMagicLink(parsed.data.code, 'oauth');
  if (!consumed.ok) throw new AppError('El inicio de sesión con Google no es válido o venció. Intenta de nuevo.', 400, consumed.reason);
  const user = await User.findById(consumed.doc.user);
  if (!user) throw new AppError('El inicio de sesión con Google no es válido o venció. Intenta de nuevo.', 400, 'token_invalid');
  const session = await issueSession(user);
  logger.info('Google sign-in exchanged for a session');
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Login successful', data: session });
});
