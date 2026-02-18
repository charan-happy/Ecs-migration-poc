import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import { SQS_CLIENT } from '../../sqs/sqs.provider';
import { SqsQueueUrlHelper } from '../../sqs/sqs-queue-url.helper';
import { SqsQueueName } from '../../sqs/sqs.constants';
import { ISqsJobMessage } from '../../sqs/sqs.interfaces';

export interface QueueStats {
  name: string;
  url: string;
  messagesAvailable: number;
  messagesInFlight: number;
  messagesDelayed: number;
  isDlq: boolean;
}

export interface DlqMessage {
  messageId: string | undefined;
  queue: string;
  jobName: string;
  data: unknown;
  timestamp: number;
  receiptHandle: string | undefined;
  approximateReceiveCount: string | undefined;
}

const MAIN_QUEUES = [SqsQueueName.EMAIL, SqsQueueName.AUDIT_LOG];
const DLQ_QUEUES = [SqsQueueName.EMAIL_DLQ, SqsQueueName.AUDIT_LOG_DLQ];
const ALL_QUEUES = [...MAIN_QUEUES, ...DLQ_QUEUES];

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);
  private readonly sqsEnabled: boolean;

  constructor(
    @Inject(SQS_CLIENT) private readonly sqsClient: SQSClient,
    private readonly queueUrlHelper: SqsQueueUrlHelper,
    private readonly configService: ConfigService,
  ) {
    this.sqsEnabled = this.configService.get<string>('ENABLE_SQS') === 'true';
  }

  async getQueueStats(): Promise<QueueStats[]> {
    if (!this.sqsEnabled) {
      return [];
    }

    const stats: QueueStats[] = [];

    for (const queueName of ALL_QUEUES) {
      const url = this.queueUrlHelper.getUrl(queueName);
      try {
        const response = await this.sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: url,
            AttributeNames: [
              'ApproximateNumberOfMessages',
              'ApproximateNumberOfMessagesNotVisible',
              'ApproximateNumberOfMessagesDelayed',
            ],
          }),
        );

        const attrs = response.Attributes ?? {};
        stats.push({
          name: queueName,
          url,
          messagesAvailable: parseInt(attrs['ApproximateNumberOfMessages'] ?? '0', 10),
          messagesInFlight: parseInt(attrs['ApproximateNumberOfMessagesNotVisible'] ?? '0', 10),
          messagesDelayed: parseInt(attrs['ApproximateNumberOfMessagesDelayed'] ?? '0', 10),
          isDlq: DLQ_QUEUES.includes(queueName),
        });
      } catch (error) {
        this.logger.warn(`Failed to get stats for queue ${queueName}: ${(error as Error).message}`);
        stats.push({
          name: queueName,
          url,
          messagesAvailable: -1,
          messagesInFlight: -1,
          messagesDelayed: -1,
          isDlq: DLQ_QUEUES.includes(queueName),
        });
      }
    }

    return stats;
  }

  async peekDlqMessages(queueName: SqsQueueName, maxMessages = 10): Promise<DlqMessage[]> {
    if (!DLQ_QUEUES.includes(queueName)) {
      return [];
    }

    const url = this.queueUrlHelper.getUrl(queueName);
    try {
      const response = await this.sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: url,
          MaxNumberOfMessages: Math.min(maxMessages, 10),
          VisibilityTimeout: 0, // Peek only — don't hide from other consumers
          WaitTimeSeconds: 0, // Don't long-poll, return immediately
          MessageSystemAttributeNames: ['ApproximateReceiveCount'],
        }),
      );

      return (response.Messages ?? []).map(msg => {
        let parsed: ISqsJobMessage = { jobName: 'unknown', data: null, metadata: { timestamp: 0 } };
        try {
          parsed = JSON.parse(msg.Body ?? '{}') as ISqsJobMessage;
        } catch {
          // Body wasn't valid JSON
        }

        return {
          messageId: msg.MessageId,
          queue: queueName,
          jobName: parsed.jobName,
          data: parsed.data,
          timestamp: parsed.metadata?.timestamp ?? 0,
          receiptHandle: msg.ReceiptHandle,
          approximateReceiveCount: msg.Attributes?.['ApproximateReceiveCount'] ?? msg.MessageId,
        };
      });
    } catch (error) {
      this.logger.warn(`Failed to peek DLQ ${queueName}: ${(error as Error).message}`);
      return [];
    }
  }

  async getAllDlqMessages(): Promise<DlqMessage[]> {
    if (!this.sqsEnabled) {
      return [];
    }
    const allMessages: DlqMessage[] = [];
    for (const dlq of DLQ_QUEUES) {
      const messages = await this.peekDlqMessages(dlq);
      allMessages.push(...messages);
    }
    return allMessages;
  }
}
