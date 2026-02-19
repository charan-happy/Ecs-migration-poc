# Docker Configuration Guide

## Overview
Your application uses a **multi-stage Docker build** approach for optimal image size and build performance. This guide explains each Dockerfile and their purposes.

## 🏗️ Build Stages Architecture

```
Source Code
     ↓
Build Stage (node:22)
- Install all dependencies
- Copy Prisma schema
- Generate Prisma client
- Build TypeScript → JavaScript
     ↓
Production Stage (node:22-slim)
- Copy only necessary runtime files
- Minimal dependencies (openssl for Prisma)
- Optimized for production
```

## 📁 Dockerfile Details

### 1. **app.Dockerfile** - Backend API Service
```dockerfile
# Multi-stage build for backend API
FROM node:22 AS build          # Build stage
FROM node:22-slim AS production # Production stage

EXPOSE 3000
CMD ["node", "dist/main.js"]    # Backend entry point
```

**Purpose**: Serves the main API endpoints, handles HTTP requests, serves static files.

### 2. **worker.Dockerfile** - Background Worker Service
```dockerfile
# Multi-stage build for background workers
FROM node:22 AS build          # Build stage
FROM node:22-slim AS production # Production stage

EXPOSE 3003
CMD ["node", "dist/worker.main.js"] # Worker entry point
```

**Purpose**: Handles background jobs, queue processing, scheduled tasks, async operations.

### 3. **migration.Dockerfile** - Database Migration Runner
```dockerfile
# Multi-stage build for migrations
FROM node:22 AS build        # Build stage
FROM node:22-slim AS migration # Migration stage

CMD ["pnpm", "run", "prisma:dev:deploy"] # Migration command
```

**Purpose**: Runs Prisma database migrations in ECS tasks before deploying application code.

## 🔧 Key Features

### **Multi-Stage Builds**
- **Build Stage**: Heavy lifting (install deps, compile TypeScript)
- **Production Stage**: Lightweight runtime (only necessary files)
- **Result**: Smaller images, faster deployments, better security

### **Prisma Integration**
- Schema copied before dependency installation (important for postinstall scripts)
- Prisma client generated during build
- Migration files included for runtime migration execution

### **Certificate Support**
- CA certificates copied for database connections
- Environment files included for configuration

### **Optimized Dependencies**
- Build stage: All dependencies (including dev dependencies)
- Production stage: Only runtime dependencies
- Migration stage: Only Prisma-related dependencies

## 🚀 Build Commands

### Local Development
```bash
# Build all images
docker build -f app.Dockerfile -t myapp-backend .
docker build -f worker.Dockerfile -t myapp-worker .
docker build -f migration.Dockerfile -t myapp-migration .

# Run locally
docker run -p 3000:3000 myapp-backend
docker run -p 3003:3003 myapp-worker
```

### CI/CD Pipeline
Images are built and pushed to ECR with Git commit SHA as tags:
```bash
# Backend
docker build -f app.Dockerfile -t $BACKEND_REPO:$GITHUB_SHA .
docker push $ECR_REGISTRY/$BACKEND_REPO:$GITHUB_SHA

# Worker
docker build -f worker.Dockerfile -t $WORKER_REPO:$GITHUB_SHA .
docker push $ECR_REGISTRY/$WORKER_REPO:$GITHUB_SHA

# Migration
docker build -f migration.Dockerfile -t $MIGRATION_REPO:$GITHUB_SHA .
docker push $ECR_REGISTRY/$MIGRATION_REPO:$GITHUB_SHA
```

## 📊 Image Size Comparison

| Dockerfile | Build Stage | Production Stage | Total Size |
|------------|-------------|------------------|------------|
| app.Dockerfile | ~800MB | ~200MB | ~200MB |
| worker.Dockerfile | ~800MB | ~180MB | ~180MB |
| migration.Dockerfile | ~600MB | ~150MB | ~150MB |

*Sizes are approximate and depend on your dependencies*

## 🔒 Security Considerations

### **Base Images**
- `node:22`: Full Node.js for building
- `node:22-slim`: Minimal runtime, smaller attack surface

### **Dependency Management**
- Only runtime dependencies in production
- No development tools in production images
- Regular dependency updates and security scans

### **Certificate Handling**
- CA certificates included for secure database connections
- No hardcoded secrets in Dockerfiles

## 🐛 Troubleshooting

### **Build Issues**
```bash
# Clear build cache
docker builder prune -f

# Rebuild without cache
docker build --no-cache -f app.Dockerfile .
```

### **Runtime Issues**
```bash
# Check container logs
docker logs <container_id>

# Debug interactively
docker run -it --entrypoint /bin/bash myapp-backend
```

### **Migration Issues**
```bash
# Test migration locally
docker run --env-file .env myapp-migration

# Check Prisma connection
docker run --env-file .env myapp-migration pnpm prisma db push --preview-feature
```

## 📈 Performance Optimizations

1. **Layer Caching**: Dependencies installed before source code
2. **Multi-Stage**: Separate build and runtime environments
3. **Minimal Base Images**: `node:22-slim` for production
4. **Selective Copying**: Only necessary files in production stage

## 🔄 CI/CD Integration

The Dockerfiles are designed to work seamlessly with your GitHub Actions pipeline:

- **Build Job**: Builds all images in parallel
- **Migrate Job**: Uses migration.Dockerfile for database changes
- **Deploy Job**: Uses app.Dockerfile and worker.Dockerfile for services
- **Rollback**: Previous images available for quick rollback

This setup provides **enterprise-grade containerization** with optimal performance, security, and maintainability.</content>
<parameter name="filePath">/workspaces/Ecs-migration-poc/DOCKER_CONFIGURATION_GUIDE.md