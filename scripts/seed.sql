-- Cherry Studio Database Seed Data
-- This file contains initial data for Cherry Studio

-- Insert default admin user
-- Password: admin123 (bcrypt hash with salt rounds 10)
INSERT INTO users (email, name, password) 
VALUES (
  'admin@admin.com', 
  'Admin User', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
) ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  updated_at = CURRENT_TIMESTAMP;

-- Get the admin user ID for reference
-- Note: In actual usage, you would replace this with the actual UUID
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@admin.com';
    
    -- Insert sample assistants
    INSERT INTO assistants (name, description, emoji, category, model_id, model_name, provider, system_prompt, user_id, is_public) VALUES
    (
        'Code Assistant',
        'A helpful coding assistant that can help with programming tasks',
        '💻',
        'Development',
        'gpt-4',
        'GPT-4',
        'openai',
        'You are a helpful coding assistant. You help users write, debug, and explain code in various programming languages. Always provide clear explanations and best practices.',
        admin_user_id,
        true
    ),
    (
        'Writing Assistant',
        'An AI assistant specialized in writing and content creation',
        '✍️',
        'Writing',
        'gpt-4',
        'GPT-4',
        'openai',
        'You are a professional writing assistant. You help users with creative writing, editing, proofreading, and content creation. Focus on clarity, grammar, and engaging content.',
        admin_user_id,
        true
    ),
    (
        'Research Assistant',
        'An assistant that helps with research and data analysis',
        '🔍',
        'Research',
        'gpt-4',
        'GPT-4',
        'openai',
        'You are a research assistant. You help users find information, analyze data, and provide insights on various topics. Always cite sources when possible and provide accurate information.',
        admin_user_id,
        true
    ),
    (
        'Language Tutor',
        'A friendly language learning assistant',
        '🌍',
        'Education',
        'gpt-4',
        'GPT-4',
        'openai',
        'You are a friendly language tutor. You help users learn new languages through conversation, grammar explanations, and vocabulary building. Be patient and encouraging.',
        admin_user_id,
        true
    ),
    (
        'Creative Assistant',
        'An assistant for creative projects and brainstorming',
        '🎨',
        'Creative',
        'gpt-4',
        'GPT-4',
        'openai',
        'You are a creative assistant. You help users with brainstorming, creative problem-solving, and artistic projects. Think outside the box and encourage creativity.',
        admin_user_id,
        true
    );
    
    -- Insert a sample chat
    INSERT INTO chats (title, model_id, model_name, provider, user_id) VALUES
    (
        'Welcome to Cherry Studio',
        'gpt-4',
        'GPT-4',
        'openai',
        admin_user_id
    );
    
END $$;

-- Display created data
SELECT 'Created Users:' as info;
SELECT id, email, name, created_at FROM users;

SELECT 'Created Assistants:' as info;
SELECT id, name, category, emoji, is_public FROM assistants;

SELECT 'Created Chats:' as info;  
SELECT id, title, model_name, provider FROM chats;
