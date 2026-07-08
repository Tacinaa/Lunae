import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCycleDto {
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @IsInt()
  @Min(21)
  @Max(35)
  cycleLength: number = 28;

  @IsInt()
  @Min(2)
  @Max(8)
  periodDuration: number = 5;

  @IsString()
  @IsOptional()
  notes?: string;
}
