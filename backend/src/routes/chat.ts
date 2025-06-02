import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// Chat routes
router.post('/', chatController.createChat);
router.get('/', chatController.getChats);
router.get('/search', chatController.searchChats);
router.get('/:chatId', chatController.getChat);
router.put('/:chatId', chatController.updateChat);
router.delete('/:chatId', chatController.deleteChat);
router.post('/:chatId/archive', chatController.archiveChat);

// Message routes
router.post('/:chatId/messages', chatController.sendMessage);
router.get('/:chatId/messages', chatController.getMessages);

export default router;
