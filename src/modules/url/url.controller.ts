import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { type Request } from 'express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminRoute } from 'src/common/decorators/admin-route.decorator';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequireAuth } from 'src/common/decorators/require-auth.decorator';

@RequireAuth()
@ApiTags('URL')
@Controller('url')
export class UrlController {
  constructor(private urlService: UrlService) {}

  @ApiOperation({ summary: 'Create a new short URL' })
  @Post('create')
  createShortUrl(@Body() body: CreateShortUrlDto, @Req() req: Request) {
    return this.urlService.createShortUrl(body, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete a short URL by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the URL to delete', type: String })
  @Delete('delete/:id')
  deleteShortUrl(@Req() req: Request, @Param('id') id: string) {
    return this.urlService.deleteShortUrl(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get all URLs for the authenticated user' })
  @Get('all')
  getAllUrls(@Req() req: Request, @Query() query: PaginationDto) {
    return this.urlService.getAllUrls(query, req.user.userId);
  }

  @ApiOperation({ summary: 'Get all URLs (Admin only)' })
  @AdminRoute()
  @Get('admin/all')
  getAllUrlsAdmin(@Query() query: PaginationDto) {
    return this.urlService.getAllUrls(query);
  }
}
