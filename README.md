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
docker-compose up -d
```

## 主要功能

### ✅ 已实现功能
- 🔐 用户认证系统 (注册/登录/JWT)
- 💬 AI 对话功能 (支持 OpenAI, Anthropic 等)
- 📁 文件上传和处理 (PDF, DOCX, TXT)
- 🤖 AI 助手管理
- 🔄 实时流式响应
- 📱 响应式设计
- 🌙 暗色模式支持

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
├── docker-compose.yml     # 容器编排
└── updated.md            # 详细改造记录
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

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库是否运行
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

### 日志查看

```bash
# 查看后端日志
docker-compose logs backend

# 查看前端日志
docker-compose logs frontend

# 查看数据库日志
docker-compose logs postgres
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

## 联系我们

- 项目主页: [Cherry Studio](https://github.com/CherryHQ/cherry-studio)
- 文档站点: [docs.cherry-ai.com](https://docs.cherry-ai.com)
- 问题反馈: [GitHub Issues](https://github.com/CherryHQ/cherry-studio/issues)
- 社区讨论: [GitHub Discussions](https://github.com/CherryHQ/cherry-studio/discussions)

---

🍒 **感谢使用 Cherry Studio!** 如果这个项目对您有帮助，请考虑给我们一个 ⭐ Star!
