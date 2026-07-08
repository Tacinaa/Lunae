import { Module } from '@nestjs/common';
import { CycleAlgorithmService } from './cycle-algorithm.service.js';
import { CycleController } from './cycle.controller.js';
import { CycleService } from './cycle.service.js';

@Module({
  controllers: [CycleController],
  providers: [CycleService, CycleAlgorithmService],
  exports: [CycleAlgorithmService],
})
export class CycleModule {}
