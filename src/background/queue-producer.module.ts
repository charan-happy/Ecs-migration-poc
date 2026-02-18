import { Module } from '@nestjs/common';
import { SqsModule } from '../sqs/sqs.module';
import { EmailProducer } from './queue/email/email.producer';
import { AuditLogProducer } from './queue/audit-log/audit-log.producer';
import { QueueAddManager } from './queue-add-manager';

@Module({
  imports: [SqsModule],
  providers: [EmailProducer, AuditLogProducer, QueueAddManager],
  exports: [QueueAddManager],
})
export class QueueProducerModule {}
