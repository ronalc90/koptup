// RAG Service for medical validations using Ley100 documents
import { lazyOpenAI } from './openai.service';
import { DocumentoLey100 } from '../models/DocumentoLey100';
import { extractTextFromPDF } from './pdf.service';
import { logger } from '../utils/logger';

// Perezoso: no falla al importar si falta OPENAI_API_KEY.
const openai = lazyOpenAI();

interface RAGContext {
  documentText: string;
  documentName: string;
  fullText: string; // Store FULL text for direct search
  relevanceScore?: number;
}

/**
 * Get all enabled Ley100 documents and extract their text
 * IMPORTANT: Uses ALL documents comprehensively
 */
async function getLey100Context(): Promise<RAGContext[]> {
  try {
    // Only get enabled documents for RAG
    const documents = await DocumentoLey100.find({ enabled: true });
    const contexts: RAGContext[] = [];

    logger.info(`Loading ${documents.length} enabled Ley100 document(s) for comprehensive RAG analysis`);

    for (const doc of documents) {
      try {
        const extracted = await extractTextFromPDF(doc.path);
        if (extracted.text && extracted.text.length > 100) {
          // Store BOTH: truncated text for GPT context and FULL text for direct search
          contexts.push({
            documentText: extracted.text.slice(0, 50000), // For GPT context
            documentName: doc.originalName,
            fullText: extracted.text, // FULL text for direct string search
          });
          logger.info(`Loaded ${doc.originalName} (${extracted.text.length} chars total, using first 50k for GPT)`);
        }
      } catch (error) {
        logger.warn(`Failed to extract text from ${doc.originalName}`);
      }
    }

    if (contexts.length === 0) {
      logger.warn('No Ley100 documents available for RAG!');
    }

    return contexts;
  } catch (error: any) {
    logger.error('Error getting Ley100 context:', error);
    return [];
  }
}

/**
 * Direct search for CUPS code in all documents (string search, not AI)
 * Returns all matches found with surrounding context
 */
