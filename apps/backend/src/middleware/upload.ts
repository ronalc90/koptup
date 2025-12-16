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

const ALLOWED_ORDER_EXTENSIONS = [
  'pdf',
  'docx',
  'txt',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'zip',
  'rar',
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

// File filter para pedidos (incluye imágenes)
const orderFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (!ALLOWED_ORDER_EXTENSIONS.includes(ext)) {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${ALLOWED_ORDER_EXTENSIONS.join(', ')}`,
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
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-rar-compressed',
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

// Storage para archivos de pedidos
const orderStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/orders/');
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

// Multer instance para pedidos
export const uploadOrderFiles = multer({
  storage: orderStorage,
  fileFilter: orderFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE * 2, // 20MB for orders
    files: 10, // Maximum 10 files per order
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
