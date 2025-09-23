import { QueueName } from '@bg/constants/job.constant';
import { CronQueueEvents } from '@cron/cron.events';
import { CronProcessor } from '@cron/cron.processor';
import { CronQueue } from '@cron/cron.queue';
import { CronScheduler } from '@cron/cron.scheduler';
import { CronService } from '@cron/cron.service';
import { BullModule } from '@nestjs/bullmq';
import { Injectable, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { DeadLetterQueueModule } from '@dead-letter-queue/dead-letter-queue.module';

@Injectable()
export class CronQueueConfig {
  static getQueueConfig() {
    return BullModule.registerQueue({
      name: QueueName.CRON,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
      defaultJobOptions: {
        attempts: 1,
        removeOnFail: true,
        removeOnComplete: {
          age: 1 * 24 * 3600, // Keep for 1 day
        },
      },
    });
  }

  static getQueueUIConfig() {
    return BullBoardModule.forFeature({
      name: QueueName.CRON,
      adapter: BullMQAdapter,
      options: {
        readOnlyMode: process.env['NODE_ENV'] === 'production' || false,
        displayName: 'CRON Queue',
        description: 'Queue for CRON jobs',
      },
    });
  }
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CronQueueConfig.getQueueConfig(),
    CronQueueConfig.getQueueUIConfig(),
    DeadLetterQueueModule,
  ],
  providers: [CronProcessor, CronScheduler, CronService, CronQueueEvents, CronQueue],
})
export class CronModule {}
