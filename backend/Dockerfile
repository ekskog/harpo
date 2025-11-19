
## Multi-arch multi-stage Dockerfile
ARG NODE_VERSION=20
ARG TARGETPLATFORM

## Stage 1: build (runs on build platform)
FROM --platform=${TARGETPLATFORM} node:${NODE_VERSION}-alpine AS build
WORKDIR /usr/src/app

# Install build dependencies (dev + prod) to compile TypeScript
# Use `npm ci` when a lockfile exists for reproducible builds, otherwise fall back to `npm install`.
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
			npm ci --prefer-offline --no-audit --no-fund; \
		else \
			npm install --no-audit --no-fund; \
		fi

# Copy sources and build
COPY tsconfig.json ./
COPY src ./src
COPY .eslintrc.json ./
COPY .env.example ./
RUN npm run build

## Stage 2: runtime (use runtime platform image)
FROM --platform=${TARGETPLATFORM} node:${NODE_VERSION}-alpine AS runtime
WORKDIR /usr/src/app

# Create a non-root user for better security
RUN addgroup -S app && adduser -S app -G app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
			npm ci --omit=dev --prefer-offline --no-audit --no-fund; \
		else \
			npm install --omit=dev --no-audit --no-fund; \
		fi

# Copy compiled output and set permissions
COPY --from=build /usr/src/app/dist ./dist
RUN chown -R app:app /usr/src/app

USER app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "./dist/index.js"]
