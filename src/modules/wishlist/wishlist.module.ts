import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

@Module({
  imports: [ProductsModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
