import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isAdmin: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  username: string;

  @Exclude()
  password: string;
}
