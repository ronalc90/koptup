import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import {
  improveContent,
  changeTone,
  adjustLength,
  generateVersions,
  generateFromTemplate,
  ContentTone,
  ContentTemplate,
} from '../services/content-manager.service';
import { logger } from '../utils/logger';
import { requireStaffOrDemoAccess } from '../middleware/access';
import { consumeRateLimit, getBudgetStatus } from '../services/ai-budget.service';
import { AuthRequest } from '../types';

const router = Router();

/** Límites de la demo /demo/gestor-contenido (visitantes; el staff no tiene cupo por IP). */
export const CONTENT_LIMITS = {
  maxContentChars: 10_000,
  perWindow: 20,
  windowSec: 10 * 60,
  perDay: 100,
} as const;

/**
 * Antes de llamar a OpenAI: clave configurada, tope mensual
 * CONTENT_MONTHLY_BUDGET_USD (Redis) y cupo por IP. Falla cerrada (503) si no
 * se puede medir el gasto.
 */
async function contentAiGate(req: Request, res: Response, next: () => void) {
  const content = (req.body ?? {}).content;
  if (typeof content === 'string' && content.length > CONTENT_LIMITS.maxContentChars) {
    res.status(400).json({ success: false, code: 'content_too_long', message: `El texto supera ${CONTENT_LIMITS.maxContentChars} caracteres.` });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ success: false, code: 'ai_unavailable', message: 'La IA no está configurada en este servidor en este momento.' });
    return;
  }
  const budget = await getBudgetStatus('content');
  if (!budget.available) {
    res.status(503).json({
      success: false,
      code: budget.reason === 'budget_exhausted' ? 'budget_exhausted' : 'ai_unavailable',
      message:
        budget.reason === 'budget_exhausted'
          ? 'Alcanzamos el cupo mensual de IA de esta demo. Escríbenos y te la mostramos en una llamada.'
          : 'La IA no está disponible en este momento. Intenta de nuevo en unos minutos.',
    });
    return;
  }
  if ((req as AuthRequest).demoAccess?.reason !== 'staff') {
    const ip = req.ip || 'unknown';
    const [w, d] = await Promise.all([
      consumeRateLimit({ scope: 'content:10m', ip, limit: CONTENT_LIMITS.perWindow, windowSec: CONTENT_LIMITS.windowSec }),
      consumeRateLimit({ scope: 'content:day', ip, limit: CONTENT_LIMITS.perDay, windowSec: 24 * 60 * 60 }),
    ]);
    if (!w || !d) {
      res.status(503).json({ success: false, code: 'ai_unavailable', message: 'La IA no está disponible en este momento. Intenta de nuevo en unos minutos.' });
      return;
    }
    if (!w.allowed || !d.allowed) {
      res.setHeader('Retry-After', String(!w.allowed ? w.retryAfterSec : d.retryAfterSec));
      res.status(429).json({ success: false, code: 'rate_limited', message: 'Llegaste al límite de solicitudes de IA. Espera unos minutos y vuelve a intentarlo.' });
      return;
    }
  }
  next();
}

// Política: staff o acceso a la demo /demo/gestor-contenido (pública por
// defecto), con tope de gasto y cupo por IP.
router.use(requireStaffOrDemoAccess('gestor-contenido'), contentAiGate);

