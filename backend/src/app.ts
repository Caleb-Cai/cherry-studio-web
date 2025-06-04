import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config();

import { logger } from './utils/logger';
import { DatabaseService } from './utils/database';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// 异步启动函数
async function startServer() {
  try {
    logger.info('🚀 Cherry Studio Backend Starting...');
    logger.info(`📝 Node.js version: ${process.version}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

    const app = express();
    const server = createServer(app);

    logger.info('🔧 Setting up Socket.IO...');
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    logger.info('🔧 Setting up middleware...');

    // Basic middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true
    }));
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use('/api/', limiter);

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    logger.info('🔧 Setting up health check endpoints...');

    // Health check endpoints (both paths for compatibility)
    const healthHandler = (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected'
      });
    };

    app.get('/health', healthHandler);
    app.get('/api/health', healthHandler);

    logger.info('🔧 Testing database connection...');
    
    // 测试数据库连接
    const dbConnected = await DatabaseService.testConnection();
    if (!dbConnected) {
      logger.warn('⚠️  Database connection test failed, but continuing to start server...');
    }

    logger.info('🔧 Setting up API routes...');

    // 动态导入路由以避免初始化问题
    try {
      const authRoutes = (await import('./routes/auth')).default;
      app.use('/api/auth', authRoutes);
      logger.info('✅ Auth routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load auth routes:', error);
    }

    try {
      const chatRoutes = (await import('./routes/chat')).default;
      app.use('/api/chats', authMiddleware, chatRoutes);
      logger.info('✅ Chat routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load chat routes:', error);
    }

    try {
      const fileRoutes = (await import('./routes/file')).default;
      app.use('/api/files', authMiddleware, fileRoutes);
      logger.info('✅ File routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load file routes:', error);
    }

    try {
      const assistantRoutes = (await import('./routes/assistant')).default;
      app.use('/api/assistants', authMiddleware, assistantRoutes);
      logger.info('✅ Assistant routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load assistant routes:', error);
    }

    try {
      const modelRoutes = (await import('./routes/model')).default;
      app.use('/api/models', authMiddleware, modelRoutes);
      logger.info('✅ Model routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load model routes:', error);
    }

    try {
      const userRoutes = (await import('./routes/user')).default;
      app.use('/api/users', authMiddleware, userRoutes);
      logger.info('✅ User routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load user routes:', error);
    }

    logger.info('🔧 Setting up Socket.IO routes...');
    try {
      const { setupSocketRoutes } = await import('./routes/socket');
      setupSocketRoutes(io);
      logger.info('✅ Socket routes loaded');
    } catch (error) {
      logger.error('❌ Failed to load socket routes:', error);
    }

    // Error handling
    app.use(errorHandler);

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });

    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';

    logger.info(`🚀 Starting server on ${HOST}:${PORT}...`);
    
    server.listen(PORT, HOST, () => {
      logger.info(`✅ Cherry Studio Backend Server running on ${HOST}:${PORT}`);
      logger.info(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      logger.info(`🎯 Health check available at: http://${HOST}:${PORT}/health`);
      logger.info(`🎯 API health check available at: http://${HOST}:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await DatabaseService.disconnect();
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await DatabaseService.disconnect();
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

export default null;