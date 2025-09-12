import { Module } from '@nestjs/common';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VisitService],
  controllers: [VisitController],
  exports: [VisitService],
})
export class VisitModule {}
