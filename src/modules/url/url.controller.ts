import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { type Request } from 'express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminRoute } from 'src/common/decorators/admin-route.decorator';

@Controller('url')
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Post('create')
  createShortUrl(@Body() body: CreateShortUrlDto, @Req() req: Request) {
    return this.urlService.createShortUrl(body, req.user.userId);
  }

  @Delete('delete/:id')
  deleteShortUrl(@Req() req: Request, @Param('id') id: string) {
    return this.urlService.deleteShortUrl(id, req.user.userId);
  }

  @Get('all')
  getAllUrls(@Req() req: Request, @Query() query: PaginationDto) {
    return this.urlService.getAllUrls(query, req.user.userId);
  }

  @AdminRoute()
  @Get('admin/all')
  getAllUrlsAdmin(@Query() query: PaginationDto) {
    return this.urlService.getAllUrls(query);
  }
}
