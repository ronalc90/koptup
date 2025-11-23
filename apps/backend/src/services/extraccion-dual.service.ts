/**
 * SERVICIO DE EXTRACCIÓN DUAL
 *
 * Arquitectura de máxima precisión que combina:
 * 1. Extracción con REGEX (rápida, determinística)
 * 2. Extracción con GPT-4o Vision (contextual, inteligente)
 * 3. Comparación y arbitraje de resultados
 *
 * Objetivo: Máxima precisión en extracción de datos médicos
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import pdfExtractorService, { DatosFacturaPDF } from './pdf-extractor.service';
const { pdfToPng } = require('pdf-to-png-converter');

/**
 * Resultado de extracción con metadatos de confianza
 */
interface ExtraccionConConfianza extends DatosFacturaPDF {
  metadatos: {
    metodo: 'REGEX' | 'GPT4O_VISION';
    confianza: number; // 0-100
    tiempoExtraccion: number; // ms
    camposExtraidos: number;
    camposVacios: number;
  };
}

/**
 * Comparación campo por campo
 */
interface ComparacionCampo {
  campo: string;
  valorRegex: any;
  valorVision: any;
  coincide: boolean;
  confianzaRegex: number;
  confianzaVision: number;
  valorFinal: any;
  requiereRevision: boolean;
}

/**
 * Resultado final de la extracción dual
 */
interface ResultadoExtraccionDual {
  datosFinales: DatosFacturaPDF;

  extraccionRegex: ExtraccionConConfianza;
  extraccionVision: ExtraccionConConfianza;

  comparacion: {
    camposComparados: ComparacionCampo[];
    coincidencias: number;
    discrepancias: number;
    porcentajeCoincidencia: number;
  };

  decision: {
    nivelConfianza: number; // 0-100
    metodoPreferido: 'REGEX' | 'GPT4O_VISION' | 'HIBRIDO';
    requiereRevisionHumana: boolean;
    razonamiento: string;
  };

  // Imagen del PDF para análisis del Auditor IA Final
  imagenPDFBase64?: string;
}

