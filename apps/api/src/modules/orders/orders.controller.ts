import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderSelectionDto } from './dto/order-selection.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post('quote') quote(@CurrentUser() user: JwtPayload, @Body() dto: OrderSelectionDto) { return this.orders.quote(user.sub, dto); }
  @Post() create(@CurrentUser() user: JwtPayload, @Body() dto: OrderSelectionDto) { return this.orders.create(user.sub, dto); }
  @Get() list(@CurrentUser() user: JwtPayload) { return this.orders.list(user.sub); }
  @Get(':id') get(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.orders.get(user.sub, id); }
  @Post(':id/cancel') cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CancelOrderDto) { return this.orders.cancel(user.sub, id, dto); }
}
