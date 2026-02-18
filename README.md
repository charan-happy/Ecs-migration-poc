# ReNeu APIs

A production-grade NestJS application for clinical trials, with background job processing (AWS SQS / ElasticMQ), observability, and DevOps tooling.

---

## Prerequisites

- **Node.js**: `>=20.0.0`
- **pnpm**: `>=8.0.0`
- **Docker Engine**: Docker Desktop, Colima, Podman, Rancher Desktop, or OrbStack

Verify Docker is running:

```bash
docker ps
```

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment variables (one-time)
pnpm run setup

# Generate Prometheus config
pnpm generate:prometheus

# Start Docker containers (Postgres, ElasticMQ, Grafana, Jaeger, etc.)
pnpm db:dev:up

sleep 5

# Apply database migrations and generate Prisma client
pnpm prisma:setup

# Start API + Worker in development mode
pnpm start:dev
```

### Accessible Endpoints

| Endpoint | URL |
|----------|-----|
| App | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api |
| Health Check (JSON) | http://localhost:3000/v1/health |
| Health Dashboard | http://localhost:3000/v1/health/health-ui |
| Dev Tools | http://localhost:3000/v1/dev-tools |
| Queue Dashboard | http://localhost:3000/v1/queues/dashboard |
| Queue Stats (JSON) | http://localhost:3000/v1/queues |
| Dev Docs | http://localhost:3000/v1/dev-tools/docs |
| Application Logs | http://localhost:3000/v1/dev-tools/logs |
| Tracing Status | http://localhost:3000/v1/tracing/status |

---

## Architecture

### Two-Process Model

```
API Process (pnpm api:start:dev)           Worker Process (pnpm worker:start:dev)
┌─────────────────────────────┐            ┌──────────────────────────────┐
│  AppModule                  │            │  WorkerModule                │
│  ├── QueueProducerModule    │  SQS/      │  ├── BackgroundModule        │
│  │   ├── EmailProducer      │  ElasticMQ │  │   ├── EmailConsumer       │
│  │   ├── AuditLogProducer   │ ─────────> │  │   ├── AuditLogConsumer    │
│  │   └── QueueAddManager    │            │  │   └── DeadLetterConsumer  │
│  ├── HealthModule (+ SQS)   │            │  └── LoggerModule            │
│  ├── QueuesModule           │            └──────────────────────────────┘
│  ├── MetricsModule          │
│  ├── TracingModule          │
│  └── DevToolsModule         │
└─────────────────────────────┘
```

- **API process**: handles HTTP requests, sends messages to SQS queues via producers
- **Worker process**: long-polls SQS queues, processes messages via consumers
- **DLQ**: SQS RedrivePolicy moves failed messages (after 3 attempts) to dead-letter queues

### SQS / ElasticMQ

Locally, queues run on **ElasticMQ** (SQS-compatible mock). In production, the same code connects to **AWS SQS** — just change the endpoint and credentials in `.env`.

| Queue | DLQ | Purpose |
|-------|-----|---------|
| `{prefix}-email` | `{prefix}-email-dlq` | OTP verification emails |
| `{prefix}-audit-log` | `{prefix}-audit-log-dlq` | Audit log events |

### Core Features

- NestJS 11
- Prisma ORM + PostgreSQL
- AWS SQS (ElasticMQ locally) for background jobs
- OpenTelemetry + Jaeger for distributed tracing
- Prometheus + Grafana for metrics
- Winston + Loki for logging
- Queue Dashboard (local dev tool)

---

## Directory Layout

```
src/
├── api/                  # Controllers & routes
│   ├── health/           # Health check (HTTP, DB, Memory, SQS)
│   ├── metrics/          # Prometheus metrics
│   ├── tracing/          # OpenTelemetry tracing
│   ├── dev-tools/        # Dev tools dashboard, docs browser, log viewer
│   └── queues/           # Queue dashboard (stats, DLQ viewer)
├── background/           # Background job system
│   ├── constants/        # Job name enums
│   ├── interfaces/       # Job data interfaces
│   ├── queue/
│   │   ├── email/        # Email producer, consumer, service
│   │   ├── audit-log/    # Audit-log producer, consumer, service
│   │   └── dead-letter/  # DLQ consumer (logs failed messages)
│   ├── queue-add-manager.ts      # Facade for sending jobs
│   ├── queue-producer.module.ts  # API process module (producers)
│   └── background.module.ts      # Worker process module (consumers)
├── sqs/                  # SQS core module
│   ├── sqs.provider.ts   # SQSClient factory
│   ├── sqs.health.ts     # SQS health indicator
│   ├── base-producer.ts  # Abstract producer base class
│   ├── base-consumer.ts  # Abstract consumer base class (polling loop)
│   ├── sqs.constants.ts  # Queue names, default config
│   └── sqs.module.ts     # NestJS module
├── common/               # Shared utils, filters, helpers
├── config/               # Environment config (Joi validation)
├── db/                   # Prisma schema & migrations
├── otel/                 # OpenTelemetry setup
├── interceptors/         # HTTP interceptors
├── middlewares/           # Express middlewares
├── logger/               # Winston logging
├── app.module.ts         # API root module
├── worker.module.ts      # Worker root module
├── main.ts               # API entry point
└── worker.main.ts        # Worker entry point

