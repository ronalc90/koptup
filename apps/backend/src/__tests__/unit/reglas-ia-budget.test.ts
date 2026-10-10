/**
 * Reglas de facturación (herramienta interna de salud): la interpretación con
 * IA respeta el tope mensual HEALTH_MONTHLY_BUDGET_USD y suma su costo al
 * gasto de "health". Se simulan el SDK de Anthropic y el servicio de topes.
 */
const create = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ messages: { create } })),
}));

jest.mock('../../services/ai-budget.service', () => ({
  getBudgetStatus: jest.fn(),
  recordSpend: jest.fn().mockResolvedValue(undefined),
}));

import reglasIAService from '../../services/reglas-ia.service';
import { getBudgetStatus, recordSpend } from '../../services/ai-budget.service';

const REGLA = {
  condiciones: [{ campo: 'valor', operador: 'menor', valor: 1000 }],
  accion: { tipo: 'ignorar_glosa' },
  confianza: 0.9,
  explicacion: 'Ignora glosas de valor menor a 1000.',
};

describe('reglas de facturación con IA: tope de salud', () => {
  beforeEach(() => {
    create.mockReset();
    (recordSpend as jest.Mock).mockClear();
  });

  it('con el tope del mes agotado no llama a la IA', async () => {
    (getBudgetStatus as jest.Mock).mockResolvedValue({ available: false, reason: 'budget_exhausted' });
    await expect(reglasIAService.interpretarRegla('Ignorar glosas menores a 1000', 'glosa')).rejects.toThrow(/tope mensual/);
    expect(getBudgetStatus).toHaveBeenCalledWith('health');
    expect(create).not.toHaveBeenCalled();
  });

  it('sin poder medir el gasto (Redis caído) tampoco llama', async () => {
    (getBudgetStatus as jest.Mock).mockResolvedValue({ available: false, reason: 'unavailable' });
    await expect(reglasIAService.interpretarRegla('Ignorar glosas menores a 1000', 'glosa')).rejects.toThrow(/gasto de IA/);
    expect(create).not.toHaveBeenCalled();
  });

  it('con cupo, llama y suma el costo real a "health"', async () => {
    (getBudgetStatus as jest.Mock).mockResolvedValue({ available: true, reason: null });
    create.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(REGLA) }],
      usage: { input_tokens: 1_000_000, output_tokens: 1_000_000 },
    });
    const regla = await reglasIAService.interpretarRegla('Ignorar glosas menores a 1000', 'glosa');
    expect(regla.accion.tipo).toBe('ignorar_glosa');
    expect(create).toHaveBeenCalledTimes(1);
    // 1M de entrada (USD 3) + 1M de salida (USD 15).
    expect(recordSpend).toHaveBeenCalledWith('health', 18);
  });
});
