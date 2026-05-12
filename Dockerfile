# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: Backend runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Backend source
COPY backend/ ./backend/

# Copy built frontend into backend's public folder
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Verify frontend files were copied
RUN ls -la /app/backend/public/ && echo "Frontend files present" || echo "WARNING: No frontend files"

# Generate Prisma client
RUN cd backend && DATABASE_URL=postgresql://placeholder:placeholder@localhost/placeholder npx prisma generate

EXPOSE 8080

CMD ["sh", "-c", "cd backend && npx prisma db push && node src/index.js"]
