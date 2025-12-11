import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { type Request } from 'express';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { UAParser } from 'ua-parser-js';
import * as requestIp from 'request-ip';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class VisitService {
  constructor(private prisma: PrismaService) {}

  async saveVisit(urlId: string, req: Request) {
    const ipAddress = requestIp.getClientIp(req) || undefined;

    const referrer = req.get('referer') || null;

    const userAgent = new UAParser(req.get('user-agent') || '');
    const browserName = userAgent.getBrowser().name || null;
    const osName = userAgent.getOS().name || null;
    const deviceType = userAgent.getDevice().type || 'desktop';

    await this.prisma.urlVisit.create({
      data: {
        urlId,
        ipAddress,
        referrer,
        browser: browserName,
        os: osName,
        deviceType,
      },
    });
  }
  async getVisitsByUrlId({ limit, page }: PaginationDto, urlId: string, userId: string) {
    const url = await this.prisma.url.findUnique({
      where: { id: urlId },
    });

    if (!url) throw new NotFoundException('URL not found');
    if (url.userId !== userId) throw new UnauthorizedException('Unauthorized');

    const where = { urlId };
    const visits = await this.prisma.urlVisit.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { visitedAt: 'desc' },
    });

    const totalVisits = await this.prisma.urlVisit.count({ where });
    const totalPages = Math.ceil(totalVisits / limit);

    return { visits, totalVisits, totalPages };
  }
  async getAllVisits({ page, limit }: PaginationDto) {
    const visits = await this.prisma.urlVisit.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { visitedAt: 'desc' },
    });

    const totalVisits = await this.prisma.urlVisit.count();
    const totalPages = Math.ceil(totalVisits / limit);

    return { visits, totalVisits, totalPages };
  }
}
