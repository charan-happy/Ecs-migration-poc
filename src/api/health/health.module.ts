import { DBModule } from '@db/db.module';
import { HealthController } from '@health/health.controller';
import { HealthService } from '@health/health.service';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { CustomHttpHealthIndicator } from './custom-http-health.indicator';
import { CustomDatabaseHealthIndicator } from './custom-database-health.indicator';
import { SqsModule } from '../../sqs/sqs.module';

@Module({
  imports: [TerminusModule, DBModule, SqsModule],
  controllers: [HealthController],
  providers: [HealthService, CustomHttpHealthIndicator, CustomDatabaseHealthIndicator],
  exports: [HealthService],
})
export class HealthModule {}
