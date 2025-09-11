# Multi-stage build for React frontend
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Build stage
FROM base AS build
COPY . .
RUN npm ci && npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Create nginx user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create directory for nginx PID and logs
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/log/nginx && \
    mkdir -p /var/run && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /var/run && \
    chown -R nodejs:nodejs /usr/share/nginx/html

# Switch to nodejs user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
