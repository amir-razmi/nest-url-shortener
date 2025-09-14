import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { VERIFY_EMAIL_HTML, VERIFY_EMAIL_SUBJECT } from 'src/common/constants/email-context.constant';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import { generateRandomString } from 'src/common/utils/gen-rand-string.util';
import { sendEmail } from 'src/common/utils/send-email.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
  ) {}

  async register({ email, password, username }: RegisterDto) {
    const isUsernameTaken = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    if (isUsernameTaken) throw new BadRequestException('Username already taken');

    const isEmailTaken = await this.prisma.user.findFirst({
      where: { email: email },
    });

    if (isEmailTaken && isEmailTaken.isEmailVerified) throw new BadRequestException('Email already taken');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.upsert({
      where: { email },
      update: { username: username, password: hashedPassword, isEmailVerified: false },
      create: { email, username, password: hashedPassword },
    });

    const lastVerificationEmailSentAt = await this.redis.client.get(`lastVerificationEmailSentAt:${email}`);
    if (lastVerificationEmailSentAt)
      return { message: 'Too many attempts', retryAfter: +lastVerificationEmailSentAt + 60 * 30 * 1000 };

    const emailVerificationToken = generateRandomString(64);

    await this.redis.client.set(`lastVerificationEmailSentAt:${email}`, Date.now().toString(), 'EX', 60 * 3);
    await this.redis.client.set(`verificationToken:${email}`, emailVerificationToken, 'EX', 60 * 30);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(username, emailVerificationToken));

    return { message: 'Registration successful, please verify your email.' };
  }
  async verifyEmail({ email, token }: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    const storedToken = await this.redis.client.get(`verificationToken:${email}`);
    if (storedToken !== token) throw new BadRequestException('Invalid or expired token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return { message: 'Email verified successfully.' };
  }
  async resendVerificationEmail({ email }: ResendVerificationEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    const lastVerificationEmailSentAt = await this.redis.client.get(`lastVerificationEmailSentAt:${email}`);
    if (lastVerificationEmailSentAt)
      return { message: 'Too many attempts', retryAfter: +lastVerificationEmailSentAt + 60 * 30 * 1000 };

    const emailVerificationToken = generateRandomString(64);

    await this.redis.client.set(`verificationToken:${email}`, emailVerificationToken, 'EX', 60 * 30);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(user.username, emailVerificationToken));

    return { message: 'Verification email resent successfully.' };
  }
  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new BadRequestException('Invalid credentials');
    if (!user.isEmailVerified) throw new BadRequestException('Email not verified');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    const accessToken = await this.jwtService.signAsync({ userId: user.id });

    return { accessToken, message: 'Login successful' };
  }
}
