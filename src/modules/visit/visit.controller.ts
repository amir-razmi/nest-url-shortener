import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { VisitService } from './visit.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { type Request } from 'express';
import { AdminRoute } from 'src/common/decorators/admin-route.decorator';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequireAuth } from 'src/common/decorators/require-auth.decorator';

@RequireAuth()
@ApiTags('Visit')
@Controller('visit')
export class VisitController {
  constructor(private visitService: VisitService) {}

  @ApiOperation({ summary: 'Get all visits for a specific URL by URL ID' })
  @ApiParam({ name: 'urlId', description: 'The ID of the URL', type: String })
  @Get(':urlId')
  async getAllVisitsByUrlId(
    @Query() query: PaginationDto,
    @Param('urlId') urlId: string,
    @Req() req: Request,
  ) {
    return this.visitService.getVisitsByUrlId(query, urlId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get all visits (Admin only)' })
  @AdminRoute()
  @Get('all')
  async getAllVisits(@Query() query: PaginationDto) {
    return this.visitService.getAllVisits(query);
  }
}
