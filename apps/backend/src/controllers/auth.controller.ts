import { Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';
import emailService from '../services/email.service';
import User, { type IUser } from '../models/User';
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

/** Vigencia del refresh token en Redis: 7 días. */
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Emite la sesión (access + refresh) de un usuario: la misma respuesta que
 * POST /api/auth/login. La usan el login y la activación de cuenta.
 */
async function issueSession(user: IUser) {
  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const refreshToken = generateRefreshToken({
    id: user._id.toString(),
    email: user.email,
  });
  await redis.setEx(`refresh_token:${user._id}`, REFRESH_TTL_SECONDS, refreshToken);
  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { email, password, name } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('User already exists', 400);
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
    throw new AppError('Validation error', 400);
  }

  const { email, password } = req.body;

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
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const session = await issueSession(user);

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
      throw new AppError('Refresh token required', 400);
    }

    // Verify refresh token (firma inválida o vencida → 401, no 500)
    let decoded: { id: string };
    try {
      decoded = verifyRefreshToken(String(refreshToken));
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.id}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Get user
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
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
    throw new AppError('Unauthorized', 401);
  }

  // Remove refresh token from Redis
  await redis.del(`refresh_token:${req.user.id}`);

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

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
    accountStatus: user.accountStatus,
    created_at: user.created_at,
    last_login: user.last_login,
  };
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
  if (!req.user) throw new AppError('Unauthorized', 401);
  const parsed = UpdateProfileSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path[0] ?? '');
    throw new AppError(issue?.message ?? 'Datos inválidos', 400, 'invalid_profile', { fields: field ? [field] : [] });
  }
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);
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
  if (!req.user) throw new AppError('Unauthorized', 401);
  const parsed = ChangePasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError(issue?.message ?? 'Datos inválidos', 400, 'invalid_password', { fields: [String(issue?.path[0] ?? 'newPassword')] });
  }
  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found', 404);
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
      throw new AppError('Validation error', 400);
    }

    const { email } = req.body;

    const genericResponse = () =>
      res.json({
        success: true,
        message:
          'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.',
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
      throw new AppError('Validation error', 400);
    }

    const { token, password } = req.body;

    const consumed = await consumeMagicLink(token, 'reset');
    if (!consumed.ok) {
      throw new AppError('El enlace de recuperación es inválido o expiró', 400, consumed.reason);
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

    // Invalida el refresh token para forzar un login nuevo.
    await redis.del(`refresh_token:${user._id}`);

    logger.info('Password reset completed');

    res.json({
      success: true,
      message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
    });
  }
);

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

// Google OAuth callback handler
export const googleCallback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication failed', 401);
    }

    const user = req.user as any;

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Store refresh token in Redis with 7 days expiration
    await redis.setEx(`refresh_token:${user.id}`, REFRESH_TTL_SECONDS, refreshToken);

    // Redirect to frontend with tokens
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendURL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);
