import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { SQS_CLIENT } from './sqs.provider';

@Injectable()
export class SqsHealthIndicator extends HealthIndicator {
  constructor(@Inject(SQS_CLIENT) private readonly sqsClient: SQSClient) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.sqsClient.send(new ListQueuesCommand({}));
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'SQS health check failed',
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
