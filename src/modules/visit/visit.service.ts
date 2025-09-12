import { Injectable } from '@nestjs/common';
import { type Request } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';
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

    await this.prisma.visit.create({
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

    if (!url) throw new Error('URL not found');
    if (url.userId !== userId) throw new Error('Unauthorized');

    const where = { urlId };
    const visits = await this.prisma.visit.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { visitedAt: 'desc' },
    });

    const totalVisits = await this.prisma.visit.count({ where });
    const totalPages = Math.ceil(totalVisits / limit);

    return { visits, totalVisits, totalPages };
  }
}
