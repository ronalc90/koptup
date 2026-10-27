import { MAX_DESCRIPTION_LENGTH, clampDescription } from '@/lib/meta-text';

describe('clampDescription', () => {
  it('deja intacto un texto que cabe', () => {
    expect(clampDescription('Demo corta.')).toBe('Demo corta.');
  });

  it('recorta en una palabra completa y nunca pasa del máximo', () => {
    const long = 'Plataforma de reservas y agendamiento online con calendario inteligente, gestión de citas, recordatorios por correo, pagos anticipados, reportes por sede y un panel para cada profesional del equipo que atiende a los clientes.';
    expect(long.length).toBeGreaterThan(MAX_DESCRIPTION_LENGTH);
    const out = clampDescription(long);
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(out.endsWith('…')).toBe(true);
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
    expect(out.slice(0, -1).endsWith(' ')).toBe(false);
  });
});
