import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsStrongPassword, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => (value as string)?.toLowerCase()?.trim())
  email: string;

  @IsString()
  @Length(8, 128)
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1 })
  password: string;

  @IsString()
  @Length(3, 30)
  username: string;
}
