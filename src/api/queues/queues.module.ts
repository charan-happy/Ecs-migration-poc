import { Module } from '@nestjs/common';
import { SqsModule } from '../../sqs/sqs.module';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';

@Module({
  imports: [SqsModule],
  controllers: [QueuesController],
  providers: [QueuesService],
})
export class QueuesModule {}
