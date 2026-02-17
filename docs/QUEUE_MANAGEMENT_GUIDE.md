# Queue Management Guide

> **Status: Background queues are currently disabled.**
>
> The previous BullMQ + Redis-based queue system has been removed. Background job processing
> will be migrated to **AWS SQS**. The old queue source code is preserved in `src/background/`
> and `src/redis/` for reference but is excluded from compilation.

---

## Previous Architecture (Archived)

The system previously used **BullMQ** backed by **Redis** with two processes:

* **API App** - handled HTTP requests, added jobs to queues, exposed Queue UI (BullBoard).
* **Worker App** - ran processors, executed jobs, handled DLQ (Dead Letter Queue) + cron tasks.

### Queue Types (Previously Available)

| Queue | Purpose |
|-------|---------|
| Email | OTP verification emails |
| Notification | Device/topic/general push notifications |
| Cron | Scheduled periodic jobs (e.g., daily mail) |
| Dead Letter | Failed job storage and retry |

---

## Migration Plan

The queue system will be rebuilt using **AWS SQS** with the following approach:

1. Replace BullMQ producers with SQS message publishers
2. Replace BullMQ worker processors with SQS consumers
3. Replace BullBoard UI with CloudWatch/custom monitoring
4. Replace Redis-backed DLQ with SQS dead-letter queues

---

## Reference Files (Not Compiled)

The following directories contain the old queue implementation for reference:

```
src/background/          # Queue modules, processors, events
src/redis/               # Redis client, health check, module
src/interceptors/cache.interceptor.ts  # Redis-backed cache interceptor
```

These are excluded from TypeScript compilation via `tsconfig.json` and `tsconfig.build.json`.

---

## Removed Dependencies

The following npm packages were removed as part of the Redis removal:

* `bullmq`
* `@nestjs/bullmq`
* `@bull-board/api`
* `@bull-board/express`
* `@bull-board/nestjs`
* `cache-manager`
* `cache-manager-redis-store`
* `@nestjs/cache-manager`
* `ioredis`
