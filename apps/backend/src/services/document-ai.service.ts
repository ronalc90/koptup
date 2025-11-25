import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DocumentAnalysis {
  tags: string[];
  summary: string;
  keywords: string[];
  entities: string[];
}

/**
 * Analiza un documento usando IA para extraer metadatos
 */
export async function analyzeDocument(
  text: string,
  filename: string
): Promise<DocumentAnalysis> {
  try {
    if (!text || text.trim().length < 50) {
      // Documento muy corto, devolver análisis básico
      return {
        tags: ['Documento'],
        summary: `Documento: ${filename}`,
        keywords: [],
        entities: [],
      };
    }

    // Limitar texto a primeros 4000 caracteres para evitar costos excesivos
    const textSample = text.substring(0, 4000);

    const prompt = `Analiza el siguiente documento y proporciona:
1. Tags/categorías (3-5 etiquetas relevantes en español)
2. Resumen breve (1-2 oraciones en español)
3. Palabras clave (5-8 palabras clave en español)
4. Entidades principales (nombres, organizaciones, conceptos clave)

Documento:
${textSample}

Responde en formato JSON:
{
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "resumen breve",
  "keywords": ["palabra1", "palabra2"],
  "entities": ["entidad1", "entidad2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente que analiza documentos y extrae metadatos estructurados. Responde siempre en formato JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as DocumentAnalysis;

    // Validar y limpiar resultados
    return {
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
      summary: analysis.summary || `Documento: ${filename}`,
      keywords: Array.isArray(analysis.keywords)
        ? analysis.keywords.slice(0, 8)
        : [],
      entities: Array.isArray(analysis.entities)
        ? analysis.entities.slice(0, 10)
        : [],
    };
  } catch (error) {
    logger.error('Error analyzing document with AI:', error);

    // Fallback: análisis básico basado en el nombre del archivo
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const basicTags = [];

    if (ext === 'pdf') basicTags.push('PDF');
    if (ext === 'docx' || ext === 'doc') basicTags.push('Word');
    if (ext === 'xlsx' || ext === 'xls') basicTags.push('Excel');

    return {
      tags: basicTags.length > 0 ? basicTags : ['Documento'],
      summary: `Documento: ${filename}`,
      keywords: [],
      entities: [],
    };
  }
}

/**
 * Genera una explicación detallada del documento
 */
export async function explainDocument(text: string, filename: string): Promise<string> {
  try {
    if (!text || text.trim().length < 50) {
      return `El documento "${filename}" es muy corto o no contiene texto extraíble.`;
    }

    // Limitar texto
    const textSample = text.substring(0, 6000);

    const prompt = `Explica el siguiente documento de manera clara y concisa. Incluye:
1. Tipo de documento y propósito
2. Temas principales
3. Puntos clave o conclusiones
4. A quién va dirigido

Documento (${filename}):
${textSample}

Proporciona una explicación en español de 2-3 párrafos.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en analizar y explicar documentos de manera clara y concisa.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || 'No se pudo generar una explicación.';
  } catch (error) {
    logger.error('Error explaining document:', error);
    return `No se pudo generar una explicación para "${filename}". El documento puede requerir procesamiento adicional.`;
  }
}

/**
 * Genera embedding para búsqueda semántica
 */
export async function generateDocumentEmbedding(text: string, isQuery: boolean = false): Promise<number[]> {
  try {
    // Para consultas de búsqueda, permitir textos más cortos (mínimo 3 caracteres)
    // Para documentos completos, requerir al menos 20 caracteres
    const minLength = isQuery ? 3 : 20;

    if (!text || text.trim().length < minLength) {
      logger.warn(`Text too short for embedding generation (min: ${minLength} chars)`);
      return [];
    }

    // Limitar a 8000 caracteres (aproximadamente 2000 tokens)
    const textSample = text.substring(0, 8000);

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: textSample,
    });

    const embedding = response.data[0]?.embedding || [];
    logger.info(`Generated embedding with ${embedding.length} dimensions`);
    return embedding;
  } catch (error: any) {
    logger.error('Error generating document embedding:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });
    return [];
  }
}

/**
 * Calcula similitud de coseno entre dos vectores
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Busca documentos similares por contenido semántico
 */
export function findSimilarDocuments(
  queryEmbedding: number[],
  documentEmbeddings: Array<{ id: string; embedding: number[]; filename: string }>,
  limit: number = 10
): Array<{ id: string; filename: string; similarity: number }> {
  if (!queryEmbedding || queryEmbedding.length === 0) {
    return [];
  }

  const similarities = documentEmbeddings
    .filter(doc => doc.embedding && doc.embedding.length > 0)
    .map(doc => ({
      id: doc.id,
      filename: doc.filename,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter(doc => doc.similarity > 0.5) // Umbral mínimo de similitud
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
}

/**
 * Explica por qué un documento es similar a una consulta de búsqueda
 */
export async function explainSimilarity(
  query: string,
  documentText: string,
  documentName: string,
  similarity: number
): Promise<string> {
  try {
    const prompt = `El usuario buscó: "${query}"

Se encontró el documento "${documentName}" con una similitud del ${Math.round(similarity * 100)}%.

Contenido del documento (extracto):
${documentText.substring(0, 2000)}

Explica en 2-3 oraciones cortas y claras por qué este documento es relevante para la búsqueda del usuario. Enfócate en los conceptos o temas que coinciden entre la búsqueda y el documento.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente que explica de forma clara y concisa por qué un documento es relevante para una búsqueda. Responde siempre en español.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || 'No se pudo generar una explicación.';
  } catch (error) {
    logger.error('Error explaining similarity:', error);
    return `Este documento tiene una similitud del ${Math.round(similarity * 100)}% con tu búsqueda "${query}".`;
  }
}
