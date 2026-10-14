/**
 * Sistema experto: si la IA no devuelve procedimientos (o devuelve otra cosa
 * en su lugar), el procesamiento termina con un 422 `no_procedures` y un
 * mensaje claro, no con un 500 «not iterable».
 */
const create = jest.fn();
jest.mock('../../services/pdf.service', () => ({
  extractTextFromPDF: jest.fn(async () => ({ text: 'Factura de prueba sin detalle legible' })),
}));
jest.mock('../../services/openai.service', () => ({
  getOpenAIFor: () => ({ chat: { completions: { create } } }),
}));

import { AppError } from '../../middleware/errorHandler';
import { NO_PROCEDURES_MESSAGE, sistemaExperto } from '../../services/expert-system.service';

describe('sistema experto sin procedimientos', () => {
  it.each([
    ['sin el arreglo', '{"numeroFactura":"FAC-1"}'],
    ['con otra cosa en su lugar', '{"procedimientos":"ninguno"}'],
    ['con el arreglo vacío', '{"procedimientos":[]}'],
  ])('respuesta de la IA %s: 422 no_procedures', async (_caso, contenido) => {
    create.mockResolvedValueOnce({ choices: [{ message: { content: contenido } }] });
    const err = await sistemaExperto.procesarFacturaMedica('/tmp/no-importa.pdf').catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 422, code: 'no_procedures', message: NO_PROCEDURES_MESSAGE });
  });
});
