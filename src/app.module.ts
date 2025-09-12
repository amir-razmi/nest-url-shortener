import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AdminGuard } from './common/guards/admin.guard';
import { AuthModule } from './modules/auth/auth.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { UrlModule } from './modules/url/url.module';
import { UserModule } from './modules/user/user.module';
import { VisitModule } from './modules/visit/visit.module';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
  imports: [AuthModule, RedirectModule, UrlModule, UserModule, VisitModule],
})
export class AppModule {}
