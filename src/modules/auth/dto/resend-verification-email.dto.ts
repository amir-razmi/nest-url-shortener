import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendVerificationEmailDto {
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;
}
