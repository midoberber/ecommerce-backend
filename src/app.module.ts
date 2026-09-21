import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DrizzleModule } from './db/drizzle.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { JwtAuthModule } from './modules/auth/jwt-auth.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { WishlistModule } from './modules/wishlist/wishlist.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  imports: [
    DrizzleModule,
    JwtAuthModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    UploadsModule,
    ReviewsModule,
    WishlistModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
