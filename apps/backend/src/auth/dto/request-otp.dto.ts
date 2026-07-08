import { IsEmail, IsEnum } from 'class-validator';
import { OtpType } from '../../../generated/prisma/enums.js';

export class RequestOtpDto {
  @IsEmail()
  email!: string;

  @IsEnum(OtpType)
  type!: OtpType;
}
