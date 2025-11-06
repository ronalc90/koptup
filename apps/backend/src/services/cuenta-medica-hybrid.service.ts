import { logger } from '../utils/logger';
import { extractTextFromPDF } from './pdf.service';
import { getOpenAI } from './openai.service';
import {
  searchCUPS,
  searchMedicamentos,
  searchDiagnosticos,
  calcularTarifaProcedimientos,
  calcularCostoMedicamentos,
} from './medical-search.service';

/**
 * Servicio híbrido para procesamiento de cuentas médicas
 * Combina OpenAI (extracción) + Base de Datos (validación y tarifas)
 */

export interface PrestacionExtraida {
  codigoCUPS?: string;
  descripcion: string;
  cantidad: number;
  fecha?: string;
  profesional?: string;
  // Enriquecido desde BD
  tarifa?: number;
  tipoTarifa?: string;
  validado: boolean;
  observaciones?: string;
}

export interface MedicamentoExtraido {
  codigoCUM?: string;
  principioActivo?: string;
  nombreComercial?: string;
  cantidad: number;
  // Enriquecido desde BD
  precioUnitario?: number;
  subtotal?: number;
  validado: boolean;
  observaciones?: string;
}

export interface CuentaMedicaExtraida {
  paciente?: {
    nombre?: string;
    identificacion?: string;
    edad?: string;
    genero?: string;
  };
  diagnosticos: Array<{
    codigoCIE10?: string;
    descripcion: string;
    validado: boolean;
  }>;
  prestaciones: PrestacionExtraida[];
  medicamentos: MedicamentoExtraido[];
  materialesInsumos: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario?: number;
    subtotal?: number;
  }>;
  resumen: {
    totalProcedimientos: number;
    totalMedicamentos: number;
    totalMateriales: number;
    totalGeneral: number;
    tipoTarifa: string;
  };
  metadata: {
    fechaExtraccion: Date;
    origen: string;
    itemsValidados: number;
    itemsNoValidados: number;
    advertencias: string[];
  };
}

/**
 * Prompt optimizado para extracción rápida de códigos
 */
const EXTRACTION_PROMPT = `Eres un asistente especializado en extracción de datos de cuentas médicas colombianas.

Tu tarea es extraer ÚNICAMENTE los códigos y cantidades del documento. NO calcules tarifas.

Extrae:
1. **Paciente**: nombre, identificación, edad, género
2. **Diagnósticos**: código CIE-10 y descripción
3. **Procedimientos (CUPS)**: código CUPS, descripción, cantidad, fecha, profesional
4. **Medicamentos**: código CUM o nombre, cantidad
5. **Materiales/Insumos**: nombre y cantidad

IMPORTANTE:
- Extrae TODOS los códigos CUPS que encuentres (pueden ser cientos)
- NO inventes códigos que no estén en el documento
- Si un código está parcial o ilegible, marca como "CODIGO_ILEGIBLE"
- NO calcules precios, solo extrae cantidades

Responde en formato JSON:
{
  "paciente": { "nombre": "", "identificacion": "", "edad": "", "genero": "" },
  "diagnosticos": [{ "codigoCIE10": "", "descripcion": "" }],
  "procedimientos": [{ "codigoCUPS": "", "descripcion": "", "cantidad": 1, "fecha": "", "profesional": "" }],
  "medicamentos": [{ "codigoCUM": "", "principioActivo": "", "nombreComercial": "", "cantidad": 1 }],
  "materialesInsumos": [{ "nombre": "", "cantidad": 1 }]
}`;

/**
 * Extraer y validar cuenta médica usando arquitectura híbrida
 */
