import { Controller, Get, Req } from '@nestjs/common';
import { type Request } from 'express';
import { UserService } from './user.service';
import { GetProfileResponseDto } from './dto/get-profile-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = await this.userService.getUserById(req.user.userId);
    return plainToInstance(GetProfileResponseDto, user);
  }
}
