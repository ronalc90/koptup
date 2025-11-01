// Validation Service - Integrates RAG for comprehensive medical billing validation
import { MedicalDataExtraction } from './openai.service';
import {
  validateCUPSCode,
  validateCIE10Code,
  validateTariff,
  checkClinicalCoherence,
  checkAuthorizationRequirement,
  detectGlosas,
} from './rag.service';
import { logger } from '../utils/logger';

export interface ValidationResult {
  campo: string;
  validacion: string;
  resultado: 'APROBADO' | 'RECHAZADO' | 'ALERTA' | 'PENDIENTE';
  observacion: string;
  paciente: string;
  cuenta_nombre: string;
}

export interface GlosaResult {
  tieneGlosa: boolean;
  tipoGlosa: string | null;
  codigoGlosa: string | null;
  descripcionGlosa: string;
  recomendacion: string;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  // Detalles financieros para glosas de tarifa
  valorCobrado?: number;
  valorCorrecto?: number;
  diferencia?: number;
  codigoCUPS?: string;
}

/**
 * Perform comprehensive validation on extracted medical data
 */
export async function validateMedicalData(
  extraction: MedicalDataExtraction,
  cuentaNombre: string
): Promise<{
  validaciones: ValidationResult[];
  glosas: GlosaResult[];
}> {
  const validaciones: ValidationResult[] = [];
  const glosas: GlosaResult[] = [];
  const paciente = extraction.nombre_completo || 'Sin nombre';

  try {
    // VALIDACIÓN 1: Códigos CUPS
    if (extraction.procedimientos && extraction.procedimientos.length > 0) {
      for (const proc of extraction.procedimientos) {
        if (proc.codigo_cups) {
          try {
            const resultCUPS = await validateCUPSCode(proc.codigo_cups);
            validaciones.push({
              campo: 'Codigo_CUPS',
              validacion: `¿Código CUPS "${proc.codigo_cups}" existe?`,
              resultado: resultCUPS.valido ? 'APROBADO' : 'RECHAZADO',
              observacion: resultCUPS.observacion,
              paciente,
              cuenta_nombre: cuentaNombre,
            });

            if (!resultCUPS.valido) {
              glosas.push({
                tieneGlosa: true,
                tipoGlosa: 'Administrativa',
                codigoGlosa: '201',
                descripcionGlosa: `Código CUPS "${proc.codigo_cups}" no válido`,
                recomendacion: 'Verificar código en catálogo oficial CUPS',
                severidad: 'ALTA',
              });
            }
          } catch (error) {
            logger.error('Error validating CUPS:', error);
          }
        }
      }
    }

    // VALIDACIÓN 2: Códigos CIE-10
    if (extraction.diagnosticos && extraction.diagnosticos.length > 0) {
      for (const diag of extraction.diagnosticos) {
        if (diag.codigo) {
          try {
            const resultCIE = await validateCIE10Code(diag.codigo);
            validaciones.push({
              campo: 'Codigo_CIE10',
              validacion: `¿Código CIE-10 "${diag.codigo}" válido?`,
              resultado: resultCIE.valido ? 'APROBADO' : 'RECHAZADO',
              observacion: resultCIE.observacion,
              paciente,
              cuenta_nombre: cuentaNombre,
            });

            if (!resultCIE.valido) {
              glosas.push({
                tieneGlosa: true,
                tipoGlosa: 'Administrativa',
                codigoGlosa: '205',
                descripcionGlosa: `Código CIE-10 "${diag.codigo}" no válido`,
                recomendacion: 'Verificar código en clasificación CIE-10',
                severidad: 'ALTA',
              });
            }
          } catch (error) {
            logger.error('Error validating CIE-10:', error);
          }
        }
      }
    }

    // VALIDACIÓN 3: Tarifas
    if (extraction.procedimientos && extraction.procedimientos.length > 0) {
      for (const proc of extraction.procedimientos) {
        if (proc.codigo_cups && proc.valor_total) {
          try {
            const resultTarifa = await validateTariff(
              proc.codigo_cups,
              proc.valor_total,
              extraction.convenio || undefined
            );

            const resultado = resultTarifa.valido ? 'APROBADO' :
              resultTarifa.diferencia && Math.abs(resultTarifa.diferencia) > 0 ? 'ALERTA' : 'APROBADO';

            validaciones.push({
              campo: 'Tarifa_Correcta',
              validacion: `¿Tarifa CUPS "${proc.codigo_cups}" correcta?`,
              resultado,
              observacion: `Valor cobrado: $${proc.valor_total.toLocaleString()}. ${resultTarifa.observacion}`,
              paciente,
              cuenta_nombre: cuentaNombre,
            });

            if (!resultTarifa.valido && resultTarifa.diferencia && Math.abs(resultTarifa.diferencia) > 1000) {
              const valorCobrado = proc.valor_total;
              const valorCorrecto = resultTarifa.valorEsperado || 0;
              const diferencia = resultTarifa.diferencia;

              glosas.push({
                tieneGlosa: true,
                tipoGlosa: 'Facturación',
                codigoGlosa: '102',
                descripcionGlosa: `Diferencia de tarifa CUPS ${proc.codigo_cups}: Valor cobrado $${valorCobrado.toLocaleString()}, Valor correcto $${valorCorrecto.toLocaleString()}, Diferencia ${diferencia > 0 ? 'a devolver' : 'a cobrar'} $${Math.abs(diferencia).toLocaleString()}`,
                recomendacion: diferencia > 0
                  ? `Devolver $${Math.abs(diferencia).toLocaleString()} al paciente/EPS. Ajustar factura al valor correcto de $${valorCorrecto.toLocaleString()}`
                  : `Cobrar adicional de $${Math.abs(diferencia).toLocaleString()}. El valor correcto es $${valorCorrecto.toLocaleString()}`,
                severidad: Math.abs(diferencia) > 10000 ? 'ALTA' : 'MEDIA',
                valorCobrado: valorCobrado,
                valorCorrecto: valorCorrecto,
                diferencia: diferencia,
                codigoCUPS: proc.codigo_cups,
              });
            }
          } catch (error) {
            logger.error('Error validating tariff:', error);
          }
        }
      }
    }

    // VALIDACIÓN 4: Coherencia Clínica
    if (
      extraction.diagnosticos &&
      extraction.diagnosticos.length > 0 &&
      extraction.procedimientos &&
      extraction.procedimientos.length > 0
    ) {
      const diagPrincipal = extraction.diagnosticos.find((d) => d.principal) || extraction.diagnosticos[0];
      const procPrincipal = extraction.procedimientos[0];

      if (diagPrincipal && procPrincipal) {
        try {
          const resultCoherencia = await checkClinicalCoherence(
            diagPrincipal.codigo,
            diagPrincipal.descripcion,
            procPrincipal.codigo_cups,
            procPrincipal.descripcion
          );

          validaciones.push({
            campo: 'Coherencia_Clinica',
            validacion: '¿Coherencia diagnóstico-procedimiento?',
            resultado: resultCoherencia.coherente ? 'APROBADO' : 'ALERTA',
            observacion: resultCoherencia.observacion,
            paciente,
            cuenta_nombre: cuentaNombre,
          });

          if (!resultCoherencia.coherente) {
            glosas.push({
              tieneGlosa: true,
              tipoGlosa: 'Auditoría Clínica',
              codigoGlosa: '301',
              descripcionGlosa: 'Incoherencia entre diagnóstico y procedimiento',
              recomendacion: 'Solicitar justificación médica o revisar codificación',
              severidad: 'MEDIA',
            });
          }
        } catch (error) {
          logger.error('Error checking coherence:', error);
        }
      }
    }

    // VALIDACIÓN 5: Requisitos de Autorización
    if (extraction.procedimientos && extraction.procedimientos.length > 0) {
      for (const proc of extraction.procedimientos) {
        if (proc.codigo_cups) {
          try {
            const resultAuth = await checkAuthorizationRequirement(
              proc.codigo_cups,
              proc.descripcion
            );

            const tieneAuth = extraction.autorizaciones && extraction.autorizaciones.length > 0;

            const resultado = resultAuth.requiereAutorizacion ?
              (tieneAuth ? 'APROBADO' : 'RECHAZADO') :
              'APROBADO';

            validaciones.push({
              campo: 'Requiere_Autorizacion',
              validacion: `¿CUPS "${proc.codigo_cups}" requiere autorización?`,
              resultado,
              observacion: resultAuth.observacion,
              paciente,
              cuenta_nombre: cuentaNombre,
            });

            if (resultAuth.requiereAutorizacion && !tieneAuth) {
              glosas.push({
                tieneGlosa: true,
                tipoGlosa: 'Facturación',
                codigoGlosa: '101',
                descripcionGlosa: 'Falta autorización previa requerida',
                recomendacion: 'Solicitar y adjuntar copia de autorización vigente',
                severidad: 'ALTA',
              });
            }
          } catch (error) {
            logger.error('Error checking authorization:', error);
          }
        }
      }
    }

    // VALIDACIÓN 6: Vigencia de Autorizaciones
    if (extraction.autorizaciones && extraction.autorizaciones.length > 0) {
      for (const auth of extraction.autorizaciones) {
        // Check if authorization has all required fields
        const completa = auth.numero && auth.tipo;

        validaciones.push({
          campo: 'Autorizacion_Vigente',
          validacion: `Autorización ${auth.numero} completa`,
          resultado: completa ? 'APROBADO' : 'ALERTA',
          observacion: completa ?
            `Autorización ${auth.numero} registrada. Verificar vigencia manualmente.` :
            'Autorización incompleta, falta información',
          paciente,
          cuenta_nombre: cuentaNombre,
        });

        if (!completa) {
          glosas.push({
            tieneGlosa: true,
            tipoGlosa: 'Administrativa',
            codigoGlosa: '202',
            descripcionGlosa: 'Autorización incompleta o falta información',
            recomendacion: 'Completar todos los campos de la autorización',
            severidad: 'MEDIA',
          });
        }
      }
    }

    // VALIDACIÓN 7: Completitud Documental
    const tieneFactura = !!extraction.nro_factura;
    const tienePaciente = !!extraction.nombre_completo;
    const tieneDiagnostico = extraction.diagnosticos && extraction.diagnosticos.length > 0;
    const tieneProcedimiento = extraction.procedimientos && extraction.procedimientos.length > 0;

    const completitud = [tieneFactura, tienePaciente, tieneDiagnostico, tieneProcedimiento];
    const porcentajeCompleto = (completitud.filter(Boolean).length / completitud.length) * 100;

    validaciones.push({
      campo: 'Documentos_Completos',
      validacion: '¿Documentación completa?',
      resultado: porcentajeCompleto === 100 ? 'APROBADO' :
        porcentajeCompleto >= 75 ? 'ALERTA' : 'RECHAZADO',
      observacion: `Completitud: ${porcentajeCompleto.toFixed(0)}%. ${!tieneFactura ? 'Falta factura. ' : ''}${!tienePaciente ? 'Falta datos paciente. ' : ''}${!tieneDiagnostico ? 'Falta diagnóstico. ' : ''}${!tieneProcedimiento ? 'Falta procedimiento. ' : ''}`,
      paciente,
      cuenta_nombre: cuentaNombre,
    });

    if (porcentajeCompleto < 100) {
      glosas.push({
        tieneGlosa: true,
        tipoGlosa: 'Administrativa',
        codigoGlosa: '203',
        descripcionGlosa: 'Documentación incompleta',
        recomendacion: 'Completar toda la documentación requerida',
        severidad: porcentajeCompleto < 75 ? 'ALTA' : 'BAJA',
      });
    }

    // VALIDACIÓN 8: Detección General de Glosas
    const glosaGeneral = await detectGlosas({
      codigoCUPS: extraction.procedimientos?.[0]?.codigo_cups,
      codigoCIE10: extraction.diagnosticos?.[0]?.codigo,
      valorCobrado: extraction.valor_neto || extraction.valor_bruto || undefined,
      tieneAutorizacion: extraction.autorizaciones && extraction.autorizaciones.length > 0,
      requiereAutorizacion: validaciones.some(v =>
        v.campo === 'Requiere_Autorizacion' && v.resultado === 'RECHAZADO'
      ),
      coherenciaClinica: validaciones.some(v =>
        v.campo === 'Coherencia_Clinica' && v.resultado === 'APROBADO'
      ),
    });

    if (glosaGeneral.tieneGlosa) {
      validaciones.push({
        campo: 'Glosa_Detectada',
        validacion: 'Análisis general de glosas',
        resultado: 'RECHAZADO',
        observacion: `${glosaGeneral.codigoGlosa}: ${glosaGeneral.descripcionGlosa}. ${glosaGeneral.recomendacion}`,
        paciente,
        cuenta_nombre: cuentaNombre,
      });
    } else {
      validaciones.push({
        campo: 'Glosa_Detectada',
        validacion: 'Análisis general de glosas',
        resultado: glosas.length === 0 ? 'APROBADO' : 'ALERTA',
        observacion: glosas.length === 0 ?
          'No se detectaron glosas. Cuenta aparentemente limpia.' :
          `Se detectaron ${glosas.length} glosa(s). Revisar detalles.`,
        paciente,
        cuenta_nombre: cuentaNombre,
      });
    }

  } catch (error: any) {
    logger.error('Error in validation process:', error);
    validaciones.push({
      campo: 'Sistema',
      validacion: 'Validación automática',
      resultado: 'PENDIENTE',
      observacion: `Error en el proceso de validación: ${error.message}`,
      paciente,
      cuenta_nombre: cuentaNombre,
    });
  }

  return {
    validaciones,
    glosas,
  };
}

