import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import { submitContact } from '../controllers/contact.controller';
import { strictRateLimiter } from '../middleware/rateLimiter';

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

export default router;
