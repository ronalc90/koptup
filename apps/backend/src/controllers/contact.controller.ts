import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { db } from '../config/database';
import { logger } from '../utils/logger';

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, phone, company, service, message } = req.body;

  const id = uuidv4();
  await db.query(
    'INSERT INTO contact_submissions (id, name, email, phone, company, service, message) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, name, email, phone || null, company || null, service || null, message]
  );

  logger.info(`Contact form submitted: ${email}`);

  res.json({
    success: true,
    message: 'Contact form submitted successfully',
  });
});
