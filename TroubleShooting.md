# 项目管理知识库系统 (PMKS) - 故障排除指南

## 📋 目录

1. [系统概述](#系统概述)
2. [环境要求](#环境要求)
3. [常见问题分类](#常见问题分类)
4. [Docker 相关问题](#docker-相关问题)
5. [数据库连接问题](#数据库连接问题)
6. [前端访问问题](#前端访问问题)
7. [后端服务问题](#后端服务问题)
8. [网络和端口问题](#网络和端口问题)
9. [认证和登录问题](#认证和登录问题)
10. [性能问题](#性能问题)
11. [日志分析](#日志分析)
12. [维护操作](#维护操作)
13. [紧急恢复](#紧急恢复)

---

## 系统概述

PMKS 是一个基于 Docker 的项目管理知识库系统，包含以下组件：
- **前端**: Vue.js + Element Plus (端口: 8080)
- **后端**: Node.js + Express + TypeScript (端口: 3001)
- **数据库**: PostgreSQL (端口: 5433)
- **缓存**: Redis (端口: 6380)

## 环境要求

- **操作系统**: Linux (推荐 Debian/Ubuntu)
- **Docker**: 版本 20.0 或更高
- **Docker Compose**: 版本 2.0 或更高
- **内存**: 最少 4GB
- **存储**: 最少 10GB 可用空间

---

## 常见问题分类

### 🔴 严重级别
- 服务完全无法启动
- 数据库连接失败
- 所有用户无法访问

### 🟡 警告级别
- 部分功能异常
- 性能问题
- 间歇性错误

### 🟢 信息级别
- 配置优化建议
- 维护提醒

---

## Docker 相关问题

### 问题 1: 容器启动失败

**症状**:
```bash
docker-compose -f docker-compose.prod.yml ps
# 显示 Exited 状态
```

**排查步骤**:
```bash
# 1. 查看容器日志
docker-compose -f docker-compose.prod.yml logs [service-name]

# 2. 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 3. 检查系统资源
free -h
df -h
```

**解决方案**:
```bash
# 重新构建并启动
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 问题 2: 端口冲突

**症状**:
```
Error: Bind for 0.0.0.0:80 failed: port is already allocated
```

**排查步骤**:
```bash
# 检查端口占用
netstat -tulpn | grep :80
# 或
lsof -i :80
```

**解决方案**:
```bash
# 方案1: 停止占用端口的服务
sudo systemctl stop nginx  # 如果是nginx占用

# 方案2: 修改端口映射
# 编辑 docker-compose.prod.yml
ports:
  - "8080:80"  # 改为其他端口
```

### 问题 3: 磁盘空间不足

**症状**:
```
no space left on device
```

**排查步骤**:
```bash
# 检查磁盘使用情况
df -h

# 检查Docker占用空间
docker system df
```

**解决方案**:
```bash
# 清理Docker资源
docker system prune -a
docker volume prune

# 清理未使用的镜像
docker image prune -a
```

---

## 数据库连接问题

### 问题 1: Prisma 客户端初始化失败

**症状**:
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

**排查步骤**:
```bash
# 检查后端日志
docker-compose -f docker-compose.prod.yml logs backend

# 进入容器检查
docker exec -it cherry-studio-backend-1 sh
ls -la node_modules/.prisma/
```

**解决方案**:
```bash
# 重新生成Prisma客户端
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate

# 或重新构建后端
docker-compose -f docker-compose.prod.yml build --no-cache backend
docker-compose -f docker-compose.prod.yml up -d
```

### 问题 2: 数据库认证失败

**症状**:
```
Authentication failed against database server at `postgres`
```

**排查步骤**:
```bash
# 检查环境变量
docker-compose -f docker-compose.prod.yml exec backend printenv | grep DATABASE

# 检查数据库连接
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "SELECT 1;"
```

**解决方案**:
```bash
# 重置数据库（注意：会丢失数据）
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d

# 或检查配置文件中的密码设置
```

### 问题 3: Schema 冲突

**症状**:
```
We found changes that cannot be executed:
• Added the required column `modelId` to the `assistants` table
```

**排查步骤**:
```bash
# 检查数据库schema
docker-compose -f docker-compose.prod.yml exec backend npx prisma db pull
```

**解决方案**:
```bash
# 强制重置数据库schema
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push --force-reset
```

---

## 前端访问问题

### 问题 1: 页面加载失败

**症状**:
- 浏览器显示 "无法访问此网站"
- 或显示空白页面

**排查步骤**:
```bash
# 1. 检查前端容器状态
docker-compose -f docker-compose.prod.yml ps frontend

# 2. 检查前端日志
docker-compose -f docker-compose.prod.yml logs frontend

# 3. 测试端口连通性
curl http://localhost:8080
```

**解决方案**:
```bash
# 重启前端服务
docker-compose -f docker-compose.prod.yml restart frontend

# 如果问题持续，重新构建
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d
```

### 问题 2: API 请求失败

**症状**:
```
POST http://172.16.18.174:3001/api/auth/login net::ERR_CONNECTION_REFUSED
```

**排查步骤**:
```bash
# 1. 检查后端服务状态
docker-compose -f docker-compose.prod.yml ps backend

# 2. 测试后端API
curl http://localhost:3001/api/health

# 3. 检查网络连接
docker-compose -f docker-compose.prod.yml exec frontend ping backend
```

**解决方案**:
```bash
# 确保后端服务正常运行
docker-compose -f docker-compose.prod.yml restart backend

# 检查前端环境变量配置
docker-compose -f docker-compose.prod.yml exec frontend printenv | grep VITE_API_URL
```

---

## 后端服务问题

### 问题 1: 服务启动卡住

**症状**:
- 日志显示 "Starting application..." 后无进一步输出
- 健康检查失败

**排查步骤**:
```bash
# 1. 查看详细启动日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 2. 检查进程状态
docker exec -it cherry-studio-backend-1 ps aux

# 3. 检查端口监听
docker exec -it cherry-studio-backend-1 netstat -tulpn
```

**解决方案**:
```bash
# 1. 重启后端服务
docker-compose -f docker-compose.prod.yml restart backend

# 2. 如果问题持续，检查代码错误
docker-compose -f docker-compose.prod.yml logs backend | grep -i error

# 3. 重新构建
docker-compose -f docker-compose.prod.yml build --no-cache backend
docker-compose -f docker-compose.prod.yml up -d
```

### 问题 2: TypeScript 编译错误

**症状**:
```
Module '"@/stores/model"' declares 'Model' locally, but it is not exported
```

**排查步骤**:
```bash
# 检查TypeScript配置
docker exec -it cherry-studio-backend-1 cat tsconfig.json

# 检查源代码
docker exec -it cherry-studio-backend-1 ls -la src/
```

**解决方案**:
```bash
# 清理并重新构建
docker-compose -f docker-compose.prod.yml build --no-cache backend
docker-compose -f docker-compose.prod.yml up -d
```

---

## 网络和端口问题

### 问题 1: 服务间通信失败

**症状**:
- 前端无法连接后端
- 后端无法连接数据库

**排查步骤**:
```bash
# 1. 检查Docker网络
docker network ls
docker network inspect cherry-studio_cherry_network

# 2. 测试服务间连通性
docker exec cherry-studio-frontend-1 ping backend
docker exec cherry-studio-backend-1 ping postgres
```

**解决方案**:
```bash
# 重新创建网络
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 问题 2: 外部访问问题

**症状**:
- 内网可以访问，外网无法访问

**排查步骤**:
```bash
# 1. 检查防火墙设置
sudo ufw status
sudo iptables -L

# 2. 检查端口监听
netstat -tulpn | grep 8080
```

**解决方案**:
```bash
# 开放端口
sudo ufw allow 8080
sudo ufw allow 3001

# 或配置nginx代理
```

---

## 认证和登录问题

### 问题 1: 管理员账户无法登录

**症状**:
```
Authentication failed. Please login again.
POST /api/auth/login 401 (Unauthorized)
```

**排查步骤**:
```bash
# 1. 检查用户是否存在
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "SELECT email, name, \"isActive\" FROM users;"

# 2. 检查后端认证日志
docker-compose -f docker-compose.prod.yml logs backend | grep -i auth
```

**解决方案**:
```bash
# 1. 重新创建管理员用户
docker-compose -f docker-compose.prod.yml exec backend npx ts-node src/seed.ts

# 2. 检查密码哈希
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "SELECT email, password FROM users WHERE email='admin@admin.com';"

# 默认登录凭据:
# Email: admin@admin.com
# Password: admin123
```

### 问题 2: JWT Token 问题

**症状**:
- 登录成功但立即退出
- Token 验证失败

**排查步骤**:
```bash
# 检查JWT配置
docker-compose -f docker-compose.prod.yml exec backend printenv | grep JWT
```

**解决方案**:
```bash
# 确保JWT_SECRET已设置
# 在 docker-compose.prod.yml 中检查环境变量配置
```

---

## 性能问题

### 问题 1: 系统响应慢

**排查步骤**:
```bash
# 1. 检查系统资源
top
free -h
iostat

# 2. 检查Docker资源使用
docker stats

# 3. 检查数据库性能
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "SELECT * FROM pg_stat_activity;"
```

**解决方案**:
```bash
# 1. 增加资源限制
# 在 docker-compose.prod.yml 中添加:
# deploy:
#   resources:
#     limits:
#       memory: 2G
#     reservations:
#       memory: 1G

# 2. 优化数据库
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio -c "VACUUM ANALYZE;"
```

---

## 日志分析

### 实时日志监控
```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres

# 查看最近的日志
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### 日志级别和关键字
```bash
# 查找错误
docker-compose -f docker-compose.prod.yml logs backend | grep -i error

# 查找警告
docker-compose -f docker-compose.prod.yml logs backend | grep -i warn

# 查找数据库相关
docker-compose -f docker-compose.prod.yml logs backend | grep -i database

# 查找认证相关
docker-compose -f docker-compose.prod.yml logs backend | grep -i auth
```

---

## 维护操作

### 定期维护
```bash
# 1. 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres cherry_studio > backup_$(date +%Y%m%d).sql

# 2. 清理Docker资源
docker system prune

# 3. 更新镜像
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 4. 检查日志文件大小
du -sh /var/lib/docker/containers/*/*-json.log
```

### 配置优化
```yaml
# docker-compose.prod.yml 优化建议
version: '3.8'
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 紧急恢复

### 快速重启
```bash
# 紧急重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 如果上述无效，完全重启
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 从备份恢复
```bash
# 1. 停止服务
docker-compose -f docker-compose.prod.yml down

# 2. 恢复数据库
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cherry_studio < backup_20240604.sql

# 3. 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

### 重置系统（清除所有数据）
```bash
# ⚠️ 警告：此操作将删除所有数据
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

---

## 联系信息

如遇到本文档未涵盖的问题，请：

1. **收集信息**：
   ```bash
   # 生成系统信息报告
   echo "=== System Info ===" > debug_report.txt
   uname -a >> debug_report.txt
   docker --version >> debug_report.txt
   docker-compose --version >> debug_report.txt
   
   echo "=== Service Status ===" >> debug_report.txt
   docker-compose -f docker-compose.prod.yml ps >> debug_report.txt
   
   echo "=== Recent Logs ===" >> debug_report.txt
   docker-compose -f docker-compose.prod.yml logs --tail=50 >> debug_report.txt
   ```

2. **检查状态**：确保已尝试上述排除步骤

3. **记录详细错误信息**：包括错误消息、发生时间、操作步骤

---

**最后更新**: 2024-06-04  
**版本**: 1.0  
**维护者**: PMKS 技术团队