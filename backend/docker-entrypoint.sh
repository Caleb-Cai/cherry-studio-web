#!/bin/sh

echo "🚀 Starting Cherry Studio Backend..."

# 等待数据库启动
echo "⏳ Waiting for database connection..."
sleep 10

# 检查数据库连接并强制重置（解决schema冲突）
echo "🔍 Resetting database schema..."
npx prisma db push --force-reset --skip-generate || {
    echo "❌ Database reset failed, retrying..."
    sleep 5
    npx prisma db push --force-reset --skip-generate || {
        echo "❌ Database still not available"
        exit 1
    }
}

# 再次生成Prisma客户端（确保数据库schema同步）
echo "🔧 Generating Prisma client..."
npx prisma generate

# 创建管理员用户
echo "👤 Creating admin user..."
npx ts-node src/seed.ts || echo "❌ Failed to create admin user, continuing..."

# 启动应用
echo "✅ Starting application..."
echo "📝 Node.js version: $(node --version)"
echo "📝 NPM version: $(npm --version)"
echo "📝 Current directory: $(pwd)"

# 启动应用并输出更多信息
exec "$@"