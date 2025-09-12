import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  page = 1;

  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 10;
}
