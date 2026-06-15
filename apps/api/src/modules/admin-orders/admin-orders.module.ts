import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { PaymentsModule } from '../payments/payments.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [OrdersModule, PaymentsModule, OperationsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}