async function directSearchCUPS(codigoCUPS: string): Promise<{
  found: boolean;
  matches: Array<{
    documentName: string;
    context: string;
    fullMatch: string;
  }>;
}> {
  const contexts = await getLey100Context();
  const matches: Array<{ documentName: string; context: string; fullMatch: string }> = [];

  // Normalize the code (remove leading zeros)
  const codigoNormalizado = codigoCUPS.replace(/^0+/, '');

  // Create regex patterns to search for the code
  // Match both "890281" and "0000890281" formats, followed by description
  const patterns = [
    new RegExp(`\\b${codigoCUPS}\\b[\\s\\S]{0,200}`, 'gi'), // Original with context
    new RegExp(`\\b${codigoNormalizado}\\b[\\s\\S]{0,200}`, 'gi'), // Normalized with context
  ];

  logger.info(`Direct search for CUPS: "${codigoCUPS}" (normalized: "${codigoNormalizado}")`);

  for (const ctx of contexts) {
    let foundInDoc = false;

    for (const pattern of patterns) {
      const regexMatches = ctx.fullText.match(pattern);

      if (regexMatches && regexMatches.length > 0) {
        foundInDoc = true;

        for (const match of regexMatches) {
          // Get more context around the match
          const index = ctx.fullText.indexOf(match);
          const start = Math.max(0, index - 100);
          const end = Math.min(ctx.fullText.length, index + 400);
          const extendedContext = ctx.fullText.slice(start, end);

          matches.push({
            documentName: ctx.documentName,
            context: extendedContext,
            fullMatch: match,
          });

          logger.info(`✓ Found CUPS code in ${ctx.documentName}: "${match.slice(0, 100)}..."`);
        }
      }
    }

    if (!foundInDoc) {
      logger.info(`✗ Code not found in ${ctx.documentName}`);
    }
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Query RAG system with a question and get contextualized answer
 */
export async function queryRAG(
  question: string,
  maxContextLength = 60000
): Promise<string> {
  try {
    // Get all Ley100 documents
    const contexts = await getLey100Context();

    if (contexts.length === 0) {
      return 'No hay documentos Ley100 disponibles para consultar. Suba documentos normativos primero.';
    }

    // Combine ALL contexts - use ALL documents comprehensively
    let combinedContext = contexts
      .map((ctx, idx) => `[Documento ${idx + 1}: ${ctx.documentName}]\n${ctx.documentText}`)
      .join('\n\n---DOCUMENTO SEPARADO---\n\n');

    // Truncate if too long but keep as much as possible
    if (combinedContext.length > maxContextLength) {
      logger.warn(`Context truncated from ${combinedContext.length} to ${maxContextLength} chars`);
      combinedContext = combinedContext.slice(0, maxContextLength) + '\n\n[...más documentos disponibles...]';
    }

    logger.info(`Querying RAG with ${contexts.length} documents, total context: ${combinedContext.length} chars`);
    logger.info(`Documents loaded: ${contexts.map(c => c.documentName).join(', ')}`);

    // Query OpenAI with context
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un experto en normativa de salud colombiana, específicamente Ley 100, CUPS, CIE-10, y facturación médica.

INSTRUCCIÓN ABSOLUTAMENTE CRÍTICA: Debes revisar y analizar CADA UNO de los ${contexts.length} documentos proporcionados de manera exhaustiva y completa. NO te detengas después de revisar el primer documento. Debes leer COMPLETAMENTE todos los documentos antes de responder.

METODOLOGÍA OBLIGATORIA:
1. Lee el Documento 1 COMPLETO
2. Lee el Documento 2 COMPLETO (si existe)
3. Lee el Documento 3 COMPLETO (si existe)
4. Continúa hasta revisar TODOS los documentos proporcionados
5. Solo después de revisar TODOS, formula tu respuesta

Usa los documentos normativos para responder preguntas sobre:
- Códigos CUPS (Clasificación Única de Procedimientos en Salud) - DEBES buscar en TODOS los ${contexts.length} documentos
- Códigos CIE-10 (Clasificación Internacional de Enfermedades) - DEBES revisar CADA uno de los ${contexts.length} documentos
- Tarifas y valores según manual ISS
- Requisitos de autorización
- Normativa de glosas médicas
- Coherencia clínica entre diagnósticos y procedimientos

REGLAS ABSOLUTAMENTE OBLIGATORIAS:
1. Revisa TODOS los ${contexts.length} documentos proporcionados, no solo el primero
2. Menciona EXPLÍCITAMENTE cuántos documentos revisaste en tu respuesta
3. Si encuentras el código/información en algún documento, especifica EXACTAMENTE en cuál documento lo encontraste
4. Si la información está en los documentos, cítala textualmente con el nombre exacto del documento
5. Si NO está en NINGUNO de los ${contexts.length} documentos después de revisar TODOS, indícalo claramente diciendo "Revisé los ${contexts.length} documentos y no encontré..."
6. Ser extremadamente preciso y específico
7. Usar terminología médica colombiana
8. Proporciona respuestas COMPLETAS sin truncar
9. Si un código existe, di que existe, describe su uso completo, y menciona en qué documento(s) lo encontraste
10. NUNCA digas "el documento que se ha revisado hasta ahora" - debes revisar TODOS antes de responder`,
        },
        {
          role: 'user',
          content: `Tienes ${contexts.length} documentos de referencia. DEBES revisarlos TODOS COMPLETAMENTE antes de responder.

${combinedContext}

---

Pregunta: ${question}

RECORDATORIO: Antes de responder, asegúrate de haber revisado COMPLETAMENTE los ${contexts.length} documentos. Menciona en tu respuesta cuántos documentos revisaste.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || 'No se pudo obtener respuesta';
  } catch (error: any) {
    logger.error('Error in RAG query:', error);
    return `Error en consulta RAG: ${error.message}`;
  }
}

/**
 * Validate CUPS code
 */
export async function validateCUPSCode(codigoCUPS: string): Promise<{
  valido: boolean;
  observacion: string;
}> {
  try {
    // First, do a DIRECT text search in all documents
    const directSearch = await directSearchCUPS(codigoCUPS);

    if (!directSearch.found) {
      // Code not found in local documents - Query OpenAI directly for general knowledge
      logger.info(`Code ${codigoCUPS} not found in documents. Querying OpenAI for general CUPS information...`);

      const codigoNormalizado = codigoCUPS.replace(/^0+/, '');

      const aiResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en códigos CUPS (Clasificación Única de Procedimientos en Salud) de Colombia. Proporciona información precisa y específica sobre códigos CUPS.`,
          },
          {
            role: 'user',
            content: `¿Qué es el código CUPS "${codigoCUPS}" (también conocido como "${codigoNormalizado}")?

Por favor proporciona:
1. Nombre exacto del procedimiento
2. Descripción del procedimiento
3. Valor aproximado o rango de valores en pesos colombianos según tarifario ISS 2001 o SOAT
4. Si es un código válido o no existe

Sé específico y preciso. Si el código no existe, indícalo claramente.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const respuestaAI = aiResponse.choices[0]?.message?.content || 'No se pudo obtener información';

      // Check if AI says code doesn't exist
      const noExiste = /no existe|inv[aá]lido|no.*v[aá]lido|no.*encontr[aé]|desconocido/i.test(respuestaAI);

      return {
        valido: !noExiste,
        observacion: `⚠️ CÓDIGO NO ENCONTRADO EN DOCUMENTOS LOCALES. Información general de IA:\n\n${respuestaAI}\n\n💡 Nota: Esta información proviene de conocimiento general de IA, no de sus documentos Ley100. Para validación oficial, suba el documento CUPS correspondiente.`,
      };
    }

    // Code FOUND! Now use GPT to interpret and enrich the information
    logger.info(`Code ${codigoCUPS} found in ${directSearch.matches.length} location(s). Using GPT to interpret...`);

    // Build enriched context from direct search results
    let contextFromMatches = directSearch.matches
      .map((m, idx) => `[Encontrado en: ${m.documentName}]\n${m.context}`)
      .join('\n\n---\n\n');

    const question = `He encontrado el código CUPS "${codigoCUPS}" en los siguientes documentos:

${contextFromMatches}

Por favor, analiza esta información y responde:
1. ¿Qué procedimiento representa este código CUPS?
2. Proporciona la descripción EXACTA tal como aparece en el documento
3. ¿En qué documento(s) se encontró?
4. Si hay información sobre tarifas o valores, inclúyela

Sé preciso y usa la información textual proporcionada arriba.`;

    const respuesta = await queryRAG(question);

    return {
      valido: true,
      observacion: `✓ CÓDIGO ENCONTRADO EN DOCUMENTOS LOCALES. ${respuesta}`,
    };
  } catch (error: any) {
    return {
      valido: false,
      observacion: `Error al validar CUPS: ${error.message}`,
    };
  }
}

/**
 * Validate CIE-10 diagnosis code
 */
export async function validateCIE10Code(codigoCIE10: string): Promise<{
  valido: boolean;
  observacion: string;
}> {
  try {
    const question = `¿El código CIE-10 "${codigoCIE10}" es válido? ¿Qué diagnóstico representa? Verifica si existe en la clasificación oficial.`;
    const respuesta = await queryRAG(question);

    const esInvalido = /no existe|inv[aá]lido|no encontrado|no est[aá] en|desconocido/i.test(respuesta);

    return {
      valido: !esInvalido,
      observacion: respuesta,
    };
  } catch (error: any) {
    return {
      valido: false,
      observacion: `Error al validar CIE-10: ${error.message}`,
    };
  }
}

/**
 * Validate tariff according to ISS manual
 */
export async function validateTariff(
  codigoCUPS: string,
  valorCobrado: number,
  convenio?: string
): Promise<{
  valido: boolean;
  valorEsperado: number | null;
  diferencia: number | null;
  observacion: string;
}> {
  try {
    // First, do a DIRECT text search for the CUPS code
    const directSearch = await directSearchCUPS(codigoCUPS);

    if (!directSearch.found) {
      // Code not found in local documents - Query OpenAI directly for tariff information
      logger.info(`Code ${codigoCUPS} not found in documents. Querying OpenAI for general tariff information...`);

      const codigoNormalizado = codigoCUPS.replace(/^0+/, '');

      const aiResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en tarifas médicas colombianas, específicamente tarifario ISS 2001 y SOAT. Proporciona valores específicos en pesos colombianos.`,
          },
          {
            role: 'user',
            content: `¿Qué es el código CUPS "${codigoCUPS}" (también "${codigoNormalizado}") y cuál es su valor?

Valor cobrado: $${valorCobrado.toLocaleString()} pesos
${convenio ? `Convenio: ${convenio}` : 'Sin convenio especificado'}

Por favor proporciona:
1. Nombre del procedimiento
2. Valor según tarifario ISS 2001 en pesos colombianos (valor exacto o rango)
3. ¿El valor cobrado ($${valorCobrado.toLocaleString()}) es correcto o hay diferencia?
4. Si hay diferencia, ¿cuánto debería cobrarse y cuánto se debe devolver o cobrar adicional?

FORMATO:
- Procedimiento: [nombre]
- Valor según tarifario: $XXXXX pesos
- Valor cobrado: $${valorCobrado.toLocaleString()} pesos
- Diferencia: $XXXXX pesos (a devolver/cobrar)

Sé específico con los valores numéricos.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const respuestaAI = aiResponse.choices[0]?.message?.content || 'No se pudo obtener información';

      // Try to extract tariff value from AI response
      const valorMatches = respuestaAI.match(/(?:valor|tarifa|precio|ISS).*?\$?\s*(\d{1,3}(?:[.,]\d{3})*)/gi);
      let valorEsperado: number | null = null;

      if (valorMatches && valorMatches.length > 0) {
        for (const match of valorMatches) {
          const numberMatch = match.match(/(\d{1,3}(?:[.,]\d{3})*)/);
          if (numberMatch) {
            const cleanNumber = numberMatch[1].replace(/\./g, '').replace(/,/g, '');
            const testValue = parseInt(cleanNumber, 10);
            if (testValue >= 1000 && testValue !== valorCobrado && testValue < 10000000) {
              valorEsperado = testValue;
              break;
            }
          }
        }
      }

      const diferencia = valorEsperado ? valorCobrado - valorEsperado : null;
      const valido = diferencia !== null ? Math.abs(diferencia) < (valorEsperado * 0.05) : true;

      return {
        valido,
        valorEsperado,
        diferencia,
        observacion: `⚠️ CÓDIGO NO ENCONTRADO EN DOCUMENTOS LOCALES. Información general de IA:\n\n${respuestaAI}\n\n💡 Nota: Esta información proviene de conocimiento general de IA, no de sus documentos Ley100. Para validación oficial, suba el tarifario correspondiente.`,
      };
    }

    // Code FOUND! Now search for tariff information
    logger.info(`Code ${codigoCUPS} found. Searching for tariff information...`);

    // Build context from direct search results
    let contextFromMatches = directSearch.matches
      .map((m) => `[Documento: ${m.documentName}]\n${m.context}`)
      .join('\n\n---\n\n');

    const question = `He encontrado el código CUPS "${codigoCUPS}" en los documentos:

${contextFromMatches}

VALIDACIÓN DE TARIFA:
${convenio ? `Convenio: ${convenio}` : 'Sin convenio especificado'}
Valor cobrado: $${valorCobrado.toLocaleString()} pesos

Por favor analiza y responde:
1. ¿Cuál es el VALOR EXACTO en pesos según el tarifario ISS o manual vigente mostrado arriba?
2. ¿El valor cobrado ($${valorCobrado.toLocaleString()}) es correcto?
3. Si hay diferencia, ¿cuánto es exactamente?

FORMATO DE RESPUESTA:
- Procedimiento: [nombre del procedimiento]
- Valor según tarifario: $XXXXX pesos
- Valor cobrado: $${valorCobrado.toLocaleString()} pesos
- Diferencia: $XXXXX pesos (a devolver/cobrar)
- Conclusión: correcto/incorrecto

Usa SOLO la información textual proporcionada arriba. Sé preciso con los valores numéricos.`;

    const respuesta = await queryRAG(question);

    // Try to extract expected value from response - improved regex
    const valorMatches = respuesta.match(/(?:valor|tarifa|precio).*?\$?\s*(\d{1,3}(?:[.,]\d{3})*)/gi);
    let valorEsperado: number | null = null;

    if (valorMatches && valorMatches.length > 0) {
      // Try to find the tariff value (usually the first number mentioned after "valor" or "tarifa")
      const numberMatch = valorMatches[0].match(/(\d{1,3}(?:[.,]\d{3})*)/);
      if (numberMatch) {
        const cleanNumber = numberMatch[1].replace(/\./g, '').replace(/,/g, '');
        valorEsperado = parseInt(cleanNumber, 10);

        // Sanity check - if the extracted value is too small (less than 100), it's probably wrong
        if (valorEsperado < 100) {
          // Try to find another number in the response
          const allNumbers = respuesta.match(/\d{1,3}(?:[.,]\d{3})+/g);
          if (allNumbers && allNumbers.length > 0) {
            for (const num of allNumbers) {
              const testValue = parseInt(num.replace(/\./g, '').replace(/,/g, ''), 10);
              if (testValue >= 1000 && testValue !== valorCobrado) {
                valorEsperado = testValue;
                break;
              }
            }
          }
        }
      }
    }

    const diferencia = valorEsperado ? valorCobrado - valorEsperado : null;
    const valido = diferencia !== null ? Math.abs(diferencia) < (valorEsperado * 0.05) : true; // 5% tolerance

    logger.info(`Tariff validation for CUPS ${codigoCUPS}: Cobrado=$${valorCobrado}, Esperado=$${valorEsperado}, Diferencia=$${diferencia}`);

    return {
      valido,
      valorEsperado,
      diferencia,
      observacion: respuesta,
    };
  } catch (error: any) {
    return {
      valido: false,
      valorEsperado: null,
      diferencia: null,
      observacion: `Error al validar tarifa: ${error.message}`,
    };
  }
}

/**
 * Check clinical coherence between diagnosis and procedure
 */
export async function checkClinicalCoherence(
  codigoCIE10: string,
  descripcionDiagnostico: string,
  codigoCUPS: string,
  descripcionProcedimiento: string
): Promise<{
  coherente: boolean;
  observacion: string;
}> {
  try {
    // Try direct search for CUPS code first
    const directSearch = await directSearchCUPS(codigoCUPS);

    let contextInfo = '';
    if (directSearch.found) {
      // Found the CUPS code, include context
      contextInfo = `\n\nInformación del código CUPS encontrada en documentos:\n${directSearch.matches.map(m => `[${m.documentName}] ${m.context.slice(0, 200)}`).join('\n\n')}`;
    }

    const question = `Analiza la coherencia clínica:

Diagnóstico: "${codigoCIE10}: ${descripcionDiagnostico}"
Procedimiento: "${codigoCUPS}: ${descripcionProcedimiento}"
${contextInfo}

¿Es clínicamente coherente este diagnóstico con este procedimiento? ¿Hay alguna inconsistencia o problema de coherencia clínica?`;

    const respuesta = await queryRAG(question);

    const esIncoherente = /no.*coherente|inconsistente|no.*apropiado|no.*indicado|problema|alerta/i.test(respuesta);

    return {
      coherente: !esIncoherente,
      observacion: respuesta,
    };
  } catch (error: any) {
    return {
      coherente: true,
      observacion: `Error al verificar coherencia: ${error.message}`,
    };
  }
}

/**
 * Check if procedure requires prior authorization
 */
export async function checkAuthorizationRequirement(
  codigoCUPS: string,
  descripcionProcedimiento: string
): Promise<{
  requiereAutorizacion: boolean;
  observacion: string;
}> {
  try {
    // Try direct search for CUPS code first
    const directSearch = await directSearchCUPS(codigoCUPS);

    let contextInfo = '';
    if (directSearch.found) {
      // Found the CUPS code, include context
      contextInfo = `\n\nInformación del código CUPS encontrada en documentos:\n${directSearch.matches.map(m => `[${m.documentName}] ${m.context.slice(0, 200)}`).join('\n\n')}`;
    }

    const question = `Analiza requisitos de autorización:

Código CUPS: "${codigoCUPS}"
Procedimiento: ${descripcionProcedimiento}
${contextInfo}

¿Este procedimiento requiere autorización previa según la normativa vigente? ¿Qué documentación o autorizaciones son necesarias?`;

    const respuesta = await queryRAG(question);

    const requiere = /requiere.*autorizaci[oó]n|necesita.*autorizaci[oó]n|debe.*autorizar|autorizaci[oó]n.*previa/i.test(respuesta);

    return {
      requiereAutorizacion: requiere,
      observacion: respuesta,
    };
  } catch (error: any) {
    return {
      requiereAutorizacion: false,
      observacion: `Error al verificar autorización: ${error.message}`,
    };
  }
}

/**
 * Detect potential glosas (billing issues)
 */
export async function detectGlosas(params: {
  codigoCUPS?: string;
  codigoCIE10?: string;
  valorCobrado?: number;
  tieneAutorizacion: boolean;
  requiereAutorizacion?: boolean;
  coherenciaClinica?: boolean;
}): Promise<{
  tieneGlosa: boolean;
  tipoGlosa: string | null;
  codigoGlosa: string | null;
  descripcionGlosa: string;
  recomendacion: string;
}> {
  const glosas: string[] = [];
  let codigoGlosa: string | null = null;
  let tipoGlosa: string | null = null;

  // Glosa 101: Falta autorización (Facturación)
  if (params.requiereAutorizacion && !params.tieneAutorizacion) {
    glosas.push('Falta autorización previa requerida');
    codigoGlosa = '101';
    tipoGlosa = 'Facturación';
  }

  // Glosa 201: Código no válido (Administrativa)
  if (params.codigoCUPS && !/^\d+$/.test(params.codigoCUPS)) {
    glosas.push('Código CUPS inválido o mal formado');
    if (!codigoGlosa) {
      codigoGlosa = '201';
      tipoGlosa = 'Administrativa';
    }
  }

  // Glosa 301: Incoherencia clínica (Auditoría Clínica)
  if (params.coherenciaClinica === false) {
    glosas.push('Incoherencia entre diagnóstico y procedimiento');
    if (!codigoGlosa) {
      codigoGlosa = '301';
      tipoGlosa = 'Auditoría Clínica';
    }
  }

  // Glosa 102: Diferencia de tarifa (Facturación - se agregará en la validación)

  const tieneGlosa = glosas.length > 0;

  let recomendacion = '';
  if (tieneGlosa) {
    if (codigoGlosa === '101') {
      recomendacion = 'Solicitar y adjuntar autorización vigente. Verificar que el número de autorización esté completo y sea válido.';
    } else if (codigoGlosa === '102') {
      recomendacion = 'Ajustar el valor facturado según tarifario vigente o presentar justificación del valor cobrado.';
    } else if (codigoGlosa === '201') {
      recomendacion = 'Verificar el código CUPS en el catálogo oficial. Corregir si está mal digitado o usar el código correcto.';
    } else if (codigoGlosa === '202') {
      recomendacion = 'Completar todos los campos de la autorización.';
    } else if (codigoGlosa === '203') {
      recomendacion = 'Completar toda la documentación requerida.';
    } else if (codigoGlosa === '301') {
      recomendacion = 'Revisar la coherencia clínica. Puede requerirse soporte médico adicional o aclaración del médico tratante.';
    } else {
      recomendacion = 'Revisar documentación soporte y normativa aplicable.';
    }
  } else {
    recomendacion = 'No se detectaron glosas. Documentación aparentemente completa.';
  }

  return {
    tieneGlosa,
    tipoGlosa,
    codigoGlosa,
    descripcionGlosa: glosas.join('; ') || 'Sin glosas detectadas',
    recomendacion,
  };
}
