import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { AttachCartEventDto } from './dto/attach-cart-event.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import { ReplaceCartItemsDto } from './dto/replace-cart-items.dto';
import { CartService } from './cart.service';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly carts: CartService) {}

  @Get('active')
  active(@CurrentUser() user: JwtPayload) {
    return this.carts.getActive(user.sub);
  }

  @Post()
  createOrFetch(@CurrentUser() user: JwtPayload, @Body() dto: CreateCartDto) {
    return this.carts.createOrFetch(user.sub, dto);
  }

  @Put(':id/items')
  replaceItems(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplaceCartItemsDto,
  ) {
    return this.carts.replaceItems(user.sub, id, dto);
  }

  @Patch(':id/event')
  attachEvent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AttachCartEventDto,
  ) {
    return this.carts.attachEvent(user.sub, id, dto);
  }

  @Post(':id/quote')
  quote(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.carts.quote(user.sub, id);
  }

  @Post(':id/checkout')
  checkout(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.carts.checkout(user.sub, id);
  }
}
