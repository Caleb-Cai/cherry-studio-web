#!/bin/bash

# Cherry Studio Quick Backend Fix
# Simple fix for the yarn lockfile issue

set -e

echo "🔧 Quick Backend Fix"
echo "==================="

# Stop backend
echo "🛑 Stopping backend..."
docker-compose -f docker-compose.prod.yml stop backend

# Remove yarn.lock to avoid conflicts
echo "🧹 Removing yarn.lock..."
rm -f backend/yarn.lock

# Rebuild backend with npm
echo "🔨 Rebuilding backend with npm..."
docker-compose -f docker-compose.prod.yml build backend

# Start backend
echo "🚀 Starting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

# Wait and test
echo "⏳ Waiting for backend to start..."
sleep 20

# Check status
echo "📊 Checking backend status..."
docker-compose -f docker-compose.prod.yml logs backend | tail -10

# Test API
echo "🔍 Testing API..."
for i in {1..5}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is responding!"
    break
  elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Backend is responding!"
    break
  else
    echo "⏳ Attempt $i: Backend not ready yet..."
    sleep 5
  fi
done

echo ""
echo "🎉 Quick fix completed!"
echo "💡 Try logging in now at: http://localhost:8080"
echo ""
