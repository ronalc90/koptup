/**
 * MÓDULO B: EXTRACTOR INTELIGENTE CON AI VISION
 *
 * Núcleo del sistema de extracción.
 * Usa GPT-4o Vision para:
 * - OCR inteligente (no solo texto → entiende estructura)
 * - Reconocimiento de tablas (columnas, valores, totales)
 * - Comprensión semántica (autorización, dx, glosa, notas, etc.)
 * - Estandarización en JSON estructurado
 *
 * Extrae 80-100 campos de manera precisa y confiable.
 */

import OpenAI from 'openai';
import { PaginaProcesada, TipoDocumento } from './document-ingestion.service';

/**
 * Esquema completo de 80+ campos a extraer
 */
export interface DatosFacturaCompletos {
  // SECCIÓN 1: DATOS DE FACTURA (10 campos)
  numeroFactura: string;
  fechaFactura: string; // DD/MM/YYYY
  fechaRadicacion: string;
  valorBrutoFactura: number;
  valorIVA: number;
  valorNetoFactura: number;
  numeroPrefactura: string;
  periodicidadFacturacion: string;
  tipoFactura: 'CAPITA' | 'EVENTO' | 'PAQUETE' | 'OTRO';
  estadoFactura: string;

  // SECCIÓN 2: DATOS DE IPS (10 campos)
  nombreIPS: string;
  nitIPS: string;
  codigoIPS: string;
  direccionIPS: string;
  telefonoIPS: string;
  ciudadIPS: string;
  departamentoIPS: string;
  representanteLegalIPS: string;
  emailIPS: string;
  bancoIPS: string;

  // SECCIÓN 3: DATOS DE EPS (8 campos)
  nombreEPS: string;
  nitEPS: string;
  codigoEPS: string;
  numeroContrato: string;
  tipoContrato: string;
  regimen: 'Contributivo' | 'Subsidiado';
  modalidadContratacion: string;
  valorCapita?: number;

  // SECCIÓN 4: DATOS DEL PACIENTE (12 campos)
  nombrePaciente: string;
  apellidosPaciente: string;
  tipoDocumentoPaciente: 'CC' | 'TI' | 'RC' | 'CE' | 'PA' | 'MS';
  numeroDocumentoPaciente: string;
  fechaNacimientoPaciente: string;
  edadPaciente: number;
  sexoPaciente: 'M' | 'F';
  direccionPaciente: string;
  telefonoPaciente: string;
  ciudadPaciente: string;
  departamentoPaciente: string;
  tipoAfiliacion: 'Cotizante' | 'Beneficiario';

  // SECCIÓN 5: DATOS DE ATENCIÓN (15 campos)
  numeroAutorizacion: string;
  fechaAutorizacion: string;
  autorizacionValidaHasta: string;
  numeroAtencion: string;
  tipoAtencion: 'Ambulatorio' | 'Hospitalario' | 'Domiciliario' | 'Urgencias';
  fechaIngresoAtencion: string;
  horaIngresoAtencion: string;
  fechaEgresoAtencion: string;
  horaEgresoAtencion: string;
  diasEstancia: number;
  origenRemision: string;
  causaExterna: string;
  estadoSalida: 'Vivo' | 'Muerto';
  destinoSalida: string;
  numeroEgreso: string;

  // SECCIÓN 6: DATOS CLÍNICOS (12 campos)
  diagnosticoPrincipal: string; // CIE-10
  diagnosticoPrincipalDescripcion: string;
  diagnosticoRelacionado1: string;
  diagnosticoRelacionado1Descripcion: string;
  diagnosticoRelacionado2: string;
  diagnosticoRelacionado2Descripcion: string;
  diagnosticoRelacionado3: string;
  diagnosticoRelacionado3Descripcion: string;
  tipoDiagnosticoPrincipal: 'Impresion' | 'Confirmado' | 'Repetido';
  causaMuerte?: string;
  codigoMuerte?: string;
  finalidadConsulta: string;

