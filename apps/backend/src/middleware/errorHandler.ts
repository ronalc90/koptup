import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/** Origen rechazado por la política de CORS (responde 403, no 500). */
export class CorsError extends AppError {
  constructor() {
    super('Origen no permitido', 403);
  }
}

interface BodyParserError extends Error {
  type?: string;
  status?: number;
  statusCode?: number;
}

/**
 * Traduce un error a { status, message, code } sin filtrar detalles internos.
 * Exportado para probarlo de forma aislada.
 */
export function classifyError(err: unknown): { status: number; message: string; code: string; operational: boolean } {
  if (err instanceof AppError) {
    return {
      status: err.statusCode,
      message: err.message,
      code: err instanceof CorsError ? 'cors_forbidden' : err.statusCode < 500 ? 'bad_request' : 'internal_error',
      operational: err.isOperational,
    };
  }

  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido.',
      LIMIT_FILE_COUNT: 'Enviaste demasiados archivos.',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado.',
      LIMIT_PART_COUNT: 'La solicitud tiene demasiadas partes.',
      LIMIT_FIELD_KEY: 'Nombre de campo demasiado largo.',
      LIMIT_FIELD_VALUE: 'Valor de campo demasiado largo.',
      LIMIT_FIELD_COUNT: 'Demasiados campos.',
    };
    return {
      status: 400,
      message: messages[err.code] ?? 'Archivo inválido.',
      code: `upload_${err.code.toLowerCase()}`,
      operational: true,
    };
  }

  // Datos inválidos detectados por Mongoose (campos requeridos, ids mal
  // formados): es un error del cliente, no del servidor.
  const named = err as { name?: string } | null;
  if (named && typeof named === 'object' && (named.name === 'ValidationError' || named.name === 'CastError')) {
    return { status: 400, message: 'Datos inválidos.', code: 'invalid_data', operational: true };
  }

  const bp = err as BodyParserError;
  if (bp && typeof bp === 'object') {
    if (bp.type === 'entity.parse.failed') {
      return { status: 400, message: 'El cuerpo de la solicitud no es un JSON válido.', code: 'invalid_json', operational: true };
    }
    if (bp.type === 'entity.too.large') {
      return { status: 413, message: 'La solicitud es demasiado grande.', code: 'payload_too_large', operational: true };
    }
    const status = bp.status ?? bp.statusCode;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return { status, message: 'Solicitud inválida.', code: 'bad_request', operational: true };
    }
  }

  return { status: 500, message: 'Internal server error', code: 'internal_error', operational: false };
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // Express identifica el manejador de errores por sus 4 argumentos.
  _next: NextFunction
): void => {
  const { status, message, code, operational } = classifyError(err);

  if (!operational || status >= 500) {
    logger.error('Error:', {
      message: err?.message,
      stack: err?.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else if (status === 403 && code === 'cors_forbidden') {
    logger.warn(`CORS: origen rechazado (${req.headers.origin ?? 'sin origen'})`);
  }

  if (res.headersSent) return;

  res.status(status).json({
    success: false,
    code,
    message,
    // Solo en desarrollo local: nunca en producción ni en pruebas.
    ...(process.env.NODE_ENV === 'development' && {
      error: err?.message,
      stack: err?.stack,
    }),
  });
};

export const asyncHandler = <T = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
