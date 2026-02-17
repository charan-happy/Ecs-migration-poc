// TODO: Replace BullMQ/Redis-based worker with SQS-based worker
// Note: All background queue modules are commented out until SQS migration

// import { Module } from '@nestjs/common';
// import { BackgroundModule } from '@bg/background.module';
// import { BullModule } from '@nestjs/bullmq';
// import { LoggerModule } from '@logger/logger.module';
// import { EnvConfigModule } from '@config/env-config.module';
// import { DEFAULT_JOB_OPTIONS, QueuePrefix } from '@bg/constants/job.constant';
// import { REDIS_CLIENT } from '@redis/redis.provider';
// import { RedisModule } from '@redis/redis.module';
// import Redis from 'ioredis';

// const queueModule = BullModule.forRootAsync({
//   imports: [RedisModule],
//   useFactory: (redisClient: Redis) => {
//     return {
//       prefix: QueuePrefix.SYSTEM,
//       connection: redisClient.options,
//       defaultJobOptions: DEFAULT_JOB_OPTIONS,
//     };
//   },
//   inject: [REDIS_CLIENT],
// });

// @Module({
//   imports: [EnvConfigModule, LoggerModule, RedisModule, queueModule, BackgroundModule],
// })
// export class WorkerModule {}

import { Module } from '@nestjs/common';
import { LoggerModule } from '@logger/logger.module';
import { EnvConfigModule } from '@config/env-config.module';

@Module({
  imports: [EnvConfigModule, LoggerModule],
})
export class WorkerModule {}
