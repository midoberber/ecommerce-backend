import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('products/:productId/reviews/me')
  async findMine(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    const [review, canReview] = await Promise.all([
      this.reviewsService.findMine(user.userId, productId),
      this.reviewsService.hasPurchased(user.userId, productId),
    ]);

    return { review, canReview };
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/:productId/reviews')
  create(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.upsert(user.userId, productId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewsService.remove(user.userId, user.role === 'admin', id);
  }
}
