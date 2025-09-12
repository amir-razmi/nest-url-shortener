import { Controller, Get, Query, Req } from '@nestjs/common';
import { type Request } from 'express';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminRoute } from 'src/common/decorators/admin-route.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireAuth } from 'src/common/decorators/require-auth.decorator';

@RequireAuth()
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = await this.userService.getUserById(req.user.userId);
    return plainToInstance(UserResponseDto, user);
  }

  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @AdminRoute()
  @Get('all')
  async getAllUsers(@Query() query: PaginationDto) {
    const users = await this.userService.getAllUsers(query);
    return plainToInstance(UserResponseDto, users);
  }
}
