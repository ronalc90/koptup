import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  googleCallback,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

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
  strictRateLimiter,
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
  strictRateLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
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
      // Check if Google OAuth is configured
      const clientID = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientID || !clientSecret || clientID.includes('tu-google')) {
        return res.status(503).json({
          success: false,
          message: 'Google OAuth is not configured on this server',
          error: 'Google authentication is currently unavailable. Please contact the administrator or use email/password login.',
        });
      }

      const passport = await getPassport();
      return passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
      })(req, res, next);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message || 'Failed to initiate Google authentication',
      });
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
 *         description: Redirect to frontend with tokens
 */
router.get(
  '/google/callback',
  async (req, res, next) => {
    try {
      // Check if Google OAuth is configured
      const clientID = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientID || !clientSecret || clientID.includes('tu-google')) {
        return res.status(503).json({
          success: false,
          message: 'Google OAuth is not configured on this server',
          error: 'Google authentication is currently unavailable.',
        });
      }

      const passport = await getPassport();
      return passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`,
      })(req, res, next);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message || 'Failed to complete Google authentication',
      });
    }
  },
  googleCallback as RequestHandler
);

export default router;
