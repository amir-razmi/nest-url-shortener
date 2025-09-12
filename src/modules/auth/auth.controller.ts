import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { LoginDto } from './dto/login.dto';
import { type Response } from 'express';
import { PublicRoute } from 'src/common/decorators/public-route.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@PublicRoute()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { accessToken, ...data } = await this.authService.login(body);

    res.cookie('auth-Token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return data;
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.cookie('auth-Token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1, // 7 days
    });

    return { message: 'Logged out successfully' };
  }
}
