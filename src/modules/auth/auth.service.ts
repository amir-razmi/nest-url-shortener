import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { hash } from 'bcrypt';
import { sendEmail } from 'src/common/utils/send-email.util';
import { VERIFY_EMAIL_HTML, VERIFY_EMAIL_SUBJECT } from 'src/common/constants/email-context.constant';
import { generateRandomString } from 'src/common/utils/gen-rand-string.util';
import { RedisService } from 'src/common/redis/redis.service';

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

    const hashedPassword = await hash(password, 10);

    await this.prisma.user.upsert({
      where: { email },
      update: { username: username, password: hashedPassword, isEmailVerified: false },
      create: { email, username, password: hashedPassword },
    });

    const emailVerificationToken = generateRandomString(64);

    await this.redis.client.set(`verificationToken:${email}`, emailVerificationToken, 'EX', 60 * 30);

    await sendEmail(email, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_HTML(username, emailVerificationToken));
  }
}
