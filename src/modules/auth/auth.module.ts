import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
