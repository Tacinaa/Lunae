import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, { message: 'Numéro de téléphone invalide' })
  phoneNumber?: string;
}
