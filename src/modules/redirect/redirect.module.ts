import { Module } from '@nestjs/common';
import { RedirectController } from './redirect.controller';
import { UrlService } from '../url/url.service';

@Module({
  imports: [UrlService],
  controllers: [RedirectController],
})
export class RedirectModule {}
