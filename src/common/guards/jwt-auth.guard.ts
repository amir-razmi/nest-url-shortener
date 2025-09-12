// src/auth/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { REQUIRE_AUTH_KEY } from '../decorators/require-auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const requireAuth = this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requireAuth) return super.canActivate(context);

    return true;
  }
}
