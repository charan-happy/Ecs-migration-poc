# 🌐 **NestJS Boilerplate Documentation**

Welcome to the **NestJS Boilerplate** - a comprehensive, production-ready NestJS application with essential modules and integrations.

---

## 🚧 **Prerequisites**

- **Node.js**: 20.0.0+
- **pnpm**: 8.0.0+ (package manager)
- **Docker CLI** & **Docker Compose**
- **Colima** (or equivalent Docker engine)

```bash
# Start Docker engine
colima start

# Setup environment (copies .env.example to .env)
pnpm run setup
# OR run directly: node scripts/setup.js
# OR force recreate: pnpm run setup:force
```

---

## 🚀 **Quick Start**

```bash
# Install dependencies
pnpm install

# Setup environment (if not done already)
pnpm run setup

# Start all services (Docker + Database + App)
pnpm local:up

# Or step by step:
pnpm db:dev:up          # Start Docker services
pnpm prisma:setup       # Setup database
pnpm start:dev          # Start NestJS app
```

**Application URLs:**
- **Main App**: http://localhost:3000
- **API Docs**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/v1/health
- **Dev Tools**: http://localhost:3000/v1/dev-tools
- **Tracing Status**: http://localhost:3000/v1/tracing/status

---

## 🛠 **Available Scripts**

### **Setup & Development**
```bash
pnpm setup              # Copy .env.example to .env (or node setup.js)
pnpm start:dev          # Start in development mode
pnpm start:prod         # Start in production mode
pnpm build              # Build the application
pnpm type-check         # Run TypeScript type checking
```

### **Code Quality**
```bash
pnpm lint               # Lint and fix code
pnpm lint:check         # Lint without fixing
pnpm format             # Format code with Prettier
pnpm pre-commit         # Run all pre-commit checks
```

### **Testing**
```bash
# Jest Tests
pnpm test               # Run unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Run tests with coverage
pnpm test:e2e           # Run E2E tests

# Playwright Tests
pnpm test:playwright:unit        # Unit tests
pnpm test:playwright:functional  # Functional tests
pnpm test:playwright:e2e         # E2E tests
pnpm test:playwright:ui          # Interactive UI

# Load Testing
pnpm test:artillery:quick        # Quick load test
pnpm test:artillery:health       # Health check load test
pnpm test:artillery:stress       # Stress test
```

### **Database**
```bash
pnpm prisma:studio      # Open Prisma Studio
pnpm prisma:migrate     # Run migrations
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:reset       # Reset database
```

### **Docker & Infrastructure**
```bash
pnpm db:dev:up          # Start Docker services
pnpm db:dev:rm          # Stop and remove containers
pnpm generate:prometheus # Generate Prometheus config
```

---

## 📊 **Monitoring & Observability**

### **Dashboards**
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Loki**: http://localhost:3100

### **Health Checks**
- **Health API**: `/v1/health` - Application health status
- **Health UI**: `/v1/health/health-ui` - Visual health dashboard
- **Metrics**: `/v1/metrics` - Prometheus metrics

### **Distributed Tracing**
- **Jaeger UI**: http://localhost:16686 - Trace visualization
- **Tracing Status**: `/v1/tracing/status` - OpenTelemetry status
- **Test Trace**: `/v1/tracing/test` - Generate test trace
- **Custom Trace**: `/v1/tracing/custom` - Generate custom trace

---

## ⚙️ **Configuration**

