import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';
import { SqsQueueName } from './sqs.constants';
import { ISqsJobMessage } from './sqs.interfaces';
import { SqsQueueUrlHelper } from './sqs-queue-url.helper';

export abstract class BaseSqsProducer {
  protected abstract readonly queueName: SqsQueueName;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly sqsClient: SQSClient,
    protected readonly queueUrlHelper: SqsQueueUrlHelper,
  ) {}

  async sendMessage<T>(
    jobName: string,
    data: T,
    options?: { delaySeconds?: number },
  ): Promise<string | undefined> {
    const message: ISqsJobMessage<T> = {
      jobName,
      data,
      metadata: { timestamp: Date.now() },
    };

    const queueUrl = this.queueUrlHelper.getUrl(this.queueName);

    this.logger.debug(`Sending message [${jobName}] to queue ${this.queueName}`);

    const result = await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        DelaySeconds: options?.delaySeconds,
      }),
    );

    this.logger.debug(`Message sent to ${this.queueName}, MessageId: ${result.MessageId}`);
    return result.MessageId;
  }
}
