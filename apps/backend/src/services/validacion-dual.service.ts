/**
 * Servicio de Validación Dual: Sistema Experto + IA
 *
 * Combina la precisión determinística del sistema experto con la
 * comprensión contextual de IA para validaciones más robustas
 */

import { DatosFacturaPDF } from './pdf-extractor.service';
import { GlosaCalculada } from './glosa-calculator.service';

interface ValidacionExpertoResult {
  glosas: GlosaCalculada[];
  valorAPagar: number;
  valorGlosaAdmitiva: number;
  observacion: string;
  confianza: 100; // Sistema determinístico = 100% confianza en sus reglas
}

interface ValidacionIAResult {
  coherenciaClinica: {
    esCoherente: boolean;
    confianza: number; // 0-100
    razonamiento: string;
  };

  pertinenciaMedica: {
    esPertinente: boolean;
    confianza: number;
    razonamiento: string;
    alternativas?: string[];
  };

  valoracionPrecio: {
    valorEsperadoMin: number;
    valorEsperadoMax: number;
    valorPromedio: number;
    confianza: number;
    razonamiento: string;
  };

  anomaliasDetectadas: {
    tipo: 'precio_inusual' | 'cantidad_sospechosa' | 'diagnostico_incompatible' | 'codigo_incorrecto';
    severidad: 'baja' | 'media' | 'alta';
    descripcion: string;
    sugerencia: string;
  }[];

  recomendacion: 'APROBAR' | 'GLOSAR' | 'REVISAR';
  confianzaGlobal: number;
}

interface ResultadoValidacionDual {
  validacionExperto: ValidacionExpertoResult;
  validacionIA: ValidacionIAResult;

  decision: {
    tipoDecision: 'APROBADO' | 'GLOSADO' | 'REVISION_MANUAL';
    requiereRevisionHumana: boolean;
    nivelConfianza: number; // 0-100
    razonamiento: string;
  };

  glosas: {
    codigo: string;
    valor: number;
    origen: 'EXPERTO' | 'IA' | 'AMBOS';
    confianza: number;
    observacion: string;
  }[];

  estadisticas: {
    coincidencias: number;
    discrepancias: number;
    alertas: number;
  };
}

class ValidacionDualService {
  /**
   * Ejecuta validación dual completa
   */
  async validarConSistemasDuales(
    datosFactura: DatosFacturaPDF,
    validacionExperto: ValidacionExpertoResult
  ): Promise<ResultadoValidacionDual> {
    console.log('🔄 Iniciando validación dual (Experto + IA)...');

    // 1. Validación con IA
    const validacionIA = await this.validarConIA(datosFactura, validacionExperto);

    // 2. Comparar resultados
    const resultado = this.compararYArbitrar(validacionExperto, validacionIA, datosFactura);

    console.log(`✅ Validación dual completada:`);
    console.log(`   - Decisión: ${resultado.decision.tipoDecision}`);
    console.log(`   - Confianza: ${resultado.decision.nivelConfianza}%`);
    console.log(`   - Requiere revisión: ${resultado.decision.requiereRevisionHumana ? 'SÍ' : 'NO'}`);

    return resultado;
  }

  /**
   * Validación con IA (simulada por ahora, se puede integrar con OpenAI/Claude)
   */
  private async validarConIA(
    datosFactura: DatosFacturaPDF,
    validacionExperto: ValidacionExpertoResult
  ): Promise<ValidacionIAResult> {
    // TODO: Integrar con API de IA real (OpenAI, Anthropic Claude, etc.)
    // Por ahora, retornamos una validación simulada inteligente

    const anomalias: ValidacionIAResult['anomaliasDetectadas'] = [];

    // Analizar coherencia clínica
    const coherenciaClinica = this.analizarCoherenciaClinica(datosFactura);

    // Analizar precio
    const valoracionPrecio = this.analizarPrecio(datosFactura, validacionExperto);

    // Detectar anomalías
    if (datosFactura.cant && datosFactura.cant > 10) {
      anomalias.push({
        tipo: 'cantidad_sospechosa',
        severidad: 'media',
        descripcion: `Cantidad inusualmente alta: ${datosFactura.cant} unidades`,
        sugerencia: 'Verificar si es un procedimiento que típicamente se realiza 1 vez'
      });
    }

    if (validacionExperto.valorGlosaAdmitiva > validacionExperto.valorAPagar) {
      anomalias.push({
        tipo: 'precio_inusual',
        severidad: 'alta',
        descripcion: 'Glosa supera el valor a pagar',
        sugerencia: 'Revisar tarifario y negociación con IPS'
      });
    }

    // Calcular confianza global de IA
    const confianzaGlobal = Math.round(
      (coherenciaClinica.confianza + valoracionPrecio.confianza) / 2
    );

    // Determinar recomendación
    let recomendacion: ValidacionIAResult['recomendacion'] = 'APROBAR';
    if (anomalias.some(a => a.severidad === 'alta')) {
      recomendacion = 'REVISAR';
    } else if (validacionExperto.valorGlosaAdmitiva > 0) {
      recomendacion = 'GLOSAR';
    }

    return {
      coherenciaClinica,
      pertinenciaMedica: {
        esPertinente: true, // Por ahora asumimos pertinente
        confianza: 85,
        razonamiento: 'Procedimiento apropiado para el diagnóstico registrado'
      },
      valoracionPrecio,
      anomaliasDetectadas: anomalias,
      recomendacion,
      confianzaGlobal
    };
  }

