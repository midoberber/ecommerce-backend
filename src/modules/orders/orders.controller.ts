import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator.js';
import { OrdersService } from './orders.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.userId, dto);
  }

  @Post(':id/pay')
  pay(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PayOrderDto) {
    return this.ordersService.pay(user.userId, id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.cancel(user.userId, id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.ordersService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findById(user.userId, id);
  }
}
