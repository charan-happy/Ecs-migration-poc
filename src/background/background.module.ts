import { Module } from '@nestjs/common';
import { SqsModule } from '../sqs/sqs.module';
import { EmailQueueModule } from './queue/email/email-queue.module';
import { AuditLogQueueModule } from './queue/audit-log/audit-log-queue.module';
import { DeadLetterQueueModule } from './queue/dead-letter/dead-letter-queue.module';

@Module({
  imports: [
    SqsModule,
    EmailQueueModule,
    AuditLogQueueModule,
    DeadLetterQueueModule,
  ],
})
export class BackgroundModule {}
