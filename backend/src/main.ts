import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import {
  getCorsOrigins,
  getNodeEnv,
  getTrustProxyHops,
} from './common/config/security-config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const trustProxyHops = getTrustProxyHops(configService);

  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

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

  app.enableCors({
    origin: getCorsOrigins(configService),
  });

  if (getNodeEnv(configService) !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MatchPredict API')
      .setDescription('API para palpites esportivos do MatchPredict.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(` Server running on http://localhost:${port}/api/v1`);
}

void bootstrap();
