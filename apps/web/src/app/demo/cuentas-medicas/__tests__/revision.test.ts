import { diaColombia, resumirRevision } from '../lib/revision';
import { anonimizarTexto, formatearFecha, nombreEntidad, zonaDeFecha } from '../lib/formato';
import { digitoVerificacion, fechaFacturaEjemplo, formatearNIT, NIT_EJEMPLO, numeroFacturaEjemplo } from '../lib/facturaEjemplo';

const etiquetas = { prestador: 'Prestador de ejemplo', pagador: 'Pagador de ejemplo', nit: 'NIT de ejemplo' };

describe('resumirRevision (estado de la factura según el auditor)', () => {
  it('queda «En auditoría» mientras haya glosas pendientes', () => {
    const r = resumirRevision({ estado: 'Aceptada' }, [
      { estado: 'Aceptada', valorGlosado: 7000 },
      { estado: 'Pendiente', valorGlosado: 2700 },
    ]);
    expect(r).toMatchObject({ estado: 'En Auditoría', glosas: 2, pendientes: 1, cerrada: false });
  });

  it('pasa a «Glosada» cuando todas las glosas están decididas y queda valor glosado', () => {
    const r = resumirRevision({ estado: 'En Auditoría' }, [
      { estado: 'Aceptada', valorGlosado: 7000 },
      { estado: 'Aceptada', valorGlosado: 1500 },
    ]);
    expect(r).toMatchObject({ estado: 'Glosada', pendientes: 0, valorGlosado: 8500, cerrada: true });
  });

  it('pasa a «Aceptada» si el auditor descarta todas las glosas', () => {
    const r = resumirRevision({ estado: 'En Auditoría' }, [
      { estado: 'Rechazada', valorGlosado: 0 },
      { estado: 'Rechazada', valorGlosado: 0 },
    ]);
    expect(r).toMatchObject({ estado: 'Aceptada', valorGlosado: 0, cerrada: true });
  });

  it('no cuenta lo glosado en las glosas descartadas', () => {
    const r = resumirRevision({ estado: 'En Auditoría' }, [
      { estado: 'Rechazada', valorGlosado: 5000 },
      { estado: 'Aceptada', valorGlosado: 1200 },
    ]);
    expect(r).toMatchObject({ estado: 'Glosada', valorGlosado: 1200 });
  });

  it('sin glosas conserva el estado del servidor, salvo «En auditoría» o «Radicada»', () => {
    expect(resumirRevision({ estado: 'En Auditoría' }, []).estado).toBe('Aceptada');
    expect(resumirRevision({ estado: 'Radicada' }, []).estado).toBe('Aceptada');
    expect(resumirRevision({ estado: 'Rechazada' }, []).estado).toBe('Rechazada');
  });

  it('reabrir una glosa devuelve la factura a «En auditoría»', () => {
    const r = resumirRevision({ estado: 'Glosada' }, [
      { estado: 'Pendiente', valorGlosado: 7000 },
      { estado: 'Aceptada', valorGlosado: 1500 },
    ]);
    expect(r.estado).toBe('En Auditoría');
  });
});

describe('diaColombia', () => {
  it('usa la fecha de Colombia (UTC-5), no la del navegador', () => {
    expect(diaColombia('2026-10-10T03:00:00.000Z')).toBe('2026-10-09');
    expect(diaColombia('2026-10-10T15:00:00.000Z')).toBe('2026-10-10');
    expect(diaColombia(undefined)).toBe('');
    expect(diaColombia('no-es-fecha')).toBe('');
  });

  it('respeta la fecha de la factura que el servidor guarda sin hora (medianoche UTC)', () => {
    expect(zonaDeFecha('2026-10-02T00:00:00.000Z')).toBe('UTC');
    expect(zonaDeFecha('2026-10-02T20:40:08.211Z')).toBe('America/Bogota');
    expect(diaColombia('2026-10-02T00:00:00.000Z')).toBe('2026-10-02');
    expect(formatearFecha('2026-10-02T00:00:00.000Z', 'es')).toMatch(/^2 .*oct.* 2026$/);
    expect(formatearFecha('2026-10-02T00:00:00.000Z', 'en')).toBe('Oct 2, 2026');
    // Auditada a las 9 p. m. de Colombia: ya es otro día en UTC, pero se muestra el de Colombia.
    expect(formatearFecha('2026-10-03T02:00:00.000Z', 'en')).toBe('Oct 2, 2026');
  });
});

describe('factura de ejemplo', () => {
  it('calcula el dígito de verificación del NIT como la DIAN (módulo 11)', () => {
    expect(digitoVerificacion('860007336')).toBe(1);
    expect(digitoVerificacion('900156264')).toBe(2);
    expect(digitoVerificacion(NIT_EJEMPLO)).toBe(7);
    expect(formatearNIT(NIT_EJEMPLO)).toBe('901.234.567-7');
  });

  it('usa un número FEDL- de cinco cifras que cambia cada minuto', () => {
    const a = numeroFacturaEjemplo(new Date('2026-10-14T15:00:00Z'));
    const b = numeroFacturaEjemplo(new Date('2026-10-14T15:01:00Z'));
    expect(a).toMatch(/^FEDL-\d{5}$/);
    expect(b).toMatch(/^FEDL-\d{5}$/);
    expect(a).not.toBe(b);
    expect(numeroFacturaEjemplo(new Date('2026-10-14T15:00:59Z'))).toBe(a);
  });

  it('fecha la factura 12 días antes de hoy, en hora de Colombia', () => {
    expect(fechaFacturaEjemplo(new Date('2026-10-10T15:00:00Z'))).toBe('28/09/2026');
    // A las 22:00 del 31 de diciembre en Colombia ya es 1 de enero en UTC.
    expect(fechaFacturaEjemplo(new Date('2027-01-01T03:00:00Z'))).toBe('19/12/2026');
  });
});

describe('entidades reales que guarda el backend', () => {
  it('se muestran como «de ejemplo»', () => {
    expect(nombreEntidad('NUEVA EPS', 'pagador', etiquetas)).toBe('Pagador de ejemplo');
    expect(nombreEntidad('COLSUBSIDIO', 'prestador', etiquetas)).toBe('Prestador de ejemplo');
    expect(nombreEntidad('', 'pagador', etiquetas)).toBe('Pagador de ejemplo');
    expect(nombreEntidad('Clínica Demo Los Andes', 'prestador', etiquetas)).toBe('Clínica Demo Los Andes');
  });

  it('se reemplazan en los textos del motor y del modelo', () => {
    const texto =
      '202 - SE GLOSA HEMOGRAMA: el contrato Nueva EPS permite máximo $ 8.500. NuevaEPS y Nueva E.P.S. con Colsubsidio (NIT 860007336-1, 900.156.264).';
    const limpio = anonimizarTexto(texto, etiquetas);
    expect(limpio).not.toMatch(/nueva\s*e\.?\s?p\.?\s?s|colsubsidio|860007336|900\.156\.264/i);
    expect(limpio).toContain('contrato Pagador de ejemplo permite');
    expect(limpio).toContain('NIT de ejemplo');
  });

  it('no toca palabras parecidas', () => {
    expect(anonimizarTexto('Nueva Esperanza', etiquetas)).toBe('Nueva Esperanza');
  });
});
