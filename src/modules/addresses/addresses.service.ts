import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ne } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { addresses, type Address } from '../../db/schema/index.js';
import type { CreateAddressDto } from './dto/create-address.dto.js';
import type { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class AddressesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(userId: string): Promise<Address[]> {
    return this.db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  async findById(userId: string, id: string): Promise<Address> {
    const [address] = await this.db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    if (!address) {
      throw new NotFoundException('العنوان غير موجود');
    }

    return address;
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const existing = await this.findAll(userId);
    const shouldBeDefault = dto.isDefault || existing.length === 0;

    return this.db.transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, userId));
      }

      const [address] = await tx
        .insert(addresses)
        .values({ ...dto, userId, isDefault: shouldBeDefault })
        .returning();

      return address;
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<Address> {
    await this.findById(userId, id);

    return this.db.transaction(async (tx) => {
      if (dto.isDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(and(eq(addresses.userId, userId), ne(addresses.id, id)));
      }

      const [address] = await tx
        .update(addresses)
        .set({ ...dto, updatedAt: new Date() })
        .where(eq(addresses.id, id))
        .returning();

      return address;
    });
  }

  async setDefault(userId: string, id: string): Promise<Address> {
    await this.findById(userId, id);

    return this.db.transaction(async (tx) => {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));

      const [address] = await tx
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, id))
        .returning();

      return address;
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const address = await this.findById(userId, id);

    await this.db.transaction(async (tx) => {
      await tx.delete(addresses).where(eq(addresses.id, id));

      if (!address.isDefault) return;

      const [next] = await tx
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.createdAt))
        .limit(1);

      if (next) {
        await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
      }
    });
  }
}
