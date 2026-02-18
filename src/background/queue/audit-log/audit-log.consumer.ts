import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient } from '@aws-sdk/client-sqs';
import { BaseSqsConsumer } from '../../../sqs/base-consumer';
import { SQS_CLIENT } from '../../../sqs/sqs.provider';
import { SqsQueueUrlHelper } from '../../../sqs/sqs-queue-url.helper';
import { SqsQueueName } from '../../../sqs/sqs.constants';
import { ISqsJobMessage } from '../../../sqs/sqs.interfaces';
import { JobName } from '../../constants/job.constant';
import { IAuditLogJob } from '../../interfaces/job.interface';
import { AuditLogQueueService } from './audit-log-queue.service';

@Injectable()
export class AuditLogConsumer extends BaseSqsConsumer {
  protected readonly queueName = SqsQueueName.AUDIT_LOG;

  constructor(
    @Inject(SQS_CLIENT) sqsClient: SQSClient,
    queueUrlHelper: SqsQueueUrlHelper,
    configService: ConfigService,
    private readonly auditLogQueueService: AuditLogQueueService,
  ) {
    super(sqsClient, queueUrlHelper, configService);
  }

  async handleMessage(message: ISqsJobMessage): Promise<void> {
    this.logger.debug(`Processing audit-log job: ${message.jobName}`);

    switch (message.jobName) {
      case JobName.AUDIT_LOG:
        await this.auditLogQueueService.processAuditLog(message.data as IAuditLogJob);
        break;
      default:
        this.logger.warn(`Unknown audit-log job name: ${message.jobName}`);
    }
  }
}
