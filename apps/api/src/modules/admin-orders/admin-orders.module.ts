import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { PaymentsModule } from '../payments/payments.module';
import { OperationsModule } from '../operations/operations.module';
import { OperatingRegionsModule } from '../operating-regions/operating-regions.module';

@Module({
  imports: [OrdersModule, PaymentsModule, OperationsModule, OperatingRegionsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}
