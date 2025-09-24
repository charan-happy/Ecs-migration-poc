import { IOtpEmailJob } from '@bg/interfaces/job.interface';
// import { EmailService } from '@services/email/email.service';
// import { SendEmailDto } from '@services/email/dto/send-email.dto';
// import { TemplateDataDTO } from '@services/email/dto/template-data.dto';
// import { AdminEmailIDs } from '@services/email/enums/email-template.enum';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  // constructor(private readonly emailService: EmailService) {}

  async sendOtpEmail(data: IOtpEmailJob): Promise<void> {
    try {
      this.logger.debug(`Sending email verification to ${data.email} with token ${data.otp}`);
      // const templateData: TemplateDataDTO = new TemplateDataDTO();
      // templateData.customerName = data.customerName;
      // templateData.generatedOTP = data.otp;
      // templateData.to = data.email;

      // const emailData: SendEmailDto = {
      //   to: data.email,
      //   from: AdminEmailIDs.NO_REPLY,
      //   templateId: 'd-6616a890138b460e97a633f79c17bbc2',
      //   templateData: templateData,
      // };
      // await this.mailService.sendEmail(emailData);
    } catch (error) {
      this.logger.error(`Failed to send OTP email: ${(error as Error).message}`);
      throw error;
    }
  }
}
