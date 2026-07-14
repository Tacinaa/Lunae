import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import { RecommendationService } from './recommendation.service.js';

@Controller('suggestions')
export class RecommendationController {
  constructor(private recommendations: RecommendationService) {}

  @Get()
  findPending(@CurrentUser() user: JwtUser) {
    return this.recommendations.findPending(user.userId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.recommendations.accept(user.userId, id);
  }

  @Post(':id/dismiss')
  dismiss(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.recommendations.dismiss(user.userId, id);
  }
}
