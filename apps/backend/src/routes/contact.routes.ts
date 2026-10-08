import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import { submitContact, testWhatsApp, testEmail } from '../controllers/contact.controller';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { devOnlyAdmin } from '../middleware/access';

const router = Router();

router.post(
  '/',
  strictRateLimiter,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('service').trim().notEmpty(),
    body('message').trim().notEmpty(),
  ],
  submitContact as RequestHandler
);

// Endpoints de prueba: no existen en producción; en desarrollo, solo admin.
router.post('/test-whatsapp', ...devOnlyAdmin, testWhatsApp as RequestHandler);
router.post('/test-email', ...devOnlyAdmin, testEmail as RequestHandler);

export default router;
