# Build stage
FROM node:20-alpine AS builder

# Install security updates
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Copy custom nginx configuration template and substitute env at start
COPY nginx.conf /etc/nginx/template.conf

# Default backend (in-cluster service). Can be overridden at runtime.
ENV BACKEND_URL=http://harp-api.harp.svc.cluster.local:80

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 3000 (matches k8s deployment)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Install envsubst (gettext) and start nginx after substituting template
RUN apk add --no-cache gettext

CMD sh -c "envsubst '$BACKEND_URL' < /etc/nginx/template.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
