import { EnvConfig } from '@config/env.config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

@Injectable()
export class DBService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pgClient: Client | null;
  constructor(config: ConfigService<EnvConfig>) {
    const databaseUrl = config.get<string>('DATABASE_URL') || '';
    console.log('Connecting to PostgreSQL with URL:', databaseUrl);
    console.log('Raw DATABASE_URL from process.env:', process.env['DATABASE_URL']);
    console.log('Individual components:', {
      POSTGRES_USER: process.env['POSTGRES_USER'],
      POSTGRES_PASSWORD: process.env['POSTGRES_PASSWORD'],
      POSTGRES_HOST: process.env['POSTGRES_HOST'],
      POSTGRES_PORT: process.env['POSTGRES_PORT'],
      POSTGRES_DB: process.env['POSTGRES_DB'],
    });

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Only create pgClient if we have a valid connection string
    if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
      try {
        this.pgClient = new Client({
          connectionString: databaseUrl,
        });
      } catch (error) {
        console.error('Failed to create PostgreSQL client:', error);
        this.pgClient = null;
      }
    } else {
      console.warn('Invalid or missing DATABASE_URL, skipping pgClient creation');
      this.pgClient = null;
    }
  }

  async onModuleInit() {
    console.log('Here');
    try {
      await this.$connect();

      if (this.pgClient) {
        await this.pgClient.connect();

        this.pgClient.on('notification', async (msg: any) => {
          console.log('Received notification: ', msg);
          if (msg.channel === 'password_updates') {
            console.log('Received password update notification', msg);
            // Handle NOTIFY events
            // const payload = JSON.parse(msg.payload)
            // TODO: Process the notification (e.g., publish to a pub/sub system)
          }
        });

        await this.pgClient.query('LISTEN password_updates');
      } else {
        console.warn('PostgreSQL client not available, skipping connection');
      }
    } catch (error) {
      console.error('Database connection failed:', error);
      // Continue without database connection for now
      return;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      if (this.pgClient) {
        await this.pgClient.end();
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}
