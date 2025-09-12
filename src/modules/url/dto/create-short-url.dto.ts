import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsUrl } from 'class-validator';

export class CreateShortUrlDto {
  @ApiProperty({ format: 'url' })
  @IsUrl()
  @Transform(({ value }) => (value as string).trim())
  originalUrl: string;
}
