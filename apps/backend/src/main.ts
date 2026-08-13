// Doit rester le tout premier import (exigence Sentry pour Nest.js) — cf. instrument.ts.
import './instrument.js';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // `/health` reste hors du préfixe `api` : c'est la convention attendue par les
  // moniteurs externes (UptimeRobot, etc.) — cf. docs/MAINTENANCE.md section 1.1/1.3.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env['PORT'] ?? 3000);
}
void bootstrap();
