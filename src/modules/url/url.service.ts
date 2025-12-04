import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Url } from '@prisma/client';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { generateShortCode } from 'src/common/utils/gen-short-code.util';
import { CreateShortUrlDto } from './dto/create-short-url.dto';

@Injectable()
export class UrlService {
  constructor(private prisma: PrismaService) {}

  async createShortUrl({ originalUrl }: CreateShortUrlDto, userId: string) {
    let url: Url;

    for (let i = 0; i < 10; i++) {
      try {
        const shortUniqueCode = await generateShortCode(7);

        url = await this.prisma.url.create({
          data: {
            originalUrl,
            shortCode: shortUniqueCode,
            userId,
          },
        });

        break;
      } catch (error) {
        if (i === 9) throw error;
      }
    }

    return url!;
  }
  async deleteShortUrl(id: string, userId: string) {
    const url = await this.prisma.extendedPrisma.url.findUnique({
      where: { id },
    });
    if (!url) throw new NotFoundException('URL not found');
    if (url.userId !== userId) throw new ForbiddenException('You are not authorized to delete this URL');

    await this.prisma.extendedPrisma.url.delete({
      where: { id },
    });

    return { message: 'Url deleted successfully' };
  }
  async getAllUrls({ page, limit }: PaginationDto, userId?: string) {
    const where = { userId };

    const urls = await this.prisma.url.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    });

    const totalUrls = await this.prisma.url.count({ where });
    const pagesCount = Math.ceil(totalUrls / limit);

    return { urls, totalUrls, pagesCount };
  }
  async getUrlByShortCode(shortCode: string) {
    const url = await this.prisma.extendedPrisma.url.findUnique({
      where: { shortCode },
    });

    return url;
  }
}
