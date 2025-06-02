import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { upload } from '../middleware/upload';

const router = Router();

// File routes
router.post('/upload', upload.array('files', 10), fileController.uploadFiles);
router.get('/', fileController.getFiles);
router.get('/search', fileController.searchFiles);
router.get('/:fileId', fileController.getFile);
router.get('/:fileId/download', fileController.downloadFile);
router.get('/:fileId/content', fileController.getFileContent);
router.delete('/:fileId', fileController.deleteFile);

export default router;
