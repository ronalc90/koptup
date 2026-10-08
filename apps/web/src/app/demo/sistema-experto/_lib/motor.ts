/**
 * Motor de reglas del simulador (se ejecuta en el navegador).
 *
 * Usa los mismos códigos internos, nombres y severidades que las 8 reglas
 * implementadas en el motor del servidor (`expert-rules.service.ts`) y la
 * configuración que se lee y guarda en `/api/expert/configuracion`
 * (tolerancia, manual por defecto y reglas habilitadas). La condición exacta
 * que evalúa cada regla aquí es la que describe la interfaz.
 */

import {
  CATALOGO_POR_CODIGO,
  CONVENIO_EJEMPLO,
  LOTE_EJEMPLO,
  type FacturaEjemplo,
  type LineaFactura,
  type ManualTarifario,
} from './datos-ejemplo';

export type Severidad = 'CRITICA' | 'ALTA' | 'MEDIA';

export interface DefinicionRegla {
  codigo: string;
  severidad: Severidad;
}

/** Las 8 reglas implementadas en el motor del servidor, con su severidad. */
export const REGLAS: DefinicionRegla[] = [
  { codigo: '101', severidad: 'CRITICA' },
  { codigo: '102', severidad: 'ALTA' },
  { codigo: '201', severidad: 'CRITICA' },
  { codigo: '202', severidad: 'ALTA' },
  { codigo: '301', severidad: 'MEDIA' },
  { codigo: '303', severidad: 'ALTA' },
  { codigo: '401', severidad: 'CRITICA' },
  { codigo: '402', severidad: 'ALTA' },
];

export const CODIGOS_REGLAS = REGLAS.map((r) => r.codigo);

export const SEVERIDAD_POR_REGLA: Record<string, Severidad> = Object.fromEntries(
  REGLAS.map((r) => [r.codigo, r.severidad])
);

/** Parte de la configuración del servidor que usa el simulador. */
export interface ConfigMotor {
  toleranciaDiferenciaTarifa: number;
  manualPorDefecto: ManualTarifario;
  reglasHabilitadas: string[];
}

/** Valores por defecto del motor del servidor (`CONFIG_DEFECTO`). */
export const CONFIG_DEFECTO: ConfigMotor = {
  toleranciaDiferenciaTarifa: 5,
  manualPorDefecto: 'ISS2004',
  reglasHabilitadas: [...CODIGOS_REGLAS],
};

export type MotivoGlosa =
  | 'r101'
  | 'r102'
  | 'r201'
  | 'r202Incompleta'
  | 'r202Vencida'
  | 'r301'
  | 'r303'
  | 'r401'
  | 'r402';

export interface Glosa {
  /** Identidad estable para comparar dos configuraciones: línea + regla. */
  clave: string;
  factura: string;
  ips: string;
  lineaId: string;
  cups: string;
  regla: string;
  severidad: Severidad;
  /** Valor glosado efectivo (nunca supera lo que queda sin glosar de la línea). */
  valor: number;
  motivo: MotivoGlosa;
  /** Datos crudos para armar el texto de la explicación. */
  datos: Record<string, string | number>;
}

export interface ResultadoSimulacion {
  glosas: Glosa[];
  totalFacturado: number;
  totalGlosado: number;
  facturas: number;
  lineas: number;
  facturasConGlosa: number;
  porRegla: Record<string, { cantidad: number; valor: number }>;
}

/** Orden de evaluación: primero lo que glosa la línea completa. */
const ORDEN = ['201', '303', '101', '202', '402', '401', '102', '301'];

