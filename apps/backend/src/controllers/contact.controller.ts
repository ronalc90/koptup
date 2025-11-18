import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Contact from '../models/Contact';
import { logger } from '../utils/logger';

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, subject, message } = req.body;

  await Contact.create({
    name,
    email,
    subject,
    message,
    status: 'new',
  });

  logger.info(`Contact form submitted: ${email}`);

  res.json({
    success: true,
    message: 'Contact form submitted successfully',
  });
});
