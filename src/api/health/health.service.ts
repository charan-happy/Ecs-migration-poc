import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryHealthIndicator } from '@nestjs/terminus';
import { CustomDatabaseHealthIndicator } from './custom-database-health.indicator';
import { SqsHealthIndicator } from '../../sqs/sqs.health';

@Injectable()
export class HealthService {
  private readonly sqsEnabled: boolean;

  constructor(
    private readonly database: CustomDatabaseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly sqsHealth: SqsHealthIndicator,
    private readonly configService: ConfigService,
  ) {
    this.sqsEnabled = this.configService.get<string>('ENABLE_SQS') === 'true';
  }

  async checkHealth(): Promise<any> {
    const results: any = {};
    let overallStatus = 'up';

    // --- Essential checks (affect overall status) ---

    // Database check
    try {
      const dbResult = await this.database.isHealthy('database');
      results.database = dbResult['database'];
    } catch (error) {
      results.database = {
        status: 'down',
        message: 'Database check failed',
        error: (error as Error).message,
      };
      overallStatus = 'down';
    }

    // Memory check
    try {
      const memoryResult = await this.memory.checkHeap('memory_heap', 250 * 1024 * 1024);
      results.memory_heap = memoryResult['memory_heap'];
    } catch (error) {
      results.memory_heap = {
        status: 'down',
        message: 'Memory check failed',
        error: (error as Error).message,
      };
      overallStatus = 'down';
    }

    // --- Optional checks (informational, do NOT affect overall status) ---

    // SQS check
    if (this.sqsEnabled) {
      try {
        const sqsResult = await this.sqsHealth.isHealthy('sqs');
        results.sqs = sqsResult['sqs'];
      } catch (error) {
        results.sqs = {
          status: 'down',
          message: 'SQS check failed',
          error: (error as Error).message,
        };
      }
    } else {
      results.sqs = { status: 'disabled' };
    }

    return {
      status: overallStatus,
      info: results,
      error: overallStatus === 'down' ? 'Some services are down' : undefined,
      details: results,
    };
  }
}
