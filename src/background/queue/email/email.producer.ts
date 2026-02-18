import { Inject, Injectable } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { BaseSqsProducer } from '../../../sqs/base-producer';
import { SQS_CLIENT } from '../../../sqs/sqs.provider';
import { SqsQueueUrlHelper } from '../../../sqs/sqs-queue-url.helper';
import { SqsQueueName } from '../../../sqs/sqs.constants';

@Injectable()
export class EmailProducer extends BaseSqsProducer {
  protected readonly queueName = SqsQueueName.EMAIL;

  constructor(
    @Inject(SQS_CLIENT) sqsClient: SQSClient,
    queueUrlHelper: SqsQueueUrlHelper,
  ) {
    super(sqsClient, queueUrlHelper);
  }
}
