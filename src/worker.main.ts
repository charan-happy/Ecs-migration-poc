import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { LoggerService } from '@logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const logger = await app.resolve(LoggerService);
  logger.log('Worker process started and listening for jobs...');
}

bootstrap();
