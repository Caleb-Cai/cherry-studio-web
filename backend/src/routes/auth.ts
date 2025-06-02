import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);

// Protected routes (require authentication)
router.post('/change-password', authController.changePassword);

export default router;
