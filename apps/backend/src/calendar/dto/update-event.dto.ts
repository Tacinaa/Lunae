import { EventType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateEventDto {
  @IsUUID()
  @IsOptional()
  calendarId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endAt?: Date;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsBoolean()
  @IsOptional()
  isMovable?: boolean;

  @IsEnum(EventType)
  @IsOptional()
  eventType?: EventType;
}