/**
 * @swagger
 * /api/content/improve:
 *   post:
 *     summary: Improve content using AI
 *     tags: [Content Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - template
 *             properties:
 *               content:
 *                 type: string
 *               template:
 *                 type: string
 *                 enum: [email, presentation, product, social, proposal]
 *     responses:
 *       200:
 *         description: Content improved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/improve',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('template')
      .isIn(['email', 'presentation', 'product', 'social', 'proposal'])
      .withMessage('Invalid template'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { content, template } = req.body;

      const improvedContent = await improveContent({
        content,
        template: template as ContentTemplate,
      });

      return res.json({
        success: true,
        data: { content: improvedContent },
      });
    } catch (error: any) {
      logger.error('Error in /improve:', error);
      return res.status(500).json({
        success: false,
        message: 'No pudimos mejorar el contenido. Intenta de nuevo.',
      });
    }
  }
);

/**
 * @swagger
 * /api/content/change-tone:
 *   post:
 *     summary: Change content tone
 *     tags: [Content Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - tone
 *               - template
 *             properties:
 *               content:
 *                 type: string
 *               tone:
 *                 type: string
 *                 enum: [formal, técnico, persuasivo]
 *               template:
 *                 type: string
 *                 enum: [email, presentation, product, social, proposal]
 *     responses:
 *       200:
 *         description: Tone changed successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/change-tone',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('tone')
      .isIn(['formal', 'técnico', 'persuasivo'])
      .withMessage('Invalid tone'),
    body('template')
      .isIn(['email', 'presentation', 'product', 'social', 'proposal'])
      .withMessage('Invalid template'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { content, tone, template } = req.body;

      const adaptedContent = await changeTone({
        content,
        tone: tone as ContentTone,
        template: template as ContentTemplate,
      });

      return res.json({
        success: true,
        data: { content: adaptedContent, tone },
      });
    } catch (error: any) {
      logger.error('Error in /change-tone:', error);
      return res.status(500).json({
        success: false,
        message: 'No pudimos cambiar el tono. Intenta de nuevo.',
      });
    }
  }
);

/**
 * @swagger
 * /api/content/adjust-length:
 *   post:
 *     summary: Adjust content length
 *     tags: [Content Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - targetWords
 *               - template
 *             properties:
 *               content:
 *                 type: string
 *               targetWords:
 *                 type: number
 *               template:
 *                 type: string
 *                 enum: [email, presentation, product, social, proposal]
 *     responses:
 *       200:
 *         description: Length adjusted successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/adjust-length',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('targetWords')
      .isInt({ min: 10, max: 5000 })
      .withMessage('Target words must be between 10 and 5000'),
    body('template')
      .isIn(['email', 'presentation', 'product', 'social', 'proposal'])
      .withMessage('Invalid template'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { content, targetWords, template } = req.body;

      const adjustedContent = await adjustLength({
        content,
        targetWords: parseInt(targetWords),
        template: template as ContentTemplate,
      });

      return res.json({
        success: true,
        data: { content: adjustedContent, targetWords },
      });
    } catch (error: any) {
      logger.error('Error in /adjust-length:', error);
      return res.status(500).json({
        success: false,
        message: 'No pudimos ajustar la longitud. Intenta de nuevo.',
      });
    }
  }
);

/**
 * @swagger
 * /api/content/generate-versions:
 *   post:
 *     summary: Generate multiple content versions
 *     tags: [Content Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - template
 *             properties:
 *               content:
 *                 type: string
 *               template:
 *                 type: string
 *                 enum: [email, presentation, product, social, proposal]
 *               numVersions:
 *                 type: number
 *                 default: 3
 *     responses:
 *       200:
 *         description: Versions generated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/generate-versions',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('template')
      .isIn(['email', 'presentation', 'product', 'social', 'proposal'])
      .withMessage('Invalid template'),
    body('numVersions')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Number of versions must be between 1 and 5'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { content, template, numVersions } = req.body;

      const versions = await generateVersions({
        content,
        template: template as ContentTemplate,
        numVersions: numVersions ? parseInt(numVersions) : undefined,
      });

      return res.json({
        success: true,
        data: { versions },
      });
    } catch (error: any) {
      logger.error('Error in /generate-versions:', error);
      return res.status(500).json({
        success: false,
        message: 'No pudimos generar las versiones. Intenta de nuevo.',
      });
    }
  }
);

/**
 * @swagger
 * /api/content/generate:
 *   post:
 *     summary: Generate content from template
 *     tags: [Content Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *               - userInput
 *             properties:
 *               template:
 *                 type: string
 *                 enum: [email, presentation, product, social, proposal]
 *               userInput:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content generated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/generate',
  [
    body('template')
      .isIn(['email', 'presentation', 'product', 'social', 'proposal'])
      .withMessage('Invalid template'),
    body('userInput').notEmpty().withMessage('User input is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { template, userInput } = req.body;

      const generatedContent = await generateFromTemplate(
        template as ContentTemplate,
        userInput
      );

      return res.json({
        success: true,
        data: { content: generatedContent },
      });
    } catch (error: any) {
      logger.error('Error in /generate:', error);
      return res.status(500).json({
        success: false,
        message: 'No pudimos generar el contenido. Intenta de nuevo.',
      });
    }
  }
);

export default router;