export async function procesarCuentaMedicaHibrida(
  pdfPath: string,
  tipoTarifa: 'SOAT' | 'ISS2001' | 'ISS2004' = 'SOAT'
): Promise<CuentaMedicaExtraida> {
  const advertencias: string[] = [];
  const fechaExtraccion = new Date();

  try {
    // 1. Extraer texto del PDF
    logger.info('Extrayendo texto del PDF...');
    const pdfText = await extractTextFromPDF(pdfPath);

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('No se pudo extraer texto del PDF');
    }

    // 2. Extraer datos estructurados con OpenAI (solo extracción, sin cálculos)
    logger.info('Extrayendo datos con OpenAI...');
    const datosExtraidos = await extraerDatosConOpenAI(pdfText);

    // 3. Validar y enriquecer diagnósticos desde BD
    logger.info('Validando diagnósticos...');
    const diagnosticosValidados = await validarDiagnosticos(datosExtraidos.diagnosticos);

    // 4. Validar y enriquecer procedimientos CUPS desde BD
    logger.info('Validando procedimientos CUPS...');
    const procedimientosValidados = await validarYTarifarProcedimientos(
      datosExtraidos.procedimientos,
      tipoTarifa
    );

    // 5. Validar y enriquecer medicamentos desde BD
    logger.info('Validando medicamentos...');
    const medicamentosValidados = await validarYCostearMedicamentos(datosExtraidos.medicamentos);

    // 6. Calcular totales
    const totalProcedimientos = procedimientosValidados.reduce(
      (sum, p) => sum + (p.tarifa || 0),
      0
    );
    const totalMedicamentos = medicamentosValidados.reduce(
      (sum, m) => sum + (m.subtotal || 0),
      0
    );
    const totalMateriales = datosExtraidos.materialesInsumos.reduce(
      (sum, m) => sum + (m.precioUnitario || 0) * m.cantidad,
      0
    );

    // Contar items validados
    const itemsValidados =
      procedimientosValidados.filter((p) => p.validado).length +
      medicamentosValidados.filter((m) => m.validado).length;

    const itemsTotales =
      procedimientosValidados.length + medicamentosValidados.length;

    if (itemsValidados < itemsTotales * 0.7) {
      advertencias.push(
        `Solo ${itemsValidados} de ${itemsTotales} items fueron validados en la base de datos`
      );
    }

    const resultado: CuentaMedicaExtraida = {
      paciente: datosExtraidos.paciente,
      diagnosticos: diagnosticosValidados,
      prestaciones: procedimientosValidados,
      medicamentos: medicamentosValidados,
      materialesInsumos: datosExtraidos.materialesInsumos,
      resumen: {
        totalProcedimientos,
        totalMedicamentos,
        totalMateriales,
        totalGeneral: totalProcedimientos + totalMedicamentos + totalMateriales,
        tipoTarifa,
      },
      metadata: {
        fechaExtraccion,
        origen: pdfPath,
        itemsValidados,
        itemsNoValidados: itemsTotales - itemsValidados,
        advertencias,
      },
    };

    logger.info('Cuenta médica procesada exitosamente (híbrido)');
    return resultado;
  } catch (error: any) {
    logger.error('Error procesando cuenta médica híbrida:', error);
    throw error;
  }
}

/**
 * Extraer datos con OpenAI (solo extracción, sin cálculos)
 */
