import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator.js';
import { PrismaHealthIndicator } from './prisma.health.js';

/**
 * Sonde de santé applicative (cf. docs/MAINTENANCE.md section 1.1).
 * Route volontairement exclue du préfixe global `api` (voir main.ts) pour
 * rester à `/health`, l'usage courant pour les moniteurs externes
 * (UptimeRobot, etc.).
 */
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      // Alerte si le tas Node dépasse 300 Mo — l'API est un service léger,
      // une dérive au-delà indique probablement une fuite mémoire.
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Alerte si le disque contenant le process dépasse 90% d'occupation.
      () =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
