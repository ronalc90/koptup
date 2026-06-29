import { Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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
import User from '../models/User';

/** Prefijo de las claves Redis para tokens de reseteo de contraseña. */
const RESET_TOKEN_PREFIX = 'password_reset:';
/** Vigencia del token de reseteo: 1 hora. */
const RESET_TOKEN_TTL_SECONDS = 60 * 60;

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
    logger.error('Login validation error:', errors.array());
    throw new AppError('Validation error', 400);
  }

  const { email, password } = req.body;
  logger.info(`Login attempt - Email: ${email}`);

  // Get user
  const user = await User.findOne({ email }).select('+password');
  logger.info(`User found: ${!!user}, Email in DB: ${user?.email}`);

  if (!user || !user.password) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate tokens
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

  // Store refresh token in Redis with 7 days expiration
  await redis.setEx(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

  // Update last login
  user.last_login = new Date();
  await user.save();

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  });
});

export const refreshToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

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

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    });
  }
);

/**
 * Solicita el reseteo de contraseña. Por seguridad (evitar enumeración de
 * usuarios) responde siempre el mismo mensaje, exista o no la cuenta. Si la
 * cuenta existe y es de tipo `local`, genera un token de un solo uso (guardado
 * en Redis con TTL) y envía el email con el enlace de reseteo.
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

    // Solo cuentas locales con contraseña pueden resetear (las de Google no).
    if (!user || user.provider !== 'local') {
      logger.info(`Password reset requested for non-resettable email: ${email}`);
      return genericResponse();
    }

    // Token aleatorio de un solo uso. Guardamos el hash en Redis, no el token.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await redis.setEx(
      `${RESET_TOKEN_PREFIX}${tokenHash}`,
      RESET_TOKEN_TTL_SECONDS,
      user._id.toString()
    );

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendURL}/reset-password?token=${rawToken}`;

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    logger.info(`Password reset email dispatched for: ${email}`);
    return genericResponse();
  }
);

/**
 * Restablece la contraseña a partir de un token válido. El token es de un solo
 * uso: se elimina de Redis tras consumirlo y se invalida la sesión vigente.
 */
export const resetPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error', 400);
    }

    const { token, password } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `${RESET_TOKEN_PREFIX}${tokenHash}`;

    const userId = await redis.get(redisKey);
    if (!userId) {
      throw new AppError('El enlace de recuperación es inválido o expiró', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      await redis.del(redisKey);
      throw new AppError('El enlace de recuperación es inválido o expiró', 400);
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    // Token de un solo uso + invalidar refresh token para forzar re-login.
    await redis.del(redisKey);
    await redis.del(`refresh_token:${user._id}`);

    logger.info(`Password reset completed for: ${user.email}`);

    res.json({
      success: true,
      message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
    });
  }
);

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
    await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    // Redirect to frontend with tokens
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendURL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);
