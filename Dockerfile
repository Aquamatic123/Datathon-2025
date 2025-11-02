# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js standalone output - copy the entire standalone directory structure
# This copies server.js, node_modules, package.json, and other required files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files - Next.js expects them at .next/static relative to where server.js runs
# Static files must be accessible for serving assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Note: public directory is automatically included in .next/standalone by Next.js

# Database connection is handled via AWS Aurora DSQL using environment variables
# No local data files needed - all data is stored in the PostgreSQL database



USER nextjs

# Expose port 3000 for AWS App Runner
EXPOSE 3000

# Set environment variables for Next.js to listen on all interfaces
# This is critical for AWS App Runner health checks
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone creates server.js at the root of .next/standalone
# When we copy standalone contents to /app, server.js will be at /app/server.js
# The server will listen on 0.0.0.0:3000 which is required for AWS App Runner
CMD ["node", "server.js"]

