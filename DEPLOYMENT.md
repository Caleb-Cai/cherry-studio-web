# Cherry Studio 部署说明

## 📦 完整的数据库管理脚本已创建

我已经为你的 Cherry Studio 项目创建了完整的数据库管理脚本和更新了 README 文件。

### 🗄️ 创建的数据库脚本

1. **scripts/init-database.sh** - 数据库初始化脚本
   - 自动创建所有必要的数据表
   - 创建默认管理员账户
   - 设置数据库索引和约束

2. **scripts/schema.sql** - 完整的数据库结构
   - 用户表 (users)
   - 对话表 (chats)  
   - 消息表 (messages)
   - 助手表 (assistants)
   - 文件表 (files)
   - 所有相关的索引和外键约束

3. **scripts/seed.sql** - 初始数据
   - 默认管理员账户
   - 示例 AI 助手
   - 示例对话

4. **scripts/generate-password-hash.sh** - 密码哈希生成工具
   - 支持 Node.js bcrypt
   - 支持 Python bcrypt
   - 生成安全的密码哈希

5. **scripts/reset-database.sh** - 数据库重置脚本
   - 完全重置数据库
   - 重新初始化所有数据

## 🚀 快速部署步骤

### 1. 上传脚本到服务器

```bash
# 上传所有脚本文件
scp -r E:\ClaudeTesting\cherry-studio-git\cherry-studio\scripts\ root@172.16.18.174:/opt/cherry-studio/

# 上传更新的 README
scp E:\ClaudeTesting\cherry-studio-git\cherry-studio\README.md root@172.16.18.174:/opt/cherry-studio/
```

### 2. 在服务器上执行

```bash
# 连接到服务器
ssh root@172.16.18.174

# 进入项目目录
cd /opt/cherry-studio

# 设置脚本执行权限
chmod +x scripts/*.sh

# 运行数据库初始化
./scripts/init-database.sh
```

### 3. 验证部署

执行脚本后，你应该能够：

1. **访问前端**: http://172.16.18.174:8080
2. **使用管理员账户登录**:
   - 邮箱: `admin@admin.com`
   - 密码: `admin123`

## 🔧 脚本功能说明

### 数据库初始化脚本特性

- ✅ 自动等待数据库启动
- ✅ 创建完整的数据库结构
- ✅ 设置性能优化索引
- ✅ 创建默认管理员用户
- ✅ 支持环境变量配置
- ✅ 错误处理和日志输出

### 默认创建的内容

**管理员账户**:
- Email: admin@admin.com
- Password: admin123
- Name: Admin User

**示例 AI 助手**:
- 💻 Code Assistant - 编程助手
- ✍️ Writing Assistant - 写作助手  
- 🔍 Research Assistant - 研究助手
- 🌍 Language Tutor - 语言导师
- 🎨 Creative Assistant - 创意助手

### 数据库表结构

```sql
users (用户表)
├── id (UUID, 主键)
├── email (邮箱, 唯一)
├── name (姓名)
├── password (密码哈希)
├── avatar (头像)
└── 时间戳字段

chats (对话表)
├── id (UUID, 主键)
├── title (标题)
├── model_id (模型ID)
├── model_name (模型名称)
├── provider (服务商)
├── user_id (用户ID, 外键)
├── is_archived (是否归档)
└── 时间戳字段

messages (消息表)
├── id (UUID, 主键)
├── chat_id (对话ID, 外键)
├── role (角色: user/assistant/system)
├── content (内容)
├── metadata (元数据, JSON)
├── tokens (token数量)
└── created_at (创建时间)

assistants (助手表)
├── id (UUID, 主键)
├── name (名称)
├── description (描述)
├── emoji (表情符号)
├── category (分类)
├── model_id (模型ID)
├── provider (服务商)
├── system_prompt (系统提示)
├── temperature (温度参数)
├── max_tokens (最大token)
├── user_id (用户ID, 外键)
├── is_public (是否公开)
├── tags (标签数组)
└── 时间戳字段

files (文件表)
├── id (UUID, 主键)
├── filename (文件名)
├── original_name (原始名称)
├── mime_type (MIME类型)
├── size (文件大小)
├── path (文件路径)
├── user_id (用户ID, 外键)
└── created_at (创建时间)
```

## 📋 使用方法

### 常用数据库操作

```bash
# 初始化数据库（首次部署）
./scripts/init-database.sh

# 重置数据库（清空所有数据）
./scripts/reset-database.sh

# 生成新的密码哈希
./scripts/generate-password-hash.sh "mynewpassword"

# 手动连接数据库
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio
```

### 添加新用户

```bash
# 方法1: 生成密码哈希后手动插入
./scripts/generate-password-hash.sh "userpassword"

# 方法2: 在数据库中直接插入
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "
INSERT INTO users (email, name, password) 
VALUES ('newuser@example.com', 'New User', 'generated_hash_here');
"
```

### 数据备份和恢复

```bash
# 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres cherry_studio > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres cherry_studio < backup_file.sql
```

## 🎯 现在你可以...

1. **登录系统** - 使用 admin@admin.com / admin123
2. **创建对话** - 开始与 AI 助手聊天
3. **管理助手** - 自定义 AI 助手
4. **上传文件** - 处理文档和文件
5. **添加用户** - 为团队成员创建账户

## 🔍 故障排除

如果遇到问题：

1. **检查服务状态**: `docker-compose -f docker-compose.prod.yml ps`
2. **查看日志**: `docker-compose -f docker-compose.prod.yml logs`
3. **重新初始化**: `./scripts/reset-database.sh`
4. **联系支持**: 提供详细的错误日志

---

所有脚本都已经创建完成，现在你的 Cherry Studio 项目具备了完整的数据库管理能力！🎉
