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

const router = Router();

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

      res.json({
        success: true,
        data: { content: improvedContent },
      });
    } catch (error: any) {
      logger.error('Error in /improve:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to improve content',
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

      res.json({
        success: true,
        data: { content: adaptedContent, tone },
      });
    } catch (error: any) {
      logger.error('Error in /change-tone:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to change tone',
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

      res.json({
        success: true,
        data: { content: adjustedContent, targetWords },
      });
    } catch (error: any) {
      logger.error('Error in /adjust-length:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to adjust length',
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

      res.json({
        success: true,
        data: { versions },
      });
    } catch (error: any) {
      logger.error('Error in /generate-versions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate versions',
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

      res.json({
        success: true,
        data: { content: generatedContent },
      });
    } catch (error: any) {
      logger.error('Error in /generate:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate content',
      });
    }
  }
);

export default router;
