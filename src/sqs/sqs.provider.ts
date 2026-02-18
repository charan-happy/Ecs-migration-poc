import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export const SQS_CLIENT = 'SQS_CLIENT';

export const SqsProvider = {
  provide: SQS_CLIENT,
  useFactory: (configService: ConfigService) => {
    const region = configService.get<string>('env.SQS_REGION') ?? 'us-east-1';
    const endpoint = configService.get<string>('env.SQS_ENDPOINT') ?? 'http://localhost:9324';
    const accessKeyId = configService.get<string>('env.SQS_ACCESS_KEY_ID') ?? 'local';
    const secretAccessKey = configService.get<string>('env.SQS_SECRET_ACCESS_KEY') ?? 'local';

    return new SQSClient({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  },
  inject: [ConfigService],
};
