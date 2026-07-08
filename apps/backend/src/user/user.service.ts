import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  createdAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
  }
}
