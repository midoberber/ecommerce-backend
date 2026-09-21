import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, eq, inArray, sql, sum } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { orderItems, orders, products, reviews, users } from '../../db/schema/index.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import type { BlockUserDto } from './dto/block-user.dto.js';

const REVENUE_STATUSES = ['paid', 'shipped', 'delivered'] as const;

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getStats() {
    const [
      [productStats],
      [userCount],
      [orderCount],
      [revenue],
      [pendingCount],
      [reviewCount],
      topProducts,
    ] = await Promise.all([
      this.db
        .select({
          total: count(),
          outOfStock: sql<string>`count(*) filter (where ${products.stock} = 0)`,
        })
        .from(products),
      this.db.select({ total: count() }).from(users),
      this.db.select({ total: count() }).from(orders),
      this.db
        .select({ total: sum(orders.totalCents) })
        .from(orders)
        .where(inArray(orders.status, [...REVENUE_STATUSES])),
      this.db
        .select({ total: count() })
        .from(orders)
        .where(eq(orders.status, 'pending')),
      this.db.select({ total: count() }).from(reviews),
      this.db
        .select({
          productId: orderItems.productId,
          name: orderItems.productName,
          soldQuantity: sql<string>`sum(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(inArray(orders.status, [...REVENUE_STATUSES]))
        .groupBy(orderItems.productId, orderItems.productName)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(5),
    ]);

    return {
      products: productStats.total,
      outOfStock: Number(productStats.outOfStock),
      users: userCount.total,
      orders: orderCount.total,
      pendingOrders: pendingCount.total,
      reviews: reviewCount.total,
      revenueCents: Number(revenue.total ?? 0),
      topProducts: topProducts.map((item) => ({
        productId: item.productId,
        name: item.name,
        soldQuantity: Number(item.soldQuantity),
      })),
    };
  }

  async getSalesTrend(days = 14) {
    const rows = await this.db.execute<{
      date: string;
      revenue_cents: string;
      order_count: string;
    }>(sql`
      select
        to_char(day::date, 'YYYY-MM-DD') as date,
        coalesce(sum(${orders.totalCents}), 0) as revenue_cents,
        count(${orders.id}) as order_count
      from generate_series(
        current_date - make_interval(days => ${days - 1}),
        current_date,
        '1 day'
      ) as day
      left join ${orders}
        on ${orders.createdAt}::date = day::date
        and ${orders.status} in ('paid', 'shipped', 'delivered')
      group by day
      order by day
    `);

    return rows.rows.map((row) => ({
      date: row.date,
      revenueCents: Number(row.revenue_cents),
      orderCount: Number(row.order_count),
    }));
  }

  async getOrdersByStatus() {
    const rows = await this.db
      .select({ status: orders.status, total: count() })
      .from(orders)
      .groupBy(orders.status);

    return rows.map((row) => ({ status: row.status, count: row.total }));
  }

  async findAllUsers() {
    return this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isBlocked: users.isBlocked,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        orderCount: count(orders.id),
        totalSpentCents: sql<string>`coalesce(sum(${orders.totalCents}) filter (
          where ${orders.status} in ('paid', 'shipped', 'delivered')
        ), 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));
  }

  async setBlocked(adminId: string, userId: string, dto: BlockUserDto) {
    if (adminId === userId) {
      throw new BadRequestException('لا يمكنك حظر حسابك');
    }

    const [target] = await this.db.select().from(users).where(eq(users.id, userId));

    if (!target) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (target.role === 'admin' && dto.isBlocked) {
      throw new BadRequestException('لا يمكن حظر حساب مدير');
    }

    const [updated] = await this.db
      .update(users)
      .set({ isBlocked: dto.isBlocked, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        isBlocked: users.isBlocked,
      });

    return updated;
  }

  async findAllOrders() {
    return this.db
      .select({
        id: orders.id,
        totalCents: orders.totalCents,
        status: orders.status,
        createdAt: orders.createdAt,
        shippingAddress: orders.shippingAddress,
        customerName: users.name,
        customerEmail: users.email,
        itemCount: sql<string>`(
          select coalesce(sum(${orderItems.quantity}), 0)
          from ${orderItems}
          where ${orderItems.orderId} = ${orders.id}
        )`,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.status === 'pending' && dto.status !== 'cancelled') {
      throw new BadRequestException('لا يمكن شحن طلب غير مدفوع');
    }

    const [updated] = await this.db
      .update(orders)
      .set({ status: dto.status })
      .where(eq(orders.id, orderId))
      .returning();

    return updated;
  }
}
