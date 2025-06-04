# Cherry Studio Web Edition

🍒 Cherry Studio 已成功改造为基于 Vue.js 的现代化 Web 应用！

## 项目概述

这是 Cherry Studio 的 Web 版本，将原本的 Electron 桌面应用重构为前后端分离的 Web 应用架构。新版本保持了原有的核心功能，同时增加了多用户支持、实时协作和云端部署能力。

## 技术栈

### 后端 (Backend)
- **框架**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **实时通信**: Socket.io
- **认证**: JWT
- **文件处理**: Multer + pdf-parse + mammoth

### 前端 (Frontend)
- **框架**: Vue.js 3 + TypeScript
- **构建工具**: Vite
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: CSS + SCSS

### 部署
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx
- **进程管理**: PM2

## 快速开始

### 开发环境

1. **克隆项目**
```bash
git clone <repository-url>
cd cherry-studio
```

2. **启动后端服务**
```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 文件，配置数据库和 AI API 密钥
npm run dev
```

3. **启动前端服务**
```bash
cd frontend
npm install
cp .env.example .env
# 编辑 .env 文件，配置 API 地址
npm run dev
```

4. **数据库设置**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 生产部署

使用 Docker Compose 一键部署：

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 初始化数据库
chmod +x scripts/init-database.sh
./scripts/init-database.sh
```

## 数据库管理

### 初始化数据库

项目提供了完整的数据库管理脚本：

```bash
# 初始化数据库和创建默认用户
./scripts/init-database.sh

# 重置数据库（删除所有数据）
./scripts/reset-database.sh

# 生成密码哈希
./scripts/generate-password-hash.sh mypassword123
```

### 默认管理员账户

数据库初始化后会自动创建管理员账户：

- **邮箱**: `admin@admin.com`
- **密码**: `admin123`

### 手动数据库操作

如果需要手动操作数据库：

```bash
# 连接数据库
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio

# 运行 schema 文件
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -f /path/to/scripts/schema.sql

# 运行 seed 数据
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -f /path/to/scripts/seed.sql
```

### 数据库结构

主要数据表：

- **users** - 用户信息
- **chats** - 对话记录
- **messages** - 消息内容
- **assistants** - AI 助手配置
- **files** - 文件上传记录

详细的数据库 schema 请查看 `scripts/schema.sql`。

## 主要功能

### ✅ 已实现功能
- 🔐 用户认证系统 (注册/登录/JWT)
- 💬 AI 对话功能 (支持 OpenAI, Anthropic 等)
- 📁 文件上传和处理 (PDF, DOCX, TXT)
- 🤖 AI 助手管理
- 🔄 实时流式响应
- 📱 响应式设计
- 🌙 暗色模式支持
- 🗄️ 完整的数据库管理脚本

### 🔄 开发中功能
- 📚 知识库集成
- 🔍 高级搜索功能
- 👥 团队协作
- 📊 使用统计分析

### 📋 计划功能
- 🔌 插件系统
- 🎨 主题自定义
- 📈 高级分析
- 🌐 多语言支持

## API 文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh-token` - 刷新令牌

### 对话管理
- `GET /api/chats` - 获取对话列表
- `POST /api/chats` - 创建新对话
- `GET /api/chats/:id` - 获取对话详情
- `POST /api/chats/:id/messages` - 发送消息

### 文件管理
- `POST /api/files/upload` - 上传文件
- `GET /api/files` - 获取文件列表
- `GET /api/files/:id/content` - 获取文件内容

### 模型管理
- `GET /api/models` - 获取可用模型
- `GET /api/models/providers` - 获取服务商列表
- `POST /api/models/test` - 测试模型

## 环境变量配置

