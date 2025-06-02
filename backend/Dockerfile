# Cherry Studio Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cherry -u 1001

# Copy built application
COPY --from=builder --chown=cherry:nodejs /app/dist ./dist
COPY --from=builder --chown=cherry:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cherry:nodejs /app/package*.json ./
COPY --from=builder --chown=cherry:nodejs /app/prisma ./prisma

# Create directories
RUN mkdir -p uploads logs && chown -R cherry:nodejs uploads logs

# Switch to app user
USER cherry

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Start the application
CMD ["dumb-init", "node", "dist/app.js"]
