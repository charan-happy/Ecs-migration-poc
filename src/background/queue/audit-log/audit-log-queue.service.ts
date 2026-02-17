import { Injectable, Logger } from '@nestjs/common';
import { IAuditLogJob } from '../../interfaces/job.interface';

@Injectable()
export class AuditLogQueueService {
  private readonly logger = new Logger(AuditLogQueueService.name);

  async processAuditLog(data: IAuditLogJob): Promise<void> {
    this.logger.debug(
      `Processing audit log: action=${data.action}, userId=${data.userId}, resource=${data.resource}`,
    );
    // TODO: persist audit log to database or external service
  }
}
