import { Module } from '@nestjs/common';
import { SqsModule } from '../../../sqs/sqs.module';
import { EmailConsumer } from './email.consumer';
import { EmailProducer } from './email.producer';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [SqsModule],
  providers: [EmailConsumer, EmailProducer, EmailQueueService],
  exports: [EmailProducer, EmailQueueService],
})
export class EmailQueueModule {}
