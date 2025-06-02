import { Router } from 'express';
import { modelController } from '../controllers/model.controller';

const router = Router();

// Model routes
router.get('/', modelController.getModels);
router.get('/providers', modelController.getProviders);
router.get('/categories', modelController.getModelCategories);
router.get('/search', modelController.searchModels);
router.get('/:provider/:modelId', modelController.getModelInfo);
router.post('/test', modelController.testModel);

export default router;
