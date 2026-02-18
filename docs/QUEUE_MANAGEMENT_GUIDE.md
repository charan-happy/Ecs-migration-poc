# Queue Management Guide

## Architecture

The background job system uses **AWS SQS** for message queuing. Locally it runs against **ElasticMQ** (an SQS-compatible mock). In production it connects to real AWS SQS. The switch is **configuration-only** — change the endpoint and credentials in `.env`.

```
API Process (AppModule)                    Worker Process (WorkerModule)
┌─────────────────────────┐               ┌──────────────────────────────┐
│  QueueProducerModule    │               │  BackgroundModule            │
│  ├── EmailProducer      │   SQS Queues  │  ├── EmailConsumer           │
│  ├── AuditLogProducer   │ ────────────> │  ├── AuditLogConsumer        │
│  └── QueueAddManager    │  (ElasticMQ   │  └── DeadLetterConsumer      │
└─────────────────────────┘   or AWS)     └──────────────────────────────┘
```

- **Producers** (API process): send messages to SQS queues via `QueueAddManager`
- **Consumers** (Worker process): long-poll SQS queues and process messages
- **DLQ**: handled natively by SQS RedrivePolicy (after 3 failed attempts)

## Queues

| Queue | DLQ | Purpose |
|-------|-----|---------|
| `{prefix}-email` | `{prefix}-email-dlq` | OTP verification emails |
| `{prefix}-audit-log` | `{prefix}-audit-log-dlq` | Audit log events |

## Environment Variables

```bash
# SQS / ElasticMQ
ENABLE_SQS=true                           # Set to 'false' to disable SQS (producers no-op, consumers skip polling)
SQS_ENDPOINT=http://localhost:9324        # ElasticMQ local / AWS SQS endpoint
SQS_REGION=us-east-1                      # AWS region
SQS_ACCESS_KEY_ID=local                   # AWS access key (ElasticMQ accepts anything)
SQS_SECRET_ACCESS_KEY=local               # AWS secret key
SQS_ACCOUNT_ID=000000000000              # AWS account ID
SQS_QUEUE_PREFIX=dev                      # Queue name prefix (dev/staging/prod)
ELASTICMQ_PORT=9324                       # ElasticMQ port (docker-compose)
```

### Disabling SQS

Set `ENABLE_SQS=false` to run the app and worker without SQS/ElasticMQ. When disabled:
- **Producers** silently skip sending messages (log a warning instead)
- **Consumers** do not start polling
- **Health check** reports SQS as `"disabled"` instead of `"down"`
- **Queue dashboard** returns empty stats

This is useful for local development or deployments where background jobs are not needed.

### Local (ElasticMQ)
Queue URL pattern: `http://localhost:9324/000000000000/{prefix}-{queueName}`

### Production (AWS SQS)
Queue URL pattern: `https://sqs.{region}.amazonaws.com/{accountId}/{prefix}-{queueName}`

## Local Setup

1. Start ElasticMQ: `docker-compose up -d elasticmq`
2. Queues are pre-created via `elasticmq.conf`
3. Start API: `pnpm run api:start:dev`
4. Start Worker: `pnpm run worker:start:dev`

## Adding a New Queue

1. Add enum value to `src/sqs/sqs.constants.ts` (`SqsQueueName`)
2. Add job name to `src/background/constants/job.constant.ts` (`JobName`)
3. Add job interface to `src/background/interfaces/job.interface.ts`
4. Create `src/background/queue/{name}/` with producer, consumer, service, module
5. Register consumer module in `src/background/background.module.ts`
6. Register producer in `src/background/queue-producer.module.ts`
7. Add method to `src/background/queue-add-manager.ts`
8. Add queue + DLQ to `elasticmq.conf`

## Key Files

```
src/sqs/                          # Core SQS module (client, health, base classes)
src/background/background.module.ts        # Worker process — imports all consumer modules
src/background/queue-producer.module.ts    # API process — imports all producers
src/background/queue-add-manager.ts        # Facade for sending jobs from API code
src/background/queue/email/                # Email queue (producer, consumer, service)
src/background/queue/audit-log/            # Audit log queue (producer, consumer, service)
src/background/queue/dead-letter/          # DLQ consumer (logs failed messages)
elasticmq.conf                             # ElasticMQ queue pre-creation config
```
