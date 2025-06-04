FROM node:18-alpine

# 安装必要的系统依赖
RUN apk add --no-cache dumb-init curl openssl openssl-dev

# 创建用户
RUN addgroup -g 1001 -S nodejs && adduser -S cherry -u 1001

WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm install --force --legacy-peer-deps && npm cache clean --force

# 复制Prisma schema
COPY prisma ./prisma

# 设置Prisma环境变量
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_GENERATE_SKIP_DOWNLOAD=false

# 生成Prisma客户端
RUN npx prisma generate

# 复制应用代码
COPY src ./src

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 创建必要目录
RUN mkdir -p uploads logs && chown -R cherry:nodejs . uploads logs

# 切换到应用用户
USER cherry

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

# 使用启动脚本
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["dumb-init", "npx", "ts-node", "src/app.ts"]