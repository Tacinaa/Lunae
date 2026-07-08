import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { OtpType } from '../../../generated/prisma/enums.js';

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsEnum(OtpType)
  type!: OtpType;
}
