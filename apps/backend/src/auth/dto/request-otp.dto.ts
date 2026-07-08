import { IsEmail, IsEnum } from 'class-validator';
import { OtpType } from '@prisma/client';

export class RequestOtpDto {
  @IsEmail()
  email!: string;

  @IsEnum(OtpType)
  type!: OtpType;
}
