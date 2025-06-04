#!/bin/bash

# Cherry Studio Database Reset Script
# This script completely resets the database and reinitializes it

set -e

echo "⚠️  Cherry Studio Database Reset"
echo "================================="
echo ""
echo "This will PERMANENTLY DELETE all data in the Cherry Studio database!"
echo "This action cannot be undone."
echo ""

# Auto-confirm for production use (remove read command)
echo "🗑️  Resetting database..."

# Configuration
DB_NAME=${DB_NAME:-cherry_studio}
DB_USER=${DB_USER:-postgres}

# Drop and recreate database
echo "📝 Dropping and recreating database..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo "✅ Database recreated successfully."

# Run initialization script
echo "🔧 Running database initialization..."
./scripts/init-database.sh

echo ""
echo "🎉 Database reset completed successfully!"
echo "📋 Default admin user has been created:"
echo "   Email: admin@admin.com"
echo "   Password: admin123"
echo ""
