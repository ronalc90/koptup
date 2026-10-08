import multer from 'multer';
import mongoose from 'mongoose';
import { AppError, CorsError, classifyError } from '../../middleware/errorHandler';

describe('clasificación de errores del manejador global', () => {
  it('CORS → 403', () => {
    expect(classifyError(new CorsError())).toMatchObject({ status: 403, code: 'cors_forbidden' });
  });

  it('JSON inválido → 400', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed', status: 400 });
    expect(classifyError(err)).toMatchObject({ status: 400, code: 'invalid_json' });
  });

  it('cuerpo demasiado grande → 413', () => {
    const err = Object.assign(new Error('request entity too large'), { type: 'entity.too.large', status: 413 });
    expect(classifyError(err)).toMatchObject({ status: 413, code: 'payload_too_large' });
  });

  it('multer → 400', () => {
    expect(classifyError(new multer.MulterError('LIMIT_FILE_SIZE'))).toMatchObject({ status: 400 });
    expect(classifyError(new multer.MulterError('LIMIT_UNEXPECTED_FILE'))).toMatchObject({ status: 400 });
  });

  it('AppError conserva su estado; un error desconocido es 500 genérico', () => {
    expect(classifyError(new AppError('No encontrado', 404))).toMatchObject({ status: 404, message: 'No encontrado' });
    const unknown = classifyError(new Error('detalle interno con ruta /srv/app'));
    expect(unknown).toMatchObject({ status: 500, message: 'Internal server error' });
  });

  it('datos inválidos de Mongoose (validación o id mal formado) → 400', () => {
    expect(classifyError(new mongoose.Error.ValidationError())).toMatchObject({ status: 400, code: 'invalid_data' });
    expect(classifyError(new mongoose.Error.CastError('ObjectId', 'no-es-un-id', '_id'))).toMatchObject({ status: 400 });
  });
});
