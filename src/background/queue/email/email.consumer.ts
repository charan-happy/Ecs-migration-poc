import { Inject, Injectable } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { BaseSqsConsumer } from '../../../sqs/base-consumer';
import { SQS_CLIENT } from '../../../sqs/sqs.provider';
import { SqsQueueUrlHelper } from '../../../sqs/sqs-queue-url.helper';
import { SqsQueueName } from '../../../sqs/sqs.constants';
import { ISqsJobMessage } from '../../../sqs/sqs.interfaces';
import { JobName } from '../../constants/job.constant';
import { IOtpEmailJob } from '../../interfaces/job.interface';
import { EmailQueueService } from './email-queue.service';

@Injectable()
export class EmailConsumer extends BaseSqsConsumer {
  protected readonly queueName = SqsQueueName.EMAIL;

  constructor(
    @Inject(SQS_CLIENT) sqsClient: SQSClient,
    queueUrlHelper: SqsQueueUrlHelper,
    private readonly emailQueueService: EmailQueueService,
  ) {
    super(sqsClient, queueUrlHelper);
  }

  async handleMessage(message: ISqsJobMessage): Promise<void> {
    this.logger.debug(`Processing email job: ${message.jobName}`);

    switch (message.jobName) {
      case JobName.OTP_EMAIL_VERIFICATION:
        await this.emailQueueService.sendOtpEmail(message.data as IOtpEmailJob);
        break;
      default:
        this.logger.warn(`Unknown email job name: ${message.jobName}`);
    }
  }
}
