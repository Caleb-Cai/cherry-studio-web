#!/bin/bash

# Step by step fix
echo "🔧 Step-by-Step Fix"
echo "==================="

echo "Step 1: Check what's wrong with backend..."
docker-compose -f docker-compose.prod.yml logs backend

echo ""
echo "Step 2: Stop all services..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "Step 3: Start database only..."
docker-compose -f docker-compose.prod.yml up -d postgres redis
sleep 10

echo ""
echo "Step 4: Ensure database is ready..."
./scripts/simple-setup.sh

echo ""
echo "Step 5: Rebuild and start backend..."
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml up -d backend

echo ""
echo "Step 6: Wait and check backend..."
sleep 20
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs backend | tail -10

echo ""
echo "Step 7: Start frontend..."
docker-compose -f docker-compose.prod.yml up -d frontend

echo ""
echo "Step 8: Final check..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Step-by-step fix completed!"
