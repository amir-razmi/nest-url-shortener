import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { UrlService } from '../url/url.service';
import { type Request, type Response } from 'express';
import { VisitService } from '../visit/visit.service';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(
    private urlService: UrlService,
    private visitService: VisitService,
  ) {}

  @ApiOperation({ summary: 'Redirect to the original URL' })
  @ApiParam({ name: 'shortCode', description: 'The short code of the URL', type: String })
  @Get(':shortCode')
  async redirectToOriginalUrl(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const url = await this.urlService.getUrlByShortCode(shortCode);
    if (url) {
      await this.visitService.saveVisit(url.id, req);

      return res.redirect(url.originalUrl);
    }

    return res.status(404).send('URL not found');
  }
}
