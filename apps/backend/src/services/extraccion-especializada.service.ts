/**
 * SERVICIO DE EXTRACCIÓN ESPECIALIZADA POR TIPO DE DOCUMENTO
 *
 * Enfoque inteligente:
 * - FA (Factura): Detección de tablas estilo PDFTables
 * - HC (Historia Clínica): Extracción de texto narrativo médico
 *
 * Beneficios:
 * - Prompts específicos y enfocados
 * - Reducción de tokens procesados
 * - Mayor precisión en extracción
 */

import * as fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

/**
 * Tipos de documentos soportados
 */
type TipoDocumento = 'FACTURA' | 'HISTORIA_CLINICA';

/**
 * Estructura de una factura médica
 */
interface DatosFactura {
  tipo: 'FACTURA';
  numeroFactura: string;
  fecha: string;
  paciente: {
    nombre: string;
    documento: string;
  };
  diagnostico: string;
  valorTotalFactura: number;
  procedimientos: Array<{
    codigo: string;
    descripcion: string;
    cantidad: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
}

/**
 * Estructura de una historia clínica
 */
interface DatosHistoriaClinica {
  tipo: 'HISTORIA_CLINICA';
  paciente: {
    nombre: string;
    documento: string;
  };
  motivoConsulta: string;
  diagnosticos: string[];
  procedimientosRealizados: string[];
  medicamentos: string[];
  resumenClinico: string;
}

/**
 * Resultado de extracción
 */
interface ResultadoExtraccion {
  tipoDetectado: TipoDocumento;
  datos: DatosFactura | DatosHistoriaClinica;
  confianza: number;
  metodo: 'REGEX' | 'IA' | 'HIBRIDO';
}

class ExtraccionEspecializadaService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ Servicio de Extracción Especializada inicializado');
    } else {
      console.warn('⚠️  OPENAI_API_KEY no configurada');
    }
  }

  /**
   * Detecta el tipo de documento por el nombre del archivo
   */
  private detectarTipoPorNombre(nombreArchivo: string): TipoDocumento {
    const nombre = nombreArchivo.toUpperCase();

    if (nombre.includes('FA') || nombre.includes('FACTURA') || nombre.includes('FV')) {
      return 'FACTURA';
    }

    if (nombre.includes('HC') || nombre.includes('HISTORIA') || nombre.includes('NOTA')) {
      return 'HISTORIA_CLINICA';
    }

    // Por defecto, asumir factura si no se detecta
    return 'FACTURA';
  }

  /**
   * Retry con backoff exponencial
   */
  private async retryRequest<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T> {
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (err?.status === 429) {
          console.log(`   ⏳ Rate limit, esperando ${delay}ms... (intento ${i + 1}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        } else {
          throw err;
        }
      }
    }

    throw new Error('Máximos reintentos alcanzados');
  }

  /**
   * Filtra líneas relevantes para reducir tokens
   */
  private filtrarLineasRelevantes(texto: string, tipo: TipoDocumento): string {
    const lineas = texto.split('\n');
    const lineasRelevantes: string[] = [];

    if (tipo === 'FACTURA') {
      // Para facturas: buscar tablas, códigos, valores
      const patronesFactura = [
        /\d{5,}/, // Códigos
        /\$\s*\d/, // Valores monetarios
        /\d+[.,]\d{3}/, // Números grandes
        /factura/i,
        /procedimiento/i,
        /total/i,
        /valor/i,
        /cantidad/i,
        /ITEM\s+C[OÓ]DIGO/i,
        /^\d{1,4}\s+[A-Z0-9\-]{4,}/, // Filas de tabla
      ];

      for (const linea of lineas) {
        if (patronesFactura.some(patron => patron.test(linea))) {
          lineasRelevantes.push(linea);
        }
      }
    } else {
      // Para HC: buscar texto narrativo médico
      const patronesHC = [
        /paciente/i,
        /motivo/i,
        /diagn[oó]stico/i,
        /tratamiento/i,
        /procedimiento/i,
        /medicamento/i,
        /evoluci[oó]n/i,
        /historia/i,
        /cl[ií]nica/i,
        /antecedente/i,
        /examen/i,
      ];

      for (const linea of lineas) {
        // Incluir líneas con palabras clave o líneas largas (narrativa)
        if (patronesHC.some(patron => patron.test(linea)) || linea.length > 50) {
          lineasRelevantes.push(linea);
        }
      }
    }

    const textoFiltrado = lineasRelevantes.join('\n');
    console.log(`   🧹 Filtrado ${tipo}: ${lineas.length} → ${lineasRelevantes.length} líneas`);
    console.log(`   📉 Reducción: ${Math.round((1 - textoFiltrado.length / texto.length) * 100)}%`);

    return textoFiltrado;
  }

  /**
   * Extrae tabla de procedimientos con REGEX (rápido y gratis)
   */
  private extraerTablaProcedimientos(texto: string): DatosFactura['procedimientos'] {
    const procedimientos: DatosFactura['procedimientos'] = [];

    // Patrón: ITEM CODIGO DESCRIPCION CANTIDAD VALOR_UNITARIO [%IMP] VALOR_TOTAL
    const patron = /^(\d{1,4})\s+([A-Z0-9\-]{4,})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+)(?:\s+[\d.,]+)?\s+([\d.,]+)\s*$/gm;

    let match;
    while ((match = patron.exec(texto)) !== null) {
      const [, item, codigo, descripcion, cantidad, valorUnitario, valorTotal] = match;

      if (codigo.length >= 4) {
        procedimientos.push({
          codigo: codigo.trim().toUpperCase(),
          descripcion: descripcion.trim(),
          cantidad: Math.round(this.parseNumeroColombiano(cantidad)),
          valorUnitario: Math.round(this.parseNumeroColombiano(valorUnitario)),
          valorTotal: Math.round(this.parseNumeroColombiano(valorTotal)),
        });
      }
    }

    if (procedimientos.length > 0) {
      console.log(`   ✅ REGEX extrajo ${procedimientos.length} procedimientos`);
    }

    return procedimientos;
  }

  /**
   * Convierte formato colombiano a número
   */
  private parseNumeroColombiano(numStr: string): number {
    if (!numStr || typeof numStr !== 'string') return 0;

    try {
      let limpio = numStr.trim().replace(/\./g, '').replace(/,/g, '.');
      const resultado = parseFloat(limpio);
      return isNaN(resultado) ? 0 : resultado;
    } catch {
      return 0;
    }
  }

  /**
   * Extrae datos de FACTURA usando IA con prompt especializado
   */
  private async extraerFacturaConIA(textoFiltrado: string, procedimientosRegex: DatosFactura['procedimientos']): Promise<DatosFactura> {
    if (!this.openai) {
      throw new Error('OpenAI no configurado');
    }

    const usarRegex = procedimientosRegex.length > 0;

    const prompt = `Eres un extractor experto de FACTURAS médicas. Detecta columnas, filas y celdas como PDFTables.

${usarRegex ? '⚠️ Ya tenemos los PROCEDIMIENTOS extraídos con REGEX. NO los extraigas de nuevo.' : ''}

TEXTO DE LA FACTURA:
${textoFiltrado}

Extrae SOLO lo siguiente en JSON:

{
  "tipo": "FACTURA",
  "numeroFactura": "número de factura exacto",
  "fecha": "DD/MM/YYYY",
  "paciente": {
    "nombre": "nombre completo del paciente",
    "documento": "número de documento"
  },
  "diagnostico": "código CIE-10 del diagnóstico principal",
  ${usarRegex ? '' : `"procedimientos": [
    {
      "codigo": "código CUPS exacto",
      "descripcion": "descripción completa",
      "cantidad": numero,
      "valorUnitario": numero_sin_separadores,
      "valorTotal": numero_sin_separadores
    }
  ],`}
  "valorTotalFactura": numero_total_factura
}

REGLAS:
- Formato colombiano: punto (.) = miles, coma (,) = decimal
- NO inventes códigos ni valores
- Si algo no está explícito, deja ""
- COPIA los números exactos sin cambiarlos`;

    const respuesta = await this.retryRequest(async () => {
      return await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: usarRegex ? 2000 : 4000, // Aumentado para JSON completo
        temperature: 0,
      });
    });

    const contenido = respuesta.choices[0].message.content || '{}';

    // Buscar JSON incluso si hay texto antes/después
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.log(`   ⚠️  IA no devolvió JSON válido. Contenido: ${contenido.substring(0, 200)}...`);
      throw new Error('IA no devolvió JSON válido');
    }

    let datos;
    try {
      datos = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.log(`   ⚠️  Error parseando JSON: ${error}`);
      console.log(`   📄 JSON recibido: ${jsonMatch[0].substring(0, 500)}...`);
      throw new Error('Error parseando JSON de la IA');
    }

    // Si usamos REGEX, usar esos procedimientos
    if (usarRegex) {
      datos.procedimientos = procedimientosRegex;
      console.log(`   ✅ Usando ${procedimientosRegex.length} procedimientos de REGEX`);
    }

    // Calcular valor total si no viene
    if (!datos.valorTotalFactura && datos.procedimientos) {
      datos.valorTotalFactura = datos.procedimientos.reduce((sum: number, p: any) => sum + (p.valorTotal || 0), 0);
    }

    return datos;
  }

  /**
   * Extrae datos de HISTORIA CLÍNICA usando IA con prompt especializado
   */
  private async extraerHistoriaClinicaConIA(textoFiltrado: string): Promise<DatosHistoriaClinica> {
    if (!this.openai) {
      throw new Error('OpenAI no configurado');
    }

    const prompt = `Eres un extractor experto de HISTORIAS CLÍNICAS. Extrae solo información médica narrativa.

TEXTO DE LA HISTORIA CLÍNICA:
${textoFiltrado}

Extrae SOLO lo siguiente en JSON:

{
  "tipo": "HISTORIA_CLINICA",
  "paciente": {
    "nombre": "nombre completo",
    "documento": "número documento"
  },
  "motivoConsulta": "razón de la consulta",
  "diagnosticos": ["CIE10-1", "CIE10-2"],
  "procedimientosRealizados": ["procedimiento 1", "procedimiento 2"],
  "medicamentos": ["medicamento 1", "medicamento 2"],
  "resumenClinico": "resumen breve de la atención"
}

REGLAS:
- NO extraigas valores ni tarifas
- NO inventes diagnósticos
- Mantén el texto resumido
- Si no está explícito, deja vacío []`;

    const respuesta = await this.retryRequest(async () => {
      return await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0,
      });
    });

    const contenido = respuesta.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('IA no devolvió JSON válido');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * MÉTODO PRINCIPAL: Extrae según tipo de documento
   */
  async extraerPorTipo(pdfPath: string, nombreArchivo: string): Promise<ResultadoExtraccion> {
    const inicio = Date.now();

    // 1. Detectar tipo por nombre
    const tipoDetectado = this.detectarTipoPorNombre(nombreArchivo);
    console.log(`\n📄 Procesando: ${nombreArchivo}`);
    console.log(`   🏷️  Tipo detectado: ${tipoDetectado}`);

    // 2. Leer PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const textoCompleto = pdfData.text;

    // 3. Filtrar líneas relevantes según tipo
    const textoFiltrado = this.filtrarLineasRelevantes(textoCompleto, tipoDetectado);

    let datos: DatosFactura | DatosHistoriaClinica;
    let metodo: 'REGEX' | 'IA' | 'HIBRIDO';
    let confianza: number;

    if (tipoDetectado === 'FACTURA') {
      // 4a. FACTURA: Intentar REGEX primero
      const procedimientosRegex = this.extraerTablaProcedimientos(textoFiltrado);

      if (procedimientosRegex.length > 0) {
        // HÍBRIDO: REGEX para procedimientos + IA para metadatos
        console.log(`   🔬 Modo HÍBRIDO: REGEX + IA`);
        datos = await this.extraerFacturaConIA(textoFiltrado, procedimientosRegex);
        metodo = 'HIBRIDO';
        confianza = 95;
      } else {
        // IA completa
        console.log(`   🤖 Modo IA completa`);
        datos = await this.extraerFacturaConIA(textoFiltrado, []);
        metodo = 'IA';
        confianza = 80;
      }
    } else {
      // 4b. HISTORIA CLÍNICA: Solo IA
      console.log(`   📋 Extracción narrativa con IA`);
      datos = await this.extraerHistoriaClinicaConIA(textoFiltrado);
      metodo = 'IA';
      confianza = 85;
    }

    const tiempoTotal = Date.now() - inicio;
    console.log(`   ⏱️  Tiempo: ${tiempoTotal}ms`);
    console.log(`   ✅ Extracción completada - Confianza: ${confianza}%`);

    return {
      tipoDetectado,
      datos,
      confianza,
      metodo,
    };
  }

  /**
   * BATCH: Procesa múltiples archivos
   */
  async extraerBatch(archivos: Array<{ path: string; nombre: string }>): Promise<ResultadoExtraccion[]> {
    console.log(`\n🚀 Procesamiento BATCH de ${archivos.length} archivos...`);

    const resultados: ResultadoExtraccion[] = [];

    for (const archivo of archivos) {
      try {
        const resultado = await this.extraerPorTipo(archivo.path, archivo.nombre);
        resultados.push(resultado);
      } catch (error: any) {
        console.error(`   ❌ Error en ${archivo.nombre}: ${error.message}`);
      }
    }

    console.log(`\n📊 Batch completado: ${resultados.length}/${archivos.length} exitosos`);
    return resultados;
  }
}

export default new ExtraccionEspecializadaService();
