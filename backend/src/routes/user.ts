import { Router } from 'express';
import { Response } from 'express';
import { prisma } from '../utils/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          chats: true,
          files: true,
          assistants: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json(user);
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, avatar } = req.body;

  if (!name) {
    throw createError('Name is required', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name, avatar },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true
    }
  });

  res.json(updatedUser);
}));

// Get user statistics
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const [chatCount, messageCount, fileCount, assistantCount] = await Promise.all([
    prisma.chat.count({ where: { userId } }),
    prisma.message.count({ 
      where: { 
        chat: { userId } 
      } 
    }),
    prisma.file.count({ where: { userId } }),
    prisma.assistant.count({ where: { userId } })
  ]);

  // Get usage statistics for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentChats = await prisma.chat.count({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo }
    }
  });

  const recentMessages = await prisma.message.count({
    where: {
      chat: { userId },
      createdAt: { gte: thirtyDaysAgo }
    }
  });

  res.json({
    total: {
      chats: chatCount,
      messages: messageCount,
      files: fileCount,
      assistants: assistantCount
    },
    recent: {
      chats: recentChats,
      messages: recentMessages
    }
  });
}));

export default router;
