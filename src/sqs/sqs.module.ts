import { Module } from '@nestjs/common';
import { EnvConfigModule } from '@config/env-config.module';
import { SqsProvider } from './sqs.provider';
import { SqsQueueUrlHelper } from './sqs-queue-url.helper';
import { SqsHealthIndicator } from './sqs.health';

@Module({
  imports: [EnvConfigModule],
  providers: [SqsProvider, SqsQueueUrlHelper, SqsHealthIndicator],
  exports: [SqsProvider, SqsQueueUrlHelper, SqsHealthIndicator],
})
export class SqsModule {}
