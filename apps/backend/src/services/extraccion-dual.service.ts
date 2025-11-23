/**
 * SERVICIO DE EXTRACCIÓN CON IA
 *
 * Usa únicamente IA (GPT-4) para extraer datos de facturas médicas.
 * Elimina dependencias de:
 * - pdf-to-png-converter (incompatible con Node v18)
 * - GPT-4o Vision
 * - Extracción con REGEX
 *
 * Objetivo: Extracción confiable usando solo IA estándar
 */

import * as fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { DatosFacturaPDF } from './pdf-extractor.service';

/**
 * Resultado de extracción con metadatos de confianza
 */
interface ExtraccionConConfianza extends DatosFacturaPDF {
  metadatos: {
    metodo: 'IA';
    confianza: number; // 0-100
    tiempoExtraccion: number; // ms
    camposExtraidos: number;
    camposVacios: number;
  };
}

/**
 * Resultado final de la extracción
 */
interface ResultadoExtraccionDual {
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
    nivelConfianza: number; // 0-100
    metodoPreferido: 'REGEX' | 'GPT4O_VISION' | 'HIBRIDO' | 'IA';
    requiereRevisionHumana: boolean;
    razonamiento: string;
  };

  // Para compatibilidad con otros servicios
  imagenPDFBase64?: string;
}

