import { Module } from '@nestjs/common';
import { SqsModule } from '../../../sqs/sqs.module';
import { AuditLogConsumer } from './audit-log.consumer';
import { AuditLogProducer } from './audit-log.producer';
import { AuditLogQueueService } from './audit-log-queue.service';

@Module({
  imports: [SqsModule],
  providers: [AuditLogConsumer, AuditLogProducer, AuditLogQueueService],
  exports: [AuditLogProducer, AuditLogQueueService],
})
export class AuditLogQueueModule {}
