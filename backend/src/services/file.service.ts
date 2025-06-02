import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export interface ProcessedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  extractedText?: string;
  processed: boolean;
}

export class FileService {
  async saveFile(
    file: Express.Multer.File,
    userId: string
  ): Promise<ProcessedFile> {
    try {
      const savedFile = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
          size: file.size,
          userId,
          processed: false
        }
      });

      logger.info(`File saved: ${file.originalname} (${file.size} bytes)`);
      
      // Process file asynchronously
      this.processFileAsync(savedFile.id, file.path, file.mimetype);

      return savedFile;
    } catch (error: any) {
      logger.error('Error saving file:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  async getFiles(userId: string, page = 1, limit = 20): Promise<{
    files: ProcessedFile[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimetype: true,
          size: true,
          extractedText: true,
          processed: true,
          createdAt: true
        }
      }),
      prisma.file.count({ where: { userId } })
    ]);

    return {
      files,
      total,
      hasMore: offset + files.length < total
    };
  }

  async getFile(fileId: string, userId: string): Promise<ProcessedFile | null> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
      select: {
        id: true,
        filename: true,
        originalName: true,
        filepath: true,
        mimetype: true,
        size: true,
        extractedText: true,
        processed: true,
        createdAt: true
      }
    });

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, userId }
      });

      if (!file) {
        return false;
      }

      // Delete physical file
      try {
        await fs.unlink(file.filepath);
      } catch (error) {
        logger.warn(`Could not delete physical file: ${file.filepath}`);
      }

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      logger.info(`File deleted: ${file.originalName}`);
      return true;
    } catch (error: any) {
      logger.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  private async processFileAsync(fileId: string, filepath: string, mimetype: string): Promise<void> {
    try {
      const extractedText = await this.extractText(filepath, mimetype);
      
      await prisma.file.update({
        where: { id: fileId },
        data: {
          extractedText,
          processed: true
        }
      });

      logger.info(`File processed successfully: ${fileId}`);
    } catch (error: any) {
      logger.error(`Error processing file ${fileId}:`, error);
      
      await prisma.file.update({
        where: { id: fileId },
        data: { processed: true } // Mark as processed even if failed
      });
    }
  }

  private async extractText(filepath: string, mimetype: string): Promise<string> {
    switch (mimetype) {
      case 'text/plain':
      case 'text/markdown':
        return this.extractFromText(filepath);
      
      case 'application/pdf':
        return this.extractFromPDF(filepath);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractFromDocx(filepath);
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
        // TODO: Implement OCR for images
        return '[Image file - OCR not implemented]';
      
      default:
        return '[Unsupported file type for text extraction]';
    }
  }

  private async extractFromText(filepath: string): Promise<string> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return content;
    } catch (error: any) {
      logger.error('Error reading text file:', error);
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  private async extractFromPDF(filepath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filepath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error: any) {
      logger.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractFromDocx(filepath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filepath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error: any) {
      logger.error('Error extracting text from DOCX:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  async searchFiles(userId: string, query: string, limit = 10): Promise<ProcessedFile[]> {
    try {
      const files = await prisma.file.findMany({
        where: {
          userId,
          processed: true,
          OR: [
            { originalName: { contains: query, mode: 'insensitive' } },
            { extractedText: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimetype: true,
          size: true,
          extractedText: true,
          processed: true,
          createdAt: true
        }
      });

      return files;
    } catch (error: any) {
      logger.error('Error searching files:', error);
      throw new Error(`Failed to search files: ${error.message}`);
    }
  }
}

export const fileService = new FileService();
