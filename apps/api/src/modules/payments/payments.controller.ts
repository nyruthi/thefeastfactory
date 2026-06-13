import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post('orders/:id/payments/razorpay-order')
  @ApiBearerAuth()
  @UseGuards(CustomerAuthGuard)
  create(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.payments.createGatewayOrder(user.sub, id); }

  @Post('payments/razorpay/verify')
  @ApiBearerAuth()
  @UseGuards(CustomerAuthGuard)
  verify(@CurrentUser() user: JwtPayload, @Body() dto: VerifyPaymentDto) { return this.payments.verify(user.sub, dto); }

  @Post('payments/razorpay/webhook')
  webhook(@Body() payload: Record<string, any>, @Headers('x-razorpay-signature') signature?: string) {
    return this.payments.webhook(payload, signature);
  }
}