  // SECCIÓN 7: PROCEDIMIENTOS (15 campos)
  codigoProcedimiento: string; // CUPS o ISS
  nombreProcedimiento: string;
  descripcionProcedimiento: string;
  tipoManual: 'CUPS' | 'ISS' | 'SOAT';
  cantidad: number;
  valorUnitarioIPS: number;
  valorTotalIPS: number;
  fechaRealizacionProcedimiento: string;
  horaRealizacionProcedimiento: string;
  ambitoRealizacion: 'Hospitalario' | 'Ambulatorio' | 'Domiciliario' | 'Urgencias';
  finalidadProcedimiento: 'Diagnostico' | 'Terapeutico' | 'Proteccion' | 'Apoyo';
  personaRealiza: string;
  registroMedico: string;
  complicaciones: string;
  formaRealizacion: 'Unico' | 'Bilateral' | 'Multiple';

  // SECCIÓN 8: COPAGOS Y CUOTAS (5 campos)
  copago: number;
  cuotaModeradora: number;
  cuotaRecuperacion: number;
  valorPagadoPaciente: number;
  numeroRecibocopago: string;

  // SECCIÓN 9: DATOS CONTRACTUALES (8 campos)
  tarifarioAplicable: 'ISS' | 'SOAT' | 'TARIFARIO_PROPIO';
  porcentajeContratado: number;
  valorUnitarioContrato: number;
  valorTotalContrato: number;
  diferenciaTarifaria: number;
  glosasTarifarias: string;
  observacionesTarifarias: string;
  requiereAjuste: boolean;

  // SECCIÓN 10: GLOSAS Y OBSERVACIONES (10 campos)
  tieneGlosas: boolean;
  numeroGlosas: number;
  valorTotalGlosas: number;
  glosasAdministrativas: string[];
  glosasAsistenciales: string[];
  observacionesGenerales: string;
  observacionesAuditor: string;
  requiereDocumentacionAdicional: boolean;
  documentosFaltantes: string[];
  estadoRevision: 'Pendiente' | 'Revision' | 'Aprobada' | 'Rechazada';

  // METADATOS DE EXTRACCIÓN
  metadatos: {
    confianzaExtraccion: number; // 0-100
    camposExtraidos: number;
    camposVacios: number;
    camposCriticos: string[]; // Campos que deben revisarse
    tiempoExtraccionMs: number;
    modeloUtilizado: string;
    versionExtractor: string;
  };
}

