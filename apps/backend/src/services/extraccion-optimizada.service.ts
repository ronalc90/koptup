/**
 * SERVICIO DE EXTRACCIÓN OPTIMIZADO
 *
 * Optimizaciones implementadas:
 * 1. Modelo gpt-4o-mini para reducir costos y rate limits
 * 2. BATCH OCR: Un solo request para múltiples PDFs
 * 3. Filtrado de líneas relevantes para reducir tokens
 * 4. Retry exponencial real que funciona correctamente
 */

import * as fs from 'fs';
import OpenAI from 'openai';
import { parsePdf } from '../utils/pdf-parse';
import { DatosFacturaPDF } from './pdf-extractor.service';

/**
 * Resultado de extracción con metadatos
 */
interface ExtraccionConConfianza extends DatosFacturaPDF {
  metadatos: {
    metodo: 'BATCH_IA' | 'IA' | 'REGEX';
    confianza: number;
    tiempoExtraccion: number;
    camposExtraidos: number;
    camposVacios: number;
  };
}

/**
 * Resultado final de extracción
 */
interface ResultadoExtraccionOptimizada {
  datosFinales: DatosFacturaPDF;
  extraccionRegex: ExtraccionConConfianza;
  extraccionVision: ExtraccionConConfianza;
  comparacion: {
    camposComparados: any[];
    coincidencias: number;
    discrepancias: number;
    porcentajeCoincidencia: number;
  };
  decision: {
    nivelConfianza: number;
    metodoPreferido: 'REGEX' | 'BATCH_IA' | 'IA';
    requiereRevisionHumana: boolean;
    razonamiento: string;
  };
  imagenPDFBase64?: string;
}

/**
 * Entrada para procesamiento batch
 */
interface PDFParaBatch {
  path: string;
  tipo: 'FACTURA' | 'HISTORIA_CLINICA' | 'PROCEDIMIENTOS';
}

