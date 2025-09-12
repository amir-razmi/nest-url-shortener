import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ default: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  page = 1;

  @ApiProperty({ default: 10, minimum: 1, maximum: 100 })
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 10;
}
