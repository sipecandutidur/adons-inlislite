# ========================================
# Backend Dockerfile (multi-stage build)
# Stage 1: Build Frontend (Admin Dashboard)
# Stage 2: Build OPAC (Public Catalog)
# Stage 3: Run backend + serve both apps
# ========================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build OPAC ---
FROM node:20-alpine AS opac-build

WORKDIR /app/opac
COPY opac/package.json opac/package-lock.json ./
RUN npm ci
COPY opac/ ./
RUN npm run build

# --- Stage 3: Backend ---
FROM node:20-alpine

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy backend dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy frontend build from stage 1
COPY --from=frontend-build /app/frontend/dist /app/public

# Copy OPAC build from stage 2
COPY --from=opac-build /app/opac/dist /app/public-opac

# Set timezone
RUN apk add --no-cache tzdata

# Set ownership
RUN chown -R appuser:appgroup /app

ENV TZ=Asia/Jakarta
ENV NODE_ENV=production

# Switch to non-root user
USER appuser

EXPOSE 3000

CMD ["node", "index.js"]
