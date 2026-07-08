import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private user: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtUser) {
    return this.user.findMe(user.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto) {
    return this.user.updateMe(user.userId, dto);
  }
}
