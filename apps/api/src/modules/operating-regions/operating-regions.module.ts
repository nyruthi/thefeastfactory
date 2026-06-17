import { Module } from '@nestjs/common';
import { OperatingRegionsController } from './operating-regions.controller';
import { OperatingRegionsService } from './operating-regions.service';

@Module({
  controllers: [OperatingRegionsController],
  providers: [OperatingRegionsService],
  exports: [OperatingRegionsService],
})
export class OperatingRegionsModule {}
