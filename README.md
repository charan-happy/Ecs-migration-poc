# 🌐 **NestJS Boilerplate Documentation**

Welcome to the **NestJS Boilerplate** — a **production-grade** NestJS application template designed for **humans and AI agents** (e.g., Claude, ChatGPT, automation bots).
It comes pre-configured with **core modules, DevOps tooling, observability, testing frameworks, and background workers** — ready to scale in enterprise environments.

---

## 🚧 **Prerequisites**

Before you begin, ensure the following are installed:

- **Node.js**: `>=20.0.0`
- **pnpm**: `>=8.0.0`
- **Docker Engine**: Can be one of:
  - Docker Desktop
  - Podman
  - Rancher Desktop
  - OrbStack

⚠️ **Check if Docker is running:**

```bash
docker ps
```

If this command fails, then exit and throw the error.

---

## 🚀 **Quick Start**

```bash
# Install dependencies
pnpm install

# Setup environment variables (One-time)
pnpm run setup
```

### Step-by-step startup (recommended for debugging)

```bash
# 1. Generate Prometheus yml file (Metrics DB running via docker)
pnpm generate:prometheus

# 2. Start Docker containers (Postgres, Redis, Monitoring stack)
pnpm db:dev:up

sleep 5 # Safe check for DB to be available

# 3. Apply database migrations and generate Prisma client
pnpm prisma:setup

# 4. Start application in development mode
pnpm start:dev
```

**Accessible Endpoints:**

