import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import {
  createApplicationValidationPipe,
  getCorsOrigins,
} from './config/application-security';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.useGlobalPipes(createApplicationValidationPipe());

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
