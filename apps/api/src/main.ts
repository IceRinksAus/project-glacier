import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import {
  applyApplicationSecurityHeaders,
  createApplicationValidationPipe,
  getCorsOrigins,
  getTrustedProxyHops,
  validateApplicationEnvironment,
} from './config/application-security';

async function bootstrap() {
  validateApplicationEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.set('trust proxy', getTrustedProxyHops());

  applyApplicationSecurityHeaders(app);
  app.useGlobalPipes(createApplicationValidationPipe());

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