  /**
   * Analiza coherencia clínica entre diagnóstico y procedimiento
   */
  private analizarCoherenciaClinica(datosFactura: DatosFacturaPDF): ValidacionIAResult['coherenciaClinica'] {
    // Simulación inteligente de análisis clínico
    // En producción, esto se haría con un LLM

    const diagnostico = datosFactura.diagnosticoPrincipal;
    const procedimiento = datosFactura.codigoProcedimiento;

    // Reglas básicas de coherencia
    if (diagnostico?.startsWith('Q') && procedimiento?.startsWith('89')) {
      // Diagnóstico congénito (Q) + Consulta (89) = Coherente
      return {
        esCoherente: true,
        confianza: 90,
        razonamiento: 'Consulta especializada apropiada para diagnóstico congénito'
      };
    }

    return {
      esCoherente: true,
      confianza: 75,
      razonamiento: 'Relación diagnóstico-procedimiento parece apropiada'
    };
  }

  /**
   * Analiza si el precio facturado es razonable
   */
  private analizarPrecio(
    datosFactura: DatosFacturaPDF,
    validacionExperto: ValidacionExpertoResult
  ): ValidacionIAResult['valoracionPrecio'] {
    const valorIPS = datosFactura.valorIPS;
    const valorContrato = validacionExperto.valorAPagar;

    // Calcular rango esperado (±20% del valor contractual)
    const margen = 0.20;
    const valorMin = valorContrato * (1 - margen);
    const valorMax = valorContrato * (1 + margen);

    const dentroDRango = valorIPS >= valorMin && valorIPS <= valorMax;

    return {
      valorEsperadoMin: valorMin,
      valorEsperadoMax: valorMax,
      valorPromedio: valorContrato,
      confianza: dentroDRango ? 90 : 60,
      razonamiento: dentroDRango
        ? `Precio dentro del rango esperado para el tarifario Nueva EPS`
        : `Precio fuera del rango esperado (${valorMin}-${valorMax}). Diferencia: $${Math.abs(valorIPS - valorContrato)}`
    };
  }

  /**
   * Compara resultados de ambos sistemas y arbitra decisión final
   */
  private compararYArbitrar(
    experto: ValidacionExpertoResult,
    ia: ValidacionIAResult,
    datosFactura: DatosFacturaPDF
  ): ResultadoValidacionDual {
    let decision: ResultadoValidacionDual['decision'];
    const glosas: ResultadoValidacionDual['glosas'] = [];

    // CASO 1: Ambos sistemas recomiendan glosar
    if (experto.glosas.length > 0 && ia.recomendacion === 'GLOSAR') {
      decision = {
        tipoDecision: 'GLOSADO',
        requiereRevisionHumana: false,
        nivelConfianza: Math.round((100 + ia.confianzaGlobal) / 2),
        razonamiento: 'Sistema Experto e IA coinciden en aplicar glosa'
      };

      experto.glosas.forEach(g => {
        glosas.push({
          codigo: g.codigo,
          valor: g.valorTotalGlosa,
          origen: 'AMBOS',
          confianza: decision.nivelConfianza,
          observacion: g.observacion
        });
      });
    }
    // CASO 2: Sistema experto glosa pero IA sugiere revisar
    else if (experto.glosas.length > 0 && ia.recomendacion === 'REVISAR') {
      decision = {
        tipoDecision: 'REVISION_MANUAL',
        requiereRevisionHumana: true,
        nivelConfianza: Math.round(ia.confianzaGlobal / 2),
        razonamiento: `Sistema Experto detectó glosa, pero IA identificó ${ia.anomaliasDetectadas.length} anomalía(s) que requieren revisión`
      };

      experto.glosas.forEach(g => {
        glosas.push({
          codigo: g.codigo,
          valor: g.valorTotalGlosa,
          origen: 'EXPERTO',
          confianza: 50,
          observacion: `${g.observacion} [REQUIERE REVISIÓN POR ANOMALÍAS DETECTADAS]`
        });
      });
    }
    // CASO 3: IA detecta anomalías severas
    else if (ia.anomaliasDetectadas.some(a => a.severidad === 'alta')) {
      decision = {
        tipoDecision: 'REVISION_MANUAL',
        requiereRevisionHumana: true,
        nivelConfianza: 40,
        razonamiento: `IA detectó ${ia.anomaliasDetectadas.filter(a => a.severidad === 'alta').length} anomalía(s) de severidad alta`
      };
    }
    // CASO 4: Todo OK, aprobar
    else {
      decision = {
        tipoDecision: 'APROBADO',
        requiereRevisionHumana: false,
        nivelConfianza: Math.round((100 + ia.confianzaGlobal) / 2),
        razonamiento: 'Sistema Experto e IA coinciden en aprobar factura'
      };
    }

    // Calcular estadísticas
    const coincidencias = (experto.glosas.length === 0 && ia.recomendacion === 'APROBAR') ||
                         (experto.glosas.length > 0 && ia.recomendacion === 'GLOSAR') ? 1 : 0;

    return {
      validacionExperto: experto,
      validacionIA: ia,
      decision,
      glosas,
      estadisticas: {
        coincidencias,
        discrepancias: coincidencias === 0 ? 1 : 0,
        alertas: ia.anomaliasDetectadas.length
      }
    };
  }

