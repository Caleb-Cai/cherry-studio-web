import { Response } from 'express';
import { prisma } from '../utils/database';
import { aiService } from '../services/ai.service';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class ChatController {
  createChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, modelId, modelName, provider } = req.body;
    const userId = req.user!.id;

    if (!title || !modelId || !provider) {
      throw createError('Title, modelId, and provider are required', 400);
    }

    const chat = await prisma.chat.create({
      data: {
        title,
        modelId,
        modelName: modelName || modelId,
        provider,
        userId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    res.status(201).json(chat);
  });

  getChats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: { 
          userId,
          isArchived: false
        },
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { messages: true }
          }
        }
      }),
      prisma.chat.count({ 
        where: { 
          userId,
          isArchived: false
        }
      })
    ]);

    res.json({
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + chats.length < total
      }
    });
  });

  getChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user!.id;

    const chat = await prisma.chat.findFirst({
      where: { 
        id: chatId,
        userId 
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    res.json(chat);
  });

  updateChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user!.id;

    if (!title) {
      throw createError('Title is required', 400);
    }

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId }
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { title }
    });

    res.json(updatedChat);
  });

  deleteChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user!.id;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId }
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    await prisma.chat.delete({
      where: { id: chatId }
    });

    res.json({ message: 'Chat deleted successfully' });
  });

  archiveChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user!.id;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId }
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { isArchived: true }
    });

    res.json(updatedChat);
  });

  sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chatId } = req.params;
    const { content, temperature, maxTokens } = req.body;
    const userId = req.user!.id;

    if (!content) {
      throw createError('Message content is required', 400);
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content
      }
    });

    try {
      // Prepare message history for AI
      const messages = [
        ...chat.messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        })),
        { role: 'user' as const, content }
      ];

      // Call AI service
      const response = await aiService.chat(
        chat.provider,
        chat.modelId,
        messages,
        {
          temperature: temperature || 0.7,
          maxTokens: maxTokens || 4096
        }
      );

      // Save AI response
      const assistantMessage = await prisma.message.create({
        data: {
          chatId,
          role: 'assistant',
          content: response.content,
          metadata: {
            usage: response.usage,
            model: response.model,
            provider: response.provider
          }
        }
      });

      // Update chat timestamp
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      });

      res.json({
        userMessage,
        assistantMessage
      });
    } catch (error: any) {
      // If AI call fails, still keep the user message but return error
      throw createError(`AI service error: ${error.message}`, 500);
    }
  });

  getMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId }
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'asc' }
      }),
      prisma.message.count({ where: { chatId } })
    ]);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + messages.length < total
      }
    });
  });

  searchChats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { query } = req.query;

    if (!query) {
      throw createError('Search query is required', 400);
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId,
        isArchived: false,
        OR: [
          { title: { contains: query as string, mode: 'insensitive' } },
          {
            messages: {
              some: {
                content: { contains: query as string, mode: 'insensitive' }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      take: 20,
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ chats });
  });
}

export const chatController = new ChatController();
