import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { DateTime } from 'luxon';
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
    if (isUsernameTaken) throw new ConflictException('Username already taken');

    const isEmailTaken = await this.prisma.user.findUnique({
      where: { email },
    });
    if (isEmailTaken) {
      if (isEmailTaken.isEmailVerified) throw new ConflictException('Email already taken');

      //INFO: Check if the email was registered more than 24 hours ago, if so, allow re-registration
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const registrationAgeInDays = DateTime.fromJSDate(isEmailTaken.createdAt).diffNow('days').days;
      if (registrationAgeInDays > -1) throw new ConflictException('Email already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.upsert({
      where: { email },
      update: { username: username, password: hashedPassword, isEmailVerified: false },
      create: { email, username, password: hashedPassword },
    });

    const emailVerificationToken = generateRandomString(64);

    await this.redis.verificationTokenService.set(email, emailVerificationToken);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(username, emailVerificationToken));

    return { message: 'Registration successful, please verify your email.' };
  }
  async verifyEmail({ email, token }: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    const storedToken = await this.redis.verificationTokenService.get(email);
    if (storedToken !== token) throw new BadRequestException('Invalid or expired token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });
    await this.redis.verificationTokenService.delete(email);

    return { message: 'Email verified successfully.' };
  }
  async resendVerificationEmail({ email }: ResendVerificationEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    const lastVerificationEmailSentAt = await this.redis.verificationTokenService.getLastSentAt(email);
    if (lastVerificationEmailSentAt) {
      //Client side can use this to set Retry-After header
      return {
        message: 'Too many attempts',
        retryAfter: +lastVerificationEmailSentAt + 60 * 30 * 1000, // 30 minutes after last sent
      };
    }

    const emailVerificationToken = generateRandomString(64);

    await this.redis.verificationTokenService.set(email, emailVerificationToken);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(user.username, emailVerificationToken));

    return { message: 'Verification email resent successfully.' };
  }
  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isEmailVerified) throw new ForbiddenException('Email not verified');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.jwtService.signAsync({ userId: user.id });

    return { accessToken, message: 'Login successful' };
  }
}
