import { Module } from '@nestjs/common';
import { LoggerModule } from '@logger/logger.module';
import { EnvConfigModule } from '@config/env-config.module';
import { BackgroundModule } from '@bg/background.module';

@Module({
  imports: [EnvConfigModule, LoggerModule, BackgroundModule],
})
export class WorkerModule {}
