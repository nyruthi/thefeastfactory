import { Module } from '@nestjs/common';
import { OperatingRegionsModule } from '../operating-regions/operating-regions.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [OperatingRegionsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
