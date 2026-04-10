# --- Stage 1: Build & Dependencies ---
FROM node:22-bookworm-slim AS build

# Install build essentials only if you have native dependencies (e.g., bcrypt, sharp)
# If you don't have native modules, you can remove the 'apt-get' line.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including devDeps) to build/test if needed
# Use --frozen-lockfile equivalent (npm ci)
RUN npm ci

COPY . .

# Optional: Run build scripts if using TypeScript/Babel
# RUN npm run build

# Prune devDependencies to keep the production layer clean
RUN npm prune --production


# --- Stage 2: Hardened Production Image ---
# We use 'slim' for the final stage to keep 'dumb-init' and basic tools available,
# or you could go Distroless if you want maximum lockdown.
FROM node:22-bookworm-slim AS production

# Install dumb-init for proper PID 1 signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create a dedicated system user
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs harpo

WORKDIR /app

# Copy only the pruned node_modules and necessary source files
COPY --from=build --chown=harpo:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=harpo:nodejs /app/src ./src
COPY --from=build --chown=harpo:nodejs /app/package.json ./package.json

USER harpo

EXPOSE 3000

# Health check using a simple node script to avoid installing curl/wget
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "src/server.js"]