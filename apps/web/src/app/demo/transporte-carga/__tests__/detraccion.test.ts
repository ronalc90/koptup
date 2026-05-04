import {
  calcularDetraccion,
  DETRACCION_PORCENTAJE_DEFAULT,
  DETRACCION_MONTO_MINIMO,
  DETRACCION_CODIGO_TRANSPORTE_CARGA,
} from '../lib/detraccion';

describe('calcularDetraccion', () => {
  it('no aplica si total < 700', () => {
    const r = calcularDetraccion({ totalFactura: 699.99 });
    expect(r.aplica).toBe(false);
    expect(r.motivo).toBe('monto_inferior_minimo');
    expect(r.monto).toBe(0);
    expect(r.netoPagar).toBe(699.99);
  });

  it('aplica con default 4% cuando total >= 700', () => {
    const r = calcularDetraccion({ totalFactura: 1000 });
    expect(r.aplica).toBe(true);
    expect(r.motivo).toBe('aplicable');
    expect(r.monto).toBe(40);
    expect(r.netoPagar).toBe(960);
    expect(r.codigo).toBe('027');
    expect(r.porcentaje).toBe(DETRACCION_PORCENTAJE_DEFAULT);
  });

  it('redondea a 2 decimales correctamente', () => {
    const r = calcularDetraccion({ totalFactura: 1183.55 });
    // 1183.55 * 0.04 = 47.342 => redondeado a 47.34
    expect(r.monto).toBe(47.34);
    expect(r.netoPagar).toBe(1136.21);
  });

  it('redondea correctamente otro ejemplo', () => {
    const r = calcularDetraccion({ totalFactura: 1000 });
    // 1000 * 0.04 = 40.00
    expect(r.monto).toBe(40);
    expect(r.netoPagar).toBe(960);
  });

  it('respeta porcentaje custom', () => {
    const r = calcularDetraccion({ totalFactura: 1000, porcentaje: 10 });
    expect(r.aplica).toBe(true);
    expect(r.monto).toBe(100);
    expect(r.netoPagar).toBe(900);
    expect(r.porcentaje).toBe(10);
  });

  it('respeta montoMinimo custom', () => {
    const r = calcularDetraccion({ totalFactura: 100, montoMinimo: 50 });
    expect(r.aplica).toBe(true);
    expect(r.monto).toBe(4); // 100 * 0.04
    expect(r.netoPagar).toBe(96);
  });

  it('no aplica con montoMinimo custom superior', () => {
    const r = calcularDetraccion({ totalFactura: 100, montoMinimo: 200 });
    expect(r.aplica).toBe(false);
    expect(r.monto).toBe(0);
    expect(r.netoPagar).toBe(100);
  });

  it('devuelve codigo 027 para transporte', () => {
    const r = calcularDetraccion({ totalFactura: 1000 });
    expect(r.codigo).toBe(DETRACCION_CODIGO_TRANSPORTE_CARGA);
  });

  it('respeta cuenta custom', () => {
    const cuentaCustom = '11-222-333333';
    const r = calcularDetraccion({ totalFactura: 1000, cuenta: cuentaCustom });
    expect(r.cuenta).toBe(cuentaCustom);
  });

  it('caso límite: total exactamente igual a montoMinimo', () => {
    const r = calcularDetraccion({ totalFactura: 700 });
    expect(r.aplica).toBe(true);
    expect(r.monto).toBe(28);
    expect(r.netoPagar).toBe(672);
  });

  it('caso límite: total un centavo menos que montoMinimo', () => {
    const r = calcularDetraccion({ totalFactura: 699.99 });
    expect(r.aplica).toBe(false);
    expect(r.monto).toBe(0);
  });
});