/**
 * Batch validate multiple extractions
 */
export async function validateBatch(
  extractions: MedicalDataExtraction[],
  cuentasMap: Map<string, string>
): Promise<{
  allValidations: ValidationResult[];
  allGlosas: GlosaResult[];
  summary: {
    totalCuentas: number;
    cuentasConGlosas: number;
    totalGlosas: number;
    glosasAlta: number;
    glosaMedia: number;
    glosaBaja: number;
  };
}> {
  const allValidations: ValidationResult[] = [];
  const allGlosas: GlosaResult[] = [];

  logger.info(`Starting validation for ${extractions.length} extractions...`);

  for (const extraction of extractions) {
    const cuentaNombre = cuentasMap.get(extraction.cuenta_id) || extraction.cuenta_id;

    const { validaciones, glosas } = await validateMedicalData(extraction, cuentaNombre);

    allValidations.push(...validaciones);
    allGlosas.push(...glosas);

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const summary = {
    totalCuentas: extractions.length,
    cuentasConGlosas: new Set(allGlosas.map(g => allValidations.find(v => v.campo === 'Glosa_Detectada')?.cuenta_nombre)).size,
    totalGlosas: allGlosas.length,
    glosasAlta: allGlosas.filter(g => g.severidad === 'ALTA').length,
    glosaMedia: allGlosas.filter(g => g.severidad === 'MEDIA').length,
    glosaBaja: allGlosas.filter(g => g.severidad === 'BAJA').length,
  };

  logger.info(`Validation complete. Found ${summary.totalGlosas} glosas.`);

  return {
    allValidations,
    allGlosas,
    summary,
  };
}
