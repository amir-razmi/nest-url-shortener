import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { VisitService } from './visit.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { type Request } from 'express';
import { AdminRoute } from 'src/common/decorators/admin-route.decorator';

@Controller('visit')
export class VisitController {
  constructor(private visitService: VisitService) {}

  @Get(':urlId')
  async getAllVisitsByUrlId(
    @Query() query: PaginationDto,
    @Param('urlId') urlId: string,
    @Req() req: Request,
  ) {
    return this.visitService.getVisitsByUrlId(query, urlId, req.user.userId);
  }

  @AdminRoute()
  @Get('all')
  async getAllVisits(@Query() query: PaginationDto) {
    return this.visitService.getAllVisits(query);
  }
}
