import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { generateShortCode } from 'src/common/utils/gen-short-code.util';
import { Url } from 'generated/prisma';

@Injectable()
export class UrlService {
  constructor(private prisma: PrismaService) {}

  async createShortUrl({ originalUrl }: CreateShortUrlDto, userId: string) {
    let url: Url;

    while (true) {
      try {
        const shortUniqueCode = generateShortCode(7);

        url = await this.prisma.url.create({
          data: {
            originalUrl,
            shortCode: shortUniqueCode,
            userId,
          },
        });

        break;
      } catch {
        /** */
      }
    }

    return url;
  }
}
