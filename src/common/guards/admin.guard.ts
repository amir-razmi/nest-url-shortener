import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isAdminRoute = this.reflector.getAllAndOverride<boolean>('is-admin-route', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isAdminRoute) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const { userId } = request.user;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return !!user && user.role === 'Admin';
  }
}
