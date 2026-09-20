import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { cartItems, formatAddress, orderItems, orders, productImages, products } from '../../db/schema/index.js';
import { AddressesService } from '../addresses/addresses.service.js';
import { PaymentService } from './payment.service.js';
import type { CheckoutDto } from './dto/checkout.dto.js';
import type { PayOrderDto } from './dto/pay-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly paymentService: PaymentService,
    private readonly addressesService: AddressesService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const address = await this.addressesService.findById(userId, dto.addressId);

    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
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
        .values({
          userId,
          totalCents,
          status: 'pending',
          addressId: address.id,
          shippingAddress: formatAddress(address),
        })
        .returning();

      await tx.insert(orderItems).values(
        rows.map((row) => ({
          orderId: order.id,
          productId: row.productId,
          productName: row.name,
          imageUrl: row.imageUrl,
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

  async pay(userId: string, orderId: string, dto: PayOrderDto) {
    const order = await this.findOrderRow(userId, orderId);

    if (order.status === 'paid') {
      throw new BadRequestException('هذا الطلب مدفوع بالفعل');
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException('لا يمكن دفع طلب ملغي');
    }

    const result = await this.paymentService.charge(dto, order.totalCents);

    if (!result.approved) {
      await this.db
        .update(orders)
        .set({ status: 'failed', paymentReference: result.reference })
        .where(eq(orders.id, orderId));

      throw new BadRequestException(result.declineReason ?? 'فشلت عملية الدفع');
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        status: 'paid',
        paymentReference: result.reference,
        cardLast4: result.last4,
        paidAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.findOrderRow(userId, orderId);

    if (order.status === 'paid') {
      throw new BadRequestException('لا يمكن إلغاء طلب مدفوع');
    }
    if (order.status === 'cancelled') {
      return order;
    }

    return this.db.transaction(async (tx) => {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (!item.productId) continue;
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }

      const [updated] = await tx
        .update(orders)
        .set({ status: 'cancelled' })
        .where(eq(orders.id, orderId))
        .returning();

      return updated;
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
    const order = await this.findOrderRow(userId, orderId);

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.productName));

    return { ...order, items };
  }

  private async findOrderRow(userId: string, orderId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
