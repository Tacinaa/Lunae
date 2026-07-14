import { Injectable, NotFoundException } from '@nestjs/common';
import type { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.invitation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { event: true },
    });
  }

  async respond(userId: string, id: string, status: InvitationStatus) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });
    if (!invitation || invitation.userId !== userId) {
      throw new NotFoundException('Invitation introuvable');
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status },
      include: { event: true },
    });
  }
}
