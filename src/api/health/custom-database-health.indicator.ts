import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { DBService } from '@db/db.service';

@Injectable()
export class CustomDatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly dbService: DBService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to connect to the database
      await (this.dbService as any).$connect();

      return this.getStatus(key, true, {
        message: 'Database connection is healthy',
        status: 'connected',
      });
    } catch (error) {
      // If database is not available, mark as unhealthy but don't crash the app
      return this.getStatus(key, false, {
        message: 'Database connection failed',
        error: (error as Error).message,
        status: 'disconnected',
      });
    }
  }
}