### **Environment Variables**
```ini
# Application
NODE_ENV=development
PORT=3000
GLOBAL_API_PREFIX=v1

# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=supersecretjwtkey
JWT_EXPIRATION_TIME=3600s

# Monitoring
OTEL_SERVICE_NAME=nestjs-app
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### **Docker Services**
- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching & Queues (port 6379)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Metrics visualization (port 3001)
- **Jaeger**: Distributed tracing (port 16686)
- **Loki**: Log aggregation (port 3100)

---

## 🧪 **Testing**

### **Test Types**
- **Unit Tests**: Individual component testing (Jest + Playwright)
- **Functional Tests**: API workflow testing (Playwright)
- **E2E Tests**: Complete user journey testing (Playwright)
- **Load Tests**: Performance testing (Artillery)

### **Test Structure**
```
tests/
├── unit/           # Unit tests
├── functional/     # Functional tests
├── e2e/           # End-to-end tests
├── fixtures/      # Test fixtures
└── utils/         # Test utilities
```

---

## 🔍 **Distributed Tracing**

### **OpenTelemetry Integration**
The application includes comprehensive distributed tracing using OpenTelemetry and Jaeger:

**Features:**
- ✅ **Automatic HTTP Request Tracing** - All API calls are automatically traced
- ✅ **Custom Trace Generation** - Manual trace creation for specific operations
- ✅ **Jaeger Integration** - Traces exported to Jaeger for visualization
- ✅ **Span Attributes** - Rich metadata attached to each trace
- ✅ **Error Tracking** - Failed requests are properly traced with error details

### **Tracing Endpoints**
```bash
# Check OpenTelemetry status
curl http://localhost:3000/v1/tracing/status

# Generate a test trace
curl http://localhost:3000/v1/tracing/test

# Generate custom trace with data
curl -X POST http://localhost:3000/v1/tracing/custom \
  -H "Content-Type: application/json" \
  -d '{"operation": "custom-operation", "duration": 2000}'
```

### **Trace Flow**
1. **HTTP Requests** → **TracingInterceptor** → **OpenTelemetry SDK** → **Jaeger**
2. **Manual Traces** → **TracingController** → **OpenTelemetry SDK** → **Jaeger**
3. **Auto Instrumentation** → **NestJS/Express** → **OpenTelemetry SDK** → **Jaeger**

### **Jaeger UI**
- **URL**: http://localhost:16686
- **Service Name**: `nestjs-app`
- **Operations**: `POST`, `GET`, `test-trace-endpoint`, `custom-operation-*`

---

## 🏗 **Architecture**

### **Core Features**
- **NestJS Framework**: TypeScript-based Node.js framework
- **Prisma ORM**: Type-safe database access
- **Redis**: Caching and background job queues
- **BullMQ**: Background job processing
- **OpenTelemetry**: Distributed tracing
- **Prometheus**: Metrics collection
- **Winston**: Structured logging

### **Project Structure**
```
src/
├── api/            # API controllers and routes
│   ├── health/     # Health check endpoints
│   ├── metrics/    # Metrics endpoints
│   ├── tracing/    # Tracing endpoints
│   └── dev-tools/  # Development tools
├── background/     # Background jobs and cron tasks
├── common/         # Shared utilities and decorators
├── config/         # Configuration modules
├── db/            # Database schema and migrations
├── interceptors/  # Request/response interceptors
├── logger/        # Logging service
├── middlewares/   # Custom middlewares
├── otel/          # OpenTelemetry configuration
└── redis/         # Redis configuration
```

---

## 🔧 **Development Guidelines**

### **Code Quality**
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **SOLID Principles**: Clean architecture patterns

### **Testing**
- **Coverage**: Aim for high test coverage
- **Types**: Unit, functional, and E2E tests
- **Performance**: Load testing with Artillery

### **Database**
- **Migrations**: Use Prisma migrations
- **Seeding**: Database seeding for development
- **Studio**: Prisma Studio for data management

---

## 🚨 **Troubleshooting**

### **Common Issues**

**Database Connection Error:**
```bash
# The app has graceful fallback for database issues
# Check Docker containers are running
docker ps

# Restart database
pnpm db:dev:rm && pnpm db:dev:up
```

**Port Already in Use:**
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Dependencies Issues:**
```bash
# Clean install
pnpm clean:all
pnpm install
```

**Setup Command Issues:**
```bash
# If pnpm setup doesn't work, run directly:
node setup.js
```

**Tracing Issues:**
```bash
# Check if Jaeger is running
docker ps | grep jaeger

# Check OpenTelemetry status
curl http://localhost:3000/v1/tracing/status

# View traces in Jaeger UI
open http://localhost:16686
```

---

## 📚 **Additional Resources**

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Playwright Testing](https://playwright.dev/)
- [Artillery Load Testing](https://artillery.io/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)

---