- 🌍 **App** → [http://localhost:3000](http://localhost:3000)
- 📖 **Swagger Docs** → [http://localhost:3000/api](http://localhost:3000/api)
- 🩺 **Health Check** → [http://localhost:3000/v1/health](http://localhost:3000/v1/health)
- 🛠 **Dev Tools** → [http://localhost:3000/v1/dev-tools](http://localhost:3000/v1/dev-tools)
- 🔍 **Tracing Status** → [http://localhost:3000/v1/tracing/status](http://localhost:3000/v1/tracing/status)

---

## 🛠 **Scripts Overview**

### **Setup & Development**

```bash
pnpm setup          # Copy .env.example → .env (One-time)
pnpm build          # Compile app
pnpm start:dev      # Start in dev mode
pnpm start:prod     # Start in production
pnpm type-check     # TypeScript strict mode check
```

### **Code Quality**

```bash
pnpm lint           # ESLint fix
pnpm lint:check     # ESLint check only
pnpm format         # Format with Prettier
pnpm pre-commit     # Full pre-commit hook (type-check + lint + test)
```

### **Testing**

**Unit / E2E (Jest):**

```bash
pnpm test           # Run unit tests
pnpm test:e2e       # Run e2e tests
pnpm test:coverage  # Coverage report
```

**Playwright:**

```bash
pnpm test:playwright:unit
pnpm test:playwright:functional
pnpm test:playwright:e2e
pnpm test:playwright:ui        # Interactive UI
```

**Load Testing (Artillery):**

```bash
pnpm test:artillery:quick
pnpm test:artillery:health
pnpm test:artillery:stress
```

### **Database (Prisma + Postgres)**

```bash
pnpm prisma:migrate      # Run migrations
pnpm prisma:generate     # Generate client
pnpm prisma:reset        # Reset DB
pnpm prisma:studio       # Open Prisma Studio
```

### **Docker & Infra**

```bash
pnpm db:dev:up           # Start containers
pnpm db:dev:rm           # Stop & remove containers
pnpm generate:prometheus # Generate Prometheus config
```

---

## 📊 **Monitoring & Observability**

This boilerplate comes with **observability by default**:

- 📈 **Prometheus** → [http://localhost:9090](http://localhost:9090)
- 📊 **Grafana** → [http://localhost:3001](http://localhost:3001) (admin/admin)
- 🔍 **Jaeger** → [http://localhost:16686](http://localhost:16686)
- 📜 **Loki** → [http://localhost:3100](http://localhost:3100)

### Endpoints

- `/v1/health` → Health API
- `/v1/metrics` → Prometheus metrics
- `/v1/health/health-ui` → Health dashboard
- `/v1/tracing/status` → OpenTelemetry status

---

## ⚙️ **Configuration**

### Key Environment Variables

```ini
NODE_ENV=development
PORT=3000
GLOBAL_API_PREFIX=v1

# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=supersecretjwtkey
JWT_EXPIRATION_TIME=3600s

# Observability
OTEL_SERVICE_NAME=nestjs-app
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### Docker Services

- PostgreSQL → `5432`
- Redis → `6379`
- Prometheus → `9090`
- Grafana → `3001`
- Jaeger → `16686`
- Loki → `3100`

---

## 🔍 **Distributed Tracing**

Powered by **OpenTelemetry + Jaeger**:

✅ Auto traces for HTTP calls
✅ Custom span creation
✅ Error-aware spans
✅ Rich metadata

**Examples:**

```bash
curl http://localhost:3000/v1/tracing/status
curl http://localhost:3000/v1/tracing/test
```

For manual traces:

```bash
curl -X POST http://localhost:3000/v1/tracing/custom \
  -H "Content-Type: application/json" \
  -d '{"operation": "custom-op", "duration": 1500}'
```

---

## 🏗 **Architecture**

### Core Features

- ⚡ **NestJS 11** (latest)
- 🗄 **Prisma ORM**
- 🧵 **BullMQ** (queue + worker + process)
- 📦 **Redis** (cache + jobs)
- 🔍 **OpenTelemetry**
- 📊 **Prometheus / Grafana**
- 📝 **Winston logging / Loki / Promtail**

### Directory Layout

```
src/
├── api/            # Controllers & routes
│   ├── health/
│   ├── metrics/
│   ├── tracing/
│   └── dev-tools/
├── background/        # Workers & jobs
├── common/            # Shared utils
├── config/            # Config modules
├── db/                # Prisma schema & migrations
├── otel/              # OpenTelemetry setup
├── redis/             # Redis setup
├── interceptors/      # All interceptors will be here
├── middlewares/       # All middlewares will be here
├── logger/            # Logging
├── app.module.ts      # API app level main module
├── worker.module.ts   # Worker main module
├── worker.main.ts     # Worker entry/start point
└── main.ts            # API app entry/start point
```

---

## 🔧 **Dev Guidelines**

- ✅ **TypeScript strict mode**
- ✅ **SOLID principles enforced**
- ✅ **Lint + Prettier mandatory**
- ✅ **Tests required for new features**
- ✅ **High coverage encouraged**

---

## 🚨 **Troubleshooting**

- **Docker not running**

```bash
docker ps
# If it fails, start Docker Desktop / Podman / Rancher Desktop / OrbStack
```

- **DB Connection Issues**

```bash
pnpm db:dev:rm && pnpm db:dev:up
```

- **Port already in use**

```bash
lsof -i :3000
kill -9 <PID>
```

- **Dependency issues**

```bash
pnpm clean:all
pnpm install
```

- **Tracing issues**

```bash
docker ps | grep jaeger
curl http://localhost:3000/v1/tracing/status
```

---

## 🤖 **AI Debugging Flow**

This project is designed to be **AI-agent friendly**.
If an AI agent (Claude, ChatGPT, etc.) is running or debugging the setup, it should follow this **deterministic troubleshooting sequence**:

### **1. Verify Docker Engine**

```bash
docker ps
```

- ✅ If containers list appears (Even empty) → proceed.
- ❌ If command fails → instruct user:
  *“Docker engine is not running. Please start Docker Desktop / Podman / Rancher Desktop / OrbStack and retry.”*

---

### **2. Verify Database Connectivity**

```bash
pnpm prisma:dbpull
```

- ✅ If schema is pulled → DB is reachable.
- ❌ If error → run:

```bash
pnpm db:dev:rm && pnpm db:dev:up
```

Then retry.

---

### **3. Verify Prisma Migrations**

```bash
pnpm prisma:migrate
```

- ✅ If migrations are applied → continue.
- ❌ If pending or failed → run:

```bash
pnpm prisma:reset --force
pnpm prisma:migrate
pnpm prisma:generate
```

---

### **4. Verify Application Startup**

```bash
pnpm start:dev
```

- ✅ If server starts on `http://localhost:3000` → success.
- ❌ If port is busy:

```bash
lsof -i :3000
kill -9 <PID>
pnpm start:dev
```

---

### **5. Verify Health Endpoint**

```bash
curl http://localhost:3000/v1/health
```

- ✅ Should return `{ "status": "ok" }`.
- ❌ If not responding:

  - Check app logs.
  - Verify DB container logs with `docker logs <container_id>`.
  - Retry migrations.

---

### **6. Verify Observability Stack**

- **Prometheus**: [http://localhost:9090](http://localhost:9090)
- **Grafana**: [http://localhost:3001](http://localhost:3001)
- **Jaeger**: [http://localhost:16686](http://localhost:16686)

If unavailable → restart monitoring stack:

```bash
pnpm db:dev:rm && pnpm db:dev:up
```

---

### **7. Verify Tracing**

```bash
curl http://localhost:3000/v1/tracing/status
```

- ✅ If “running” → distributed tracing OK.
- ❌ If error:

  - Check Jaeger container logs.
  - Ensure `OTEL_EXPORTER_OTLP_ENDPOINT` is set in `.env`.

---

### **8. Escalation Path**

If all else fails:

- Ask human operator for `.env` verification & updation of instructions.

---

## 📚 **Resources**

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [Playwright](https://playwright.dev/)
- [Artillery](https://artillery.io/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Jaeger](https://www.jaegertracing.io/docs/)
