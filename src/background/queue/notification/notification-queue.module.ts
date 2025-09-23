import { Injectable, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@bg/constants/job.constant';
import { NotificationQueueEvents } from '@notification-queue/notification-queue.events';
import { NotificationProcessor } from '@notification-queue/notification.processor';
import { NotificationQueueService } from '@notification-queue/notification-queue.service';
import { NotificationQueue } from '@notification-queue/notification.queue';
// import { NotificationModule } from '@notification/notification.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { DeadLetterQueueModule } from '@dead-letter-queue/dead-letter-queue.module';

@Injectable()
export class NotificationQueueConfig {
  static getQueueConfig() {
    return BullModule.registerQueue({
      name: QueueName.NOTIFICATION,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
      defaultJobOptions: {
        removeOnFail: true,
        removeOnComplete: {
          age: 1 * 24 * 3600, // Keep for 1 day
        },
      },
    });
  }

  static getQueueUIConfig() {
    return BullBoardModule.forFeature({
      name: QueueName.NOTIFICATION,
      adapter: BullMQAdapter,
      options: {
        readOnlyMode: process.env['NODE_ENV'] === 'production' || false,
        displayName: 'Notifications Queue',
        description: 'Queue for sending notifications',
      },
    });
  }
}

@Module({
  imports: [
    NotificationQueueConfig.getQueueConfig(),
    NotificationQueueConfig.getQueueUIConfig(),
    // NotificationModule,
    DeadLetterQueueModule,
  ],
  providers: [
    NotificationQueueEvents,
    NotificationProcessor,
    NotificationQueueService,
    NotificationQueue,
  ],
  exports: [NotificationQueue],
})
export class NotificationQueueModule {}
