import { Injectable, Logger } from '@nestjs/common';
// import { NotificationService } from '@services/notification/notification.service';
import {
  INotificationJob,
  INotificationTopicJob,
  ISendNotificationJob,
} from '@bg/interfaces/job.interface';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);
  // constructor(
  //   private readonly notificationService: NotificationService,
  // ) {}

  async sendNotificationToDevice(data: INotificationJob): Promise<void> {
    try {
      this.logger.debug(
        `Sending push notification to ${data.deviceTokens} with subject ${data.subject}, message ${data.message}, url ${data.url}, additional data ${data.data}`
      );
      // await this.notificationService.sendNotificationToDevice(
      //   data.deviceTokens,
      //   data.subject,
      //   data.message,
      //   data.url,
      //   data.data,
      // );
    } catch (error) {
      this.logger.error(`Failed to send notification: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendNotificationToTopic(data: INotificationTopicJob): Promise<void> {
    try {
      this.logger.debug(
        `Sending push notification topic ${data.topic} with subject ${data.subject}, message ${data.message}, url ${data.url}, additional data ${data.data}`
      );
      // await this.notificationService.sendNotificationToTopic(
      //   data.topic,
      //   data.subject,
      //   data.message,
      //   data.url,
      //   data.data,
      // );
    } catch (error) {
      this.logger.error(`Failed to send notification: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendNotification(data: ISendNotificationJob): Promise<void> {
    try {
      this.logger.debug(
        `Sending push notification & also adding inapp notification to ${data.user_ids} with subject ${data.subject}, message ${data.message}, url ${data.url}`
      );
      // await this.notificationService.sendNotificationToUsers(data);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${(error as Error).message}`);
      throw error;
    }
  }
}
