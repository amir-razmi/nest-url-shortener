import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { REQUIRE_AUTH_KEY } from '../decorators/require-auth.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticationRequired = this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isAuthenticationRequired) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.accessToken as string;

    if (!token) throw new UnauthorizedException('Access token not found');

    try {
      const payload = await this.jwtService.verifyAsync<{ userId: string }>(token);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
