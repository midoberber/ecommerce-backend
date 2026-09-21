import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('customer'),
  isBlocked: boolean('is_blocked').notNull().default(false),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  city: varchar('city', { length: 120 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
