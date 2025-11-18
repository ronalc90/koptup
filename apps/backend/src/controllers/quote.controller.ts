import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Quote from '../models/Quote';
import { logger } from '../utils/logger';

export const submitQuote = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, service, description } = req.body;

  await Quote.create({
    name,
    email,
    service,
    description,
    status: 'pending',
  });

  logger.info(`Quote request submitted: ${email}`);

  res.json({
    success: true,
    message: 'Quote request submitted successfully',
  });
});
