import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}
