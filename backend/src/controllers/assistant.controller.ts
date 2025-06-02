import { Response } from 'express';
import { prisma } from '../utils/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class AssistantController {
  createAssistant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      description,
      prompt,
      modelId,
      modelName,
      provider,
      isPublic = false,
      avatar,
      category,
      tags = [],
      config = {}
    } = req.body;
    const userId = req.user!.id;

    if (!name || !prompt || !modelId || !provider) {
      throw createError('Name, prompt, modelId, and provider are required', 400);
    }

    const assistant = await prisma.assistant.create({
      data: {
        name,
        description,
        prompt,
        modelId,
        modelName: modelName || modelId,
        provider,
        userId,
        isPublic,
        avatar,
        category,
        tags,
        config
      }
    });

    res.status(201).json(assistant);
  });

  getAssistants = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const includePublic = req.query.includePublic === 'true';
    const offset = (page - 1) * limit;

    const whereClause: any = {
      OR: [
        { userId },
        ...(includePublic ? [{ isPublic: true }] : [])
      ]
    };

    if (category) {
      whereClause.category = category;
    }

    const [assistants, total] = await Promise.all([
      prisma.assistant.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.assistant.count({ where: whereClause })
    ]);

    res.json({
      assistants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + assistants.length < total
      }
    });
  });

  getAssistant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assistantId } = req.params;
    const userId = req.user!.id;

    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        OR: [
          { userId },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!assistant) {
      throw createError('Assistant not found', 404);
    }

    res.json(assistant);
  });

  updateAssistant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assistantId } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Check ownership
    const assistant = await prisma.assistant.findFirst({
      where: { id: assistantId, userId }
    });

    if (!assistant) {
      throw createError('Assistant not found or access denied', 404);
    }

    // Remove sensitive fields that shouldn't be updated
    delete updateData.userId;
    delete updateData.isSystem;

    const updatedAssistant = await prisma.assistant.update({
      where: { id: assistantId },
      data: updateData
    });

    res.json(updatedAssistant);
  });

  deleteAssistant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assistantId } = req.params;
    const userId = req.user!.id;

    const assistant = await prisma.assistant.findFirst({
      where: { id: assistantId, userId }
    });

    if (!assistant) {
      throw createError('Assistant not found or access denied', 404);
    }

    if (assistant.isSystem) {
      throw createError('Cannot delete system assistant', 403);
    }

    await prisma.assistant.delete({
      where: { id: assistantId }
    });

    res.json({ message: 'Assistant deleted successfully' });
  });

  searchAssistants = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { query, category } = req.query;

    if (!query) {
      throw createError('Search query is required', 400);
    }

    const whereClause: any = {
      OR: [
        { userId },
        { isPublic: true }
      ],
      AND: [
        {
          OR: [
            { name: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } },
            { tags: { has: query as string } }
          ]
        }
      ]
    };

    if (category) {
      whereClause.AND.push({ category });
    }

    const assistants = await prisma.assistant.findMany({
      where: whereClause,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({ assistants });
  });

  getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    const categories = await prisma.assistant.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true }
        ],
        category: { not: null }
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(Boolean)
      .sort();

    res.json({ categories: categoryList });
  });

  cloneAssistant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assistantId } = req.params;
    const userId = req.user!.id;

    // Find the assistant to clone
    const originalAssistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        OR: [
          { userId },
          { isPublic: true }
        ]
      }
    });

    if (!originalAssistant) {
      throw createError('Assistant not found', 404);
    }

    // Create a clone
    const clonedAssistant = await prisma.assistant.create({
      data: {
        name: `${originalAssistant.name} (Copy)`,
        description: originalAssistant.description,
        prompt: originalAssistant.prompt,
        modelId: originalAssistant.modelId,
        modelName: originalAssistant.modelName,
        provider: originalAssistant.provider,
        userId,
        isPublic: false, // Clones are private by default
        avatar: originalAssistant.avatar,
        category: originalAssistant.category,
        tags: originalAssistant.tags,
        config: originalAssistant.config
      }
    });

    res.status(201).json(clonedAssistant);
  });
}

export const assistantController = new AssistantController();
