import { Controller, Get, Query, Req } from '@nestjs/common';
import { type Request } from 'express';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminRoute } from 'src/common/decorators/admin-route.decorator';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = await this.userService.getUserById(req.user.userId);
    return plainToInstance(UserResponseDto, user);
  }

  @AdminRoute()
  @Get('all')
  async getAllUsers(@Query() query: PaginationDto) {
    const users = await this.userService.getAllUsers(query);
    return plainToInstance(UserResponseDto, users);
  }
}
