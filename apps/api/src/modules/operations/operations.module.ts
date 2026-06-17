import { Module } from '@nestjs/common';
import { OperatingRegionsModule } from '../operating-regions/operating-regions.module';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [OperatingRegionsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