docs/                     # Project documentation (browsable via dev-tools)
views/                    # Pug templates (health, queues, docs, logs)
assets/                   # Static assets (icons, logo)
elasticmq.conf            # ElasticMQ queue pre-creation config
```

---

## Scripts

### Setup & Development

```bash
pnpm setup              # Copy .env.example -> .env (one-time)
pnpm build              # Compile API + Worker
pnpm start:dev          # Start API + Worker in dev mode
pnpm start:prod         # Start in production mode
pnpm api:start:dev      # Start API only (dev)
pnpm worker:start:dev   # Start Worker only (dev)
pnpm type-check         # TypeScript strict mode check
```

### Code Quality

```bash
pnpm lint               # ESLint fix
pnpm lint:check         # ESLint check only
pnpm format             # Format with Prettier
pnpm pre-commit         # Full pre-commit check (type-check + lint + test)
```

### Testing

```bash
# Unit / E2E (Jest)
pnpm test
pnpm test:e2e
pnpm test:coverage

# Playwright
pnpm test:playwright:unit
pnpm test:playwright:functional
pnpm test:playwright:e2e
pnpm test:playwright:ui

# Load Testing (Artillery)
pnpm test:artillery:quick
pnpm test:artillery:health
pnpm test:artillery:stress
```

### Database (Prisma + PostgreSQL)

```bash
pnpm prisma:migrate      # Run migrations
pnpm prisma:generate     # Generate client
pnpm prisma:reset        # Reset DB
pnpm prisma:studio       # Open Prisma Studio
```

### Docker & Infrastructure

```bash
pnpm db:dev:up           # Start containers
pnpm db:dev:rm           # Stop & remove containers
pnpm generate:prometheus # Generate Prometheus config
```

---

## Environment Variables

### Key Configuration

```ini
# Common
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"

# SQS / ElasticMQ
SQS_ENDPOINT=http://localhost:9324         # ElasticMQ local / AWS SQS
SQS_REGION=us-east-1
SQS_ACCESS_KEY_ID=local                    # AWS credentials (ElasticMQ accepts anything)
SQS_SECRET_ACCESS_KEY=local
SQS_ACCOUNT_ID=000000000000
SQS_QUEUE_PREFIX=dev
ELASTICMQ_PORT=9324

# Observability
OTEL_SERVICE_NAME=nestjs-app
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| ElasticMQ | 9324 | SQS-compatible local queue |
| Grafana | 3001 | Metrics dashboards |
| Prometheus | 9090 | Metrics collection |
| Jaeger | 16686 | Distributed tracing UI |
| Loki | 3100 | Log aggregation |
| Promtail | 9080 | Log shipping |

---

## Monitoring & Observability

- **Prometheus** -> http://localhost:9090
- **Grafana** -> http://localhost:3001 (admin/admin)
- **Jaeger** -> http://localhost:16686
- **Loki** -> http://localhost:3100

### Application Endpoints

| Endpoint | Description |
|----------|-------------|
| `/v1/health` | Health check JSON (HTTP, DB, Memory, SQS) |
| `/v1/health/health-ui` | Health dashboard (visual) |
| `/v1/metrics` | Prometheus metrics |
| `/v1/tracing/status` | OpenTelemetry tracing status |
| `/v1/queues` | Queue stats JSON |
| `/v1/queues/dashboard` | Queue dashboard (visual — stats, DLQ viewer) |
| `/v1/dev-tools/docs` | Documentation browser |
| `/v1/dev-tools/logs` | Application log viewer |

---

## Distributed Tracing

Powered by OpenTelemetry + Jaeger:

```bash
curl http://localhost:3000/v1/tracing/status
curl http://localhost:3000/v1/tracing/test
curl -X POST http://localhost:3000/v1/tracing/custom \
  -H "Content-Type: application/json" \
  -d '{"operation": "custom-op", "duration": 1500}'
```

---

## Adding a New Queue

1. Add enum to `src/sqs/sqs.constants.ts` (`SqsQueueName`)
2. Add job name to `src/background/constants/job.constant.ts`
3. Add interface to `src/background/interfaces/job.interface.ts`
4. Create `src/background/queue/{name}/` with producer, consumer, service, module
5. Register consumer module in `background.module.ts`
6. Register producer in `queue-producer.module.ts`
7. Add method to `queue-add-manager.ts`
8. Add queue + DLQ to `elasticmq.conf`

See `docs/QUEUE_MANAGEMENT_GUIDE.md` for full details.

---

## Troubleshooting

**Docker not running:**
```bash
docker ps   # If fails, start Docker/Colima/Podman
```

**DB connection issues:**
```bash
pnpm db:dev:rm && pnpm db:dev:up
```

**Port already in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Dependency issues:**
```bash
pnpm clean:all && pnpm install
```

**Tracing issues:**
```bash
docker ps | grep jaeger
curl http://localhost:3000/v1/tracing/status
```

---

## Dev Guidelines

- TypeScript strict mode enabled
- SOLID principles enforced
- Lint + Prettier mandatory
- Tests required for new features

---

## Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [AWS SQS](https://docs.aws.amazon.com/sqs/)
- [ElasticMQ](https://github.com/softwaremill/elasticmq)
- [Playwright](https://playwright.dev/)
- [Artillery](https://artillery.io/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Jaeger](https://www.jaegertracing.io/docs/)
