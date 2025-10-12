import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { db } from '../config/database';
import { logger } from '../utils/logger';

export const submitQuote = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, phone, company, service, plan, budget, description, requirements } = req.body;

  const id = uuidv4();
  await db.query(
    'INSERT INTO quote_requests (id, name, email, phone, company, service, plan, budget, description, requirements) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [id, name, email, phone || null, company || null, service, plan || null, budget || null, description, JSON.stringify(requirements || {})]
  );

  logger.info(`Quote request submitted: ${email}`);

  res.json({
    success: true,
    message: 'Quote request submitted successfully',
  });
});
