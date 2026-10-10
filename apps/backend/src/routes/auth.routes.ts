import { Router, RequestHandler, Request, Response } from 'express';
import { body } from 'express-validator';
import {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  googleCallback,
  googleExchange,
  forgotPassword,
  resetPassword,
  activateAccount,
  checkActivation,
  updateProfile,
  updatePreferences,
  changePassword,
  getAuthProviders,
  isGoogleConfigured,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import {
  activationCheckRateLimiter,
  activationRateLimiter,
  changePasswordRateLimiter,
  forgotPasswordIpRateLimiter,
  forgotPasswordRateLimiter,
  loginIpRateLimiter,
  loginRateLimiter,
  oauthExchangeRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
} from '../middleware/rateLimiter';
import { sendError } from '../utils/http-error';
import { logger } from '../utils/logger';

const router = Router();

const GOOGLE_NOT_CONFIGURED_MESSAGE = 'El inicio de sesión con Google no está disponible en este momento. Entra con tu correo y contraseña.';

/**
 * Google sin configurar: a un navegador (que llegó desde el botón) se le
 * devuelve a /login con un aviso; a un cliente de la API, el JSON 503.
 */
function googleNotConfigured(req: Request, res: Response) {
  if (req.accepts(['json', 'html']) === 'html') {
    res.redirect(`${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/login?error=google_not_configured`);
    return;
  }
  sendError(res, 503, 'google_not_configured', GOOGLE_NOT_CONFIGURED_MESSAGE);
}

// Lazy import passport to avoid blocking
let passportInstance: any = null;
const getPassport = async () => {
  if (!passportInstance) {
    passportInstance = (await import('../config/passport')).default;
  }
  return passportInstance;
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/register',
  registerRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  register as RequestHandler
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  loginIpRateLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  // Después de normalizar el correo: las variantes de un mismo correo
  // (mayúsculas, puntos o "+etiqueta" de Gmail) comparten el contador.
  loginRateLimiter,
  login as RequestHandler
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', body('refreshToken').notEmpty(), refreshToken as RequestHandler);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent if the account exists
 */
router.post(
  '/forgot-password',
  forgotPasswordIpRateLimiter,
  [body('email').isEmail().normalizeEmail()],
  // Por correo normalizado (ver /login).
  forgotPasswordRateLimiter,
  forgotPassword as RequestHandler
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset the password using a valid token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  [body('token').trim().notEmpty(), body('password').isLength({ min: 8 })],
  resetPassword as RequestHandler
);

/**
 * @swagger
 * /api/auth/activate/check:
 *   post:
 *     tags: [Auth]
 *     summary: Valida un enlace de activación sin consumirlo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enlace válido (nombre y email enmascarado)
 *       400:
 *         description: token_invalid, token_used o token_expired
 */
router.post('/activate/check', activationCheckRateLimiter, checkActivation as RequestHandler);

/**
 * @swagger
 * /api/auth/activate:
 *   post:
 *     tags: [Auth]
 *     summary: Activa la cuenta con el enlace mágico y fija la contraseña (devuelve la sesión)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Cuenta activa; misma respuesta que el login
 *       400:
 *         description: token_invalid, token_used, token_expired o invalid_password
 */
router.post('/activate', activationRateLimiter, activateAccount as RequestHandler);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, logout as RequestHandler);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, getProfile as RequestHandler);

/**
 * GET /api/auth/me — usuario vigente según la BD (id, email, nombre y rol).
 * Lo usa el middleware de Next para proteger /admin y /dashboard en el servidor.
 */
router.get('/me', authenticate, getProfile as RequestHandler);

/**
 * PATCH /api/auth/me { name?, phone?, company? } — el dueño actualiza sus
 * datos básicos (Portal › Mi perfil). El email y el rol no se cambian aquí.
 */
router.patch('/me', authenticate, updateProfile as RequestHandler);

/**
 * PATCH /api/auth/me/preferences { email: { pedidos?, facturacion?, proyectos?, mensajes? } }
 * — avisos del portal que la persona quiere recibir por correo.
 */
router.patch('/me/preferences', authenticate, updatePreferences as RequestHandler);

/**
 * GET /api/auth/providers — `{ google, email }`: qué formas de iniciar sesión
 * ofrece este servidor (la web oculta "Continuar con Google" si no está).
 */
router.get('/providers', getAuthProviders as RequestHandler);

/**
 * POST /api/auth/change-password { currentPassword, newPassword } — cambia la
 * contraseña verificando la actual y devuelve una sesión nueva (cupo propio
 * por cuenta: changePasswordRateLimiter).
 */
router.post('/change-password', changePasswordRateLimiter, authenticate, changePassword as RequestHandler);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate Google OAuth flow
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get(
  '/google',
  async (req, res, next) => {
    try {
      // Google sin configurar: aviso en /login (navegador) o 503 (API).
      if (!isGoogleConfigured()) return googleNotConfigured(req, res);

      const passport = await getPassport();
      return passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
      })(req, res, next);
    } catch (error: any) {
      logger.error(`[auth] Google OAuth: ${error?.message ?? error}`);
      return sendError(res, 500, 'internal_error', 'No pudimos iniciar sesión con Google. Intenta de nuevo o entra con tu correo.');
    }
  }
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth callback
 *     responses:
 *       302:
 *         description: Redirect to the web with a one-time code in the URL fragment (never the tokens)
 */
router.get(
  '/google/callback',
  async (req, res, next) => {
    try {
      // Google sin configurar: aviso en /login (navegador) o 503 (API).
      if (!isGoogleConfigured()) return googleNotConfigured(req, res);

      const passport = await getPassport();
      return passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`,
      })(req, res, next);
    } catch (error: any) {
      logger.error(`[auth] Google OAuth callback: ${error?.message ?? error}`);
      return sendError(res, 500, 'internal_error', 'No pudimos iniciar sesión con Google. Intenta de nuevo o entra con tu correo.');
    }
  },
  googleCallback as RequestHandler
);

/**
 * @swagger
 * /api/auth/google/exchange:
 *   post:
 *     tags: [Auth]
 *     summary: Canjea el código de un solo uso del inicio de sesión con Google por la sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Misma respuesta que el login
 *       400:
 *         description: Código inválido, usado o vencido (60 s)
 */
router.post('/google/exchange', oauthExchangeRateLimiter, googleExchange as RequestHandler);

export default router;
