/**
 * Lógica de la demo del sistema experto: motor de reglas sobre el lote de
 * ejemplo, comparación de configuraciones, búsqueda en el catálogo de
 * ejemplo, borrador en el navegador y formatos deterministas.
 */
import { CODIGOS_REGLAS, CONFIG_DEFECTO, comparar, mismaConfig, simular, type ConfigMotor } from '../_lib/motor';
import { buscarEnCatalogo } from '../_lib/busqueda';
import { CLAVE_BORRADOR, escribirBorrador, leerBorrador, normalizarConfig } from '../_lib/borrador';
import { CONVENIO_EJEMPLO, LOTE_EJEMPLO } from '../_lib/datos-ejemplo';
import { conPorcentaje, formatoCOP, formatoFecha } from '../_lib/formato';

const sin202Tol10: ConfigMotor = {
  ...CONFIG_DEFECTO,
  toleranciaDiferenciaTarifa: 10,
  reglasHabilitadas: CODIGOS_REGLAS.filter((c) => c !== '202'),
};

/** Dígito de verificación del NIT (módulo 11 de la DIAN). */
function dvNit(nit: string): number {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digitos = nit.replace(/\D/g, '').split('').reverse();
  const suma = digitos.reduce((s, d, i) => s + Number(d) * pesos[i], 0);
  const r = suma % 11;
  return r < 2 ? r : 11 - r;
}

describe('motor de reglas sobre el lote de ejemplo', () => {
  it('con la configuración por defecto propone 11 glosas por $509.800 en 10 de 12 facturas', () => {
    const r = simular(CONFIG_DEFECTO);
    expect(r.facturas).toBe(12);
    expect(r.lineas).toBe(29);
    expect(r.totalFacturado).toBe(2269860);
    expect(r.glosas).toHaveLength(11);
    expect(r.totalGlosado).toBe(509800);
    expect(r.facturasConGlosa).toBe(10);
  });

  it('cada una de las 8 reglas glosa al menos una línea (hay un error sembrado por regla)', () => {
    const r = simular(CONFIG_DEFECTO);
    for (const c of CODIGOS_REGLAS) expect(r.porRegla[c].cantidad).toBeGreaterThan(0);
  });

  it('la regla 301 marca para revisión sin valor y nunca se glosa más que la línea', () => {
    const r = simular(CONFIG_DEFECTO);
    expect(r.glosas.filter((g) => g.regla === '301').every((g) => g.valor === 0)).toBe(true);
    const porLinea = new Map<string, number>();
    for (const g of r.glosas) porLinea.set(g.lineaId, (porLinea.get(g.lineaId) ?? 0) + g.valor);
    const lineas = new Map(LOTE_EJEMPLO.flatMap((f) => f.lineas.map((l) => [l.id, l.cantidad * l.valorUnitario] as const)));
    porLinea.forEach((v, id) => expect(v).toBeLessThanOrEqual(lineas.get(id)!));
  });

  it('apagar la 202 y subir la tolerancia al 10 % quita 4 glosas y $265.400', () => {
    const base = simular(CONFIG_DEFECTO);
    const nueva = simular(sin202Tol10);
    const d = comparar(base, nueva);
    expect(nueva.glosas).toHaveLength(7);
    expect(nueva.totalGlosado).toBe(244400);
    expect(d.nuevas).toHaveLength(0);
    expect(d.eliminadas).toHaveLength(4);
    expect(d.diferenciaValor).toBe(-265400);
  });

  it('bajar la tolerancia al 2 % agrega glosas de tarifa (102) que antes no salían', () => {
    const d = comparar(simular(CONFIG_DEFECTO), simular({ ...CONFIG_DEFECTO, toleranciaDiferenciaTarifa: 2 }));
    expect(d.nuevas.length).toBeGreaterThan(0);
    expect(d.nuevas.every((g) => g.regla === '102')).toBe(true);
  });

  it('mismaConfig ignora el orden de las reglas', () => {
    expect(mismaConfig(CONFIG_DEFECTO, { ...CONFIG_DEFECTO, reglasHabilitadas: [...CODIGOS_REGLAS].reverse() })).toBe(true);
    expect(mismaConfig(CONFIG_DEFECTO, sin202Tol10)).toBe(false);
  });
});

describe('datos de ejemplo', () => {
  it('los NIT del convenio y de las IPS tienen dígito de verificación válido', () => {
    const nits = [CONVENIO_EJEMPLO.nit, ...new Set(LOTE_EJEMPLO.map((f) => f.nitIps))];
    for (const nit of nits) {
      const [base, dv] = nit.split('-');
      expect(dvNit(base)).toBe(Number(dv));
    }
  });

  it('cada servicio se presta antes o el mismo día de la factura', () => {
    for (const f of LOTE_EJEMPLO) for (const l of f.lineas) expect(l.fechaServicio <= f.fecha).toBe(true);
  });
});

describe('búsqueda en el catálogo de ejemplo', () => {
  it('encuentra la radiografía de tórax por palabras comunes y sin tildes', () => {
    expect(buscarEnCatalogo('radiografia de torax')[0].item.codigo).toBe('871121');
    expect(buscarEnCatalogo('placa de pecho')[0].item.codigo).toBe('871121');
  });

  it('busca también por el inicio del código', () => {
    expect(buscarEnCatalogo('8902').map((r) => r.item.codigo)).toEqual(expect.arrayContaining(['890201', '890202']));
  });

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(buscarEnCatalogo('xyz inexistente')).toEqual([]);
  });
});

describe('borrador en el navegador', () => {
  beforeEach(() => window.localStorage.clear());

  it('guarda, recupera y borra el borrador', () => {
    escribirBorrador(sin202Tol10);
    expect(leerBorrador()).toEqual(sin202Tol10);
    escribirBorrador(null);
    expect(leerBorrador()).toBeNull();
  });

  it('descarta valores dañados y limita la tolerancia a 0–20 %', () => {
    window.localStorage.setItem(CLAVE_BORRADOR, '{no es json');
    expect(leerBorrador()).toBeNull();
    expect(normalizarConfig({ toleranciaDiferenciaTarifa: 'x' })).toBeNull();
    expect(
      normalizarConfig({ toleranciaDiferenciaTarifa: 99, manualPorDefecto: 'OTRO', reglasHabilitadas: ['101', '999'] })
    ).toEqual({ toleranciaDiferenciaTarifa: 20, manualPorDefecto: 'ISS2004', reglasHabilitadas: ['101'] });
  });
});

describe('formatos deterministas', () => {
  it('formatea pesos, porcentajes y fechas sin depender de la zona horaria', () => {
    expect(formatoCOP(2269860, 'es')).toBe('$2.269.860');
    expect(formatoCOP(-265400, 'en')).toBe('-$265,400');
    expect(conPorcentaje(22.46, 'es')).toBe('22,5 %');
    expect(conPorcentaje(5, 'en')).toBe('5%');
    expect(formatoFecha('2026-09-05', 'es')).toBe('5 sep 2026');
    expect(formatoFecha('2026-09-05', 'en')).toBe('Sep 5, 2026');
  });
});
