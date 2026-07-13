import { Module } from '@nestjs/common';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service.js';
import { RecommendationController } from './recommendation.controller.js';
import { RecommendationService } from './recommendation.service.js';

@Module({
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationAlgorithmService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
