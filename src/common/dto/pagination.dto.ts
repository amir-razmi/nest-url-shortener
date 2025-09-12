import { IsInt, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsInt()
  @Min(0)
  page: number;

  @IsInt()
  @IsPositive()
  limit: number;
}
