import { IsEnum, IsString } from 'class-validator';

export enum GoogleAuthPlatform {
  android = 'android',
  ios = 'ios',
}

export class ImportGoogleCalendarDto {
  @IsString()
  code!: string;

  // Schéma personnalisé (ex. "lunae://redirect"), pas une URL http(s) standard — @IsUrl le rejetterait.
  @IsString()
  redirectUri!: string;

  @IsString()
  codeVerifier!: string;

  @IsEnum(GoogleAuthPlatform)
  platform!: GoogleAuthPlatform;
}
