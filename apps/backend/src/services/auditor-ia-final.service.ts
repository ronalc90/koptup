/**
 * AUDITOR IA FINAL - DECISIÓN DEFINITIVA CON GPT-4o
 *
 * Este servicio es el ÚLTIMO nivel de validación.
 * La IA analiza TODO y toma la DECISIÓN FINAL sobre:
 * - Datos correctos de la factura
 * - Validez del procedimiento médico
 * - Aprobación o glosa de la factura
 * - Monto exacto a pagar
 * - Justificación médica y administrativa
 */

import OpenAI from 'openai';
import { DatosFacturaPDF } from './pdf-extractor.service';
import sistemaAprendizajeService from './sistema-aprendizaje.service';

/**
 * Contexto completo para que la IA tome la decisión
 */
interface ContextoAuditoria {
  // Extracción de datos
  extraccionRegex: {
    datos: DatosFacturaPDF;
    confianza: number;
  };
  extraccionVision: {
    datos: DatosFacturaPDF;
    confianza: number;
  };
  discrepancias: {
    campo: string;
    valorRegex: any;
    valorVision: any;
  }[];

  // Validación de tarifario
  sistemaExperto: {
    valorIPSFacturado: number;
    valorContratoNuevaEPS: number;
    glosaCalculada: number;
    observacion: string;
  };

  // Datos de imagen para análisis visual
  imagenPDFBase64?: string;
}

/**
 * Decisión FINAL de la IA
 */
interface DecisionFinalIA {
  // PASO 1: Confirmación de datos
  datosConfirmados: DatosFacturaPDF;
  correccionesRealizadas: {
    campo: string;
    valorAnterior: any;
    valorCorregido: any;
    razon: string;
  }[];

  // PASO 2: Análisis médico
  analisisMedico: {
    coherenciaClinica: {
      esCoherente: boolean;
      confianza: number;
      explicacion: string;
    };
    pertinenciaProcedimiento: {
      esPertinente: boolean;
      confianza: number;
      explicacion: string;
      alternativasSugeridas?: string[];
    };
  };

  // PASO 3: Análisis financiero
  analisisFinanciero: {
    valorIPSJustificado: boolean;
    valorJustoAPagar: number;
    diferenciaTarifario: number;
    explicacion: string;
  };

  // PASO 4: DECISIÓN FINAL
  decisionFinal: {
    veredicto: 'APROBADO_COMPLETO' | 'APROBADO_PARCIAL' | 'GLOSADO' | 'RECHAZADO' | 'REQUIERE_REVISION_HUMANA';
    valorAPagar: number;
    valorGlosa: number;
    porcentajeGlosa: number;

    justificacion: {
      resumenEjecutivo: string;
      fundamentoMedico: string;
      fundamentoAdministrativo: string;
      fundamentoFinanciero: string;
    };

    alertas: {
      tipo: 'CRITICA' | 'IMPORTANTE' | 'INFORMATIVA';
      mensaje: string;
    }[];

    requiereRevisionHumana: boolean;
    razonesRevision?: string[];
  };

  // Metadatos
  metadatos: {
    confianzaDecision: number; // 0-100
    tiempoAnalisis: number; // ms
    modeloUtilizado: string;
    timestamp: Date;
  };
}

