import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';

const router = Router();

// Assistant routes
router.post('/', assistantController.createAssistant);
router.get('/', assistantController.getAssistants);
router.get('/categories', assistantController.getCategories);
router.get('/search', assistantController.searchAssistants);
router.get('/:assistantId', assistantController.getAssistant);
router.put('/:assistantId', assistantController.updateAssistant);
router.delete('/:assistantId', assistantController.deleteAssistant);
router.post('/:assistantId/clone', assistantController.cloneAssistant);

export default router;
