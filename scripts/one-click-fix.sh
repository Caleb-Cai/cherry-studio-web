#!/bin/bash

# Cherry Studio One-Click Fix
# This script fixes all known issues and gets the system running

set -e

echo "🍒 Cherry Studio One-Click Fix"
echo "=============================="
echo ""

# Step 1: Stop all services
echo "🛑 Step 1: Stopping all services..."
docker-compose -f docker-compose.prod.yml down

# Step 2: Clean up
echo "🧹 Step 2: Cleaning up..."
docker system prune -f || true

# Step 3: Rebuild backend with fixed configuration
echo "🔨 Step 3: Rebuilding backend..."
docker-compose -f docker-compose.prod.yml build backend

# Step 4: Start all services
echo "🚀 Step 4: Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 5: Wait for services
echo "⏳ Step 5: Waiting for services to start..."
sleep 30

# Step 6: Initialize database
echo "🗄️ Step 6: Ensuring database is ready..."
./scripts/simple-setup.sh

# Step 7: Test everything
echo "🔍 Step 7: Testing services..."

# Check container status
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

# Test backend API
echo ""
echo "🔍 Testing Backend API..."
for i in {1..10}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is responding!"
    break
  else
    echo "⏳ Attempt $i: Backend not ready yet, waiting..."
    sleep 3
  fi
done

# Test frontend
echo ""
echo "🔍 Testing Frontend..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
  echo "✅ Frontend is responding!"
else
  echo "⚠️ Frontend may not be ready yet"
fi

# Test login API
echo ""
echo "🔍 Testing Login API..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}' || echo "000")

if [[ "$RESPONSE" == *"200"* ]] || [[ "$RESPONSE" == *"400"* ]]; then
  echo "✅ Login API is responding!"
else
  echo "⚠️ Login API not ready: HTTP $RESPONSE"
fi

echo ""
echo "🎉 Fix completed!"
echo ""
echo "📱 Access Information:"
echo "   Frontend URL: http://localhost:8080"
echo "   Backend API: http://localhost:3000"
echo ""
echo "👤 Login Credentials:"
echo "   Email: admin@admin.com"
echo "   Password: admin123"
echo ""

# Show any backend errors
echo "📋 Recent Backend Logs:"
docker-compose -f docker-compose.prod.yml logs backend | tail -5

echo ""
echo "💡 If login still fails, run: docker-compose -f docker-compose.prod.yml logs backend"
echo ""
