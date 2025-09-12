import { Controller, Get, Param, Res } from '@nestjs/common';
import { UrlService } from '../url/url.service';
import { type Response } from 'express';

@Controller()
export class RedirectController {
  constructor(private urlService: UrlService) {}

  @Get(':shortCode')
  async redirectToOriginalUrl(@Param('shortCode') shortCode: string, @Res() res: Response) {
    const url = await this.urlService.getUrlByShortCode(shortCode);
    if (url) return res.redirect(url.originalUrl);

    return res.status(404).send('URL not found');
  }
}
