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

// 10MB por defecto. Multer 2.4+ rechaza al arrancar un límite que no sea un
// entero positivo (antes un NaN desactivaba el límite sin avisar), así que un
// valor inválido en MAX_FILE_SIZE vuelve al valor por defecto.
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const parsedMaxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE || '', 10);
const MAX_FILE_SIZE =
  Number.isInteger(parsedMaxFileSize) && parsedMaxFileSize > 0 ? parsedMaxFileSize : DEFAULT_MAX_FILE_SIZE;

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
        `El archivo "${file.originalname}" no es de un tipo permitido. Usa: ${ALLOWED_ORDER_EXTENSIONS.join(', ')}.`,
        400,
        'invalid_file_type',
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
    cb(new AppError(`El archivo "${file.originalname}" no es de un tipo permitido.`, 400, 'invalid_file_type'));
    return;
  }

  cb(null, true);
};

// Entregables del equipo: documentos, imágenes, comprimidos y diseños.
const ALLOWED_DELIVERABLE_EXTENSIONS = [...ALLOWED_ORDER_EXTENSIONS, 'xlsx', 'pptx', 'md', 'json', 'fig', 'sketch', 'svg', '7z'];
const MAX_DELIVERABLE_SIZE = 50 * 1024 * 1024;

const deliverableFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (!ALLOWED_DELIVERABLE_EXTENSIONS.includes(ext)) {
    cb(new AppError(`El archivo no es de un tipo permitido. Usa: ${ALLOWED_DELIVERABLE_EXTENSIONS.join(', ')}.`, 400, 'invalid_file_type'));
    return;
  }
  cb(null, true);
};

const deliverableStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/deliverables/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

/** Un archivo por entregable (campo `file`), hasta 50 MB. */
export const uploadDeliverableFile = multer({
  storage: deliverableStorage,
  fileFilter: deliverableFileFilter,
  limits: { fileSize: MAX_DELIVERABLE_SIZE, files: 1 },
});

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
    // Los límites dependen de la ruta (pedidos: 20 MB y 10 archivos;
    // entregables: 50 MB y 1 archivo).
    const isDeliverable = req.originalUrl.startsWith('/api/deliverables');
    if (error.code === 'LIMIT_FILE_SIZE') {
      const maxMb = isDeliverable ? MAX_DELIVERABLE_SIZE / 1024 / 1024 : (MAX_FILE_SIZE * 2) / 1024 / 1024;
      res.status(400).json({
        success: false,
        code: 'file_too_large',
        message: `Un archivo supera el tamaño máximo (${maxMb} MB).`,
      });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        code: 'too_many_files',
        message: isDeliverable ? 'Sube un solo archivo por entregable.' : 'Puedes adjuntar máximo 10 archivos.',
      });
      return;
    }
  }

  next(error);
};
