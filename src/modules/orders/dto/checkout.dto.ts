import { IsUUID } from 'class-validator';

export class CheckoutDto {
  @IsUUID(undefined, { message: 'اختر عنوان الشحن' })
  addressId!: string;
}
