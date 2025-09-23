process.env.TZ = 'UTC';

import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { RouteNames } from '@common/route-names';
import { LoggerService } from '@logger/logger.service';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { Response } from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@config/env.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ErrorHandlerService } from '@common/services/error-handler.service';
import { TraceIdInterceptor } from '@interceptors/trace-id.interceptor';
import { TracingInterceptor } from '@interceptors/tracing.interceptor';
import { copyStaticAssets } from '@common/helpers/copy-static-assets';

async function bootstrap() {
  const environment = process.env['NODE_ENV'] || 'development';
  const isProd = environment === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    snapshot: false, // true - Enable Debugging
    bufferLogs: false, // true - Enable Debugging
    rawBody: false, // true - Enable raw body, Required for payment webhooks
  });

  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);

  // Apply Helmet Middleware for setting security-related HTTP headers
  app.use(helmet());

  const configService = app.get(ConfigService<EnvConfig>);
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];

  // Enable CORS with specific settings
  app.enableCors({
    origin: corsOrigins,
    credentials: true, // Include credentials in CORS requests
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-forwarded-for, x-client-ip, x-real-ip, referer, user-agent, x-forwarded-host, x-forwarded-user-agent, referrer, x-forwarded-referer, x-forwarded-origin, origin, host',
  });

  // Limit Request Size to 1MB
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Project/App Name APIs')
      .setDescription('API documentation for the backend services of Project/App Name')
      .setVersion('1.0')
      // .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    // ❌ remove unwanted route manually from swagger document
    // delete document.paths['/v1/metrics'];
    SwaggerModule.setup(RouteNames.API_DOCS, app, document);
  }

  // Use global filters and pipes
  const errorHandler = app.get(ErrorHandlerService);
  app.useGlobalFilters(new HttpExceptionFilter(errorHandler));
  app.useGlobalInterceptors(new TraceIdInterceptor(), new TracingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove non-whitelisted properties
      forbidNonWhitelisted: true, // Return an error for non-whitelisted properties
      transform: true, // Transform plain input objects to class instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Serve static assets
  app.useStaticAssets(path.join(__dirname, '..', 'assets'), {
    prefix: '/assets/',
  });
  app.setBaseViewsDir(path.join(__dirname, '..', 'views'));
  app.setViewEngine('pug');

  // Default Route - Show Friendly Info Page
  const expressApp = app.getHttpAdapter().getInstance() as any;
  expressApp.get(['/', '/v1', '/dev-tools', '/v1/queues'], (_: any, res: Response) => {
    res.status(200).render('default', {
      app: 'Project/App Name',
      environment,
      isProd,
      message: isProd
        ? 'You are hitting a wrong URL. Please check the official API documentation.'
        : 'Welcome to the backend service. Use the options below to explore further.',
    });
  });
  if (!isProd) {
    expressApp.get('/robots.txt', (_: any, res: any) =>
      res.type('text/plain').send('User-agent: *\nDisallow: /')
    );
  }

  const port = process.env['PORT'] || 3000;
  await app.listen(port, '0.0.0.0');
  const appUrl = await app.getUrl();
  Logger.log(`App is running on ${appUrl}`, 'Project/App Name');
  await copyStaticAssets();
}

bootstrap();
