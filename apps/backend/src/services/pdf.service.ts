// Service for PDF text extraction
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

export interface ExtractedPDFData {
  text: string;
  numPages: number;
  filename: string;
  success: boolean;
  error?: string;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<ExtractedPDFData> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      numPages: data.numpages,
      filename: filePath,
      success: true,
    };
  } catch (error: any) {
    logger.error(`Error extracting PDF text from ${filePath}:`, error);
    return {
      text: '',
      numPages: 0,
      filename: filePath,
      success: false,
      error: error.message || 'Unknown error extracting PDF',
    };
  }
}

/**
 * Extract text from multiple PDFs in batch
 */
export async function extractTextFromMultiplePDFs(
  filePaths: string[]
): Promise<ExtractedPDFData[]> {
  const results = await Promise.allSettled(
    filePaths.map((filePath) => extractTextFromPDF(filePath))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        text: '',
        numPages: 0,
        filename: filePaths[index],
        success: false,
        error: result.reason?.message || 'Failed to extract PDF',
      };
    }
  });
}

/**
 * Check if text extraction was successful and has meaningful content
 */
export function isValidExtractedText(data: ExtractedPDFData): boolean {
  return data.success && data.text.trim().length > 50; // At least 50 characters
}
