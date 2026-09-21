import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { orderItems, orders, reviews, users } from '../../db/schema/index.js';
import type { CreateReviewDto } from './dto/create-review.dto.js';

const PAID_STATUSES = ['paid', 'shipped', 'delivered'] as const;

@Injectable()
export class ReviewsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByProduct(productId: string) {
    return this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userId: reviews.userId,
        userName: users.name,
        userAvatar: users.avatarUrl,
        verifiedPurchase: sql<boolean>`exists (
          select 1 from ${orders}
          join ${orderItems} on ${orderItems.orderId} = ${orders.id}
          where ${orders.userId} = ${reviews.userId}
            and ${orderItems.productId} = ${reviews.productId}
            and ${orders.status} in ('paid', 'shipped', 'delivered')
        )`,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async upsert(userId: string, productId: string, dto: CreateReviewDto) {
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)));

    if (existing) {
      const [updated] = await this.db
        .update(reviews)
        .set({ ...dto, updatedAt: new Date() })
        .where(eq(reviews.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(reviews)
      .values({ ...dto, userId, productId })
      .returning();

    return created;
  }

  async remove(userId: string, isAdmin: boolean, reviewId: string) {
    const [review] = await this.db.select().from(reviews).where(eq(reviews.id, reviewId));

    if (!review) {
      throw new NotFoundException('التقييم غير موجود');
    }

    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException('لا يمكنك حذف تقييم شخص آخر');
    }

    await this.db.delete(reviews).where(eq(reviews.id, reviewId));
  }

  async hasPurchased(userId: string, productId: string) {
    const [row] = await this.db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.productId, productId),
          inArray(orders.status, [...PAID_STATUSES]),
        ),
      )
      .limit(1);

    return Boolean(row);
  }

  async findMine(userId: string, productId: string) {
    const [review] = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)));

    return review ?? null;
  }
}
