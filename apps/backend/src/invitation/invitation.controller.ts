import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import { UpdateInvitationDto } from './dto/update-invitation.dto.js';
import { InvitationService } from './invitation.service.js';

@Controller('invitations')
export class InvitationController {
  constructor(private invitations: InvitationService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.invitations.findAll(user.userId);
  }

  @Patch(':id')
  respond(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvitationDto,
  ) {
    return this.invitations.respond(user.userId, id, dto.status);
  }
}
