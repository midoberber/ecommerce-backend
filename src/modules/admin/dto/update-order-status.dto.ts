import { IsIn } from 'class-validator';
import type { OrderStatus } from '../../../db/schema/index.js';

export const ADMIN_ORDER_STATUSES = [
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const satisfies readonly OrderStatus[];

export class UpdateOrderStatusDto {
  @IsIn(ADMIN_ORDER_STATUSES, { message: 'حالة غير صالحة' })
  status!: (typeof ADMIN_ORDER_STATUSES)[number];
}
