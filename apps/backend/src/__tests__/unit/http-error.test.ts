import express from 'express';
import request from 'supertest';
import { normalizeErrorBody, normalizeErrorResponses, sendError } from '../../utils/http-error';

describe('formato único de error', () => {
  it('completa code y message de las respuestas antiguas sin quitar datos', () => {
    expect(normalizeErrorBody(404, { success: false, message: 'Order not found' }, false)).toEqual({
      success: false,
      code: 'not_found',
      message: 'Order not found',
    });
    expect(normalizeErrorBody(400, { error: 'too_many_docs', max: 50 }, false)).toEqual({
      error: 'too_many_docs',
      max: 50,
      success: false,
      code: 'too_many_docs',
      message: 'La solicitud no es válida.',
    });
    expect(normalizeErrorBody(403, { error: 'Unauthorized' }, false)).toMatchObject({ code: 'forbidden', message: 'Unauthorized' });
    // Lo que ya trae el formato se respeta.
    expect(normalizeErrorBody(429, { success: false, code: 'rate_limited', message: 'Espera' }, false)).toEqual({ success: false, code: 'rate_limited', message: 'Espera' });
  });

  it('en producción un 5xx no devuelve detalles internos', () => {
    const out = normalizeErrorBody(500, { success: false, error: 'connect ECONNREFUSED 10.0.0.5:27017', stack: 'Error: …' }, true) as Record<string, unknown>;
    expect(out).toEqual({ success: false, code: 'internal_error', message: 'Ocurrió un error inesperado. Intenta de nuevo.' });
    // En desarrollo se conservan para depurar.
    const dev = normalizeErrorBody(500, { error: 'detalle' }, false) as Record<string, unknown>;
    expect(dev.error).toBe('detalle');
  });

  it('el middleware solo toca respuestas 4xx/5xx con cuerpo objeto', async () => {
    const app = express();
    app.use(normalizeErrorResponses);
    app.get('/ok', (_req, res) => res.json({ success: true, data: 1 }));
    app.get('/legacy', (_req, res) => res.status(404).json({ success: false, message: 'Factura no encontrada' }));
    app.get('/nuevo', (_req, res) => sendError(res, 409, 'already_done', 'Ya estaba hecho.', { id: 'x' }));
    app.get('/texto', (_req, res) => res.status(400).json('texto plano'));

    expect((await request(app).get('/ok')).body).toEqual({ success: true, data: 1 });
    expect((await request(app).get('/legacy')).body).toEqual({ success: false, code: 'not_found', message: 'Factura no encontrada' });
    expect((await request(app).get('/nuevo')).body).toEqual({ id: 'x', success: false, code: 'already_done', message: 'Ya estaba hecho.' });
    expect((await request(app).get('/texto')).body).toBe('texto plano');
  });
});
