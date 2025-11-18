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
      await Document.create({
        user_id: req.user.id,
        filename: file.filename,
        original_filename: file.originalname,
        file_path: fileUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        text_content: extractedText,
      });

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

    const documents = await Document.find({ user_id: req.user.id })
      .select('_id filename original_filename file_size mime_type created_at')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: documents.map(doc => ({
        id: doc._id,
        filename: doc.filename,
        original_filename: doc.original_filename,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        created_at: doc.created_at,
      })),
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
    const document = await Document.findOne({ _id: id, user_id: req.user.id });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const filePath = document.file_path;

    // Delete from S3 if applicable
    if (filePath.startsWith('https://')) {
      const s3Key = filePath.split('.com/')[1];
      await deleteFromS3(s3Key);
    } else {
      // Delete local file
      await fs.unlink(filePath).catch(() => {});
    }

    // Delete from database
    await Document.deleteOne({ _id: id });

    logger.info(`Document deleted: ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  }
);
