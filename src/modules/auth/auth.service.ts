import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcrypt';
import { sendEmail } from 'src/common/utils/send-email.util';
import { VERIFY_EMAIL_HTML, VERIFY_EMAIL_SUBJECT } from 'src/common/constants/email-context.constant';
import { generateRandomString } from 'src/common/utils/gen-rand-string.util';
import { RedisService } from 'src/common/redis/redis.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationEmail } from './dto/resend-verification-email.dto';
import { LoginDto } from './dto/login.dto';
import jwt from 'jsonwebtoken';
import { env } from 'src/env';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async register({ email, password, username }: RegisterDto) {
    const isUsernameTaken = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    if (isUsernameTaken) throw new Error('Username already taken');

    const isEmailTaken = await this.prisma.user.findFirst({
      where: { email: email },
    });

    if (isEmailTaken && isEmailTaken.isEmailVerified) throw new Error('Email already taken');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.upsert({
      where: { email },
      update: { username: username, password: hashedPassword, isEmailVerified: false },
      create: { email, username, password: hashedPassword },
    });

    const emailVerificationToken = generateRandomString(64);

    await this.redis.client.set(`verificationToken:${email}`, emailVerificationToken, 'EX', 60 * 30);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(username, emailVerificationToken));

    return { message: 'Registration successful, please verify your email.' };
  }
  async verifyEmail({ email, token }: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new Error('User not found');
    if (user.isEmailVerified) throw new Error('Email already verified');

    const storedToken = await this.redis.client.get(`verificationToken:${email}`);
    if (storedToken !== token) throw new Error('Invalid or expired token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return { message: 'Email verified successfully.' };
  }
  async resendVerificationEmail({ email }: ResendVerificationEmail) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new Error('User not found');
    if (user.isEmailVerified) throw new Error('Email already verified');

    const emailVerificationToken = generateRandomString(64);

    await this.redis.client.set(`verificationToken:${email}`, emailVerificationToken, 'EX', 60 * 30);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(user.username, emailVerificationToken));

    return { message: 'Verification email resent successfully.' };
  }
  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new Error('Invalid credentials');
    if (!user.isEmailVerified) throw new Error('Email not verified');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    const authToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    return { authToken };
  }
}
