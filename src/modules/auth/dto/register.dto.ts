import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsStrongPassword, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  @Transform(({ value }) => (value as string)?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @Length(8, 128)
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1 })
  password: string;

  @ApiProperty({ minLength: 3, maxLength: 30 })
  @IsString()
  @Length(3, 30)
  username: string;
}
