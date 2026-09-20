import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { asc, sql } from 'drizzle-orm';
import { cartItems, productImages, products } from '../../db/schema/index.js';
import type { AddCartItemDto } from './dto/add-cart-item.dto.js';

@Injectable()
export class CartService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getCart(userId: string) {
    const rows = await this.db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        productId: products.id,
        name: products.name,
        priceCents: products.priceCents,
        stock: products.stock,
        imageUrl: sql<string | null>`(
          select ${productImages.url}
          from ${productImages}
          where ${productImages.productId} = ${products.id}
          order by ${productImages.position}
          limit 1
        )`,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(asc(cartItems.createdAt));

    const totalCents = rows.reduce((sum, row) => sum + row.priceCents * row.quantity, 0);

    return { items: rows, totalCents };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, dto.productId));

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, dto.productId)));

    const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;

    if (nextQuantity > product.stock) {
      throw new BadRequestException('Not enough stock');
    }

    if (existing) {
      await this.db
        .update(cartItems)
        .set({ quantity: nextQuantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id));
    } else {
      await this.db
        .insert(cartItems)
        .values({ userId, productId: dto.productId, quantity: dto.quantity });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const [row] = await this.db
      .select({ stock: products.stock })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));

    if (!row) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity > row.stock) {
      throw new BadRequestException('Not enough stock');
    }

    await this.db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, itemId));

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const deleted = await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .returning({ id: cartItems.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Cart item not found');
    }

    return this.getCart(userId);
  }
}
