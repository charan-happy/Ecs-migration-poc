import { Inject, Injectable } from '@nestjs/common';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { SQS_CLIENT } from '../../../sqs/sqs.provider';
import { SqsQueueUrlHelper } from '../../../sqs/sqs-queue-url.helper';
import { SqsQueueName, DEFAULT_SQS_CONFIG } from '../../../sqs/sqs.constants';
import { ISqsJobMessage } from '../../../sqs/sqs.interfaces';

const DLQ_QUEUES = [SqsQueueName.EMAIL_DLQ, SqsQueueName.AUDIT_LOG_DLQ];

@Injectable()
export class DeadLetterConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(DeadLetterConsumer.name);
  private isRunning = false;

  constructor(
    @Inject(SQS_CLIENT) private readonly sqsClient: SQSClient,
    private readonly queueUrlHelper: SqsQueueUrlHelper,
  ) {}

  onApplicationBootstrap(): void {
    this.isRunning = true;
    for (const dlq of DLQ_QUEUES) {
      void this.pollDlq(dlq);
    }
  }

  onApplicationShutdown(): void {
    this.isRunning = false;
  }

  private async pollDlq(queueName: SqsQueueName): Promise<void> {
    const queueUrl = this.queueUrlHelper.getUrl(queueName);
    this.logger.log(`Starting DLQ polling for: ${queueName}`);

    while (this.isRunning) {
      try {
        const response = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: DEFAULT_SQS_CONFIG.maxNumberOfMessages,
            WaitTimeSeconds: DEFAULT_SQS_CONFIG.waitTimeSeconds,
          }),
        );

        for (const msg of response.Messages ?? []) {
          try {
            const parsed: ISqsJobMessage = JSON.parse(msg.Body ?? '{}');
            this.logger.error(
              `DLQ message in ${queueName}: jobName=${parsed.jobName}, data=${JSON.stringify(parsed.data)}`,
            );
            // Delete after logging — message has been recorded
            await this.sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: msg.ReceiptHandle,
              }),
            );
          } catch (error) {
            this.logger.error(
              `Failed to process DLQ message in ${queueName}: ${(error as Error).message}`,
            );
          }
        }
      } catch (error) {
        if (this.isRunning) {
          this.logger.error(`Error polling DLQ ${queueName}: ${(error as Error).message}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }
}
