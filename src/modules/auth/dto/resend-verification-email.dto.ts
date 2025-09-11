import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendVerificationEmail {
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;
}
