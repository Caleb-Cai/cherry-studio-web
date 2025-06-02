import { Server } from 'socket.io';
import { aiService } from '../services/ai.service';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthUtils } from '../utils/auth';

interface SocketWithAuth extends Socket {
  userId?: string;
}

export function setupSocketRoutes(io: Server) {
  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = AuthUtils.verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: SocketWithAuth) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining specific chat rooms
    socket.on('join-chat', async (chatId: string) => {
      try {
        // Verify user has access to this chat
        const chat = await prisma.chat.findFirst({
          where: { id: chatId, userId: socket.userId }
        });

        if (chat) {
          socket.join(`chat:${chatId}`);
          logger.info(`User ${socket.userId} joined chat ${chatId}`);
        }
      } catch (error) {
        logger.error('Error joining chat:', error);
      }
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      logger.info(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle streaming chat messages
    socket.on('send-message', async (data: {
      chatId: string;
      content: string;
      temperature?: number;
      maxTokens?: number;
    }) => {
      try {
        const { chatId, content, temperature, maxTokens } = data;

        // Verify chat ownership
        const chat = await prisma.chat.findFirst({
          where: { id: chatId, userId: socket.userId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 50 // Last 50 messages for context
            }
          }
        });

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Save user message
        const userMessage = await prisma.message.create({
          data: {
            chatId,
            role: 'user',
            content
          }
        });

        // Emit user message to chat room
        io.to(`chat:${chatId}`).emit('message', userMessage);

        // Prepare message history
        const messages = [
          ...chat.messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content
          })),
          { role: 'user' as const, content }
        ];

        // Start streaming response
        let fullResponse = '';
        socket.emit('stream-start', { chatId });

        try {
          const stream = aiService.chatStream(
            chat.provider,
            chat.modelId,
            messages,
            {
              temperature: temperature || 0.7,
              maxTokens: maxTokens || 4096
            }
          );

          for await (const chunk of stream) {
            fullResponse += chunk;
            socket.emit('stream-chunk', {
              chatId,
              chunk,
              isComplete: false
            });
          }

          // Save complete AI response
          const assistantMessage = await prisma.message.create({
            data: {
              chatId,
              role: 'assistant',
              content: fullResponse,
              metadata: {
                model: chat.modelId,
                provider: chat.provider,
                streaming: true
              }
            }
          });

          // Update chat timestamp
          await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
          });

          // Emit completion
          socket.emit('stream-complete', {
            chatId,
            message: assistantMessage
          });

          // Emit to chat room
          io.to(`chat:${chatId}`).emit('message', assistantMessage);

        } catch (aiError: any) {
          logger.error('AI streaming error:', aiError);
          socket.emit('stream-error', {
            chatId,
            error: aiError.message
          });
        }

      } catch (error: any) {
        logger.error('Socket message error:', error);
        socket.emit('error', {
          message: 'Failed to process message',
          details: error.message
        });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    // Handle file processing notifications
    socket.on('file-uploaded', async (data: { fileId: string }) => {
      try {
        const file = await prisma.file.findFirst({
          where: { id: data.fileId, userId: socket.userId }
        });

        if (file) {
          socket.emit('file-processing', {
            fileId: file.id,
            status: 'processing'
          });

          // File processing is handled in FileService
          // This is just for real-time notifications
        }
      } catch (error) {
        logger.error('File upload notification error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Utility function to send notifications to specific users
  io.sendToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Utility function to send to chat rooms
  io.sendToChat = (chatId: string, event: string, data: any) => {
    io.to(`chat:${chatId}`).emit(event, data);
  };

  logger.info('Socket.IO routes configured');
}

// Extend Server interface to add utility methods
declare module 'socket.io' {
  interface Server {
    sendToUser(userId: string, event: string, data: any): void;
    sendToChat(chatId: string, event: string, data: any): void;
  }
}
