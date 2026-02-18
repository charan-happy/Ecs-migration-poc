import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobName } from './constants/job.constant';
import { IOtpEmailJob, IAuditLogJob } from './interfaces/job.interface';
import { EmailProducer } from './queue/email/email.producer';
import { AuditLogProducer } from './queue/audit-log/audit-log.producer';

@Injectable()
export class QueueAddManager {
  private readonly logger = new Logger(QueueAddManager.name);
  private readonly sqsEnabled: boolean;

  constructor(
    private readonly emailProducer: EmailProducer,
    private readonly auditLogProducer: AuditLogProducer,
    private readonly configService: ConfigService,
  ) {
    this.sqsEnabled = this.configService.get<string>('ENABLE_SQS') === 'true';
    if (!this.sqsEnabled) {
      this.logger.warn('SQS is disabled — background jobs will be skipped');
    }
  }

  async addOtpEmailJob(data: IOtpEmailJob): Promise<void> {
    if (!this.sqsEnabled) {
      this.logger.warn(`SQS disabled — skipping OTP email job for ${data.email}`);
      return;
    }
    this.logger.debug(`Adding OTP email job for ${data.email}`);
    await this.emailProducer.sendMessage(JobName.OTP_EMAIL_VERIFICATION, data);
  }

  async addAuditLogJob(data: IAuditLogJob): Promise<void> {
    if (!this.sqsEnabled) {
      this.logger.warn(`SQS disabled — skipping audit log job: ${data.action}`);
      return;
    }
    this.logger.debug(`Adding audit log job: ${data.action}`);
    await this.auditLogProducer.sendMessage(JobName.AUDIT_LOG, {
      ...data,
      timestamp: data.timestamp ?? Date.now(),
    });
  }
}
