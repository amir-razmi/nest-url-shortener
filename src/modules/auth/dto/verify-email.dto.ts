import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @IsString()
  token: string;
}
