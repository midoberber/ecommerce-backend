import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator.js';
import { WishlistService } from './wishlist.service.js';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.wishlistService.findAll(user.userId);
  }

  @Get('ids')
  findIds(@CurrentUser() user: AuthUser) {
    return this.wishlistService.findIds(user.userId);
  }

  @Post(':productId')
  add(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.wishlistService.add(user.userId, productId);
  }

  @Delete(':productId')
  remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.wishlistService.remove(user.userId, productId);
  }
}
