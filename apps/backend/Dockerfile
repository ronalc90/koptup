# Multi-stage build for Node.js backend

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/package.json ./
COPY --from=deps --chown=expressjs:nodejs /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p ./uploads && chown -R expressjs:nodejs ./uploads

USER expressjs

EXPOSE 3001

CMD ["node", "dist/index.js"]
