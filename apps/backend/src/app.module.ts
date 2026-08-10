import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { CycleModule } from './cycle/cycle.module.js';
import { HealthModule } from './health/health.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RecommendationModule } from './recommendation/recommendation.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    // Doit rester le premier import (exigence Sentry pour Nest.js). Sans effet tant que
    // SENTRY_DSN n'est pas configuré (cf. instrument.ts) — pas de dépendance dure à Sentry.
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    CycleModule,
    RecommendationModule,
    CalendarModule,
    InvitationModule,
  ],
  providers: [
    // Doit être déclaré avant les autres APP_FILTER pour intercepter les exceptions en
    // premier (recommandation Sentry) — aucun autre filtre global n'est défini à ce jour.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
