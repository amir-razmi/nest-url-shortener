import { Transform } from 'class-transformer';
import { IsUrl } from 'class-validator';

export class CreateShortUrlDto {
  @IsUrl()
  @Transform(({ value }) => (value as string).trim())
  originalUrl: string;
}
