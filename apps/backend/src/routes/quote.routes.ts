import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import { submitQuote } from '../controllers/quote.controller';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/',
  strictRateLimiter,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('service').trim().notEmpty(),
    body('description').trim().notEmpty(),
  ],
  submitQuote as RequestHandler
);

export default router;
