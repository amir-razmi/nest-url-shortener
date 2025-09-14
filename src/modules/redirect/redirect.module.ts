import { Module } from '@nestjs/common';
import { UrlModule } from '../url/url.module';
import { VisitModule } from '../visit/visit.module';
import { RedirectController } from './redirect.controller';
import { PrismaModule } from 'src/common/db/prisma/prisma.module';

@Module({
  imports: [UrlModule, VisitModule, PrismaModule],
  controllers: [RedirectController],
})
export class RedirectModule {}
