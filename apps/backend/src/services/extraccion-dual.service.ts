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
   * Deduplica procedimientos basándose en código y valor
   */
  private deduplicarProcedimientos(procedimientos: any[]): any[] {
    const vistos = new Map<string, any>();

    for (const proc of procedimientos) {
      // Crear clave única basada en código + valor + cantidad
      const clave = `${proc.codigoProcedimiento}_${proc.valorUnitario}_${proc.cant}`;

      if (!vistos.has(clave)) {
        vistos.set(clave, proc);
      }
    }

    return Array.from(vistos.values());
  }

  /**
   * Procesa PDF grande usando chunking y consolida resultados
   */
  private async procesarConChunking(chunks: string[], pdfPath: string): Promise<ExtraccionConConfianza> {
    const todosLosProcedimientos: any[] = [];
    const todosDiagnosticos: Set<string> = new Set();
    let datosBase: any = null;
    let confianzaTotal = 0;

    for (let i = 0; i < chunks.length; i++) {
      console.log(`   📄 Procesando chunk ${i + 1}/${chunks.length} (${chunks[i].length} caracteres)...`);

      try {
        const resultado = await this.extraerDeChunk(chunks[i], i + 1);

        // Guardar datos base del primer chunk (factura, paciente, etc.)
        if (i === 0) {
          datosBase = resultado;
        }

        // Consolidar procedimientos de todos los chunks
        if (resultado.procedimientos && Array.isArray(resultado.procedimientos)) {
          todosLosProcedimientos.push(...resultado.procedimientos);
        }

        // Consolidar diagnósticos
        if (resultado.diagnosticoPrincipal) todosDiagnosticos.add(resultado.diagnosticoPrincipal);
        if (resultado.diagnosticoRelacionado1) todosDiagnosticos.add(resultado.diagnosticoRelacionado1);
        if (resultado.diagnosticoRelacionado2) todosDiagnosticos.add(resultado.diagnosticoRelacionado2);

        confianzaTotal += resultado.confianzaExtraccion || 0;
      } catch (error: any) {
        console.log(`   ⚠️  Error procesando chunk ${i + 1}: ${error.message}`);
      }
    }

    // Deduplicar procedimientos (pueden repetirse por el overlap)
    const procedimientosUnicos = this.deduplicarProcedimientos(todosLosProcedimientos);
    console.log(`   🔄 Deduplicación: ${todosLosProcedimientos.length} → ${procedimientosUnicos.length} procedimientos únicos`);

    // Calcular valor total sumando todos los procedimientos únicos
    const valorTotal = procedimientosUnicos.reduce((sum, proc) => {
      return sum + (proc.valorUnitario * proc.cant || 0);
    }, 0);

    const diagnosticosArray = Array.from(todosDiagnosticos);
    const confianzaPromedio = Math.round(confianzaTotal / chunks.length);

    console.log(`   ✅ Consolidación completada: ${procedimientosUnicos.length} procedimientos, ${diagnosticosArray.length} diagnósticos`);

    // Consolidar datos
    const datosConsolidados = {
      ...datosBase,
      procedimientos: procedimientosUnicos,
      diagnosticoPrincipal: diagnosticosArray[0] || '',
      diagnosticoRelacionado1: diagnosticosArray[1] || '',
      diagnosticoRelacionado2: diagnosticosArray[2] || '',
      valorIPS: valorTotal,
      confianzaExtraccion: confianzaPromedio,
      // Usar primer procedimiento para compatibilidad
      codigoProcedimiento: procedimientosUnicos[0]?.codigoProcedimiento || '',
      nombreProcedimiento: procedimientosUnicos[0]?.nombreProcedimiento || '',
      cant: procedimientosUnicos[0]?.cant || 0,
    };

    const camposExtraidos = 6 + procedimientosUnicos.length;

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

**IMPORTANTE:**
- Este es el chunk ${numeroChunk} de un documento más grande
- Extrae TODOS los procedimientos que veas en este fragmento
- Formato colombiano: punto (.) = miles, coma (,) = decimales
- Devuelve números sin separadores: "38.586,00" → 38586

TEXTO DEL FRAGMENTO:
${textoChunk}

Responde ÚNICAMENTE con un objeto JSON:
{
  "nroFactura": "valor",
  "nombrePaciente": "valor",
  "numeroDocumento": "valor",
  "procedimientos": [
    {
      "codigoProcedimiento": "valor",
      "nombreProcedimiento": "valor",
      "cant": numero,
      "valorUnitario": numero
    }
  ],
  "diagnosticoPrincipal": "valor",
  "diagnosticoRelacionado1": "valor",
  "diagnosticoRelacionado2": "valor",
  "confianzaExtraccion": numero_0_a_100
}`;

    // Llamar a OpenAI con retry logic
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        response = await this.openai!.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
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
      throw new Error('OpenAI no está configurado');
    }

    // 1. Extraer texto del PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const textoPDF = pdfData.text;

    console.log(`📄 Texto extraído del PDF (${textoPDF.length} caracteres)`);

    // Si el PDF es muy grande, dividirlo en chunks
    const chunks = this.dividirEnChunks(textoPDF, 80000);

    if (chunks.length > 1) {
      console.log(`📦 PDF dividido en ${chunks.length} chunks para procesamiento`);
      return await this.procesarConChunking(chunks, pdfPath);
    }

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
    const confianzaExtraccion = datosExtraidos.confianzaExtraccion || 50;

    // 4. Crear objeto completo con valores por defecto
    const datoCompletos: any = {
      // Valores extraídos por IA
      ...datosExtraidos,

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
