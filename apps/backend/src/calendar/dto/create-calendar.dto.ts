import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;
}
