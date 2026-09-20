import { Module } from '@nestjs/common';
import { AddressesModule } from '../addresses/addresses.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PaymentService } from './payment.service.js';

@Module({
  imports: [AddressesModule],
  controllers: [OrdersController],
  providers: [OrdersService, PaymentService],
})
export class OrdersModule {}
