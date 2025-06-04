import { Response } from 'express';
import { fileService } from '../services/file.service';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class FileController {
  uploadFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    try {
      const savedFiles = await Promise.all(
        files.map(file => fileService.saveFile(file, userId))
      );

      res.status(201).json({
        message: `${savedFiles.length} file(s) uploaded successfully`,
        files: savedFiles
      });
    } catch (error: any) {
      throw createError(`Upload failed: ${error.message}`, 500);
    }
  });

  getFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await fileService.getFiles(userId, page, limit);

    res.json({
      files: result.files,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
        hasMore: result.hasMore
      }
    });
  });

  getFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const file = await fileService.getFile(fileId, userId);

    if (!file) {
      throw createError('File not found', 404);
    }

    res.json(file);
  });

  downloadFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const file = await fileService.getFile(fileId, userId);

    if (!file) {
      throw createError('File not found', 404);
    }

    // 修复：使用正确的属性名
    res.download(file.filepath, file.originalName);
  });

  deleteFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const deleted = await fileService.deleteFile(fileId, userId);

    if (!deleted) {
      throw createError('File not found', 404);
    }

    res.json({ message: 'File deleted successfully' });
  });

  searchFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { query } = req.query;

    if (!query) {
      throw createError('Search query is required', 400);
    }

    const files = await fileService.searchFiles(userId, query as string);

    res.json({ files });
  });

  getFileContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const file = await fileService.getFile(fileId, userId);

    if (!file) {
      throw createError('File not found', 404);
    }

    if (!file.processed || !file.extractedText) {
      throw createError('File not processed or text extraction failed', 400);
    }

    res.json({
      id: file.id,
      filename: file.originalName,
      content: file.extractedText,
      mimetype: file.mimetype
    });
  });
}

export const fileController = new FileController();
