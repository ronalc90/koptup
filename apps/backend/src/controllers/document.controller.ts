import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import Document from '../models/Document';
import { uploadToS3, deleteFromS3 } from '../services/storage.service';
import {
  analyzeDocument,
  explainDocument,
  generateDocumentEmbedding,
  findSimilarDocuments,
  explainSimilarity,
} from '../services/document-ai.service';

// Usuario demo público para la demostración
const DEMO_USER_ID = 'demo-public-user';
const DELETE_PIN = '1010'; // PIN requerido para eliminar documentos

/**
 * Sube un documento y lo procesa con IA (DEMO PÚBLICO)
 */
export const uploadDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.file;
    const documentId = uuidv4();
    const { folder } = req.body;
    const userId = req.user?.id || DEMO_USER_ID; // Usar usuario demo si no hay autenticación

    try {
      // Extraer texto del documento
      let extractedText = '';
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === '.pdf') {
        const dataBuffer = await fs.readFile(file.path);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: file.path });
        extractedText = result.value;
      } else if (ext === '.txt' || ext === '.csv') {
        extractedText = await fs.readFile(file.path, 'utf-8');
      }

      // Analizar con IA para obtener tags, resumen, etc.
      let aiAnalysis = {
        tags: [] as string[],
        summary: '',
        keywords: [] as string[],
        entities: [] as string[],
      };
      let embedding: number[] = [];

      if (extractedText && process.env.OPENAI_API_KEY) {
        try {
          aiAnalysis = await analyzeDocument(extractedText, file.originalname);
          embedding = await generateDocumentEmbedding(extractedText);
        } catch (error) {
          logger.error('Error analyzing document with AI:', error);
          // Continuar sin análisis de IA
        }
      }

      // Subir a S3 si está configurado con credenciales válidas
      let fileUrl = file.path;
      if (
        process.env.AWS_S3_BUCKET &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      ) {
        const s3Key = `documents/${userId}/${documentId}${ext}`;
        fileUrl = await uploadToS3(file.path, s3Key, file.mimetype);

        // Eliminar archivo local después de subir
        await fs.unlink(file.path);
      }

      // Guardar metadata en base de datos
      const document = await Document.create({
        user_id: userId,
        filename: file.filename,
        original_filename: file.originalname,
        file_path: fileUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        text_content: extractedText,
        folder: folder || 'General',
        tags: aiAnalysis.tags,
        ai_summary: aiAnalysis.summary,
        ai_keywords: aiAnalysis.keywords,
        ai_entities: aiAnalysis.entities,
        embedding: embedding.length > 0 ? embedding : undefined,
      });

      logger.info(`Document uploaded: ${documentId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Documento subido y procesado exitosamente',
        data: {
          id: document._id,
          filename: document.original_filename,
          folder: document.folder,
          size: document.file_size,
          tags: document.tags,
          summary: document.ai_summary,
          keywords: document.ai_keywords,
          entities: document.ai_entities,
          created_at: document.created_at,
        },
      });
    } catch (error) {
      // Limpiar archivo si el procesamiento falló
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      throw error;
    }
  }
);

/**
 * Obtiene todos los documentos con filtros (DEMO PÚBLICO)
 */
export const getDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;

    const {
      folder,
      favorites,
      recent,
      trash,
      search,
    } = req.query;

    // Construir filtro
    const filter: any = { user_id: userId };

    if (trash === 'true') {
      filter.is_deleted = true;
    } else {
      filter.is_deleted = false;
    }

    if (folder) {
      filter.folder = folder;
    }

    if (favorites === 'true') {
      filter.is_favorite = true;
    }

    // Búsqueda por texto
    if (search && typeof search === 'string') {
      filter.$or = [
        { original_filename: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { ai_keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let query = Document.find(filter).select(
      '_id filename original_filename file_size mime_type folder is_favorite tags ai_summary ai_keywords ai_entities created_at updated_at'
    );

    // Ordenar
    if (recent === 'true') {
      query = query.sort({ created_at: -1 }).limit(10);
    } else {
      query = query.sort({ created_at: -1 });
    }

    const documents = await query;

    res.json({
      success: true,
      data: documents.map((doc) => ({
        id: doc._id,
        name: doc.original_filename,
        filename: doc.filename,
        folder: doc.folder,
        size: formatFileSize(doc.file_size),
        sizeBytes: doc.file_size,
        type: getMimeTypeLabel(doc.mime_type),
        mimeType: doc.mime_type,
        favorite: doc.is_favorite,
        tags: doc.tags,
        summary: doc.ai_summary,
        keywords: doc.ai_keywords,
        entities: doc.ai_entities,
        date: doc.created_at.toISOString().split('T')[0],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      })),
    });
  }
);

/**
 * Búsqueda semántica por significado (DEMO PÚBLICO)
 */
export const searchDocumentsBySemantic = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;

    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      throw new AppError('Query is required', 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    // Generar embedding de la consulta (isQuery: true permite textos más cortos)
    const queryEmbedding = await generateDocumentEmbedding(query, true);

    if (queryEmbedding.length === 0) {
      throw new AppError('Could not generate query embedding', 500);
    }

    // Obtener todos los documentos del usuario con embeddings
    const documents = await Document.find({
      user_id: userId,
      is_deleted: false,
      embedding: { $exists: true, $ne: null },
    }).select('_id original_filename embedding');

    const documentEmbeddings = documents.map((doc) => ({
      id: doc._id.toString(),
      filename: doc.original_filename,
      embedding: doc.embedding as number[],
    }));

    // Encontrar documentos similares
    const similarDocs = findSimilarDocuments(queryEmbedding, documentEmbeddings, 10);

    // Obtener información completa de los documentos similares
    const fullDocs = await Document.find({
      _id: { $in: similarDocs.map((d) => d.id) },
    });

    const results = similarDocs.map((sim) => {
      const doc = fullDocs.find((d) => d._id.toString() === sim.id);
      if (!doc) return null;

      return {
        id: doc._id,
        name: doc.original_filename,
        folder: doc.folder,
        size: formatFileSize(doc.file_size),
        type: getMimeTypeLabel(doc.mime_type),
        tags: doc.tags,
        summary: doc.ai_summary,
        similarity: Math.round(sim.similarity * 100),
        date: doc.created_at.toISOString().split('T')[0],
      };
    }).filter(Boolean);

    res.json({
      success: true,
      query,
      results,
    });
  }
);

/**
 * Explica por qué un documento es similar a una búsqueda (DEMO PÚBLICO)
 */
export const explainDocumentSimilarity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;
    const { id } = req.params;
    const { query, similarity } = req.body;

    if (!query || typeof query !== 'string') {
      throw new AppError('Query is required', 400);
    }

    if (!similarity || typeof similarity !== 'number') {
      throw new AppError('Similarity score is required', 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const document = await Document.findOne({
      _id: id,
      user_id: userId,
      is_deleted: false,
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    if (!document.text_content) {
      throw new AppError('Document has no extractable text', 400);
    }

    const explanation = await explainSimilarity(
      query,
      document.text_content,
      document.original_filename,
      similarity
    );

    res.json({
      success: true,
      data: {
        id: document._id,
        filename: document.original_filename,
        query,
        similarity,
        explanation,
      },
    });
  }
);

/**
 * Explica un documento usando IA (DEMO PÚBLICO)
 */
export const explainDocumentById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;
    const { id } = req.params;

    const document = await Document.findOne({
      _id: id,
      user_id: userId,
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    if (!document.text_content) {
      throw new AppError('Document has no extractable text', 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const explanation = await explainDocument(
      document.text_content,
      document.original_filename
    );

    res.json({
      success: true,
      data: {
        id: document._id,
        filename: document.original_filename,
        explanation,
      },
    });
  }
);

/**
 * Actualiza un documento (renombrar, mover carpeta, favorito) - DEMO PÚBLICO
 */
export const updateDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;
    const { id } = req.params;
    const { filename, folder, is_favorite } = req.body;

    const document = await Document.findOne({
      _id: id,
      user_id: userId,
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Actualizar campos permitidos
    if (filename !== undefined) {
      document.original_filename = filename;
    }

    if (folder !== undefined) {
      document.folder = folder;
    }

    if (is_favorite !== undefined) {
      document.is_favorite = is_favorite;
    }

    await document.save();

    logger.info(`Document updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        id: document._id,
        name: document.original_filename,
        folder: document.folder,
        is_favorite: document.is_favorite,
      },
    });
  }
);

