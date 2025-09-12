import { Module } from '@nestjs/common';
import { RedirectController } from './redirect.controller';
import { UrlService } from '../url/url.service';
import { VisitService } from '../visit/visit.service';

@Module({
  imports: [UrlService, VisitService],
  controllers: [RedirectController],
})
export class RedirectModule {}
