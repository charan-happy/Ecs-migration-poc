import { Module } from '@nestjs/common';
import { SqsModule } from '../../../sqs/sqs.module';
import { DeadLetterConsumer } from './dead-letter.consumer';

@Module({
  imports: [SqsModule],
  providers: [DeadLetterConsumer],
})
export class DeadLetterQueueModule {}
