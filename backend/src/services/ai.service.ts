import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export interface AIProvider {
  id: string;
  name: string;
  client: any;
  supportStreaming: boolean;
  supportVision: boolean;
  supportFunctionCalling: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  functions?: any[];
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        id: 'openai',
        name: 'OpenAI',
        client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        supportStreaming: true,
        supportVision: true,
        supportFunctionCalling: true
      });
    }

    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        id: 'anthropic',
        name: 'Anthropic',
        client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
        supportStreaming: true,
        supportVision: true,
        supportFunctionCalling: true
      });
    }

    logger.info(`Initialized ${this.providers.size} AI providers`);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  async chat(
    provider: string, 
    model: string, 
    messages: ChatMessage[], 
    options: ChatOptions = {}
  ): Promise<any> {
    const aiProvider = this.providers.get(provider);
    if (!aiProvider) {
      throw new Error(`Provider ${provider} not found or not configured`);
    }

    logger.info(`Chat request: ${provider}/${model} with ${messages.length} messages`);

    try {
      switch (provider) {
        case 'openai':
          return this.chatWithOpenAI(aiProvider.client, model, messages, options);
        case 'anthropic':
          return this.chatWithAnthropic(aiProvider.client, model, messages, options);
        default:
          throw new Error(`Provider ${provider} not supported`);
      }
    } catch (error: any) {
      logger.error(`AI Service Error (${provider}/${model}):`, error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  async *chatStream(
    provider: string,
    model: string,
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const aiProvider = this.providers.get(provider);
    if (!aiProvider) {
      throw new Error(`Provider ${provider} not found`);
    }

    if (!aiProvider.supportStreaming) {
      throw new Error(`Provider ${provider} does not support streaming`);
    }

    try {
      switch (provider) {
        case 'openai':
          yield* this.streamOpenAI(aiProvider.client, model, messages, options);
          break;
        case 'anthropic':
          yield* this.streamAnthropic(aiProvider.client, model, messages, options);
          break;
        default:
          throw new Error(`Streaming not implemented for provider ${provider}`);
      }
    } catch (error: any) {
      logger.error(`AI Stream Error (${provider}/${model}):`, error);
      throw new Error(`AI stream error: ${error.message}`);
    }
  }

  private async chatWithOpenAI(
    client: OpenAI,
    model: string,
    messages: ChatMessage[],
    options: ChatOptions
  ) {
    const response = await client.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens,
      stream: false
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
      provider: 'openai'
    };
  }

  private async *streamOpenAI(
    client: OpenAI,
    model: string,
    messages: ChatMessage[],
    options: ChatOptions
  ): AsyncGenerator<string, void, unknown> {
    const stream = await client.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  private async chatWithAnthropic(
    client: Anthropic,
    model: string,
    messages: ChatMessage[],
    options: ChatOptions
  ) {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: response.usage,
      model: response.model,
      provider: 'anthropic'
    };
  }

  private async *streamAnthropic(
    client: Anthropic,
    model: string,
    messages: ChatMessage[],
    options: ChatOptions
  ): AsyncGenerator<string, void, unknown> {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const stream = await client.messages.create({
      model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      stream: true
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  // Get available models for a provider
  async getModels(provider: string): Promise<any[]> {
    const aiProvider = this.providers.get(provider);
    if (!aiProvider) {
      throw new Error(`Provider ${provider} not found`);
    }

    try {
      switch (provider) {
        case 'openai':
          const models = await aiProvider.client.models.list();
          return models.data
            .filter((model: any) => model.id.includes('gpt'))
            .map((model: any) => ({
              id: model.id,
              name: model.id,
              provider: 'openai',
              type: 'chat'
            }));
        case 'anthropic':
          // Anthropic doesn't have a models endpoint, return known models
          return [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', type: 'chat' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', type: 'chat' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', type: 'chat' }
          ];
        default:
          return [];
      }
    } catch (error: any) {
      logger.error(`Error getting models for ${provider}:`, error);
      return [];
    }
  }
}

export const aiService = new AIService();
