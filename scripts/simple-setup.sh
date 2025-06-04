#!/bin/bash

# Cherry Studio Simple Database Setup
# Minimal script to just create user table and admin user

set -e

echo "🔧 Simple Database Setup"
echo "========================"

# Execute minimal SQL to create admin user
echo "👤 Creating admin user..."

docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d cherry_studio << 'EOF'
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
ON CONFLICT (email) DO NOTHING;

-- Show result
SELECT 'Setup completed!' as status;
SELECT email, name, created_at FROM users WHERE email = 'admin@admin.com';
EOF

echo ""
echo "✅ Simple setup completed!"
echo ""
echo "🎯 Login credentials:"
echo "   Email: admin@admin.com"
echo "   Password: admin123"
echo "   URL: http://localhost:8080"
echo ""
