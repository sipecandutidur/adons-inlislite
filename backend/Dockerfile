# ========================================
# Backend Dockerfile (multi-stage build)
# Stage 1: Build frontend
# Stage 2: Run backend + serve frontend
# ========================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Backend ---
FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Copy frontend build from stage 1
COPY --from=frontend-build /app/frontend/dist /app/public

# Set timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta

EXPOSE 3000

CMD ["node", "index.js"]
