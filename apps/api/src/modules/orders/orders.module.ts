import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OperationsModule } from '../operations/operations.module';
import { OperatingRegionsModule } from '../operating-regions/operating-regions.module';

@Module({
  imports: [PricingModule, OperationsModule, OperatingRegionsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