### 后端环境变量 (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/cherry_studio
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 前端环境变量 (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=Cherry Studio
```

## 项目结构

```
cherry-studio/
├── backend/                 # Node.js 后端
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务服务
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   └── utils/          # 工具函数
│   ├── prisma/             # 数据库模型
│   └── uploads/            # 文件存储
├── frontend/               # Vue.js 前端
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   ├── views/         # 页面视图
│   │   ├── stores/        # 状态管理
│   │   ├── services/      # API 服务
│   │   └── router/        # 路由配置
├── scripts/               # 数据库管理脚本
│   ├── init-database.sh   # 数据库初始化
│   ├── reset-database.sh  # 数据库重置
│   ├── schema.sql         # 数据库结构
│   ├── seed.sql           # 初始数据
│   └── generate-password-hash.sh  # 密码哈希生成
├── docker-compose.yml     # 容器编排
├── docker-compose.prod.yml # 生产环境配置
└── README.md             # 项目文档
```

## 部署指南

### 生产环境部署步骤

1. **准备环境**
```bash
# 克隆项目
git clone <repository-url>
cd cherry-studio

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置生产环境配置
```

2. **启动服务**
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动完成
sleep 30
```

3. **初始化数据库**
```bash
# 运行数据库初始化脚本
chmod +x scripts/*.sh
./scripts/init-database.sh
```

4. **验证部署**
```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 测试前端访问
curl http://localhost:8080

# 测试后端 API
curl http://localhost:3000/api/health
```

### 域名和 SSL 配置

如果要使用自定义域名，请修改 `frontend/nginx.conf` 并配置 SSL 证书。

### 数据备份

定期备份数据库：

```bash
# 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres cherry_studio > backup.sql

# 恢复数据库
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres cherry_studio < backup.sql
```

## 开发指南

### 添加新的 AI 服务商

1. 在 `backend/src/services/ai.service.ts` 中添加新的服务商客户端
2. 实现对应的聊天和流式响应方法
3. 在 `backend/src/controllers/model.controller.ts` 中添加模型配置
4. 更新前端的模型选择器组件

### 添加新的文件类型支持

1. 在 `backend/src/middleware/upload.ts` 中添加 MIME 类型
2. 在 `backend/src/services/file.service.ts` 中实现文本提取逻辑
3. 测试文件处理功能

### 自定义主题

1. 修改 `frontend/src/styles/global.css` 中的 CSS 变量
2. 使用 Element Plus 的主题定制功能
3. 添加主题切换功能

### 添加新用户

1. **使用注册功能** - 在登录页面点击"Sign up here"
2. **使用脚本生成密码哈希**:
```bash
./scripts/generate-password-hash.sh newpassword123
```
3. **手动插入数据库**:
```sql
INSERT INTO users (email, name, password) 
VALUES ('user@example.com', 'User Name', 'generated_hash');
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库是否运行: `docker-compose -f docker-compose.prod.yml logs postgres`
   - 验证 DATABASE_URL 配置
   - 确认数据库权限

2. **AI API 调用失败**
   - 检查 API 密钥配置
   - 验证网络连接
   - 确认 API 限额

3. **Socket.io 连接问题**
   - 检查防火墙设置
   - 验证 CORS 配置
   - 确认端口开放

4. **前端无法访问后端**
   - 检查 VITE_API_URL 配置
   - 验证后端服务状态
   - 确认端口映射

5. **后端 TypeScript 编译错误**
   - 安装缺失的类型定义: `npm install --save-dev @types/express @types/node`
   - 修改 tsconfig.json 配置
   - 使用 `--transpile-only` 跳过类型检查

### 日志查看

```bash
# 查看后端日志
docker-compose -f docker-compose.prod.yml logs backend

# 查看前端日志
docker-compose -f docker-compose.prod.yml logs frontend

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs postgres

# 实时查看所有日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 容器管理

```bash
# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend

# 重新构建服务
docker-compose -f docker-compose.prod.yml build backend

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 完全清理（包括数据卷）
docker-compose -f docker-compose.prod.yml down -v
```

### 数据库故障排除

```bash
# 检查数据库连接
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# 查看数据库表
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "\dt"

# 检查用户表
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "SELECT * FROM users;"

# 重新初始化数据库
./scripts/reset-database.sh
```

## 性能优化

### 前端优化

1. **代码分割**: 使用动态导入优化首屏加载
2. **缓存策略**: 配置适当的 HTTP 缓存头
3. **压缩**: 启用 gzip/brotli 压缩
4. **CDN**: 使用 CDN 加速静态资源

### 后端优化

1. **数据库索引**: 根据查询模式优化索引
2. **连接池**: 配置数据库连接池
3. **缓存**: 使用 Redis 缓存热点数据
4. **负载均衡**: 多实例部署

### 数据库优化

1. **定期清理**: 清理过期的会话和临时数据
2. **分析查询**: 使用 EXPLAIN 分析慢查询
3. **配置调优**: 根据服务器资源调整 PostgreSQL 配置

## 安全考虑

### 认证和授权

- JWT 令牌有效期管理
- 密码复杂度要求
- 用户权限控制
- API 速率限制

### 数据保护

- 敏感数据加密存储
- SQL 注入防护
- XSS 攻击防护
- CSRF 保护

### 网络安全

- HTTPS 强制使用
- 安全 headers 配置
- 防火墙规则
- 定期安全更新

## 监控和日志

### 应用监控

```bash
# 查看容器资源使用
docker stats

# 查看应用健康状态
curl http://localhost:3000/api/health
```

### 日志管理

- 结构化日志记录
- 日志轮转配置
- 错误日志告警
- 访问日志分析

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 和 Prettier 格式化代码
- 遵循 TypeScript 最佳实践
- 编写单元测试
- 更新相关文档

### 提交规范

使用约定式提交格式：
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建工具

## 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

## 联系我们

- 项目主页: [Cherry Studio](https://github.com/CherryHQ/cherry-studio)
- 文档站点: [docs.cherry-ai.com](https://docs.cherry-ai.com)
- 问题反馈: [GitHub Issues](https://github.com/CherryHQ/cherry-studio/issues)
- 社区讨论: [GitHub Discussions](https://github.com/CherryHQ/cherry-studio/discussions)

## 更新日志

### v1.0.0 (当前版本)
- ✅ 完成从 Electron 到 Web 的架构迁移
- ✅ 实现前后端分离架构
- ✅ 添加多用户支持
- ✅ 集成 Docker 容器化部署
- ✅ 完善数据库管理脚本
- ✅ 优化 TypeScript 配置和错误处理

### 即将发布
- 🔄 知识库功能增强
- 🔄 性能优化和缓存策略
- 🔄 移动端适配改进
- 🔄 插件系统架构

---

🍒 **感谢使用 Cherry Studio!** 如果这个项目对您有帮助，请考虑给我们一个 ⭐ Star!

## 快速故障解决

如果遇到问题，可以尝试以下快速解决方案：

```bash
# 一键重置和重新部署
./scripts/reset-database.sh && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d && ./scripts/init-database.sh
```

然后使用默认账户登录：
- **邮箱**: admin@admin.com  
- **密码**: admin123
