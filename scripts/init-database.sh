#!/bin/bash

# Cherry Studio Database Initialization Script (TTY Fixed)
# This script initializes the database and creates a default admin user

set -e

echo "🗄️ Cherry Studio Database Initialization"
echo "========================================"

# Configuration
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-cherry_studio}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@admin.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
ADMIN_NAME=${ADMIN_NAME:-Admin User}

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U $DB_USER -d $DB_NAME; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"
echo "🔧 Initializing database schema..."

# Create schema SQL file in container
echo "📝 Creating database schema and admin user..."

# Execute SQL commands directly
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -d $DB_NAME << 'EOSQL'
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

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  model_id VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  tokens INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Create assistants table
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  category VARCHAR(100),
  model_id VARCHAR(255) NOT NULL,
  model_name VARCHAR(255),
  provider VARCHAR(255) NOT NULL,
  system_prompt TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  avatar VARCHAR(500),
  user_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  path VARCHAR(500) NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_assistants_user_id ON assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_is_public ON assistants(is_public);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- Insert admin user (password: admin123)
INSERT INTO users (email, name, password) 
VALUES ('admin@admin.com', 'Admin User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) 
DO UPDATE SET 
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  updated_at = CURRENT_TIMESTAMP;

-- Show created tables
SELECT 'Database tables created:' as info;
\dt

-- Show created admin user
SELECT 'Admin user created:' as info;
SELECT id, email, name, created_at FROM users WHERE email = 'admin@admin.com';
EOSQL

echo ""
echo "🎉 Database initialization completed successfully!"
echo ""
echo "📋 Default Admin User:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "💡 You can now login to Cherry Studio with these credentials."
echo "🌐 Frontend URL: http://localhost:8080"
echo ""
