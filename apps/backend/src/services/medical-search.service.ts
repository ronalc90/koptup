import { logger } from '../utils/logger';
import CUPS from '../models/CUPS';
import Medicamento from '../models/Medicamento';
import Diagnostico from '../models/Diagnostico';
import MaterialInsumo from '../models/MaterialInsumo';

/**
 * Servicio de búsqueda híbrida para datos médicos
 * Combina búsqueda estructurada en BD + RAG para contexto adicional
 */

export interface SearchResult<T> {
  items: T[];
  total: number;
  source: 'database' | 'rag' | 'hybrid';
}

/**
 * Buscar códigos CUPS (procedimientos)
 */
export async function searchCUPS(query: {
  codigo?: string;
  descripcion?: string;
  categoria?: string;
  especialidad?: string;
  limit?: number;
}): Promise<SearchResult<any>> {
  try {
    const filter: any = { activo: true };

    if (query.codigo) {
      filter.codigo = new RegExp(query.codigo, 'i');
    }

    if (query.descripcion) {
      filter.$text = { $search: query.descripcion };
    }

    if (query.categoria) {
      filter.categoria = query.categoria;
    }

    if (query.especialidad) {
      filter.especialidad = new RegExp(query.especialidad, 'i');
    }

    const items = await CUPS.find(filter)
      .limit(query.limit || 20)
      .lean();

    logger.info(`Found ${items.length} CUPS codes`);

    return {
      items,
      total: items.length,
      source: 'database',
    };
  } catch (error: any) {
    logger.error('Error searching CUPS:', error);
    throw error;
  }
}

/**
 * Buscar medicamentos
 */
export async function searchMedicamentos(query: {
  principioActivo?: string;
  nombreComercial?: string;
  codigoATC?: string;
  codigoCUM?: string;
  pos?: boolean;
  limit?: number;
}): Promise<SearchResult<any>> {
  try {
    const filter: any = { activo: true };

    if (query.codigoATC) {
      filter.codigoATC = new RegExp(query.codigoATC, 'i');
    }

    if (query.codigoCUM) {
      filter.codigoCUM = query.codigoCUM;
    }

    if (query.principioActivo || query.nombreComercial) {
      filter.$text = {
        $search: query.principioActivo || query.nombreComercial || '',
      };
    }

    if (query.pos !== undefined) {
      filter.pos = query.pos;
    }

    const items = await Medicamento.find(filter)
      .limit(query.limit || 20)
      .lean();

    logger.info(`Found ${items.length} medications`);

    return {
      items,
      total: items.length,
      source: 'database',
    };
  } catch (error: any) {
    logger.error('Error searching medications:', error);
    throw error;
  }
}

/**
 * Buscar diagnósticos CIE-10
 */
export async function searchDiagnosticos(query: {
  codigoCIE10?: string;
  descripcion?: string;
  categoria?: string;
  limit?: number;
}): Promise<SearchResult<any>> {
  try {
    const filter: any = { activo: true };

    if (query.codigoCIE10) {
      filter.codigoCIE10 = new RegExp(query.codigoCIE10, 'i');
    }

    if (query.descripcion) {
      filter.$text = { $search: query.descripcion };
    }

    if (query.categoria) {
      filter.categoria = new RegExp(query.categoria, 'i');
    }

    const items = await Diagnostico.find(filter)
      .limit(query.limit || 20)
      .lean();

    logger.info(`Found ${items.length} diagnoses`);

    return {
      items,
      total: items.length,
      source: 'database',
    };
  } catch (error: any) {
    logger.error('Error searching diagnoses:', error);
    throw error;
  }
}

/**
 * Buscar materiales e insumos
 */
export async function searchMaterialesInsumos(query: {
  codigo?: string;
  nombre?: string;
  categoria?: string;
  limit?: number;
}): Promise<SearchResult<any>> {
  try {
    const filter: any = { activo: true };

    if (query.codigo) {
      filter.codigo = new RegExp(query.codigo, 'i');
    }

    if (query.nombre) {
      filter.$text = { $search: query.nombre };
    }

    if (query.categoria) {
      filter.categoria = query.categoria;
    }

    const items = await MaterialInsumo.find(filter)
      .limit(query.limit || 20)
      .lean();

    logger.info(`Found ${items.length} materials/supplies`);

    return {
      items,
      total: items.length,
      source: 'database',
    };
  } catch (error: any) {
    logger.error('Error searching materials:', error);
    throw error;
  }
}

/**
 * Calcular tarifa total de procedimientos
 */
export async function calcularTarifaProcedimientos(
  codigosCUPS: string[],
  tipoTarifa: 'SOAT' | 'ISS2001' | 'ISS2004' = 'SOAT'
): Promise<{
  total: number;
  detalle: any[];
  codigosNoEncontrados: string[];
}> {
  try {
    const procedimientos = await CUPS.find({
      codigo: { $in: codigosCUPS },
      activo: true,
    }).lean();

    const codigosEncontrados = new Set(procedimientos.map((p) => p.codigo));
    const codigosNoEncontrados = codigosCUPS.filter((c) => !codigosEncontrados.has(c));

    const detalle = procedimientos.map((proc) => {
      let tarifa = 0;
      if (tipoTarifa === 'SOAT') tarifa = proc.tarifaSOAT || 0;
      else if (tipoTarifa === 'ISS2001') tarifa = proc.tarifaISS2001 || 0;
      else if (tipoTarifa === 'ISS2004') tarifa = proc.tarifaISS2004 || 0;

      return {
        codigo: proc.codigo,
        descripcion: proc.descripcion,
        tarifa,
        tipoTarifa,
      };
    });

    const total = detalle.reduce((sum, item) => sum + item.tarifa, 0);

    return {
      total,
      detalle,
      codigosNoEncontrados,
    };
  } catch (error: any) {
    logger.error('Error calculating procedure fees:', error);
    throw error;
  }
}

/**
 * Calcular costo de medicamentos
 */
export async function calcularCostoMedicamentos(
  medicamentosConCantidad: Array<{ codigoCUM: string; cantidad: number }>
): Promise<{
  total: number;
  detalle: any[];
  codigosNoEncontrados: string[];
}> {
  try {
    const codigosCUM = medicamentosConCantidad.map((m) => m.codigoCUM);

    const medicamentos = await Medicamento.find({
      codigoCUM: { $in: codigosCUM },
      activo: true,
    }).lean();

    const medicamentosMap = new Map(medicamentos.map((m) => [m.codigoCUM, m]));

    const detalle = medicamentosConCantidad
      .filter((mc) => medicamentosMap.has(mc.codigoCUM))
      .map((mc) => {
        const med = medicamentosMap.get(mc.codigoCUM)!;
        const subtotal = med.precioUnitario * mc.cantidad;

        return {
          codigoCUM: mc.codigoCUM,
          principioActivo: med.principioActivo,
          nombreComercial: med.nombreComercial,
          cantidad: mc.cantidad,
          precioUnitario: med.precioUnitario,
          subtotal,
        };
      });

    const codigosEncontrados = new Set([...medicamentosMap.keys()]);
    const codigosNoEncontrados = codigosCUM.filter((c) => !codigosEncontrados.has(c));

    const total = detalle.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      total,
      detalle,
      codigosNoEncontrados,
    };
  } catch (error: any) {
    logger.error('Error calculating medication costs:', error);
    throw error;
  }
}

export default {
  searchCUPS,
  searchMedicamentos,
  searchDiagnosticos,
  searchMaterialesInsumos,
  calcularTarifaProcedimientos,
  calcularCostoMedicamentos,
};
