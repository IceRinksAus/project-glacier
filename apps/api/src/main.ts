import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
      {
        rawBody: true,
      },
    );

  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  await app.listen(
    process.env.PORT ?? 3000,
  );
}

bootstrap();