import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ default: 1, minimum: 0, type: 'integer' })
  @Transform(({ value }) => +value)
  @IsInt()
  @Min(0)
  @IsOptional()
  page = 1;

  @ApiProperty({ default: 10, minimum: 1, maximum: 100, type: 'integer' })
  @Transform(({ value }) => +value)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 10;
}