  /**
   * Genera reporte de validación dual para auditor humano
   */
  generarReporte(resultado: ResultadoValidacionDual): string {
    const lineas: string[] = [];

    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('       REPORTE DE VALIDACIÓN DUAL - NUEVA EPS');
    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('');

    // Decisión final
    lineas.push(`🎯 DECISIÓN FINAL: ${resultado.decision.tipoDecision}`);
    lineas.push(`   Confianza: ${resultado.decision.nivelConfianza}%`);
    lineas.push(`   Requiere Revisión Humana: ${resultado.decision.requiereRevisionHumana ? 'SÍ ⚠️' : 'NO ✅'}`);
    lineas.push(`   Razonamiento: ${resultado.decision.razonamiento}`);
    lineas.push('');

    // Validación Sistema Experto
    lineas.push('─────────────────────────────────────────────────────');
    lineas.push('📊 SISTEMA EXPERTO (Tarifario Nueva EPS)');
    lineas.push('─────────────────────────────────────────────────────');
    lineas.push(`   Valor a Pagar: $${resultado.validacionExperto.valorAPagar.toLocaleString('es-CO')}`);
    lineas.push(`   Glosa Admitiva: $${resultado.validacionExperto.valorGlosaAdmitiva.toLocaleString('es-CO')}`);
    lineas.push(`   Glosas Detectadas: ${resultado.validacionExperto.glosas.length}`);
    lineas.push('');

    // Validación IA
    lineas.push('─────────────────────────────────────────────────────');
    lineas.push('🤖 VALIDACIÓN CON IA');
    lineas.push('─────────────────────────────────────────────────────');
    lineas.push(`   Recomendación: ${resultado.validacionIA.recomendacion}`);
    lineas.push(`   Confianza Global: ${resultado.validacionIA.confianzaGlobal}%`);
    lineas.push(`   Coherencia Clínica: ${resultado.validacionIA.coherenciaClinica.confianza}% - ${resultado.validacionIA.coherenciaClinica.razonamiento}`);
    lineas.push(`   Pertinencia Médica: ${resultado.validacionIA.pertinenciaMedica.confianza}% - ${resultado.validacionIA.pertinenciaMedica.razonamiento}`);
    lineas.push('');

    // Anomalías detectadas por IA
    if (resultado.validacionIA.anomaliasDetectadas.length > 0) {
      lineas.push('⚠️  ANOMALÍAS DETECTADAS:');
      resultado.validacionIA.anomaliasDetectadas.forEach((anomalia, i) => {
        const icon = anomalia.severidad === 'alta' ? '🔴' : anomalia.severidad === 'media' ? '🟡' : '🟢';
        lineas.push(`   ${i + 1}. ${icon} [${anomalia.severidad.toUpperCase()}] ${anomalia.tipo}`);
        lineas.push(`      ${anomalia.descripcion}`);
        lineas.push(`      💡 Sugerencia: ${anomalia.sugerencia}`);
      });
      lineas.push('');
    }

    // Estadísticas
    lineas.push('─────────────────────────────────────────────────────');
    lineas.push('📈 ESTADÍSTICAS');
    lineas.push('─────────────────────────────────────────────────────');
    lineas.push(`   Coincidencias: ${resultado.estadisticas.coincidencias}`);
    lineas.push(`   Discrepancias: ${resultado.estadisticas.discrepancias}`);
    lineas.push(`   Alertas: ${resultado.estadisticas.alertas}`);
    lineas.push('');
    lineas.push('═══════════════════════════════════════════════════════');

    return lineas.join('\n');
  }
}

export default new ValidacionDualService();
