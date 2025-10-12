import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { db } from '../config/database';
import { uploadToS3, deleteFromS3 } from '../services/storage.service';
import { processDocumentEmbeddings } from '../services/embedding.service';

export const uploadDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.file;
    const documentId = uuidv4();

    try {
      // Extract text from document
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

      // Upload to S3 if configured
      let fileUrl = file.path;
      if (process.env.AWS_S3_BUCKET) {
        const s3Key = `documents/${req.user.id}/${documentId}${ext}`;
        fileUrl = await uploadToS3(file.path, s3Key, file.mimetype);

        // Delete local file after upload
        await fs.unlink(file.path);
      }

      // Save document metadata to database
      await db.query(
        `INSERT INTO documents (id, user_id, filename, original_filename, file_path, file_size, mime_type, text_content, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          documentId,
          req.user.id,
          file.filename,
          file.originalname,
          fileUrl,
          file.size,
          file.mimetype,
          extractedText,
        ]
      );

      // Process embeddings asynchronously (don't block response)
      if (extractedText && process.env.OPENAI_API_KEY) {
        processDocumentEmbeddings(documentId, extractedText).catch((error) => {
          logger.error(`Error processing embeddings for document ${documentId}:`, error);
        });
      }

      logger.info(`Document uploaded: ${documentId} by user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: documentId,
          filename: file.originalname,
          size: file.size,
          textPreview: extractedText.substring(0, 200),
        },
      });
    } catch (error) {
      // Clean up file if processing failed
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      throw error;
    }
  }
);

export const getDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await db.query(
      `SELECT id, filename, original_filename, file_size, mime_type, created_at
       FROM documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  }
);

export const deleteDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;

    // Get document
    const result = await db.query(
      'SELECT file_path FROM documents WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Document not found', 404);
    }

    const filePath = result.rows[0].file_path;

    // Delete from S3 if applicable
    if (filePath.startsWith('https://')) {
      const s3Key = filePath.split('.com/')[1];
      await deleteFromS3(s3Key);
    } else {
      // Delete local file
      await fs.unlink(filePath).catch(() => {});
    }

    // Delete from database
    await db.query('DELETE FROM documents WHERE id = $1', [id]);

    logger.info(`Document deleted: ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  }
);