class ExtraccionDualService {
  private openai: OpenAI | null = null;
  private ultimaImagenBase64: string | undefined;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI GPT-4o inicializado para extracción dual');
    } else {
      console.log('⚠️  OPENAI_API_KEY no configurada - solo se usará extracción REGEX');
    }
  }

  /**
   * MÉTODO PRINCIPAL: Extracción dual con máxima precisión
   */
  async extraerConDobleValidacion(pdfPath: string): Promise<ResultadoExtraccionDual> {
    console.log('🔍 Iniciando extracción dual (REGEX + GPT-4o Vision)...');

    // 1. EXTRACCIÓN CON REGEX (rápida)
    const inicioRegex = Date.now();
    const datosRegex = await this.extraerConRegex(pdfPath);
    const tiempoRegex = Date.now() - inicioRegex;

    console.log(`✅ Extracción REGEX completada en ${tiempoRegex}ms`);
    console.log(`   - Campos extraídos: ${datosRegex.metadatos.camposExtraidos}`);
    console.log(`   - Confianza: ${datosRegex.metadatos.confianza}%`);

    // 2. EXTRACCIÓN CON GPT-4o VISION (inteligente)
    let datosVision: ExtraccionConConfianza | null = null;
    let tiempoVision = 0;

    if (this.openai) {
      try {
        const inicioVision = Date.now();
        datosVision = await this.extraerConGPT4oVision(pdfPath);
        tiempoVision = Date.now() - inicioVision;

        console.log(`✅ Extracción GPT-4o Vision completada en ${tiempoVision}ms`);
        console.log(`   - Campos extraídos: ${datosVision.metadatos.camposExtraidos}`);
        console.log(`   - Confianza: ${datosVision.metadatos.confianza}%`);
      } catch (error) {
        console.error('❌ Error en extracción GPT-4o Vision:', error);
        datosVision = null;
      }
    }

    // 3. COMPARACIÓN Y ARBITRAJE
    if (datosVision) {
      return this.compararYArbitrar(datosRegex, datosVision);
    } else {
      // Fallback: solo REGEX
      console.log('⚠️  Usando solo extracción REGEX (GPT-4o no disponible)');
      return {
        datosFinales: datosRegex,
        extraccionRegex: datosRegex,
        extraccionVision: datosRegex, // Mismo que regex
        comparacion: {
          camposComparados: [],
          coincidencias: 0,
          discrepancias: 0,
          porcentajeCoincidencia: 100,
        },
        decision: {
          nivelConfianza: datosRegex.metadatos.confianza,
          metodoPreferido: 'REGEX',
          requiereRevisionHumana: datosRegex.metadatos.confianza < 70,
          razonamiento: 'Solo se usó extracción REGEX (GPT-4o no disponible)',
        },
      };
    }
  }

  /**
   * Extracción con REGEX (método actual optimizado)
   */
  private async extraerConRegex(pdfPath: string): Promise<ExtraccionConConfianza> {
    const datos = await pdfExtractorService.extraerDatosFactura(pdfPath);

    // Calcular confianza basada en campos extraídos
    const camposEsperados = [
      'nroFactura', 'nombrePaciente', 'numeroDocumento', 'codigoProcedimiento',
      'diagnosticoPrincipal', 'valorIPS', 'cant'
    ];

    const camposExtraidos = camposEsperados.filter(campo => {
      const valor = (datos as any)[campo];
      return valor && valor !== '' && valor !== 0;
    }).length;

    const camposVacios = camposEsperados.length - camposExtraidos;
    const confianza = Math.round((camposExtraidos / camposEsperados.length) * 100);

    return {
      ...datos,
      metadatos: {
        metodo: 'REGEX',
        confianza,
        tiempoExtraccion: 0,
        camposExtraidos,
        camposVacios,
      },
    };
  }

  /**
   * Extracción con GPT-4o Vision
   */
  private async extraerConGPT4oVision(pdfPath: string): Promise<ExtraccionConConfianza> {
    if (!this.openai) {
      throw new Error('OpenAI no está configurado');
    }

    // 1. Convertir PDF a imagen
    const imagePath = await this.convertirPDFaImagen(pdfPath);

    // 2. Leer imagen como base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Guardar para el Auditor IA Final
    this.ultimaImagenBase64 = base64Image;

    // 3. Llamar a GPT-4o Vision con prompt detallado
    const prompt = `Eres un experto en extracción de datos de facturas médicas colombianas.

Analiza esta imagen de factura médica y extrae EXACTAMENTE los siguientes campos:

**DATOS DE LA FACTURA:**
- nroFactura: Número de factura
- fechaFactura: Fecha de emisión (formato DD/MM/YYYY)
- fechaRadicacion: Fecha de radicación

**DATOS DEL PACIENTE:**
- nombrePaciente: Nombre completo del paciente
- tipoDocumentoPaciente: Tipo de documento (CC, RC, TI, CE)
- numeroDocumento: Número de documento de identidad
- edad: Edad del paciente
- sexo: Sexo (M/F)

**DATOS DEL PROCEDIMIENTO:**
- codigoProcedimiento: Código CUPS del procedimiento (6 dígitos que empiezan con 8 o 9)
- nombreProcedimiento: Descripción del procedimiento
- descripcionProcedimiento: Descripción completa
- cant: Cantidad de procedimientos realizados

**DATOS CLÍNICOS:**
- diagnosticoPrincipal: Código CIE-10 del diagnóstico principal (formato: letra + 2-3 números)
- diagnosticoRelacionado: Diagnóstico relacionado si existe

**DATOS FINANCIEROS:**
- valorIPS: Valor facturado por la IPS (número)
- valorBrutoFactura: Valor bruto total
- valorNetoFactura: Valor neto
- valorIVA: Valor del IVA

**DATOS DE AUTORIZACIÓN:**
- nroAutNvo: Número de autorización Nueva EPS
- autorizacion: Número de autorización general

**IMPORTANTE:**
- Los códigos CUPS DEBEN empezar con 8 o 9 (procedimientos médicos)
- Los códigos CIE-10 son letra seguida de números (ej: Q659, J18, I10)
- NO confundir códigos de vehículos (V03) con diagnósticos médicos
- Si un campo no se encuentra, devuelve cadena vacía "" o 0 para números

**FORMATO DE RESPUESTA:**
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:

{
  "nroFactura": "valor",
  "fechaFactura": "valor",
  "fechaRadicacion": "valor",
  "nombrePaciente": "valor",
  "tipoDocumentoPaciente": "valor",
  "numeroDocumento": "valor",
  "edad": numero,
  "sexo": "valor",
  "codigoProcedimiento": "valor",
  "nombreProcedimiento": "valor",
  "descripcionProcedimiento": "valor",
  "cant": numero,
  "diagnosticoPrincipal": "valor",
  "diagnosticoRelacionado": "valor",
  "valorIPS": numero,
  "valorBrutoFactura": numero,
  "valorNetoFactura": numero,
  "valorIVA": numero,
  "nroAutNvo": "valor",
  "autorizacion": "valor",
  "confianzaExtraccion": numero_0_a_100
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 3000, // Aumentado para permitir análisis más detallado
      temperature: 0,  // Temperatura baja para precisión máxima
    });

    // 4. Parsear respuesta JSON
    const contenido = response.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('GPT-4o no devolvió JSON válido');
    }

    const datosExtraidos = JSON.parse(jsonMatch[0]);
    const confianzaExtraccion = datosExtraidos.confianzaExtraccion || 50;

    // 5. Limpiar imagen temporal
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // 6. Contar campos extraídos
    const camposEsperados = [
      'nroFactura', 'nombrePaciente', 'numeroDocumento', 'codigoProcedimiento',
      'diagnosticoPrincipal', 'valorIPS', 'cant'
    ];

    const camposExtraidos = camposEsperados.filter(campo => {
      const valor = datosExtraidos[campo];
      return valor && valor !== '' && valor !== 0;
    }).length;

    const camposVacios = camposEsperados.length - camposExtraidos;

    return {
      ...datosExtraidos,
      metadatos: {
        metodo: 'GPT4O_VISION',
        confianza: confianzaExtraccion,
        tiempoExtraccion: 0,
        camposExtraidos,
        camposVacios,
      },
    };
  }

  /**
   * Convertir PDF a imagen usando pdf-to-png-converter
   */
  private async convertirPDFaImagen(pdfPath: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'uploads', 'temp-images');

    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Convertir primera página del PDF a PNG
      const pngPages = await pdfToPng(pdfPath, {
        disableFontFace: false,
        useSystemFonts: false,
        viewportScale: 2.0,
        outputFolder: outputDir,
        outputFileMask: `pdf_${Date.now()}`,
        pagesToProcess: [1], // Solo primera página
      });

      if (!pngPages || pngPages.length === 0) {
        throw new Error('No se pudo convertir el PDF a imagen');
      }

      // La imagen se guarda automáticamente en outputFolder
      // Retornar la ruta completa
      const imagePath = pngPages[0].path;
      return imagePath;
    } catch (error) {
      console.error('❌ Error al convertir PDF a imagen:', error);
      throw error;
    }
  }

  /**
   * Comparar y arbitrar resultados de ambas extracciones
   */
  private compararYArbitrar(
    regex: ExtraccionConConfianza,
    vision: ExtraccionConConfianza
  ): ResultadoExtraccionDual {
    console.log('⚖️  Comparando resultados REGEX vs GPT-4o Vision...');

    const camposCriticos = [
      'nroFactura',
      'nombrePaciente',
      'numeroDocumento',
      'codigoProcedimiento',
      'diagnosticoPrincipal',
      'valorIPS',
      'cant',
    ];

    const comparaciones: ComparacionCampo[] = [];
    const datosFinales: any = {};

    camposCriticos.forEach(campo => {
      const valorRegex = (regex as any)[campo];
      const valorVision = (vision as any)[campo];

      // Normalizar valores para comparación
      const regexNorm = this.normalizarValor(valorRegex);
      const visionNorm = this.normalizarValor(valorVision);

      const coincide = regexNorm === visionNorm;

      // Confianza por campo (heurística)
      const confianzaRegex = this.calcularConfianzaCampo(campo, valorRegex, 'REGEX');
      const confianzaVision = this.calcularConfianzaCampo(campo, valorVision, 'VISION');

      // Decidir valor final
      let valorFinal: any;
      let requiereRevision = false;

      if (coincide) {
        // Coincidencia perfecta: usar cualquiera
        valorFinal = valorRegex;
      } else {
        // Discrepancia: usar el de mayor confianza
        if (confianzaVision > confianzaRegex) {
          valorFinal = valorVision;
        } else if (confianzaRegex > confianzaVision) {
          valorFinal = valorRegex;
        } else {
          // Misma confianza: preferir Vision (más contextual)
          valorFinal = valorVision;
          requiereRevision = true;
        }
      }

      comparaciones.push({
        campo,
        valorRegex,
        valorVision,
        coincide,
        confianzaRegex,
        confianzaVision,
        valorFinal,
        requiereRevision,
      });

      datosFinales[campo] = valorFinal;
    });

    // Copiar campos restantes de vision (más completo)
    Object.keys(vision).forEach(campo => {
      if (!datosFinales[campo] && campo !== 'metadatos') {
        datosFinales[campo] = (vision as any)[campo];
      }
    });

    // Estadísticas
    const coincidencias = comparaciones.filter(c => c.coincide).length;
    const discrepancias = comparaciones.filter(c => !c.coincide).length;
    const porcentajeCoincidencia = Math.round((coincidencias / comparaciones.length) * 100);

    // Decisión final
    let metodoPreferido: 'REGEX' | 'GPT4O_VISION' | 'HIBRIDO' = 'HIBRIDO';
    let nivelConfianza = Math.round((regex.metadatos.confianza + vision.metadatos.confianza) / 2);
    let requiereRevisionHumana = false;
    let razonamiento = '';

    if (porcentajeCoincidencia >= 90) {
      nivelConfianza = Math.max(regex.metadatos.confianza, vision.metadatos.confianza);
      razonamiento = `Alta coincidencia (${porcentajeCoincidencia}%) entre ambos métodos`;
    } else if (porcentajeCoincidencia >= 70) {
      razonamiento = `Coincidencia media (${porcentajeCoincidencia}%) - usando combinación inteligente`;
      requiereRevisionHumana = discrepancias > 2;
    } else {
      razonamiento = `Baja coincidencia (${porcentajeCoincidencia}%) - requiere revisión humana`;
      requiereRevisionHumana = true;
      nivelConfianza = Math.min(nivelConfianza, 60);
    }

    console.log(`📊 Comparación completada:`);
    console.log(`   - Coincidencias: ${coincidencias}/${comparaciones.length}`);
    console.log(`   - Porcentaje: ${porcentajeCoincidencia}%`);
    console.log(`   - Confianza final: ${nivelConfianza}%`);
    console.log(`   - Requiere revisión: ${requiereRevisionHumana ? 'SÍ ⚠️' : 'NO ✅'}`);

    return {
      datosFinales,
      extraccionRegex: regex,
      extraccionVision: vision,
      comparacion: {
        camposComparados: comparaciones,
        coincidencias,
        discrepancias,
        porcentajeCoincidencia,
      },
      decision: {
        nivelConfianza,
        metodoPreferido,
        requiereRevisionHumana,
        razonamiento,
      },
      imagenPDFBase64: this.ultimaImagenBase64,
    };
  }

  /**
   * Normalizar valores para comparación
   */
  private normalizarValor(valor: any): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Calcular confianza de un campo específico
   */
  private calcularConfianzaCampo(campo: string, valor: any, metodo: 'REGEX' | 'VISION'): number {
    if (!valor || valor === '' || valor === 0) return 0;

    let confianza = 50; // Base

    // REGEX es mejor para códigos estructurados
    if (metodo === 'REGEX') {
      if (campo === 'codigoProcedimiento' && /^[89]\d{5}$/.test(valor)) confianza = 90;
      if (campo === 'diagnosticoPrincipal' && /^[A-Z]\d{2,3}/.test(valor)) confianza = 85;
      if (campo === 'numeroDocumento' && /^\d{7,10}$/.test(valor)) confianza = 90;
      if (campo === 'valorIPS' && !isNaN(valor) && valor > 0) confianza = 80;
    }

    // VISION es mejor para nombres y textos complejos
    if (metodo === 'VISION') {
      if (campo === 'nombrePaciente' && /^[A-ZÁÉÍÓÚÑ]/.test(valor)) confianza = 90;
      if (campo === 'nroFactura' && valor.length > 5) confianza = 85;
      if (campo === 'descripcionProcedimiento') confianza = 95;
    }

    return confianza;
  }

  /**
   * Generar reporte de comparación
   */
  generarReporteComparacion(resultado: ResultadoExtraccionDual): string {
    const lineas: string[] = [];

    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('     REPORTE DE EXTRACCIÓN DUAL - MÁXIMA PRECISIÓN');
    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('');

    lineas.push('📊 ESTADÍSTICAS DE EXTRACCIÓN:');
    lineas.push(`   - Coincidencias: ${resultado.comparacion.coincidencias}/${resultado.comparacion.camposComparados.length}`);
    lineas.push(`   - Discrepancias: ${resultado.comparacion.discrepancias}`);
    lineas.push(`   - Porcentaje coincidencia: ${resultado.comparacion.porcentajeCoincidencia}%`);
    lineas.push(`   - Confianza final: ${resultado.decision.nivelConfianza}%`);
    lineas.push('');

    lineas.push('⚖️  COMPARACIÓN CAMPO POR CAMPO:');
    resultado.comparacion.camposComparados.forEach(comp => {
      const icono = comp.coincide ? '✅' : '⚠️';
      lineas.push(`   ${icono} ${comp.campo}:`);
      lineas.push(`      REGEX: ${comp.valorRegex} (confianza: ${comp.confianzaRegex}%)`);
      lineas.push(`      VISION: ${comp.valorVision} (confianza: ${comp.confianzaVision}%)`);
      lineas.push(`      FINAL: ${comp.valorFinal} ${comp.requiereRevision ? '⚠️ REVISAR' : ''}`);
      lineas.push('');
    });

    lineas.push('🎯 DECISIÓN FINAL:');
    lineas.push(`   - Método: ${resultado.decision.metodoPreferido}`);
    lineas.push(`   - Revisión humana: ${resultado.decision.requiereRevisionHumana ? 'SÍ ⚠️' : 'NO ✅'}`);
    lineas.push(`   - Razonamiento: ${resultado.decision.razonamiento}`);
    lineas.push('');
    lineas.push('═══════════════════════════════════════════════════════');

    return lineas.join('\n');
  }
}

export default new ExtraccionDualService();