/**
 * Marca un documento como eliminado (requiere PIN 1010)
 */
export const deleteDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;
    const { id } = req.params;
    const { permanent, pin } = req.query;

    // Verificar PIN
    if (pin !== DELETE_PIN) {
      throw new AppError('PIN incorrecto. Se requiere PIN 1010 para eliminar documentos.', 403);
    }

    const document = await Document.findOne({
      _id: id,
      user_id: userId,
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    if (permanent === 'true') {
      // Eliminación permanente
      const filePath = document.file_path;

      // Eliminar de S3 si aplica
      if (filePath.startsWith('https://')) {
        const s3Key = filePath.split('.com/')[1];
        await deleteFromS3(s3Key);
      } else {
        // Eliminar archivo local
        await fs.unlink(filePath).catch(() => {});
      }

      // Eliminar de BD
      await Document.deleteOne({ _id: id });

      logger.info(`Document permanently deleted: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Document permanently deleted',
      });
    } else {
      // Mover a papelera
      document.is_deleted = true;
      document.deleted_at = new Date();
      await document.save();

      logger.info(`Document moved to trash: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Document moved to trash',
      });
    }
  }
);

/**
 * Restaura un documento de la papelera (DEMO PÚBLICO)
 */
export const restoreDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;
    const { id } = req.params;

    const document = await Document.findOne({
      _id: id,
      user_id: userId,
      is_deleted: true,
    });

    if (!document) {
      throw new AppError('Document not found in trash', 404);
    }

    document.is_deleted = false;
    document.deleted_at = undefined;
    await document.save();

    logger.info(`Document restored: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Document restored successfully',
      data: {
        id: document._id,
        name: document.original_filename,
      },
    });
  }
);

/**
 * Obtiene las carpetas con contadores (DEMO PÚBLICO)
 */
export const getFolders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;

    const folders = await Document.aggregate([
      {
        $match: {
          user_id: userId,
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: '$folder',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      data: folders.map((f) => ({
        name: f._id || 'General',
        count: f.count,
      })),
    });
  }
);

/**
 * Crea una nueva carpeta (DEMO PÚBLICO)
 */
export const createFolder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      throw new AppError('Folder name is required', 400);
    }

    // Verificar si ya existe
    const existing = await Document.findOne({
      user_id: userId,
      folder: name,
    });

    if (existing) {
      throw new AppError('Folder already exists', 400);
    }

    logger.info(`Folder created: ${name} by user ${userId}`);

    res.json({
      success: true,
      message: 'Folder created successfully',
      data: { name },
    });
  }
);

/**
 * Obtiene estadísticas del gestor de documentos (DEMO PÚBLICO)
 */
export const getDocumentStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || DEMO_USER_ID;

    const [totalDocs, favorites, recentCount, trashedCount, totalSize] = await Promise.all([
      Document.countDocuments({ user_id: userId, is_deleted: false }),
      Document.countDocuments({ user_id: userId, is_favorite: true, is_deleted: false }),
      Document.countDocuments({ user_id: userId, is_deleted: false }),
      Document.countDocuments({ user_id: userId, is_deleted: true }),
      Document.aggregate([
        { $match: { user_id: userId, is_deleted: false } },
        { $group: { _id: null, total: { $sum: '$file_size' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total: totalDocs,
        favorites,
        recent: Math.min(recentCount, 10),
        trash: trashedCount,
        totalSize: totalSize[0]?.total || 0,
      },
    });
  }
);

// Utilidades
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getMimeTypeLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'Word';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint';
  if (mimeType.includes('text')) return 'Text';
  return 'Document';
}
