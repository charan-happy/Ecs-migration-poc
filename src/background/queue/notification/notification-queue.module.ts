import { Module } from '@nestjs/common';
import { NotificationProcessor } from '@notification-queue/notification.processor';
import { NotificationQueueService } from '@notification-queue/notification-queue.service';
import { DeadLetterQueueModule } from '@dead-letter-queue/dead-letter-queue.module';
// import { NotificationModule } from '@services/notification/notification.module';

@Module({
  imports: [
    // NotificationModule,
    DeadLetterQueueModule,
  ],
  providers: [NotificationProcessor, NotificationQueueService],
})
export class NotificationQueueModule {}
