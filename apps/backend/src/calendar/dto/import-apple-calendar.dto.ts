import { IsEmail, IsString } from 'class-validator';

export class ImportAppleCalendarDto {
  @IsEmail()
  appleId!: string;

  @IsString()
  appSpecificPassword!: string;
}