class AIVisionExtractorService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('🤖 AI Vision Extractor (GPT-4o) inicializado');
    } else {
      console.warn('⚠️  OPENAI_API_KEY no configurada - Extractor no disponible');
    }
  }

  /**
   * MÉTODO PRINCIPAL: Extraer datos estructurados de páginas procesadas
   */
  async extraerDatosCompletos(
    paginas: PaginaProcesada[],
    tipoDocumento: TipoDocumento
  ): Promise<DatosFacturaCompletos> {
    if (!this.openai) {
      throw new Error('AI Vision Extractor requiere OPENAI_API_KEY configurada');
    }

    const inicio = Date.now();

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🤖 MÓDULO B: AI VISION EXTRACTOR (GPT-4o)');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log(`📄 Páginas a procesar: ${paginas.length}`);
    console.log(`📋 Tipo de documento: ${tipoDocumento}`);
    console.log('');

    // Extraer datos de todas las páginas
    let datosExtraidos: Partial<DatosFacturaCompletos> = {};

    for (const pagina of paginas) {
      console.log(`📄 Procesando página ${pagina.numeroPagina}/${paginas.length}...`);

      const datosPagina = await this.extraerDatosDePagina(
        pagina,
        tipoDocumento,
        pagina.numeroPagina
      );

      // Merge de datos (la página actual puede sobrescribir o complementar)
      datosExtraidos = this.mergeDatos(datosExtraidos, datosPagina);

      console.log(`   ✓ ${datosPagina.metadatos.camposExtraidos} campos extraídos`);
    }

    // Calcular metadatos finales
    const camposTotales = Object.keys(datosExtraidos).filter(k => k !== 'metadatos').length;
    const camposVacios = camposTotales - (datosExtraidos.metadatos?.camposExtraidos || 0);

    const tiempoTotal = Date.now() - inicio;

    console.log('');
    console.log(`✅ Extracción completada:`);
    console.log(`   📊 Campos extraídos: ${camposTotales}`);
    console.log(`   ⚠️  Campos vacíos: ${camposVacios}`);
    console.log(`   📈 Confianza: ${datosExtraidos.metadatos?.confianzaExtraccion || 0}%`);
    console.log(`   ⏱️  Tiempo: ${tiempoTotal}ms`);
    console.log('');

    return datosExtraidos as DatosFacturaCompletos;
  }

  /**
   * Extraer datos de una página específica
   */
  private async extraerDatosDePagina(
    pagina: PaginaProcesada,
    tipoDocumento: TipoDocumento,
    numeroPagina: number
  ): Promise<Partial<DatosFacturaCompletos>> {
    const prompt = this.construirPromptExtraccion(tipoDocumento, numeroPagina);

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un EXPERTO en extracción de datos de documentos médicos colombianos.
Tu misión es extraer TODOS los campos posibles con MÁXIMA PRECISIÓN.

REGLAS CRÍTICAS:
1. Los códigos CUPS SIEMPRE empiezan con 8 o 9 (6 dígitos)
2. Los códigos CIE-10 son: letra + 2-3 números (ej: J18, Q659, I10)
3. Los valores monetarios son NÚMEROS REALES, NO inventar ni poner 0
4. Si un campo NO se encuentra, usar null (no cadena vacía ni 0)
5. Extraer TODO el contexto de tablas y columnas
6. Leer TODOS los valores monetarios con precisión

IMPORTANTE: Este documento es REAL, los datos existen, NO inventar.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${pagina.imagenBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 4000, // Tokens suficientes para respuesta completa
        temperature: 0, // Cero creatividad, máxima precisión
        response_format: { type: 'json_object' }, // Forzar JSON
      });

      const contenido = response.choices[0].message.content || '{}';
      const datosExtraidos = JSON.parse(contenido);

      // Contar campos extraídos (no nulos)
      const camposExtraidos = Object.keys(datosExtraidos).filter(campo => {
        const valor = datosExtraidos[campo];
        return valor !== null && valor !== '' && valor !== 0 && valor !== undefined;
      }).length;

      // Agregar metadatos
      datosExtraidos.metadatos = {
        confianzaExtraccion: this.calcularConfianza(datosExtraidos),
        camposExtraidos,
        camposVacios: Object.keys(datosExtraidos).length - camposExtraidos,
        camposCriticos: this.identificarCamposCriticos(datosExtraidos),
        tiempoExtraccionMs: 0,
        modeloUtilizado: 'gpt-4o',
        versionExtractor: '2.0.0',
      };

      return datosExtraidos;
    } catch (error) {
      console.error(`❌ Error extrayendo datos de página ${numeroPagina}:`, error);
      throw error;
    }
  }

  /**
   * Construir prompt especializado según tipo de documento
   */
  private construirPromptExtraccion(tipoDocumento: TipoDocumento, numeroPagina: number): string {
    const promptBase = `Extrae TODOS los datos posibles de esta imagen (página ${numeroPagina}).

Esta es una ${tipoDocumento} de una IPS colombiana.

Extrae la siguiente información EN FORMATO JSON:

{
  "numeroFactura": "número de la factura o cuenta",
  "fechaFactura": "DD/MM/YYYY",
  "fechaRadicacion": "DD/MM/YYYY",
  "valorBrutoFactura": número_sin_comas,
  "valorIVA": número_sin_comas,
  "valorNetoFactura": número_sin_comas,

  "nombreIPS": "nombre de la IPS prestadora",
  "nitIPS": "NIT de la IPS",
  "codigoIPS": "código habilitación",

  "nombreEPS": "nombre de la EPS pagadora",
  "nitEPS": "NIT de la EPS",
  "numeroContrato": "número de contrato",
  "regimen": "Contributivo o Subsidiado",

  "nombrePaciente": "nombre completo del paciente",
  "tipoDocumentoPaciente": "CC, TI, RC, CE, PA, MS",
  "numeroDocumentoPaciente": "número de documento",
  "edadPaciente": número,
  "sexoPaciente": "M o F",

  "numeroAutorizacion": "número de autorización",
  "fechaAutorizacion": "DD/MM/YYYY",
  "numeroAtencion": "número de atención",
  "tipoAtencion": "Ambulatorio, Hospitalario, Urgencias, Domiciliario",
  "fechaIngresoAtencion": "DD/MM/YYYY",
  "fechaEgresoAtencion": "DD/MM/YYYY",

  "diagnosticoPrincipal": "código CIE-10 (ej: J18, I10, Q659)",
  "diagnosticoPrincipalDescripcion": "descripción del diagnóstico",
  "diagnosticoRelacionado1": "código CIE-10 si existe",

  "codigoProcedimiento": "código CUPS de 6 dígitos que EMPIEZA con 8 o 9",
  "nombreProcedimiento": "nombre completo del procedimiento",
  "descripcionProcedimiento": "descripción detallada",
  "tipoManual": "CUPS, ISS o SOAT",
  "cantidad": número,
  "valorUnitarioIPS": número_real_facturado,
  "valorTotalIPS": número_real_facturado,

  "copago": número_o_0,
  "cuotaModeradora": número_o_0,
  "cuotaRecuperacion": número_o_0,

  "tarifarioAplicable": "ISS, SOAT, TARIFARIO_PROPIO",
  "valorUnitarioContrato": número_según_contrato,
  "diferenciaTarifaria": número_diferencia,

  "tieneGlosas": booleano,
  "numeroGlosas": número,
  "valorTotalGlosas": número,

  "observacionesGenerales": "cualquier observación relevante"
}

CRÍTICO:
- Si ves una TABLA, extrae TODOS los valores de cada columna
- Los VALORES MONETARIOS son REALES, leerlos con precisión
- CUPS: 6 dígitos empiezan con 8 o 9 (NO confundir con otros códigos)
- CIE-10: letra + números (NO códigos de vehículos como V03)
- Si algo NO aparece en la imagen, usar null (no inventar)

Responde ÚNICAMENTE con el objeto JSON completo.`;

    return promptBase;
  }

  /**
   * Merge inteligente de datos de múltiples páginas
   */
  private mergeDatos(
    datosAcumulados: Partial<DatosFacturaCompletos>,
    datosNuevos: Partial<DatosFacturaCompletos>
  ): Partial<DatosFacturaCompletos> {
    const merged = { ...datosAcumulados };

    // Para cada campo nuevo
    Object.keys(datosNuevos).forEach(campo => {
      const valorNuevo = (datosNuevos as any)[campo];
      const valorExistente = (merged as any)[campo];

      // Si no hay valor existente, usar el nuevo
      if (!valorExistente || valorExistente === null || valorExistente === '') {
        (merged as any)[campo] = valorNuevo;
      }
      // Si el nuevo tiene más información, sobrescribir
      else if (typeof valorNuevo === 'string' && valorNuevo.length > String(valorExistente).length) {
        (merged as any)[campo] = valorNuevo;
      }
      // Para números, usar el no-cero
      else if (typeof valorNuevo === 'number' && valorNuevo > 0 && valorExistente === 0) {
        (merged as any)[campo] = valorNuevo;
      }
    });

    return merged;
  }

  /**
   * Calcular confianza de extracción
   */
  private calcularConfianza(datos: any): number {
    const camposCriticos = [
      'numeroFactura',
      'nombrePaciente',
      'numeroDocumentoPaciente',
      'codigoProcedimiento',
      'valorTotalIPS',
      'diagnosticoPrincipal',
    ];

    let puntaje = 0;
    let maxPuntaje = camposCriticos.length * 100;

    camposCriticos.forEach(campo => {
      const valor = datos[campo];
      if (valor && valor !== null && valor !== '' && valor !== 0) {
        puntaje += 100;
      }
    });

    return Math.round((puntaje / maxPuntaje) * 100);
  }

  /**
   * Identificar campos críticos que requieren revisión
   */
  private identificarCamposCriticos(datos: any): string[] {
    const criticos: string[] = [];

    // Revisar CUPS
    if (datos.codigoProcedimiento) {
      const cups = String(datos.codigoProcedimiento);
      if (!cups.startsWith('8') && !cups.startsWith('9')) {
        criticos.push('codigoProcedimiento: No empieza con 8 o 9');
      }
    }

    // Revisar valores en cero
    if (datos.valorTotalIPS === 0) {
      criticos.push('valorTotalIPS: Valor en cero es sospechoso');
    }

    // Revisar diagnóstico
    if (datos.diagnosticoPrincipal && datos.diagnosticoPrincipal.startsWith('V0')) {
      criticos.push('diagnosticoPrincipal: Parece código de vehículo, no diagnóstico médico');
    }

    return criticos;
  }
}

export default new AIVisionExtractorService();
