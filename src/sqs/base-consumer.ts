import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { SqsQueueName, DEFAULT_SQS_CONFIG } from './sqs.constants';
import { ISqsJobMessage } from './sqs.interfaces';
import { SqsQueueUrlHelper } from './sqs-queue-url.helper';

export abstract class BaseSqsConsumer
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  protected abstract readonly queueName: SqsQueueName;
  protected readonly logger = new Logger(this.constructor.name);
  private isRunning = false;
  private abortController = new AbortController();

  constructor(
    protected readonly sqsClient: SQSClient,
    protected readonly queueUrlHelper: SqsQueueUrlHelper,
  ) {}

  abstract handleMessage(message: ISqsJobMessage): Promise<void>;

  onApplicationBootstrap(): void {
    this.startPolling();
  }

  onApplicationShutdown(): void {
    this.logger.log(`Shutting down consumer for queue: ${this.queueName}`);
    this.isRunning = false;
    this.abortController.abort();
  }

  private startPolling(): void {
    this.isRunning = true;
    this.logger.log(`Starting to poll queue: ${this.queueName}`);
    void this.poll();
  }

  private async poll(): Promise<void> {
    const queueUrl = this.queueUrlHelper.getUrl(this.queueName);

    while (this.isRunning) {
      try {
        const response = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: DEFAULT_SQS_CONFIG.maxNumberOfMessages,
            WaitTimeSeconds: DEFAULT_SQS_CONFIG.waitTimeSeconds,
            VisibilityTimeout: DEFAULT_SQS_CONFIG.visibilityTimeout,
          }),
        );

        for (const msg of response.Messages ?? []) {
          try {
            const parsed: ISqsJobMessage = JSON.parse(msg.Body ?? '{}');
            await this.handleMessage(parsed);
            await this.sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: msg.ReceiptHandle,
              }),
            );
          } catch (error) {
            // Message stays in queue, becomes visible again after VisibilityTimeout.
            // After maxReceiveCount (3), SQS moves it to DLQ automatically.
            this.logger.error(
              `Failed to process message from ${this.queueName}: ${(error as Error).message}`,
              (error as Error).stack,
            );
          }
        }
      } catch (error) {
        if (this.isRunning) {
          this.logger.error(
            `Error polling queue ${this.queueName}: ${(error as Error).message}`,
          );
          // Back off briefly before retrying the poll
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }
}
