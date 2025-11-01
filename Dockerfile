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

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js standalone output - this copies the minimal server files including node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files - Next.js expects them at .next/static relative to the server
# These need to be accessible for serving static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy data directory (for JSON database files)
# This must be at /app/data where process.cwd() will find it
# The database.ts uses: path.join(process.cwd(), 'data', 'database.json')
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Ensure data directory is writable (needed for database updates)
RUN chmod -R 755 /app/data

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js in the root of .next/standalone
# When we copy standalone contents to /app, server.js will be at /app/server.js
CMD ["node", "server.js"]

