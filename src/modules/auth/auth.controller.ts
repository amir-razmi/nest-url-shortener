import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('Auth')
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

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json(data);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1, // 7 days
    });

    return res.json({ message: 'Logged out successfully' });
  }
}
