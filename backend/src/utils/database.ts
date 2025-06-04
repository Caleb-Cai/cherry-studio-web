import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      logger.info('🔌 Initializing database connection...');
      
      DatabaseService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty'
      });

      // 非阻塞连接测试
      DatabaseService.instance.$connect()
        .then(() => {
          logger.info('✅ Database connected successfully');
        })
        .catch((error: any) => {
          logger.error('❌ Database connection error:', error);
          // 不要立即退出，让应用尝试重连
        });
    }

    return DatabaseService.instance;
  }

  static async testConnection(): Promise<boolean> {
    try {
      await DatabaseService.instance.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection test passed');
      return true;
    } catch (error) {
      logger.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      logger.info('🔌 Database disconnected');
    }
  }
}

export const prisma = DatabaseService.getInstance();
export { DatabaseService };