import type { Factura } from '../types';

// Sistema de Pago de Obligaciones Tributarias (SPOT) - SUNAT
export const DETRACCION_CODIGO_TRANSPORTE_CARGA = '027'; // Servicio de transporte de bienes por vía terrestre
export const DETRACCION_PORCENTAJE_DEFAULT = 4;
export const DETRACCION_MONTO_MINIMO = 700; // S/ 700 — no aplica si total < 700
export const CUENTA_BANCO_NACION_DEFAULT = '00-000-000000';

export interface CalcularDetraccionInput {
  totalFactura: number;
  porcentaje?: number;
  montoMinimo?: number;
  cuenta?: string;
}

export interface CalcularDetraccionResult {
  aplica: boolean;
  motivo?: string; // 'monto_inferior_minimo', 'aplicable'
  porcentaje: number;
  monto: number; // redondeado a 2 decimales
  netoPagar: number; // total - monto
  cuenta: string;
  codigo: string;
}

/**
 * Calcula la detracción según el monto de la factura.
 * Si totalFactura < montoMinimo, no aplica.
 * Si totalFactura >= montoMinimo, aplica con el porcentaje especificado.
 */
export function calcularDetraccion(
  input: CalcularDetraccionInput
): CalcularDetraccionResult {
  const porcentaje = input.porcentaje ?? DETRACCION_PORCENTAJE_DEFAULT;
  const montoMinimo = input.montoMinimo ?? DETRACCION_MONTO_MINIMO;
  const cuenta = input.cuenta ?? CUENTA_BANCO_NACION_DEFAULT;

  if (input.totalFactura < montoMinimo) {
    return {
      aplica: false,
      motivo: 'monto_inferior_minimo',
      porcentaje,
      monto: 0,
      netoPagar: input.totalFactura,
      cuenta,
      codigo: DETRACCION_CODIGO_TRANSPORTE_CARGA,
    };
  }

  // Redondeo a 2 decimales: Math.round(n * 100) / 100
  const monto = Math.round((input.totalFactura * porcentaje) / 100 * 100) / 100;

  return {
    aplica: true,
    motivo: 'aplicable',
    porcentaje,
    monto,
    netoPagar: Math.round((input.totalFactura - monto) * 100) / 100,
    cuenta,
    codigo: DETRACCION_CODIGO_TRANSPORTE_CARGA,
  };
}

/**
 * Aplica la detracción a una factura, devolviendo una nueva instancia con el campo actualizado.
 */
export function aplicarDetraccionAFactura(
  factura: Factura,
  opciones?: Partial<CalcularDetraccionInput>
): Factura {
  const resultado = calcularDetraccion({
    totalFactura: factura.total,
    ...opciones,
  });

  return {
    ...factura,
    detraccion: {
      aplica: resultado.aplica,
      porcentaje: resultado.porcentaje,
      monto: resultado.monto,
      cuenta: resultado.cuenta,
      codigo: resultado.codigo,
    },
  };
}

/**
 * Formatea el número de cuenta para detracción en formato XXX-XXX-XXXXXX
 */
export function formatearCuentaDetraccion(cuenta: string): string {
  // Elimina guiones existentes
  const limpia = cuenta.replace(/-/g, '');
  // Formatea como XXX-XXX-XXXXXX
  if (limpia.length === 9) {
    return `${limpia.substring(0, 3)}-${limpia.substring(3, 6)}-${limpia.substring(6)}`;
  }
  return cuenta;
}