async function extraerDatosConOpenAI(pdfText: string): Promise<any> {
  try {
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT,
        },
        {
          role: 'user',
          content: `Texto del PDF:\n${pdfText.slice(0, 50000)}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    const parsed = JSON.parse(content);

    return {
      paciente: parsed.paciente || {},
      diagnosticos: parsed.diagnosticos || [],
      procedimientos: parsed.procedimientos || [],
      medicamentos: parsed.medicamentos || [],
      materialesInsumos: parsed.materialesInsumos || [],
    };
  } catch (error: any) {
    logger.error('Error extrayendo datos con OpenAI:', error);
    throw error;
  }
}

/**
 * Validar diagnósticos en la BD
 */
async function validarDiagnosticos(
  diagnosticos: Array<{ codigoCIE10?: string; descripcion: string }>
): Promise<Array<{ codigoCIE10?: string; descripcion: string; validado: boolean }>> {
  const validados: Array<any> = [];

  for (const diag of diagnosticos) {
    let validado = false;

    if (diag.codigoCIE10) {
      try {
        const resultado = await searchDiagnosticos({
          codigoCIE10: diag.codigoCIE10,
          limit: 1,
        });

        if (resultado.items.length > 0) {
          validado = true;
          // Enriquecer con datos de la BD
          diag.descripcion = resultado.items[0].descripcion;
        }
      } catch (error) {
        logger.warn(`Error validando diagnóstico ${diag.codigoCIE10}:`, error);
      }
    }

    validados.push({
      ...diag,
      validado,
    });
  }

  return validados;
}

/**
 * Validar procedimientos CUPS y calcular tarifas desde BD
 */
async function validarYTarifarProcedimientos(
  procedimientos: Array<{
    codigoCUPS?: string;
    descripcion: string;
    cantidad: number;
    fecha?: string;
    profesional?: string;
  }>,
  tipoTarifa: 'SOAT' | 'ISS2001' | 'ISS2004'
): Promise<PrestacionExtraida[]> {
  const validados: PrestacionExtraida[] = [];

  for (const proc of procedimientos) {
    let validado = false;
    let tarifa = 0;
    let observaciones: string | undefined;

    if (proc.codigoCUPS && proc.codigoCUPS !== 'CODIGO_ILEGIBLE') {
      try {
        const resultado = await searchCUPS({
          codigo: proc.codigoCUPS,
          limit: 1,
        });

        if (resultado.items.length > 0) {
          const cupsData = resultado.items[0];
          validado = true;

          // Obtener tarifa según tipo
          if (tipoTarifa === 'SOAT') tarifa = cupsData.tarifaSOAT || 0;
          else if (tipoTarifa === 'ISS2001') tarifa = cupsData.tarifaISS2001 || 0;
          else if (tipoTarifa === 'ISS2004') tarifa = cupsData.tarifaISS2004 || 0;

          // Enriquecer descripción
          proc.descripcion = cupsData.descripcion;

          if (tarifa === 0) {
            observaciones = 'Código CUPS encontrado pero sin tarifa configurada';
          }
        } else {
          observaciones = 'Código CUPS no encontrado en base de datos';
        }
      } catch (error) {
        logger.warn(`Error validando CUPS ${proc.codigoCUPS}:`, error);
        observaciones = 'Error al consultar base de datos';
      }
    } else {
      observaciones = 'Código CUPS no disponible o ilegible';
    }

    validados.push({
      codigoCUPS: proc.codigoCUPS,
      descripcion: proc.descripcion,
      cantidad: proc.cantidad,
      fecha: proc.fecha,
      profesional: proc.profesional,
      tarifa: tarifa * proc.cantidad,
      tipoTarifa,
      validado,
      observaciones,
    });
  }

  return validados;
}

/**
 * Validar medicamentos y calcular costos desde BD
 */
async function validarYCostearMedicamentos(
  medicamentos: Array<{
    codigoCUM?: string;
    principioActivo?: string;
    nombreComercial?: string;
    cantidad: number;
  }>
): Promise<MedicamentoExtraido[]> {
  const validados: MedicamentoExtraido[] = [];

  for (const med of medicamentos) {
    let validado = false;
    let precioUnitario = 0;
    let observaciones: string | undefined;

    if (med.codigoCUM) {
      try {
        const resultado = await searchMedicamentos({
          codigoCUM: med.codigoCUM,
          limit: 1,
        });

        if (resultado.items.length > 0) {
          const medData = resultado.items[0];
          validado = true;
          precioUnitario = medData.precioUnitario || 0;

          // Enriquecer datos
          med.principioActivo = medData.principioActivo;
          med.nombreComercial = medData.nombreComercial;

          if (precioUnitario === 0) {
            observaciones = 'Medicamento encontrado pero sin precio configurado';
          }
        } else {
          observaciones = 'Código CUM no encontrado en base de datos';
        }
      } catch (error) {
        logger.warn(`Error validando medicamento ${med.codigoCUM}:`, error);
        observaciones = 'Error al consultar base de datos';
      }
    } else if (med.principioActivo || med.nombreComercial) {
      // Intentar búsqueda por nombre
      try {
        const resultado = await searchMedicamentos({
          principioActivo: med.principioActivo,
          nombreComercial: med.nombreComercial,
          limit: 1,
        });

        if (resultado.items.length > 0) {
          const medData = resultado.items[0];
          validado = true;
          precioUnitario = medData.precioUnitario || 0;
          med.codigoCUM = medData.codigoCUM;
          observaciones = 'Medicamento encontrado por nombre (verificar código CUM)';
        } else {
          observaciones = 'Medicamento no encontrado por nombre';
        }
      } catch (error) {
        logger.warn(`Error buscando medicamento por nombre:`, error);
        observaciones = 'Error al consultar base de datos';
      }
    } else {
      observaciones = 'Código CUM y nombre no disponibles';
    }

    validados.push({
      codigoCUM: med.codigoCUM,
      principioActivo: med.principioActivo,
      nombreComercial: med.nombreComercial,
      cantidad: med.cantidad,
      precioUnitario,
      subtotal: precioUnitario * med.cantidad,
      validado,
      observaciones,
    });
  }

  return validados;
}

export default {
  procesarCuentaMedicaHibrida,
};
