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

export class CreateEventDto {
  @IsUUID()
  calendarId!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;

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
