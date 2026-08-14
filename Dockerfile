# Use the official Node.js runtime as the base image
FROM node:24 AS build

# Set the working directory in the container
WORKDIR /app

# Copy package files for the monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/isenax-lib/package.json ./packages/isenax-lib/
COPY packages/isenax-app/package.json ./packages/isenax-app/
COPY packages/isenax-backend/package.json ./packages/isenax-backend/
COPY packages/isenax-mcp/package.json ./packages/isenax-mcp/

# Install dependencies for the entire workspace
RUN corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile

# Copy the entire monorepo code
COPY . .

# Build the library first, then the app
RUN pnpm run build:lib && pnpm run build:app

# isenax-backend depends on the isenax-mcp workspace package (which itself
# depends on isenax-lib's built standalone bundle) via "workspace:*" -- a
# plain `npm install` in the slim final stage can't resolve that protocol at
# all. `pnpm deploy` resolves workspace deps into a real, self-contained
# node_modules instead, so the final stage can just copy it over.
RUN pnpm --filter=isenax-backend deploy --prod --legacy /app/deploy/backend

# Use Node with nginx for production
FROM node:24-alpine

# Install web server packages
RUN apk add --no-cache nginx openssl su-exec

# Copy backend code (already deployed with resolved workspace deps, see build stage)
COPY --from=build /app/deploy/backend /app/packages/isenax-backend

WORKDIR /app/packages/isenax-backend

# Copy the built React app to Nginx's web server directory
COPY --from=build /app/packages/isenax-app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data directory for persistent storage
RUN mkdir -p /data/diagrams

# Expose ports
EXPOSE 80 3001

# Environment variables with defaults
ENV ENABLE_SERVER_STORAGE=true
ENV STORAGE_PATH=/data/diagrams
ENV BACKEND_PORT=3001

# Start services
ENTRYPOINT ["/docker-entrypoint.sh"]