class ExtraccionDualService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI GPT-4o inicializado para extracción con IA');
    } else {
      console.log('⚠️  OPENAI_API_KEY no configurada');
    }
  }

  /**
   * MÉTODO PRINCIPAL: Extracción solo con IA
   */
  async extraerConDobleValidacion(pdfPath: string): Promise<ResultadoExtraccionDual> {
    console.log('🔍 Iniciando extracción con IA...');

    if (!this.openai) {
      throw new Error('OpenAI no está configurado. Configure OPENAI_API_KEY en las variables de entorno.');
    }

    const inicio = Date.now();
    const datosIA = await this.extraerConIA(pdfPath);
    const tiempoExtraccion = Date.now() - inicio;

    console.log(`✅ Extracción IA completada en ${tiempoExtraccion}ms`);
    console.log(`   - Campos extraídos: ${datosIA.metadatos.camposExtraidos}`);
    console.log(`   - Confianza: ${datosIA.metadatos.confianza}%`);

    return {
      datosFinales: datosIA,
      extraccionRegex: datosIA,
      extraccionVision: datosIA,
      comparacion: {
        camposComparados: [],
        coincidencias: 0,
        discrepancias: 0,
        porcentajeCoincidencia: 100,
      },
      decision: {
        nivelConfianza: datosIA.metadatos.confianza,
        metodoPreferido: 'IA',
        requiereRevisionHumana: datosIA.metadatos.confianza < 70,
        razonamiento: `Extracción completada con IA - Confianza: ${datosIA.metadatos.confianza}%`,
      },
    };
  }

  /**
   * Valida y sanitiza un procedimiento extraído
   */
  private validarProcedimiento(proc: any): { valido: boolean; errores: string[]; procedimientoSanitizado?: any } {
    const errores: string[] = [];

    // Validar código de procedimiento
    if (!proc.codigoProcedimiento || typeof proc.codigoProcedimiento !== 'string') {
      errores.push('Código de procedimiento faltante o inválido');
    } else if (proc.codigoProcedimiento.trim().length === 0) {
      errores.push('Código de procedimiento vacío');
    }

    // Validar cantidad
    const cantidad = Number(proc.cant);
    if (isNaN(cantidad) || cantidad <= 0 || cantidad > 10000) {
      errores.push(`Cantidad inválida: ${proc.cant} (debe ser > 0 y <= 10000)`);
    }

    // Validar valor unitario
    const valorUnitario = Number(proc.valorUnitario);
    if (isNaN(valorUnitario) || valorUnitario < 0 || valorUnitario > 100000000) {
      errores.push(`Valor unitario inválido: ${proc.valorUnitario} (debe ser >= 0 y <= 100M)`);
    }

    // Validar nombre de procedimiento
    if (!proc.nombreProcedimiento || typeof proc.nombreProcedimiento !== 'string') {
      // No es crítico, pero advertir
      proc.nombreProcedimiento = proc.nombreProcedimiento || 'Procedimiento sin descripción';
    }

    if (errores.length > 0) {
      return { valido: false, errores };
    }

    // Sanitizar y normalizar datos
    const procedimientoSanitizado = {
      codigoProcedimiento: String(proc.codigoProcedimiento).trim().toUpperCase(),
      nombreProcedimiento: String(proc.nombreProcedimiento).trim(),
      cant: Math.round(cantidad), // Redondear cantidad a entero
      valorUnitario: Math.round(valorUnitario), // Redondear valor a entero
    };

    return { valido: true, errores: [], procedimientoSanitizado };
  }

  /**
   * Deduplica procedimientos basándose en código y valor
   * Ahora con validación integrada
   */
  private deduplicarProcedimientos(procedimientos: any[]): any[] {
    const vistos = new Map<string, any>();
    let procedimientosInvalidos = 0;

    for (const proc of procedimientos) {
      // Validar procedimiento
      const { valido, errores, procedimientoSanitizado } = this.validarProcedimiento(proc);

      if (!valido) {
        console.log(`   ⚠️  Procedimiento inválido omitido: ${errores.join(', ')}`);
        procedimientosInvalidos++;
        continue;
      }

      // Crear clave única basada en código + valor + cantidad
      const clave = `${procedimientoSanitizado!.codigoProcedimiento}_${procedimientoSanitizado!.valorUnitario}_${procedimientoSanitizado!.cant}`;

      if (!vistos.has(clave)) {
        vistos.set(clave, procedimientoSanitizado);
      }
    }

    if (procedimientosInvalidos > 0) {
      console.log(`   🔍 ${procedimientosInvalidos} procedimientos inválidos fueron omitidos`);
    }

    return Array.from(vistos.values());
  }

  /**
   * Procesa PDF grande usando chunking y consolida resultados
   * HÍBRIDO: Usa REGEX para procedimientos (confiable) + IA para metadatos
   */
  private async procesarConChunking(chunks: string[], pdfPath: string): Promise<ExtraccionConConfianza> {
    const todosLosProcedimientos: any[] = [];
    const procedimientosRegex: any[] = [];
    const todosDiagnosticos: Set<string> = new Set();
    let datosBase: any = null;
    let confianzaTotal = 0;
    let chunksExitosos = 0;
    let chunksFallidos = 0;

    // PASO 1: Extraer procedimientos con REGEX de todos los chunks (más confiable)
    console.log(`\n🔬 PASO 1: Extracción REGEX de procedimientos de todos los chunks...`);
    for (let i = 0; i < chunks.length; i++) {
      const procChunk = this.extraerTablaProcedimientos(chunks[i]);
      if (procChunk.length > 0) {
        procedimientosRegex.push(...procChunk);
        console.log(`   ✅ Chunk ${i + 1}: ${procChunk.length} procedimientos por REGEX`);
      }
    }

    console.log(`   🎯 Total REGEX antes de deduplicar: ${procedimientosRegex.length} procedimientos`);

    // PASO 2: Extraer metadatos con IA (factura, paciente, diagnósticos)
    console.log(`\n🤖 PASO 2: Extracción IA de metadatos...`);
    for (let i = 0; i < chunks.length; i++) {
      console.log(`   📄 Procesando chunk ${i + 1}/${chunks.length} (${chunks[i].length} caracteres)...`);

      try {
        const resultado = await this.extraerDeChunk(chunks[i], i + 1);

        // Validar que el resultado tenga estructura mínima válida
        if (!resultado || typeof resultado !== 'object') {
          throw new Error('Resultado de extracción inválido (no es un objeto)');
        }

        // Guardar datos base del primer chunk (factura, paciente, etc.)
        if (i === 0) {
          datosBase = resultado;
          console.log(`   📋 Datos base extraídos: Factura=${resultado.nroFactura || 'N/A'}, Paciente=${resultado.nombrePaciente || 'N/A'}`);
        }

        // Si REGEX no encontró procedimientos, usar los de IA como fallback
        if (procedimientosRegex.length === 0 && resultado.procedimientos && Array.isArray(resultado.procedimientos)) {
          const procValidos = resultado.procedimientos.length;
          todosLosProcedimientos.push(...resultado.procedimientos);
          console.log(`   ⚠️  Usando procedimientos de IA como fallback: ${procValidos} procedimientos`);
        }

        // Consolidar diagnósticos
        if (resultado.diagnosticoPrincipal) {
          todosDiagnosticos.add(resultado.diagnosticoPrincipal);
        }
        if (resultado.diagnosticoRelacionado1) {
          todosDiagnosticos.add(resultado.diagnosticoRelacionado1);
        }
        if (resultado.diagnosticoRelacionado2) {
          todosDiagnosticos.add(resultado.diagnosticoRelacionado2);
        }

        // Acumular confianza
        const confianzaChunk = resultado.confianzaExtraccion || 0;
        if (confianzaChunk >= 0 && confianzaChunk <= 100) {
          confianzaTotal += confianzaChunk;
          chunksExitosos++;
        } else {
          console.log(`   ⚠️  Confianza de chunk ${i + 1} fuera de rango: ${confianzaChunk}`);
        }

      } catch (error: any) {
        chunksFallidos++;
        console.log(`   ❌ Error procesando chunk ${i + 1}: ${error.message}`);

        // Si es el primer chunk y falla, intentar rescatar datos básicos
        if (i === 0 && !datosBase) {
          console.log(`   🔄 Intentando recuperar datos básicos del chunk 1...`);
          try {
            datosBase = {
              nroFactura: this.extraerNumeroFacturaPorRegex(chunks[i]),
              nombrePaciente: '',
              numeroDocumento: '',
              procedimientos: [],
              diagnosticoPrincipal: '',
            };
            console.log(`   ✅ Datos básicos recuperados por regex`);
          } catch (recoveryError) {
            console.log(`   ⚠️  No se pudieron recuperar datos básicos`);
          }
        }

        // Continuar con el siguiente chunk en lugar de fallar completamente
        continue;
      }
    }

    // Validar que se procesó al menos un chunk exitosamente
    if (chunksExitosos === 0 && procedimientosRegex.length === 0) {
      throw new Error(`Todos los chunks fallaron (${chunksFallidos}/${chunks.length}). No se pudo extraer ningún dato.`);
    }

    console.log(`\n📊 Resumen de procesamiento por chunks:`);
    console.log(`   - Chunks exitosos: ${chunksExitosos}/${chunks.length}`);
    console.log(`   - Chunks fallidos: ${chunksFallidos}/${chunks.length}`);
    console.log(`   - Tasa de éxito: ${Math.round((chunksExitosos / chunks.length) * 100)}%`);

    // PASO 3: Consolidar procedimientos (priorizar REGEX sobre IA)
    console.log(`\n🔀 PASO 3: Consolidación de procedimientos...`);

    let procedimientosFinales: any[];
    if (procedimientosRegex.length > 0) {
      console.log(`   ✅ Usando procedimientos REGEX (más confiables): ${procedimientosRegex.length} extraídos`);
      procedimientosFinales = this.deduplicarProcedimientos(procedimientosRegex);
      console.log(`   🔄 Deduplicación REGEX: ${procedimientosRegex.length} → ${procedimientosFinales.length} procedimientos únicos`);
    } else {
      console.log(`   ⚠️  REGEX no encontró procedimientos, usando IA como fallback`);
      procedimientosFinales = this.deduplicarProcedimientos(todosLosProcedimientos);
      console.log(`   🔄 Deduplicación IA: ${todosLosProcedimientos.length} → ${procedimientosFinales.length} procedimientos únicos`);
    }

    // Calcular valor total sumando todos los procedimientos únicos
    const valorTotal = procedimientosFinales.reduce((sum, proc) => {
      return sum + (proc.valorUnitario * proc.cant || 0);
    }, 0);

    const diagnosticosArray = Array.from(todosDiagnosticos);
    const confianzaPromedio = procedimientosRegex.length > 0 ? 95 : Math.round(confianzaTotal / Math.max(chunks.length, 1));

    console.log(`   ✅ Consolidación completada: ${procedimientosFinales.length} procedimientos, ${diagnosticosArray.length} diagnósticos`);
    console.log(`   💰 Valor total calculado: ${valorTotal.toLocaleString('es-CO')}`);

    // Consolidar datos
    const datosConsolidados = {
      ...datosBase,
      procedimientos: procedimientosFinales,
      diagnosticoPrincipal: diagnosticosArray[0] || '',
      diagnosticoRelacionado1: diagnosticosArray[1] || '',
      diagnosticoRelacionado2: diagnosticosArray[2] || '',
      valorIPS: valorTotal,
      confianzaExtraccion: confianzaPromedio,
      // Usar primer procedimiento para compatibilidad
      codigoProcedimiento: procedimientosFinales[0]?.codigoProcedimiento || '',
      nombreProcedimiento: procedimientosFinales[0]?.nombreProcedimiento || '',
      cant: procedimientosFinales[0]?.cant || 0,
    };

    const camposExtraidos = 6 + procedimientosFinales.length;

    return {
      ...datosConsolidados,
      metadatos: {
        metodo: 'IA',
        confianza: confianzaPromedio,
        tiempoExtraccion: 0,
        camposExtraidos,
        camposVacios: 0,
      },
    };
  }

  /**
   * Extrae datos de un chunk individual
   */
  private async extraerDeChunk(textoChunk: string, numeroChunk: number): Promise<any> {
    const prompt = `Eres un experto en extracción de datos de facturas médicas colombianas.

Analiza el siguiente FRAGMENTO de una factura médica y extrae TODOS los procedimientos que encuentres.

**INSTRUCCIONES CRÍTICAS - LEER TABLAS COMPLETAS:**

1. FORMATO DE TABLA: Las facturas tienen tablas con columnas:
   ITEM | CÓDIGO | DESCRIPCIÓN | CANTIDAD | VALOR UNITARIO | % IMP | VALOR TOTAL

2. EXTRACCIÓN COMPLETA:
   - NO omitas ninguna fila de la tabla
   - Lee TODAS las líneas numeradas (1, 2, 3, 4, ..., 50+)
   - Si ves "TOTAL LÍNEAS: 54", debes extraer las 54 líneas
   - Continúa leyendo hasta encontrar "SUBTOTAL" o "TOTAL LÍNEAS"

3. CÓDIGOS VÁLIDOS:
   - CUPS: 6 dígitos (ej: 890602, 735301, 897011)
   - Códigos internos: alfanuméricos (ej: 10A002, 129A02)
   - Medicamentos: numéricos largos (ej: 19934768-2, 20013906-1)
   - Insumos: numéricos cortos (ej: 104358, 25700)
   - TODOS son válidos - NO filtres por tipo de código

4. FORMATO COLOMBIANO:
   - Punto (.) = separador de miles
   - Coma (,) = separador decimal
   - Convierte a número sin separadores: "38.586,00" → 38586

5. CHUNK ${numeroChunk}:
   - Este es un fragmento de un documento más grande
   - Extrae TODO lo que veas en este fragmento
   - Los procedimientos se consolidarán después

TEXTO DEL FRAGMENTO:
${textoChunk}

Responde ÚNICAMENTE con un objeto JSON:
{
  "nroFactura": "valor",
  "nombrePaciente": "valor",
  "numeroDocumento": "valor",
  "procedimientos": [
    {
      "codigoProcedimiento": "codigo_tal_cual_aparece_en_tabla",
      "nombreProcedimiento": "descripción_completa",
      "cant": numero_cantidad,
      "valorUnitario": numero_sin_separadores
    }
  ],
  "diagnosticoPrincipal": "valor",
  "diagnosticoRelacionado1": "valor",
  "diagnosticoRelacionado2": "valor",
  "confianzaExtraccion": numero_0_a_100
}

RECUERDA: Extrae TODAS las filas de la tabla, no solo algunas. Si hay 50 procedimientos, devuelve los 50.`;

    // Llamar a OpenAI con retry logic
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await this.openai!.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8000, // Aumentado para soportar 50+ procedimientos por chunk
          temperature: 0,
        });
        break;
      } catch (error: any) {
        if (error?.status === 429 && retries < maxRetries) {
          const waitTime = Math.pow(2, retries) * 2000;
          console.log(`   ⏳ Rate limit (chunk ${numeroChunk}), esperando ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error;
        }
      }
    }

    const contenido = response!.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { procedimientos: [], confianzaExtraccion: 0 };
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Fallback: Extraer número de factura usando regex (cuando IA falla)
   */
  private extraerNumeroFacturaPorRegex(texto: string): string {
    // Intentar varios patrones de número de factura
    const patrones = [
      /FACTURA\s*(?:No\.?|N[°ºª]\.?|#)?\s*([A-Z0-9\-]+)/i,
      /FACTURA\s+ELECTR[OÓ]NICA.*?No\.?\s*([A-Z0-9\-]+)/i,
      /N[°ºª]\.?\s*FACTURA:?\s*([A-Z0-9\-]+)/i,
      /FV(\d+)/,  // Patrón común: FV694326
      /FEHM(\d+)/, // Patrón común: FEHM716251
    ];

    for (const patron of patrones) {
      const match = texto.match(patron);
      if (match && match[1]) {
        console.log(`   🎯 Número de factura encontrado por regex: ${match[1]}`);
        return match[1].trim();
      }
    }

    console.log(`   ⚠️  No se pudo encontrar número de factura con regex`);
    return '';
  }

  /**
   * NUEVO: Convierte número en formato colombiano a número JavaScript
   * Formato colombiano: punto (.) = miles, coma (,) = decimal
   * Ejemplos: "38.586,00" → 38586, "1.234.567,89" → 1234567.89
   */
  private parseNumeroColombiano(numStr: string): number {
    if (!numStr || typeof numStr !== 'string') {
      return 0;
    }

    try {
      // Eliminar espacios
      let limpio = numStr.trim();

      // Eliminar puntos (separadores de miles)
      limpio = limpio.replace(/\./g, '');

      // Reemplazar coma (separador decimal) por punto
      limpio = limpio.replace(/,/g, '.');

      // Parsear como float
      const resultado = parseFloat(limpio);

      return isNaN(resultado) ? 0 : resultado;
    } catch (error) {
      console.log(`   ⚠️  Error parseando número colombiano: "${numStr}"`);
      return 0;
    }
  }

  /**
   * NUEVO: Extrae tabla de procedimientos usando REGEX (más confiable que IA para datos estructurados)
   * Formato esperado: ITEM | CÓDIGO | DESCRIPCIÓN | CANTIDAD | VALOR UNITARIO | % IMP | VALOR TOTAL
   * Ejemplo: "1    890602    CUIDADO MANEJO...    4.00    70,000.00    0.00    280,000.00"
   */
  private extraerTablaProcedimientos(texto: string): any[] {
    const procedimientos: any[] = [];

    console.log(`\n🔍 Extrayendo procedimientos con REGEX (método estructurado)...`);

    // PATRÓN 1: Filas con estructura completa (más específico)
    // Captura: ITEM CÓDIGO DESCRIPCIÓN CANTIDAD VALOR_UNITARIO %IMP VALOR_TOTAL
    const patron1 = /^(\d{1,4})\s+([A-Z0-9\-]{4,})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s*$/gm;

    // PATRÓN 2: Filas más flexibles (para casos donde faltan columnas)
    const patron2 = /^(\d{1,4})\s+([A-Z0-9\-]{4,})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+)/gm;

    let match;
    let contadorPatron1 = 0;
    let contadorPatron2 = 0;

    // Intentar patrón 1 (más específico)
    while ((match = patron1.exec(texto)) !== null) {
      const [, item, codigo, descripcion, cantidad, valorUnitario, porcentajeImp, valorTotal] = match;

      // Validar que el código tenga longitud mínima
      if (codigo.length < 4) continue;

      // Parsear números en formato colombiano
      const cantidadNum = this.parseNumeroColombiano(cantidad);
      const valorUnitarioNum = this.parseNumeroColombiano(valorUnitario);
      const valorTotalNum = this.parseNumeroColombiano(valorTotal);

      // Validar que los valores tengan sentido
      if (valorUnitarioNum > 0 && cantidadNum > 0) {
        procedimientos.push({
          item: parseInt(item),
          codigoProcedimiento: codigo.trim().toUpperCase(),
          nombreProcedimiento: descripcion.trim(),
          cant: Math.round(cantidadNum),
          valorUnitario: Math.round(valorUnitarioNum),
        });
        contadorPatron1++;
      }
    }

    console.log(`   ✅ Patrón 1 (completo): ${contadorPatron1} procedimientos extraídos`);

    // Si el patrón 1 no encontró suficientes, intentar patrón 2
    if (contadorPatron1 < 5) {
      console.log(`   🔄 Intentando con patrón 2 (más flexible)...`);

      while ((match = patron2.exec(texto)) !== null) {
        const [, item, codigo, descripcion, cantidad, valorUnitario] = match;

        if (codigo.length < 4) continue;

        const cantidadNum = this.parseNumeroColombiano(cantidad);
        const valorUnitarioNum = this.parseNumeroColombiano(valorUnitario);

        if (valorUnitarioNum > 0 && cantidadNum > 0) {
          // Verificar que no sea duplicado del patrón 1
          const yaExiste = procedimientos.some(p =>
            p.item === parseInt(item) &&
            p.codigoProcedimiento === codigo.trim().toUpperCase()
          );

          if (!yaExiste) {
            procedimientos.push({
              item: parseInt(item),
              codigoProcedimiento: codigo.trim().toUpperCase(),
              nombreProcedimiento: descripcion.trim(),
              cant: Math.round(cantidadNum),
              valorUnitario: Math.round(valorUnitarioNum),
            });
            contadorPatron2++;
          }
        }
      }

      console.log(`   ✅ Patrón 2 (flexible): ${contadorPatron2} procedimientos adicionales`);
    }

    // Ordenar por número de item
    procedimientos.sort((a, b) => a.item - b.item);

    console.log(`   🎯 TOTAL REGEX: ${procedimientos.length} procedimientos extraídos de la tabla`);

    if (procedimientos.length > 0) {
      console.log(`   📋 Rango de items: ${procedimientos[0].item} - ${procedimientos[procedimientos.length - 1].item}`);
    }

    return procedimientos;
  }

  /**
   * Divide texto largo en chunks con overlapping (asolapamiento) para no perder datos
   */
  private dividirEnChunks(texto: string, tamañoMaxChunk: number = 80000): string[] {
    if (texto.length <= tamañoMaxChunk) {
      return [texto];
    }

    const chunks: string[] = [];
    const lineas = texto.split('\n');
    const overlap = 10000; // 10k caracteres de overlap entre chunks

    let indiceLineaInicio = 0;

    while (indiceLineaInicio < lineas.length) {
      let chunkActual = '';
      let indiceLineaFin = indiceLineaInicio;

      // Agregar líneas hasta alcanzar el tamaño máximo
      while (indiceLineaFin < lineas.length && chunkActual.length < tamañoMaxChunk) {
        chunkActual += lineas[indiceLineaFin] + '\n';
        indiceLineaFin++;
      }

      chunks.push(chunkActual);

      // Retroceder para crear overlap
      if (indiceLineaFin < lineas.length) {
        // Retroceder aproximadamente 'overlap' caracteres
        let caracteresRetrocedidos = 0;
        let lineasRetrocedidas = 0;

        while (caracteresRetrocedidos < overlap && (indiceLineaFin - lineasRetrocedidas - 1) > indiceLineaInicio) {
          lineasRetrocedidas++;
          caracteresRetrocedidos += lineas[indiceLineaFin - lineasRetrocedidas].length;
        }

        indiceLineaInicio = indiceLineaFin - lineasRetrocedidas;
      } else {
        break;
      }
    }

    console.log(`   📦 Chunks creados con overlap de ~10k caracteres entre cada uno`);
    return chunks;
  }

  /**
   * Extracción con IA usando texto del PDF
   */
  private async extraerConIA(pdfPath: string): Promise<ExtraccionConConfianza> {
    if (!this.openai) {
      throw new Error('OpenAI no está configurado - Falta OPENAI_API_KEY en variables de entorno');
    }

    // Validar que el archivo existe y es legible
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Archivo PDF no encontrado: ${pdfPath}`);
    }

    const stats = fs.statSync(pdfPath);
    if (stats.size === 0) {
      throw new Error(`Archivo PDF vacío: ${pdfPath}`);
    }

    if (stats.size > 50 * 1024 * 1024) {  // 50MB
      console.log(`   ⚠️  Archivo PDF muy grande (${Math.round(stats.size / 1024 / 1024)}MB). Esto puede tardar varios minutos.`);
    }

    // 1. Extraer texto del PDF
    let dataBuffer: Buffer;
    let pdfData: any;
    let textoPDF: string;

    try {
      dataBuffer = fs.readFileSync(pdfPath);
      pdfData = await pdfParse(dataBuffer);
      textoPDF = pdfData.text;
    } catch (error: any) {
      throw new Error(`Error al leer PDF: ${error.message}. El archivo podría estar corrupto o protegido.`);
    }

    // Validar que se extrajo texto
    if (!textoPDF || textoPDF.trim().length === 0) {
      throw new Error(`No se pudo extraer texto del PDF. El archivo podría ser solo imágenes o estar corrupto.`);
    }

    if (textoPDF.length < 50) {
      console.log(`   ⚠️  Texto extraído muy corto (${textoPDF.length} caracteres). Verificar calidad del PDF.`);
    }

    console.log(`📄 Texto extraído del PDF (${textoPDF.length} caracteres)`);

    // Si el PDF es muy grande, dividirlo en chunks
    const chunks = this.dividirEnChunks(textoPDF, 80000);

    if (chunks.length > 1) {
      console.log(`📦 PDF dividido en ${chunks.length} chunks para procesamiento`);
      return await this.procesarConChunking(chunks, pdfPath);
    }

    // HÍBRIDO: Si es pequeño, intentar REGEX primero para procedimientos
    console.log(`\n🔬 Intentando extracción REGEX de procedimientos...`);
    const procedimientosRegex = this.extraerTablaProcedimientos(textoPDF);

    // Si es pequeño, procesarlo directamente
    const textoParaIA = textoPDF;

    // Debug: Mostrar fragmento del texto para verificar extracción
    if (textoPDF.includes('Valor Unitario') || textoPDF.includes('Vlr. Unitario')) {
      const lineas = textoPDF.split('\n');
      const lineaValor = lineas.find(l => l.includes('Valor Unitario') || l.includes('Vlr. Unitario'));
      if (lineaValor) {
        console.log(`🔍 DEBUG - Línea con Valor Unitario encontrada: "${lineaValor}"`);
      }
    }

    // 2. Llamar a GPT-4 para extraer datos estructurados
    const prompt = `Eres un experto en extracción de datos de facturas médicas colombianas.

Analiza el siguiente texto de una factura médica y extrae EXACTAMENTE los siguientes campos:

**FORMATO DE NÚMEROS COLOMBIANO - MUY IMPORTANTE:**
- En Colombia, el PUNTO (.) se usa como separador de miles
- La COMA (,) se usa como separador decimal
- Ejemplo: "38.586,00" = treinta y ocho mil quinientos ochenta y seis pesos
- Ejemplo: "1.234.567,89" = un millón doscientos treinta y cuatro mil quinientos sesenta y siete pesos con 89 centavos
- Al extraer valores monetarios, convierte el número eliminando puntos de miles y convirtiendo coma a punto decimal
- Ejemplo: Si ves "38.586,00" en el PDF, devuelve el número como 38586.00
- Ejemplo: Si ves "1.234.567,89" en el PDF, devuelve el número como 1234567.89
- NUNCA confundas el punto de miles con punto decimal
- Lee CUIDADOSAMENTE cada dígito del número

**DATOS DE LA FACTURA:**
- nroFactura: Número de factura
- fechaFactura: Fecha de emisión (formato DD/MM/YYYY)
- fechaRadicacion: Fecha de radicación
- valorBrutoFactura: Valor bruto total
- valorNetoFactura: Valor neto
- valorIVA: Valor del IVA

**DATOS DEL PACIENTE:**
- nombrePaciente: Nombre completo del paciente
- tipoDocumentoPaciente: Tipo de documento (CC, RC, TI, CE)
- numeroDocumento: Número de documento de identidad
- edad: Edad del paciente (número)
- sexo: Sexo (M/F)

**DATOS DE PROCEDIMIENTOS:**
- procedimientos: Array con TODOS los procedimientos encontrados en la factura
  - Cada procedimiento debe tener:
    - codigoProcedimiento: Código CUPS (6 dígitos que empiezan con 8 o 9, o códigos de 5-6 dígitos)
    - nombreProcedimiento: Descripción del procedimiento
    - cant: Cantidad
    - valorUnitario: Valor unitario del procedimiento
- Si hay MÚLTIPLES procedimientos, devuelve TODOS en el array
- NO omitas ningún procedimiento que encuentres

**DATOS CLÍNICOS:**
- diagnosticoPrincipal: Código CIE-10 del diagnóstico principal (formato: letra + 2-3 números)
- diagnosticoRelacionado1: Diagnóstico relacionado si existe
- diagnosticoRelacionado2: Segundo diagnóstico relacionado si existe

**DATOS FINANCIEROS:**
- valorIPS: Valor facturado por la IPS. Busca "Valor Unitario", "Vlr. Unitario", "Valor Base" o similar. COPIA EXACTAMENTE los dígitos que ves, sin cambiarlos.
- copago: Valor de copago
- cmo: Cuota moderadora

**DATOS DE AUTORIZACIÓN:**
- nroAutNvo: Número de autorización Nueva EPS
- autorizacion: Número de autorización general

**IMPORTANTE:**
- Los códigos CUPS DEBEN empezar con 8 o 9 (procedimientos médicos)
- Los códigos CIE-10 son letra seguida de números (ej: Q659, J18, I10)
- NO confundir códigos de vehículos (V03) con diagnósticos médicos
- Si un campo no se encuentra, devuelve cadena vacía "" o 0 para números
- EXTRAE los valores EXACTOS del texto - NO CAMBIES NINGÚN DÍGITO
- RECUERDA: Formato colombiano usa punto (.) para miles y coma (,) para decimales
- COPIA los números dígito por dígito - NO los interpretes ni cambies
- Si ves "38.586", NO lo cambies a "33.886" ni a ningún otro número
- Lee cada dígito individualmente: 3-8-5-8-6, no 3-3-8-8-6
- VERIFICA cada número TRES veces antes de extraerlo, comparando dígito por dígito con el texto original

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
  "procedimientos": [
    {
      "codigoProcedimiento": "valor",
      "nombreProcedimiento": "valor",
      "cant": numero,
      "valorUnitario": numero
    }
  ],
  "codigoProcedimiento": "primer_procedimiento",
  "nombreProcedimiento": "descripcion_primer_procedimiento",
  "cant": cantidad_primer_procedimiento,
  "diagnosticoPrincipal": "valor",
  "diagnosticoRelacionado1": "valor",
  "diagnosticoRelacionado2": "valor",
  "valorIPS": suma_total_de_todos_los_procedimientos,
  "valorBrutoFactura": numero,
  "valorNetoFactura": numero,
  "valorIVA": numero,
  "copago": numero,
  "cmo": numero,
  "nroAutNvo": "valor",
  "autorizacion": "valor",
  "confianzaExtraccion": numero_0_a_100
}

TEXTO DE LA FACTURA:
${textoParaIA}`;

    // Llamar a OpenAI con retry logic para rate limits
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await this.openai.chat.completions.create({
          model: 'gpt-4o', // GPT-4o: más rápido, más tokens, mejores límites
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0, // Temperatura baja para precisión máxima
        });
        break; // Si tuvo éxito, salir del loop
      } catch (error: any) {
        if (error?.status === 429 && retries < maxRetries) {
          // Rate limit - esperar y reintentar
          const waitTime = Math.pow(2, retries) * 2000; // 2s, 4s, 8s
          console.log(`⏳ Rate limit alcanzado, esperando ${waitTime/1000}s antes de reintentar (intento ${retries + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error; // Si no es rate limit o ya se acabaron los reintentos, lanzar el error
        }
      }
    }

    // 3. Parsear respuesta JSON
    const contenido = response.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('IA no devolvió JSON válido');
    }

    const datosExtraidos = JSON.parse(jsonMatch[0]);
    let confianzaExtraccion = datosExtraidos.confianzaExtraccion || 50;

    // 3.5. HÍBRIDO: Si REGEX encontró procedimientos, usarlos en lugar de los de IA
    let procedimientosFinales: any[];
    if (procedimientosRegex.length > 0) {
      console.log(`   ✅ Usando ${procedimientosRegex.length} procedimientos REGEX (más confiables que IA)`);
      procedimientosFinales = procedimientosRegex;
      confianzaExtraccion = 95; // Mayor confianza con REGEX

      // Calcular valor total con procedimientos REGEX
      const valorTotalRegex = procedimientosFinales.reduce((sum, proc) => {
        return sum + (proc.valorUnitario * proc.cant || 0);
      }, 0);

      datosExtraidos.valorIPS = valorTotalRegex;
      datosExtraidos.procedimientos = procedimientosFinales;
      console.log(`   💰 Valor total recalculado con REGEX: ${valorTotalRegex.toLocaleString('es-CO')}`);
    } else {
      console.log(`   ⚠️  REGEX no encontró procedimientos, usando IA como fallback`);
      procedimientosFinales = datosExtraidos.procedimientos || [];
    }

    // 4. Crear objeto completo con valores por defecto
    const datoCompletos: any = {
      // Valores extraídos por IA
      ...datosExtraidos,

      // Usar procedimientos finales (REGEX o IA)
      procedimientos: procedimientosFinales,

      // Campos adicionales con valores por defecto
      nroRadicacion: datosExtraidos.nroFactura || '',
      prefijoFactura: '',
      consecutivoFactura: '',
      tipoDocumentoIPS: '',
      regional: '',
      estadoFactura: '',
      observacion: '',

      // Procedimiento
      mapiss: '',
      cantParagr: datosExtraidos.cant || 0,
      matricUno: '',
      matrizLiquidacion: '',
      valorAPagar: datosExtraidos.valorIPS || 0,
      valorNotaCredito: 0,
      gestionGlosas: '',
      valorGlosaAdmitiva: 0,
      valorGlosaAuditoria: 0,
      estado: '',
      categoria: '',
      tipoLiquidacion: '',
      valor: datosExtraidos.valorIPS || 0,
      subServicioContratado: '',
      uvr: 0,
      regimen: '',
      convenioPaC: '',
      tipoDocumentoIPS2: '',

      // Glosas
      codigoDevolucion: '',
      cantGlosada: 0,
      vlrUnitGlosado: 0,
      valorDevolucion: 0,
      observacionesGlosa: '',
      origen: '',
      usuario: '',
      codigoDevolucionItem: '',
      totalGlosas: 0,
      diferencia: 0,

      // Autorización
      pai: '',
      formaDePago: '',
      observacionAut: '',

      // Paciente
      regimenPaciente: '',
      categoriaPaciente: '',
      tipoAfiliado: '',
      direccion: '',
      telefono: '',
      departamento: '',
      municipio: '',

      // Diagnósticos
      diagnosticoEgreso: '',

      // Fechas
      fechaIngreso: datosExtraidos.fechaFactura || '',
      horaIngreso: '',
      fechaEgreso: '',
      horaEgreso: '',
      servicioEgreso: '',
      cama: '',

      // Valores finales
      vlrBrutoFact: datosExtraidos.valorBrutoFactura || 0,
      vlrNetoFact: datosExtraidos.valorNetoFactura || 0,
      netoDigitado: 0,
      dif: 0,
      docValorIPS: datosExtraidos.valorIPS || 0,
      dacto: 0,
      totales: datosExtraidos.valorNetoFactura || 0,
      nroAtenciones: 1,
    };

    // 5. Contar campos extraídos
    const camposEsperados = [
      'nroFactura', 'nombrePaciente', 'numeroDocumento', 'codigoProcedimiento',
      'diagnosticoPrincipal', 'valorIPS', 'cant'
    ];

    const camposExtraidos = camposEsperados.filter(campo => {
      const valor = datoCompletos[campo];
      return valor && valor !== '' && valor !== 0;
    }).length;

    const camposVacios = camposEsperados.length - camposExtraidos;

    return {
      ...datoCompletos,
      metadatos: {
        metodo: 'IA',
        confianza: confianzaExtraccion,
        tiempoExtraccion: 0,
        camposExtraidos,
        camposVacios,
      },
    };
  }

  /**
   * Generar reporte de comparación (mantenido para compatibilidad)
   */
  generarReporteComparacion(resultado: ResultadoExtraccionDual): string {
    const lineas: string[] = [];

    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('     REPORTE DE EXTRACCIÓN CON IA');
    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('');

    lineas.push('📊 ESTADÍSTICAS DE EXTRACCIÓN:');
    lineas.push(`   - Confianza: ${resultado.decision.nivelConfianza}%`);
    lineas.push(`   - Método: ${resultado.decision.metodoPreferido}`);
    lineas.push('');

    lineas.push('🎯 DECISIÓN FINAL:');
    lineas.push(`   - Revisión humana: ${resultado.decision.requiereRevisionHumana ? 'SÍ ⚠️' : 'NO ✅'}`);
    lineas.push(`   - Razonamiento: ${resultado.decision.razonamiento}`);
    lineas.push('');
    lineas.push('═══════════════════════════════════════════════════════');

    return lineas.join('\n');
  }
}

export default new ExtraccionDualService();
