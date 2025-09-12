import { Injectable } from '@nestjs/common';
import { type Request } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UAParser } from 'ua-parser-js';
import * as requestIp from 'request-ip';

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
}