class ExtraccionOptimizadaService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI GPT-4o-mini inicializado para extracción optimizada');
    } else {
      console.log('⚠️  OPENAI_API_KEY no configurada');
    }
  }

  /**
   * FUNCIÓN DE RETRY EXPONENCIAL REAL
   */
  private async retryRequest<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T> {
    let delay = 1000; // Empezar con 1 segundo

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (err?.status === 429) {
          console.log(`   ⏳ Rate limit, reintentando en ${delay}ms... (intento ${i + 1}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; // Duplicar el tiempo de espera (exponencial)
        } else {
          throw err; // Si no es rate limit, lanzar el error
        }
      }
    }

    throw new Error('Máximos reintentos alcanzados');
  }

  /**
   * FILTRAR LÍNEAS RELEVANTES DEL PDF
   * Objetivo: Reducir tokens procesados eliminando contenido irrelevante
   */
  private filtrarLineasRelevantes(texto: string): string {
    const lineas = texto.split('\n');
    const lineasRelevantes: string[] = [];

    // Patrones que indican líneas relevantes
    const patronesRelevantes = [
      /\d{5,}/, // Códigos largos (CUPS, documentos, etc.)
      /\$\s*\d/, // Valores monetarios
      /\d+[.,]\d{3}/, // Números grandes (valores)
      /factura/i, // Información de factura
      /paciente/i, // Información de paciente
      /procedimiento/i, // Procedimientos
      /diagn[oó]stico/i, // Diagnósticos
      /autorizaci[oó]n/i, // Autorización
      /valor/i, // Valores
      /total/i, // Totales
      /fecha/i, // Fechas
      /cantidad/i, // Cantidades
      /ITEM\s+C[OÓ]DIGO/i, // Encabezado de tabla
      /^\d{1,4}\s+[A-Z0-9\-]{4,}/, // Filas de tabla (ITEM CODIGO...)
    ];

    // Patrones que indican líneas irrelevantes (excluir)
    const patronesIrrelevantes = [
      /^resolución/i,
      /^habilitación/i,
      /^página\s+\d+/i,
      /^_{3,}/, // Líneas de guiones
      /^={3,}/, // Líneas de igual
      /^\s*$/, // Líneas vacías
    ];

    for (const linea of lineas) {
      // Primero verificar si es irrelevante
      const esIrrelevante = patronesIrrelevantes.some(patron => patron.test(linea));
      if (esIrrelevante) {
        continue;
      }

      // Verificar si es relevante
      const esRelevante = patronesRelevantes.some(patron => patron.test(linea));
      if (esRelevante) {
        lineasRelevantes.push(linea);
      }
    }

    const textoFiltrado = lineasRelevantes.join('\n');

    console.log(`   🧹 Filtrado de líneas:`);
    console.log(`      Original: ${lineas.length} líneas (${texto.length} caracteres)`);
    console.log(`      Filtrado: ${lineasRelevantes.length} líneas (${textoFiltrado.length} caracteres)`);
    console.log(`      Reducción: ${Math.round((1 - textoFiltrado.length / texto.length) * 100)}%`);

    return textoFiltrado;
  }

  /**
   * MÉTODO PRINCIPAL: Extracción BATCH de múltiples PDFs en un solo request
   */
  async extraerBatch(pdfs: PDFParaBatch[]): Promise<ResultadoExtraccionOptimizada[]> {
    console.log(`\n🚀 Iniciando extracción BATCH de ${pdfs.length} PDFs...`);

    if (!this.openai) {
      throw new Error('OpenAI no está configurado. Configure OPENAI_API_KEY en las variables de entorno.');
    }

    const inicio = Date.now();

    // 1. Extraer y filtrar texto de todos los PDFs
    const textosExtraidos: { path: string; tipo: string; texto: string; textoFiltrado: string }[] = [];

    for (const pdf of pdfs) {
      try {
        const dataBuffer = fs.readFileSync(pdf.path);
        const pdfData = await parsePdf(dataBuffer);
        const texto = pdfData.text;
        const textoFiltrado = this.filtrarLineasRelevantes(texto);

        textosExtraidos.push({
          path: pdf.path,
          tipo: pdf.tipo,
          texto: texto,
          textoFiltrado: textoFiltrado,
        });

        console.log(`   ✅ PDF ${pdf.tipo}: ${pdf.path.split('/').pop()}`);
      } catch (error: any) {
        console.log(`   ❌ Error leyendo PDF ${pdf.path}: ${error.message}`);
      }
    }

    // 2. Primero intentar REGEX en todos los PDFs de factura
    const procedimientosRegex: any[] = [];
    for (const { tipo, textoFiltrado } of textosExtraidos) {
      if (tipo === 'FACTURA' || tipo === 'PROCEDIMIENTOS') {
        const procRegex = this.extraerTablaProcedimientos(textoFiltrado);
        if (procRegex.length > 0) {
          procedimientosRegex.push(...procRegex);
          console.log(`   ✅ REGEX extrajo ${procRegex.length} procedimientos`);
        }
      }
    }

    // 3. Si REGEX encontró procedimientos, usar solo IA para metadatos
    if (procedimientosRegex.length > 0) {
      console.log(`\n✅ REGEX exitoso: ${procedimientosRegex.length} procedimientos encontrados`);
      console.log(`   📝 Usando IA solo para metadatos (factura, paciente, diagnósticos)`);

      // Construir un solo prompt con todos los textos
      const resultado = await this.extraerMetadatosBatch(textosExtraidos, procedimientosRegex);

      const tiempoTotal = Date.now() - inicio;
      console.log(`\n✅ Extracción BATCH completada en ${tiempoTotal}ms`);

      return [resultado];
    }

    // 4. Si REGEX no encontró nada, usar IA completa en batch
    console.log(`\n⚠️  REGEX no encontró procedimientos, usando IA completa en BATCH`);
    const resultado = await this.extraerCompletoBatch(textosExtraidos);

    const tiempoTotal = Date.now() - inicio;
    console.log(`\n✅ Extracción BATCH completada en ${tiempoTotal}ms`);

    return [resultado];
  }

  /**
   * Extracción de solo metadatos usando IA (cuando REGEX ya tiene procedimientos)
   */
  private async extraerMetadatosBatch(
    textos: { path: string; tipo: string; texto: string; textoFiltrado: string }[],
    procedimientosRegex: any[]
  ): Promise<ResultadoExtraccionOptimizada> {
    const prompt = `Eres un experto en extracción de datos de facturas médicas colombianas.

Analiza los siguientes documentos y extrae SOLO los metadatos (los procedimientos ya fueron extraídos).

**DOCUMENTOS:**
${textos.map((t, i) => `
DOCUMENTO ${i + 1} - TIPO: ${t.tipo}
${t.textoFiltrado}
---
`).join('\n')}

**EXTRAE SOLO:**
- Número de factura
- Datos del paciente (nombre, tipo documento, número documento, edad, sexo)
- Diagnósticos (principal y relacionados)
- Fechas (factura, radicación, ingreso)
- Autorización

**NO extraigas procedimientos** (ya tenemos esa información).

Responde ÚNICAMENTE con un objeto JSON:
{
  "nroFactura": "valor",
  "fechaFactura": "DD/MM/YYYY",
  "fechaRadicacion": "DD/MM/YYYY",
  "nombrePaciente": "valor",
  "tipoDocumentoPaciente": "CC|RC|TI|CE",
  "numeroDocumento": "valor",
  "edad": numero,
  "sexo": "M|F",
  "diagnosticoPrincipal": "codigo_CIE10",
  "diagnosticoRelacionado1": "codigo_CIE10",
  "diagnosticoRelacionado2": "codigo_CIE10",
  "nroAutNvo": "valor",
  "autorizacion": "valor",
  "fechaIngreso": "DD/MM/YYYY",
  "confianzaExtraccion": numero_0_a_100
}`;

    const respuesta = await this.retryRequest(async () => {
      return await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo más económico para metadatos
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0,
      });
    });

    const contenido = respuesta.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('IA no devolvió JSON válido');
    }

    const metadatos = JSON.parse(jsonMatch[0]);

    // Deduplicar y calcular valor total de procedimientos REGEX
    const procedimientosFinales = this.deduplicarProcedimientos(procedimientosRegex);
    const valorTotal = procedimientosFinales.reduce((sum, p) => sum + (p.valorUnitario * p.cant), 0);

    const datosFinales: any = {
      ...metadatos,
      procedimientos: procedimientosFinales,
      codigoProcedimiento: procedimientosFinales[0]?.codigoProcedimiento || '',
      nombreProcedimiento: procedimientosFinales[0]?.nombreProcedimiento || '',
      cant: procedimientosFinales[0]?.cant || 0,
      valorIPS: valorTotal,
    };

    const resultado: ExtraccionConConfianza = {
      ...datosFinales,
      metadatos: {
        metodo: 'BATCH_IA',
        confianza: 95, // Alta confianza con REGEX
        tiempoExtraccion: 0,
        camposExtraidos: procedimientosFinales.length + 6,
        camposVacios: 0,
      },
    };

    return {
      datosFinales: resultado,
      extraccionRegex: resultado,
      extraccionVision: resultado,
      comparacion: {
        camposComparados: [],
        coincidencias: 0,
        discrepancias: 0,
        porcentajeCoincidencia: 100,
      },
      decision: {
        nivelConfianza: 95,
        metodoPreferido: 'BATCH_IA',
        requiereRevisionHumana: false,
        razonamiento: `Extracción BATCH: ${procedimientosFinales.length} procedimientos por REGEX + metadatos por IA`,
      },
    };
  }

  /**
   * Extracción completa usando IA en batch
   */
  private async extraerCompletoBatch(
    textos: { path: string; tipo: string; texto: string; textoFiltrado: string }[]
  ): Promise<ResultadoExtraccionOptimizada> {
    const prompt = `Eres un experto en extracción de datos de facturas médicas colombianas.

Analiza los siguientes documentos y extrae TODOS los datos.

**DOCUMENTOS:**
${textos.map((t, i) => `
DOCUMENTO ${i + 1} - TIPO: ${t.tipo}
${t.textoFiltrado}
---
`).join('\n')}

**FORMATO COLOMBIANO:**
- Punto (.) = separador de miles
- Coma (,) = separador decimal
- Ejemplo: "38.586,00" → 38586

**EXTRAE:**
- Todos los procedimientos de la tabla
- Datos de factura (número, fechas, valores)
- Datos del paciente completos
- Diagnósticos (CIE-10)
- Autorización

Responde ÚNICAMENTE con un objeto JSON:
{
  "nroFactura": "valor",
  "fechaFactura": "DD/MM/YYYY",
  "nombrePaciente": "valor",
  "tipoDocumentoPaciente": "CC|RC|TI|CE",
  "numeroDocumento": "valor",
  "edad": numero,
  "sexo": "M|F",
  "procedimientos": [
    {
      "codigoProcedimiento": "codigo",
      "nombreProcedimiento": "descripcion",
      "cant": numero,
      "valorUnitario": numero
    }
  ],
  "diagnosticoPrincipal": "CIE10",
  "diagnosticoRelacionado1": "CIE10",
  "diagnosticoRelacionado2": "CIE10",
  "nroAutNvo": "valor",
  "autorizacion": "valor",
  "confianzaExtraccion": numero_0_a_100
}`;

    const respuesta = await this.retryRequest(async () => {
      return await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo económico
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0,
      });
    });

    const contenido = respuesta.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('IA no devolvió JSON válido');
    }

    const datos = JSON.parse(jsonMatch[0]);
    const procedimientos = datos.procedimientos || [];
    const valorTotal = procedimientos.reduce((sum: number, p: any) => sum + (p.valorUnitario * p.cant), 0);

    const datosFinales: any = {
      ...datos,
      codigoProcedimiento: procedimientos[0]?.codigoProcedimiento || '',
      nombreProcedimiento: procedimientos[0]?.nombreProcedimiento || '',
      cant: procedimientos[0]?.cant || 0,
      valorIPS: valorTotal,
    };

    const resultado: ExtraccionConConfianza = {
      ...datosFinales,
      metadatos: {
        metodo: 'BATCH_IA',
        confianza: datos.confianzaExtraccion || 75,
        tiempoExtraccion: 0,
        camposExtraidos: procedimientos.length + 6,
        camposVacios: 0,
      },
    };

    return {
      datosFinales: resultado,
      extraccionRegex: resultado,
      extraccionVision: resultado,
      comparacion: {
        camposComparados: [],
        coincidencias: 0,
        discrepancias: 0,
        porcentajeCoincidencia: 100,
      },
      decision: {
        nivelConfianza: datos.confianzaExtraccion || 75,
        metodoPreferido: 'BATCH_IA',
        requiereRevisionHumana: (datos.confianzaExtraccion || 75) < 70,
        razonamiento: `Extracción completa BATCH con IA - ${procedimientos.length} procedimientos`,
      },
    };
  }

  /**
   * Extrae tabla de procedimientos usando REGEX
   */
  private extraerTablaProcedimientos(texto: string): any[] {
    const procedimientos: any[] = [];

    // Patrón para filas de tabla: ITEM CODIGO DESCRIPCION CANTIDAD VALOR_UNITARIO
    const patron = /^(\d{1,4})\s+([A-Z0-9\-]{4,})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+)/gm;

    let match;
    while ((match = patron.exec(texto)) !== null) {
      const [, item, codigo, descripcion, cantidad, valorUnitario] = match;

      if (codigo.length >= 4) {
        const cantidadNum = this.parseNumeroColombiano(cantidad);
        const valorUnitarioNum = this.parseNumeroColombiano(valorUnitario);

        if (valorUnitarioNum > 0 && cantidadNum > 0) {
          procedimientos.push({
            item: parseInt(item),
            codigoProcedimiento: codigo.trim().toUpperCase(),
            nombreProcedimiento: descripcion.trim(),
            cant: Math.round(cantidadNum),
            valorUnitario: Math.round(valorUnitarioNum),
          });
        }
      }
    }

    return procedimientos;
  }

  /**
   * Convierte número colombiano a JavaScript
   */
  private parseNumeroColombiano(numStr: string): number {
    if (!numStr || typeof numStr !== 'string') {
      return 0;
    }

    try {
      let limpio = numStr.trim().replace(/\./g, '').replace(/,/g, '.');
      const resultado = parseFloat(limpio);
      return isNaN(resultado) ? 0 : resultado;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Deduplica procedimientos
   */
  private deduplicarProcedimientos(procedimientos: any[]): any[] {
    const vistos = new Map<string, any>();

    for (const proc of procedimientos) {
      const clave = `${proc.codigoProcedimiento}_${proc.valorUnitario}_${proc.cant}`;
      if (!vistos.has(clave)) {
        vistos.set(clave, proc);
      }
    }

    return Array.from(vistos.values()).sort((a, b) => a.item - b.item);
  }

  /**
   * Validar procedimiento
   */
  private validarProcedimiento(proc: any): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!proc.codigoProcedimiento || proc.codigoProcedimiento.trim().length === 0) {
      errores.push('Código faltante');
    }

    const cantidad = Number(proc.cant);
    if (isNaN(cantidad) || cantidad <= 0) {
      errores.push('Cantidad inválida');
    }

    const valor = Number(proc.valorUnitario);
    if (isNaN(valor) || valor < 0) {
      errores.push('Valor inválido');
    }

    return { valido: errores.length === 0, errores };
  }
}

export default new ExtraccionOptimizadaService();
