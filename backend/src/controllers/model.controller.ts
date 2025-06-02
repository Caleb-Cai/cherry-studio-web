import { Response } from 'express';
import { aiService } from '../services/ai.service';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

// Predefined model configurations
const MODEL_CONFIGS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'chat', maxTokens: 4096, supportVision: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', type: 'chat', maxTokens: 4096, supportVision: true },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', type: 'chat', maxTokens: 4096, supportVision: false },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', type: 'chat', maxTokens: 4096, supportVision: false },
    { id: 'o1-preview', name: 'o1 Preview', provider: 'openai', type: 'reasoning', maxTokens: 32768, supportVision: false },
    { id: 'o1-mini', name: 'o1 Mini', provider: 'openai', type: 'reasoning', maxTokens: 65536, supportVision: false }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', type: 'chat', maxTokens: 8192, supportVision: true },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', type: 'chat', maxTokens: 8192, supportVision: true },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', type: 'chat', maxTokens: 4096, supportVision: true },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', type: 'chat', maxTokens: 4096, supportVision: true }
  ]
};

export class ModelController {
  getModels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const provider = req.query.provider as string;

    try {
      if (provider) {
        // Get models for specific provider
        if (!MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS]) {
          throw createError(`Provider ${provider} not supported`, 400);
        }

        // Try to get live models from AI service
        try {
          const liveModels = await aiService.getModels(provider);
          if (liveModels.length > 0) {
            res.json({
              provider,
              models: liveModels
            });
            return;
          }
        } catch (error) {
          // Fall back to predefined models if API call fails
        }

        // Return predefined models
        res.json({
          provider,
          models: MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS]
        });
      } else {
        // Get all available models
        const availableProviders = aiService.getAvailableProviders();
        const allModels: any[] = [];

        for (const prov of availableProviders) {
          if (MODEL_CONFIGS[prov as keyof typeof MODEL_CONFIGS]) {
            allModels.push(...MODEL_CONFIGS[prov as keyof typeof MODEL_CONFIGS]);
          }
        }

        res.json({
          providers: availableProviders,
          models: allModels
        });
      }
    } catch (error: any) {
      throw createError(`Failed to get models: ${error.message}`, 500);
    }
  });

  getProviders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const availableProviders = aiService.getAvailableProviders();
      const providersWithInfo = availableProviders.map(providerId => {
        const provider = aiService.getProvider(providerId);
        return {
          id: providerId,
          name: provider?.name || providerId,
          supportStreaming: provider?.supportStreaming || false,
          supportVision: provider?.supportVision || false,
          supportFunctionCalling: provider?.supportFunctionCalling || false
        };
      });

      res.json({
        providers: providersWithInfo
      });
    } catch (error: any) {
      throw createError(`Failed to get providers: ${error.message}`, 500);
    }
  });

  getModelInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { provider, modelId } = req.params;

    if (!provider || !modelId) {
      throw createError('Provider and modelId are required', 400);
    }

    try {
      // Find model in predefined configs
      const providerModels = MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS];
      if (!providerModels) {
        throw createError(`Provider ${provider} not supported`, 400);
      }

      const model = providerModels.find(m => m.id === modelId);
      if (!model) {
        throw createError(`Model ${modelId} not found for provider ${provider}`, 404);
      }

      res.json(model);
    } catch (error: any) {
      throw createError(`Failed to get model info: ${error.message}`, 500);
    }
  });

  testModel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { provider, modelId, message } = req.body;

    if (!provider || !modelId || !message) {
      throw createError('Provider, modelId, and message are required', 400);
    }

    try {
      const testMessage = message || 'Hello, this is a test message. Please respond briefly.';
      
      const response = await aiService.chat(
        provider,
        modelId,
        [{ role: 'user', content: testMessage }],
        { maxTokens: 100 }
      );

      res.json({
        success: true,
        model: modelId,
        provider: provider,
        response: response.content,
        usage: response.usage
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        model: modelId,
        provider: provider,
        error: error.message
      });
    }
  });

  getModelCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const categories = [
      {
        id: 'chat',
        name: 'Chat Models',
        description: 'General purpose conversational AI models'
      },
      {
        id: 'reasoning',
        name: 'Reasoning Models',
        description: 'Models optimized for complex reasoning and problem solving'
      },
      {
        id: 'vision',
        name: 'Vision Models',
        description: 'Models capable of processing images and visual content'
      },
      {
        id: 'code',
        name: 'Code Models',
        description: 'Models specialized for code generation and programming tasks'
      },
      {
        id: 'embedding',
        name: 'Embedding Models',
        description: 'Models for text embeddings and semantic search'
      }
    ];

    res.json({ categories });
  });

  searchModels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, type, provider } = req.query;

    if (!query) {
      throw createError('Search query is required', 400);
    }

    try {
      const allModels: any[] = [];
      const providers = provider ? [provider as string] : Object.keys(MODEL_CONFIGS);

      for (const prov of providers) {
        if (MODEL_CONFIGS[prov as keyof typeof MODEL_CONFIGS]) {
          allModels.push(...MODEL_CONFIGS[prov as keyof typeof MODEL_CONFIGS]);
        }
      }

      let filteredModels = allModels.filter(model => 
        model.name.toLowerCase().includes((query as string).toLowerCase()) ||
        model.id.toLowerCase().includes((query as string).toLowerCase())
      );

      if (type) {
        filteredModels = filteredModels.filter(model => model.type === type);
      }

      res.json({
        models: filteredModels,
        total: filteredModels.length
      });
    } catch (error: any) {
      throw createError(`Failed to search models: ${error.message}`, 500);
    }
  });
}

export const modelController = new ModelController();
