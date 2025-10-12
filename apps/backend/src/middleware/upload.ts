import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from './errorHandler';

const ALLOWED_EXTENSIONS = process.env.ALLOWED_FILE_TYPES?.split(',') || [
  'pdf',
  'docx',
  'txt',
  'csv',
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// File filter
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400
      )
    );
    return;
  }

  // Check MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new AppError('Invalid file MIME type', 400));
    return;
  }

  cb(null, true);
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum 5 files per request
  },
});

// Middleware to handle multer errors
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Too many files. Maximum: 5 files',
      });
      return;
    }
  }

  next(error);
};
