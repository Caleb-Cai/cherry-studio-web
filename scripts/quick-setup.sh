#!/bin/bash

# Cherry Studio Quick Setup Script
# This script performs a complete setup of Cherry Studio

set -e

echo "🍒 Cherry Studio Quick Setup"
echo "============================"
echo ""

# Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down || true

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Initialize database
echo "🗄️ Initializing database..."
./scripts/init-database.sh

echo ""
echo "🎉 Cherry Studio setup completed successfully!"
echo ""
echo "📱 You can now access Cherry Studio at:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:3000"
echo ""
echo "👤 Default Admin User:"
echo "   Email: admin@admin.com"
echo "   Password: admin123"
echo ""
echo "🔧 Available management scripts:"
echo "   ./scripts/init-database.sh - Initialize database"
echo "   ./scripts/reset-database.sh - Reset database"
echo "   ./scripts/generate-password-hash.sh <password> - Generate password hash"
echo ""
