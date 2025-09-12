import { Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId },
    });

    return user;
  }
  async getAllUsers({ limit, page }: PaginationDto) {
    const users = await this.prisma.user.findMany({
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalUsers = await this.prisma.user.count();
    const pagesCount = Math.ceil(totalUsers / limit);

    return { users, totalUsers, pagesCount };
  }
}
