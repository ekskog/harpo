# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

# Install security updates
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code and build the application
COPY . .
RUN npm run build

# --- Stage 2: Production Stage ---
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade

# 1. Copy your hardcoded nginx configuration directly to the final destination.
# This prevents any "templates" or "envsubst" scripts from overwriting it.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Copy the built Vue/Vite files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 3000 to match your Kubernetes service/deployment
EXPOSE 3000

# Health check using wget (standard in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 3. Use the standard Nginx execution command.
# We no longer use 'sh -c' or 'envsubst' to avoid pulling in stale env vars.
CMD ["nginx", "-g", "daemon off;"]