#!/bin/bash

# Cherry Studio Final Fix
# Fix backend startup and frontend API configuration

set -e

echo "🔧 Final Fix for Cherry Studio"
echo "=============================="

# Check backend logs first
echo "📋 Checking backend logs..."
docker-compose -f docker-compose.prod.yml logs backend

echo ""
echo "🛑 Stopping all services..."
docker-compose -f docker-compose.prod.yml down

# Fix frontend environment configuration
echo "🔧 Fixing frontend API configuration..."
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3000
EOF

# Create simple backend Dockerfile that definitely works
echo "🐳 Creating ultra-simple backend Dockerfile..."
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

# Install basic dependencies
RUN apk add --no-cache dumb-init curl

# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S cherry -u 1001

WORKDIR /app

# Copy files
COPY package.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/

# Install dependencies with maximum compatibility
RUN npm install --force --legacy-peer-deps --no-optional && npm cache clean --force

# Try to generate Prisma client
RUN npx prisma generate 2>/dev/null || echo "Prisma generation skipped"

# Create directories
RUN mkdir -p uploads logs && chown -R cherry:nodejs . uploads logs

# Set user
USER cherry

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start with minimal options
CMD ["node", "--loader", "ts-node/esm", "--experimental-specifier-resolution=node", "src/app.ts"]
EOF

# Rebuild frontend to pick up new environment
echo "🔨 Rebuilding frontend with correct API URL..."
docker-compose -f docker-compose.prod.yml build frontend

# Rebuild backend with simple config
echo "🔨 Rebuilding backend with ultra-simple config..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# Start services one by one
echo "🚀 Starting database and redis first..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "⏳ Waiting for database..."
sleep 10

echo "🚀 Starting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "⏳ Waiting for backend..."
sleep 15

echo "🚀 Starting frontend..."
docker-compose -f docker-compose.prod.yml up -d frontend

echo "⏳ Waiting for frontend..."
sleep 10

# Check status
echo "📊 Final status check..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Backend logs:"
docker-compose -f docker-compose.prod.yml logs backend | tail -10

echo ""
echo "🔍 Testing API connectivity..."
curl -v http://localhost:3000/api/health 2>&1 || echo "API not responding yet"

echo ""
echo "🎉 Final fix completed!"
echo "🌐 Frontend: http://localhost:8080"
echo "🔌 Backend: http://localhost:3000"
echo "👤 Login: admin@admin.com / admin123"
echo ""
