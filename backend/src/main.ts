import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Validação global dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors();

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api/v1`);
}

bootstrap();