class AuditorIAFinalService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('🤖 Auditor IA Final (GPT-4o) inicializado');
    } else {
      console.warn('⚠️  OPENAI_API_KEY no configurada - Auditor IA no disponible');
    }
  }

  /**
   * MÉTODO PRINCIPAL: Análisis completo y decisión final
   */
  async tomarDecisionFinal(contexto: ContextoAuditoria): Promise<DecisionFinalIA> {
    if (!this.openai) {
      throw new Error('Auditor IA Final requiere OPENAI_API_KEY configurada');
    }

    const inicioAnalisis = Date.now();

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('     🤖 AUDITOR IA FINAL - ANÁLISIS COMPLETO');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Construir prompt ULTRA detallado para GPT-4o
    const prompt = this.construirPromptCompleto(contexto);

    try {
      console.log('📡 Enviando contexto completo a GPT-4o para decisión final...');

      const messages: any[] = [
        {
          role: 'system',
          content: `Eres el AUDITOR MÉDICO FINAL de Nueva EPS en Colombia.

Tu responsabilidad es TOMAR LA DECISIÓN DEFINITIVA sobre facturas médicas.

AUTORIDAD:
- Tienes autoridad FINAL sobre todas las decisiones
- Puedes corregir datos extraídos si detectas errores
- Puedes aprobar, modificar o rechazar glosas del sistema experto
- Tu decisión es DEFINITIVA

RESPONSABILIDADES:
1. Verificar datos extraídos (REGEX vs Vision)
2. Validar coherencia médica (diagnóstico + procedimiento)
3. Evaluar pertinencia del procedimiento
4. Analizar precios y tarifarios
5. DECIDIR: Aprobar, Glosar o Rechazar
6. Justificar completamente tu decisión

CRITERIOS DE DECISIÓN:
- Prioriza la seguridad del paciente
- Aplica guías médicas colombianas
- Respeta tarifarios contractuales Nueva EPS
- Detecta fraude o cobros indebidos
- Marca casos complejos para revisión humana

Debes responder en formato JSON estructurado.`
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Si hay imagen, agregarla al análisis
      if (contexto.imagenPDFBase64) {
        messages[1].content = [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${contexto.imagenPDFBase64}`,
              detail: 'high'
            }
          }
        ];
      }

      // Retry logic para manejar rate limits (429)
      let retries = 0;
      const maxRetries = 3;
      let completion;

      while (retries <= maxRetries) {
        try {
          completion = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 6000, // Aumentado para permitir análisis y justificación completa
            temperature: 0.1, // Baja temperatura para decisiones consistentes y precisas
          });
          break; // Éxito, salir del loop
        } catch (error: any) {
          if (error?.status === 429 && retries < maxRetries) {
            const waitTime = Math.pow(2, retries) * 2000; // 2s, 4s, 8s
            console.log(`   ⏳ Rate limit en Auditor IA Final, esperando ${waitTime/1000}s antes de reintentar (intento ${retries + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
          } else {
            throw error; // Error diferente o se agotaron los reintentos
          }
        }
      }

      const respuesta = completion.choices[0].message.content || '{}';

      // Extraer JSON
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('GPT-4o no devolvió JSON válido');
      }

      const decisionIA = JSON.parse(jsonMatch[0]);

      // Completar metadatos
      const tiempoAnalisis = Date.now() - inicioAnalisis;

      const decisionFinal: DecisionFinalIA = {
        ...decisionIA,
        metadatos: {
          confianzaDecision: decisionIA.metadatos?.confianzaDecision || 85,
          tiempoAnalisis,
          modeloUtilizado: 'gpt-4o',
          timestamp: new Date(),
        }
      };

      // Mostrar resultado
      this.mostrarDecisionFinal(decisionFinal);

      // 📚 REGISTRAR DECISIÓN PARA APRENDIZAJE CONTINUO
      await this.registrarDecisionParaAprendizaje(decisionFinal, contexto);

      return decisionFinal;

    } catch (error) {
      console.error('❌ Error en Auditor IA Final:', error);
      throw error;
    }
  }

  /**
   * Construir prompt ultra completo para GPT-4o
   */
  private construirPromptCompleto(contexto: ContextoAuditoria): string {
    const { extraccionRegex, extraccionVision, discrepancias, sistemaExperto } = contexto;

    return `Analiza esta factura médica y toma la DECISIÓN FINAL como auditor de Nueva EPS.

═══════════════════════════════════════════════════════
SECCIÓN 1: EXTRACCIÓN DE DATOS (Comparación REGEX vs Vision)
═══════════════════════════════════════════════════════

📊 DATOS EXTRAÍDOS POR REGEX (Confianza: ${extraccionRegex.confianza}%):
- Número Factura: ${extraccionRegex.datos.nroFactura}
- Paciente: ${extraccionRegex.datos.nombrePaciente}
- Tipo Doc: ${extraccionRegex.datos.tipoDocumentoPaciente}
- Número Doc: ${extraccionRegex.datos.numeroDocumento}
- Código CUPS: ${extraccionRegex.datos.codigoProcedimiento}
- Procedimiento: ${extraccionRegex.datos.nombreProcedimiento}
- Diagnóstico CIE-10: ${extraccionRegex.datos.diagnosticoPrincipal}
- Cantidad: ${extraccionRegex.datos.cant}
- Valor IPS: $${extraccionRegex.datos.valorIPS?.toLocaleString('es-CO')}

📊 DATOS EXTRAÍDOS POR GPT-4o Vision (Confianza: ${extraccionVision.confianza}%):
- Número Factura: ${extraccionVision.datos.nroFactura}
- Paciente: ${extraccionVision.datos.nombrePaciente}
- Tipo Doc: ${extraccionVision.datos.tipoDocumentoPaciente}
- Número Doc: ${extraccionVision.datos.numeroDocumento}
- Código CUPS: ${extraccionVision.datos.codigoProcedimiento}
- Procedimiento: ${extraccionVision.datos.nombreProcedimiento}
- Diagnóstico CIE-10: ${extraccionVision.datos.diagnosticoPrincipal}
- Cantidad: ${extraccionVision.datos.cant}
- Valor IPS: $${extraccionVision.datos.valorIPS?.toLocaleString('es-CO')}

⚠️  DISCREPANCIAS DETECTADAS (${discrepancias.length}):
${discrepancias.map(d => `   - ${d.campo}: REGEX="${d.valorRegex}" vs VISION="${d.valorVision}"`).join('\n')}

═══════════════════════════════════════════════════════
SECCIÓN 2: VALIDACIÓN DEL SISTEMA EXPERTO (Tarifario)
═══════════════════════════════════════════════════════

💰 ANÁLISIS TARIFARIO NUEVA EPS:
- Valor Facturado por IPS: $${sistemaExperto.valorIPSFacturado.toLocaleString('es-CO')}
- Valor Contractual Nueva EPS: $${sistemaExperto.valorContratoNuevaEPS.toLocaleString('es-CO')}
- Glosa Calculada Sistema: $${sistemaExperto.glosaCalculada.toLocaleString('es-CO')}
- Observación: ${sistemaExperto.observacion}

═══════════════════════════════════════════════════════
TU TAREA: DECISIÓN FINAL
═══════════════════════════════════════════════════════

Debes analizar TODO lo anterior y tomar la DECISIÓN FINAL.

PASO 1: Confirma o corrige los datos extraídos
- Revisa las discrepancias entre REGEX y Vision
- Si ves la imagen del PDF, usa esa información como fuente de verdad
- Decide qué datos son correctos
- Reporta cualquier corrección que hagas

PASO 2: Análisis médico
- ¿El procedimiento CUPS es coherente con el diagnóstico CIE-10?
- ¿Es pertinente médicamente?
- ¿Hay alternativas más apropiadas?

PASO 3: Análisis financiero
- ¿El valor facturado por la IPS es razonable?
- ¿La glosa del sistema experto es correcta?
- ¿Cuál es el valor justo a pagar?

PASO 4: DECISIÓN FINAL
Opciones:
- APROBADO_COMPLETO: Pagar el 100% del valor facturado
- APROBADO_PARCIAL: Pagar según glosa (parcial)
- GLOSADO: Aplicar glosa significativa (>30%)
- RECHAZADO: Rechazar la factura completamente
- REQUIERE_REVISION_HUMANA: Caso muy complejo

**FORMATO DE RESPUESTA (JSON):**

{
  "datosConfirmados": {
    "nroFactura": "valor_correcto",
    "nombrePaciente": "valor_correcto",
    "tipoDocumentoPaciente": "valor_correcto",
    "numeroDocumento": "valor_correcto",
    "codigoProcedimiento": "valor_correcto",
    "nombreProcedimiento": "valor_correcto",
    "diagnosticoPrincipal": "valor_correcto",
    "cant": numero_correcto,
    "valorIPS": numero_correcto
  },

  "correccionesRealizadas": [
    {
      "campo": "nombre_campo",
      "valorAnterior": "valor_incorrecto",
      "valorCorregido": "valor_correcto",
      "razon": "explicación de por qué se corrigió"
    }
  ],

  "analisisMedico": {
    "coherenciaClinica": {
      "esCoherente": true/false,
      "confianza": 0-100,
      "explicacion": "análisis detallado de coherencia diagnóstico-procedimiento"
    },
    "pertinenciaProcedimiento": {
      "esPertinente": true/false,
      "confianza": 0-100,
      "explicacion": "análisis de pertinencia médica",
      "alternativasSugeridas": ["alternativa1", "alternativa2"]
    }
  },

  "analisisFinanciero": {
    "valorIPSJustificado": true/false,
    "valorJustoAPagar": numero,
    "diferenciaTarifario": numero,
    "explicacion": "análisis del precio facturado vs tarifario"
  },

  "decisionFinal": {
    "veredicto": "APROBADO_COMPLETO|APROBADO_PARCIAL|GLOSADO|RECHAZADO|REQUIERE_REVISION_HUMANA",
    "valorAPagar": numero_exacto,
    "valorGlosa": numero_exacto,
    "porcentajeGlosa": porcentaje,

    "justificacion": {
      "resumenEjecutivo": "resumen de 2-3 líneas de la decisión",
      "fundamentoMedico": "justificación médica detallada",
      "fundamentoAdministrativo": "justificación administrativa (autorizaciones, etc)",
      "fundamentoFinanciero": "justificación de precios y tarifas"
    },

    "alertas": [
      {
        "tipo": "CRITICA|IMPORTANTE|INFORMATIVA",
        "mensaje": "descripción de la alerta"
      }
    ],

    "requiereRevisionHumana": true/false,
    "razonesRevision": ["razon1", "razon2"]
  },

  "metadatos": {
    "confianzaDecision": 0-100
  }
}`;
  }

  /**
   * Mostrar decisión final en consola
   */
  private mostrarDecisionFinal(decision: DecisionFinalIA): void {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('          ✅ DECISIÓN FINAL DEL AUDITOR IA');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Correcciones
    if (decision.correccionesRealizadas && decision.correccionesRealizadas.length > 0) {
      console.log('🔧 CORRECCIONES DE DATOS:');
      decision.correccionesRealizadas.forEach(corr => {
        console.log(`   - ${corr.campo}: "${corr.valorAnterior}" → "${corr.valorCorregido}"`);
        console.log(`     Razón: ${corr.razon}`);
      });
      console.log('');
    }

    // Análisis médico
    console.log('🏥 ANÁLISIS MÉDICO:');
    console.log(`   - Coherencia clínica: ${decision.analisisMedico.coherenciaClinica.esCoherente ? '✅ SÍ' : '❌ NO'} (${decision.analisisMedico.coherenciaClinica.confianza}%)`);
    console.log(`     ${decision.analisisMedico.coherenciaClinica.explicacion}`);
    console.log(`   - Pertinencia: ${decision.analisisMedico.pertinenciaProcedimiento.esPertinente ? '✅ SÍ' : '❌ NO'} (${decision.analisisMedico.pertinenciaProcedimiento.confianza}%)`);
    console.log(`     ${decision.analisisMedico.pertinenciaProcedimiento.explicacion}`);
    console.log('');

    // Análisis financiero
    console.log('💰 ANÁLISIS FINANCIERO:');
    console.log(`   - Valor IPS justificado: ${decision.analisisFinanciero.valorIPSJustificado ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   - Valor justo a pagar: $${decision.analisisFinanciero.valorJustoAPagar.toLocaleString('es-CO')}`);
    console.log(`   - Diferencia con tarifario: $${decision.analisisFinanciero.diferenciaTarifario.toLocaleString('es-CO')}`);
    console.log(`     ${decision.analisisFinanciero.explicacion}`);
    console.log('');

    // DECISIÓN FINAL
    const iconoVeredicto = {
      'APROBADO_COMPLETO': '✅',
      'APROBADO_PARCIAL': '⚠️',
      'GLOSADO': '💰',
      'RECHAZADO': '❌',
      'REQUIERE_REVISION_HUMANA': '👤'
    }[decision.decisionFinal.veredicto] || '❓';

    console.log('🎯 DECISIÓN FINAL:');
    console.log(`   ${iconoVeredicto} VEREDICTO: ${decision.decisionFinal.veredicto}`);
    console.log(`   💵 Valor a pagar: $${decision.decisionFinal.valorAPagar.toLocaleString('es-CO')}`);
    console.log(`   📉 Glosa: $${decision.decisionFinal.valorGlosa.toLocaleString('es-CO')} (${decision.decisionFinal.porcentajeGlosa}%)`);
    console.log(`   📊 Confianza: ${decision.metadatos.confianzaDecision}%`);
    console.log('');

    console.log('📝 JUSTIFICACIÓN:');
    console.log(`   Resumen: ${decision.decisionFinal.justificacion.resumenEjecutivo}`);
    console.log('');

    // Alertas
    if (decision.decisionFinal.alertas && decision.decisionFinal.alertas.length > 0) {
      console.log('⚠️  ALERTAS:');
      decision.decisionFinal.alertas.forEach(alerta => {
        const icono = alerta.tipo === 'CRITICA' ? '🔴' : alerta.tipo === 'IMPORTANTE' ? '🟡' : '🔵';
        console.log(`   ${icono} ${alerta.mensaje}`);
      });
      console.log('');
    }

    // Revisión humana
    if (decision.decisionFinal.requiereRevisionHumana) {
      console.log('👤 REQUIERE REVISIÓN HUMANA:');
      decision.decisionFinal.razonesRevision?.forEach(razon => {
        console.log(`   - ${razon}`);
      });
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * Registrar decisión en el sistema de aprendizaje
   */
  private async registrarDecisionParaAprendizaje(
    decision: DecisionFinalIA,
    contexto: ContextoAuditoria
  ): Promise<void> {
    try {
      const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await sistemaAprendizajeService.registrarDecision({
        id: decisionId,
        timestamp: decision.metadatos.timestamp,

        // Contexto de la decisión
        contexto: {
          numeroFactura: decision.datosConfirmados.nroFactura || 'N/A',
          paciente: decision.datosConfirmados.nombrePaciente || 'N/A',
          diagnostico: decision.datosConfirmados.diagnosticoPrincipal || 'N/A',
          codigoCUPS: decision.datosConfirmados.codigoProcedimiento || 'N/A',
          valorFacturado: decision.datosConfirmados.valorIPS || 0,
        },

        // Decisión tomada por la IA
        decision: {
          tipo: 'APROBACION',
          valorDecidido: {
            veredicto: decision.decisionFinal.veredicto,
            valorAPagar: decision.decisionFinal.valorAPagar,
            valorGlosa: decision.decisionFinal.valorGlosa,
            porcentajeGlosa: decision.decisionFinal.porcentajeGlosa,
          },
          confianzaIA: decision.metadatos.confianzaDecision,
          razonamiento: decision.decisionFinal.justificacion.resumenEjecutivo,
        },
      });

      console.log(`📚 Decisión ${decisionId} registrada para aprendizaje continuo`);
    } catch (error) {
      console.error('⚠️  Error al registrar decisión para aprendizaje:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }
}

export default new AuditorIAFinalService();
