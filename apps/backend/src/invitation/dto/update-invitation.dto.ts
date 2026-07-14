import { InvitationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateInvitationDto {
  @IsEnum(InvitationStatus)
  status!: InvitationStatus;
}
