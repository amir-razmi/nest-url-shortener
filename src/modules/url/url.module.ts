import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';

@Module({
  providers: [UrlService],
  controllers: [UrlController],
  exports: [UrlService],
})
export class UrlModule {}
