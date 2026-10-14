/**
 * Auditoría de cuentas médicas (/api/auditoria/procesar-facturas-pdf): si el
 * PDF tiene texto de factura pero ningún procedimiento, se responde 400
 * `no_procedures` antes de llamar al modelo y sin guardar nada (antes quedaba
 * una factura a medias en la base y la respuesta era un 500).
 */
const extraerBatch = jest.fn();
const tomarDecisionFinal = jest.fn();
const FacturaMock = jest.fn();

jest.mock('../../services/extraccion-especializada.service', () => ({
  __esModule: true,
  default: { extraerBatch },
}));
jest.mock('../../services/auditor-ia-final.service', () => ({
  __esModule: true,
  default: { tomarDecisionFinal },
}));
jest.mock('../../models/Factura', () => ({ __esModule: true, default: FacturaMock }));

import type { Request, Response } from 'express';
import controller from '../../controllers/auditoria-medica.controller';
import { NO_PROCEDURES_MESSAGE } from '../../services/expert-system.service';

function respuesta() {
  const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = jest.fn((body: unknown) => {
    res.body = body;
    return res as Response;
  });
  return res;
}

describe('procesar-facturas-pdf sin procedimientos', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    extraerBatch.mockReset();
    tomarDecisionFinal.mockReset();
    FacturaMock.mockReset();
  });

  it.each([
    ['con el arreglo vacío', []],
    ['sin el arreglo', undefined],
  ])('factura %s: 400 no_procedures, sin IA y sin guardar', async (_caso, procedimientos) => {
    extraerBatch.mockResolvedValueOnce([
      {
        tipoDetectado: 'FACTURA',
        confianza: 80,
        metodo: 'IA',
        datos: {
          numeroFactura: 'FE-0001',
          fecha: '01/10/2026',
          paciente: { nombre: '', documento: '' },
          diagnostico: '',
          autorizacion: '',
          valorTotalFactura: 0,
          procedimientos,
        },
      },
    ]);
    const req = { body: {}, files: [{ path: '/tmp/x.pdf', originalname: 'x.pdf' }] } as unknown as Request;
    const res = respuesta();

    await controller.procesarFacturasPDF(req, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'no_procedures', message: NO_PROCEDURES_MESSAGE });
    expect(tomarDecisionFinal).not.toHaveBeenCalled();
    expect(FacturaMock).not.toHaveBeenCalled();
  });
});
