# Multi-stage build for production

# Stage 1: Build Next.js client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:18-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

# Copy server dependencies and code
COPY --from=server-builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server ./server

# Copy client build
COPY --from=client-builder /app/client/.next ./client/.next
COPY --from=client-builder /app/client/public ./client/public
COPY --from=client-builder /app/client/package.json ./client/

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["npm", "start"]