function evaluarLinea(
  factura: FacturaEjemplo,
  linea: LineaFactura,
  config: ConfigMotor,
  vistos: Set<string>
): Glosa[] {
  const activas = new Set(config.reglasHabilitadas);
  const total = linea.cantidad * linea.valorUnitario;
  const item = CATALOGO_POR_CODIGO[linea.cups];
  const candidatas: Array<Omit<Glosa, 'clave' | 'factura' | 'ips' | 'lineaId' | 'cups' | 'severidad' | 'valor'> & { calculado: number }> = [];

  const claveDuplicado = `${factura.paciente.id}|${linea.cups}|${linea.fechaServicio}`;
  const esDuplicado = vistos.has(claveDuplicado);
  vistos.add(claveDuplicado);

  if (!item) {
    candidatas.push({ regla: '201', motivo: 'r201', calculado: total, datos: { cups: linea.cups } });
  } else {
    if (esDuplicado) {
      candidatas.push({
        regla: '303',
        motivo: 'r303',
        calculado: total,
        datos: { cups: linea.cups, fecha: linea.fechaServicio, paciente: factura.paciente.id },
      });
    }

    const aut = linea.autorizacion;
    if (item.requiereAutorizacion && !aut) {
      candidatas.push({ regla: '101', motivo: 'r101', calculado: total, datos: { cups: linea.cups } });
    }

    if (aut) {
      const faltan: string[] = [];
      if (!aut.numero) faltan.push('numero');
      if (!aut.fecha) faltan.push('fecha');
      if (!aut.vigencia) faltan.push('vigencia');
      if (faltan.length > 0) {
        candidatas.push({ regla: '202', motivo: 'r202Incompleta', calculado: total, datos: { faltan: faltan.join(',') } });
      } else if (aut.vigencia && linea.fechaServicio > aut.vigencia) {
        // Fechas ISO (AAAA-MM-DD): la comparación de texto es cronológica.
        candidatas.push({
          regla: '202',
          motivo: 'r202Vencida',
          calculado: total,
          datos: { vigencia: aut.vigencia, fecha: linea.fechaServicio, numero: aut.numero ?? '' },
        });
      }

      if (aut.cantidadAutorizada && linea.cantidad > aut.cantidadAutorizada) {
        const exceso = linea.cantidad - aut.cantidadAutorizada;
        candidatas.push({
          regla: '402',
          motivo: 'r402',
          calculado: exceso * linea.valorUnitario,
          datos: { cantidad: linea.cantidad, autorizada: aut.cantidadAutorizada, exceso },
        });
      }
    }

    const pactada = CONVENIO_EJEMPLO.tarifasPactadas[linea.cups];
    if (pactada !== undefined) {
      if (linea.valorUnitario > pactada) {
        candidatas.push({
          regla: '401',
          motivo: 'r401',
          calculado: (linea.valorUnitario - pactada) * linea.cantidad,
          datos: { cobrado: linea.valorUnitario, pactado: pactada },
        });
      }
    } else {
      const tarifa = item.tarifas[config.manualPorDefecto];
      const porcentaje = ((linea.valorUnitario - tarifa) / tarifa) * 100;
      if (porcentaje > config.toleranciaDiferenciaTarifa) {
        candidatas.push({
          regla: '102',
          motivo: 'r102',
          calculado: (linea.valorUnitario - tarifa) * linea.cantidad,
          datos: {
            cobrado: linea.valorUnitario,
            tarifa,
            manual: config.manualPorDefecto,
            porcentaje: Math.round(porcentaje * 10) / 10,
            tolerancia: config.toleranciaDiferenciaTarifa,
          },
        });
      }
    }

    if (item.soloSexo && item.soloSexo !== factura.paciente.sexo) {
      candidatas.push({
        regla: '301',
        motivo: 'r301',
        calculado: 0,
        datos: { cups: linea.cups, sexo: factura.paciente.sexo },
      });
    }
  }

  let restante = total;
  const glosas: Glosa[] = [];
  for (const regla of ORDEN) {
    for (const c of candidatas) {
      if (c.regla !== regla || !activas.has(regla)) continue;
      const valor = Math.max(0, Math.min(c.calculado, restante));
      restante -= valor;
      glosas.push({
        clave: `${linea.id}:${regla}`,
        factura: factura.numero,
        ips: factura.ips,
        lineaId: linea.id,
        cups: linea.cups,
        regla,
        severidad: SEVERIDAD_POR_REGLA[regla],
        valor,
        motivo: c.motivo,
        datos: c.datos,
      });
    }
  }
  return glosas;
}

export function simular(config: ConfigMotor, lote: FacturaEjemplo[] = LOTE_EJEMPLO): ResultadoSimulacion {
  const vistos = new Set<string>();
  const glosas: Glosa[] = [];
  let totalFacturado = 0;
  let lineas = 0;
  const facturasConGlosa = new Set<string>();

  for (const factura of lote) {
    for (const linea of factura.lineas) {
      lineas += 1;
      totalFacturado += linea.cantidad * linea.valorUnitario;
      const resultado = evaluarLinea(factura, linea, config, vistos);
      if (resultado.length > 0) facturasConGlosa.add(factura.numero);
      glosas.push(...resultado);
    }
  }

  const porRegla: ResultadoSimulacion['porRegla'] = Object.fromEntries(
    CODIGOS_REGLAS.map((c) => [c, { cantidad: 0, valor: 0 }])
  );
  for (const g of glosas) {
    porRegla[g.regla].cantidad += 1;
    porRegla[g.regla].valor += g.valor;
  }

  return {
    glosas,
    totalFacturado,
    totalGlosado: glosas.reduce((s, g) => s + g.valor, 0),
    facturas: lote.length,
    lineas,
    facturasConGlosa: facturasConGlosa.size,
    porRegla,
  };
}

export interface Comparacion {
  nuevas: Glosa[];
  eliminadas: Glosa[];
  diferenciaValor: number;
}

export function comparar(base: ResultadoSimulacion, propuesta: ResultadoSimulacion): Comparacion {
  const clavesBase = new Set(base.glosas.map((g) => g.clave));
  const clavesPropuesta = new Set(propuesta.glosas.map((g) => g.clave));
  return {
    nuevas: propuesta.glosas.filter((g) => !clavesBase.has(g.clave)),
    eliminadas: base.glosas.filter((g) => !clavesPropuesta.has(g.clave)),
    diferenciaValor: propuesta.totalGlosado - base.totalGlosado,
  };
}

export function mismaConfig(a: ConfigMotor, b: ConfigMotor): boolean {
  if (a.toleranciaDiferenciaTarifa !== b.toleranciaDiferenciaTarifa) return false;
  if (a.manualPorDefecto !== b.manualPorDefecto) return false;
  const sa = CODIGOS_REGLAS.filter((c) => a.reglasHabilitadas.includes(c)).join(',');
  const sb = CODIGOS_REGLAS.filter((c) => b.reglasHabilitadas.includes(c)).join(',');
  return sa === sb;
}
