import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PayOrderDto {
  @IsString()
  @Matches(/^\d{16}$/, { message: 'رقم البطاقة يجب أن يكون 16 رقماً' })
  cardNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  cardHolder!: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'تاريخ الانتهاء بصيغة MM/YY' })
  expiry!: string;

  @IsString()
  @Matches(/^\d{3}$/, { message: 'رمز التحقق 3 أرقام' })
  cvc!: string;
}
