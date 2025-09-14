import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/common/db/prisma/prisma.module';
import { RedisModule } from 'src/common/db/redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'src/env';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
