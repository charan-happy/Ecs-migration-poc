import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@bg/constants/job.constant';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { DeadLetterQueueService } from '@dead-letter-queue/dead-letter-queue.service';
import { DeadLetterProcessor } from '@dead-letter-queue/dead-letter.processor';
import { DeadLetterQueueEvents } from '@dead-letter-queue/dead-letter-queue.events';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.DEAD_LETTER,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed DLQ jobs for 7 days
        },
        removeOnFail: {
          age: 60 * 24 * 3600, // Keep failed DLQ jobs for 60 days
        },
      },
    }),
    BullBoardModule.forFeature({
      name: QueueName.DEAD_LETTER,
      adapter: BullMQAdapter,
      options: {
        readOnlyMode: process.env['NODE_ENV'] === 'production' || false,
        displayName: 'Dead Letter Queue',
        description: 'Queue for failed jobs from other queues',
      },
    }),
  ],
  providers: [
    DeadLetterQueueService,
    DeadLetterProcessor,
    DeadLetterQueueEvents,
  ],
  exports: [DeadLetterQueueService],
})
export class DeadLetterQueueModule {}
