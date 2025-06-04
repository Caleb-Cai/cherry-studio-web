#!/bin/bash

# Cherry Studio Manual Database Creation Script
# Use this if the automatic initialization fails

set -e

echo "🔧 Manual Database Creation"
echo "============================"

# Configuration
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-cherry_studio}

echo "📝 Connecting to database and creating tables manually..."

# Create tables and insert admin user
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -d $DB_NAME << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (password: admin123)
INSERT INTO users (email, name, password) 
VALUES ('admin@admin.com', 'Admin User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  updated_at = CURRENT_TIMESTAMP;

-- Verify user creation
SELECT 'Users created:' as info;
SELECT id, email, name, created_at FROM users;

-- Show tables
\dt
EOF

echo ""
echo "✅ Manual database creation completed!"
echo ""
echo "👤 Admin user created:"
echo "   Email: admin@admin.com"
echo "   Password: admin123"
echo ""
