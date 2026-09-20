import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { cartItems, orderItems, orders, products } from '../../db/schema/index.js';

@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async checkout(userId: string) {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
          cartItemId: cartItems.id,
          quantity: cartItems.quantity,
          productId: products.id,
          name: products.name,
          priceCents: products.priceCents,
          stock: products.stock,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId));

      if (rows.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const outOfStock = rows.find((row) => row.quantity > row.stock);
      if (outOfStock) {
        throw new BadRequestException(`Not enough stock for ${outOfStock.name}`);
      }

      const totalCents = rows.reduce((sum, row) => sum + row.priceCents * row.quantity, 0);

      const [order] = await tx
        .insert(orders)
        .values({ userId, totalCents, status: 'paid' })
        .returning();

      await tx.insert(orderItems).values(
        rows.map((row) => ({
          orderId: order.id,
          productId: row.productId,
          productName: row.name,
          unitPriceCents: row.priceCents,
          quantity: row.quantity,
        })),
      );

      for (const row of rows) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${row.quantity}`, updatedAt: new Date() })
          .where(eq(products.id, row.productId));
      }

      await tx.delete(cartItems).where(eq(cartItems.userId, userId));

      return order;
    });
  }

  findAll(userId: string) {
    return this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async findById(userId: string, orderId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return { ...order, items };
  }
}
