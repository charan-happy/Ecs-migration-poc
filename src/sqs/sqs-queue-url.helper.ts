import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsQueueName } from './sqs.constants';

@Injectable()
export class SqsQueueUrlHelper {
  private readonly endpoint: string;
  private readonly accountId: string;
  private readonly prefix: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('env.SQS_ENDPOINT') ?? 'http://localhost:9324';
    this.accountId = this.configService.get<string>('env.SQS_ACCOUNT_ID') ?? '000000000000';
    this.prefix = this.configService.get<string>('env.SQS_QUEUE_PREFIX') ?? 'dev';
  }

  getUrl(queueName: SqsQueueName): string {
    return `${this.endpoint}/${this.accountId}/${this.prefix}-${queueName}`;
  }
}
