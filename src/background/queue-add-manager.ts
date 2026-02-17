import { Injectable, Logger } from '@nestjs/common';
import { JobName } from './constants/job.constant';
import { IOtpEmailJob, IAuditLogJob } from './interfaces/job.interface';
import { EmailProducer } from './queue/email/email.producer';
import { AuditLogProducer } from './queue/audit-log/audit-log.producer';

@Injectable()
export class QueueAddManager {
  private readonly logger = new Logger(QueueAddManager.name);

  constructor(
    private readonly emailProducer: EmailProducer,
    private readonly auditLogProducer: AuditLogProducer,
  ) {}

  async addOtpEmailJob(data: IOtpEmailJob): Promise<void> {
    this.logger.debug(`Adding OTP email job for ${data.email}`);
    await this.emailProducer.sendMessage(JobName.OTP_EMAIL_VERIFICATION, data);
  }

  async addAuditLogJob(data: IAuditLogJob): Promise<void> {
    this.logger.debug(`Adding audit log job: ${data.action}`);
    await this.auditLogProducer.sendMessage(JobName.AUDIT_LOG, {
      ...data,
      timestamp: data.timestamp ?? Date.now(),
    });
  }
}
