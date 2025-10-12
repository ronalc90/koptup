import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger';
import { db } from '../config/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let pinecone: Pinecone | null = null;

if (process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
  });
}

/**
 * Split text into chunks for embedding
 */
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    logger.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Process document and create embeddings
 */
export async function processDocumentEmbeddings(
  documentId: string,
  text: string
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not configured, skipping embeddings');
    return;
  }

  try {
    // Chunk the text
    const chunks = chunkText(text);
    logger.info(`Processing ${chunks.length} chunks for document ${documentId}`);

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Store in Pinecone if configured
    if (pinecone && process.env.PINECONE_INDEX_NAME) {
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

      const vectors = chunks.map((chunk, i) => ({
        id: `${documentId}_chunk_${i}`,
        values: embeddings[i],
        metadata: {
          documentId,
          chunkIndex: i,
          text: chunk,
        },
      }));

      await index.upsert(vectors);
      logger.info(`Stored ${vectors.length} vectors in Pinecone for document ${documentId}`);
    }

    // Store embeddings in database
    for (let i = 0; i < chunks.length; i++) {
      await db.query(
        `INSERT INTO document_embeddings (document_id, chunk_index, chunk_text, embedding)
         VALUES ($1, $2, $3, $4)`,
        [documentId, i, chunks[i], JSON.stringify(embeddings[i])]
      );
    }

    logger.info(`Document embeddings processed: ${documentId}`);
  } catch (error) {
    logger.error(`Error processing embeddings for document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Search similar documents using embeddings
 */
export async function searchSimilarDocuments(
  query: string,
  userId: string,
  topK: number = 5
): Promise<any[]> {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not configured, semantic search not available');
    return [];
  }

  try {
    // Generate embedding for query
    const [queryEmbedding] = await generateEmbeddings([query]);

    // Search in Pinecone if configured
    if (pinecone && process.env.PINECONE_INDEX_NAME) {
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

      const searchResults = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      return searchResults.matches?.map((match) => ({
        documentId: match.metadata?.documentId,
        text: match.metadata?.text,
        score: match.score,
      })) || [];
    }

    // Fallback to database search (cosine similarity)
    // This is less efficient but works without Pinecone
    const result = await db.query(
      `SELECT de.document_id, de.chunk_text,
              1 - (de.embedding::vector <=> $1::vector) as similarity
       FROM document_embeddings de
       JOIN documents d ON d.id = de.document_id
       WHERE d.user_id = $2
       ORDER BY similarity DESC
       LIMIT $3`,
      [JSON.stringify(queryEmbedding), userId, topK]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching similar documents:', error);
    throw error;
  }
}
