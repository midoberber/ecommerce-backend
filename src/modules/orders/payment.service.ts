import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PayOrderDto } from './dto/pay-order.dto.js';

export interface PaymentResult {
  approved: boolean;
  reference: string;
  last4: string;
  declineReason?: string;
}

const DECLINE_CARD = '4000000000000002';

@Injectable()
export class PaymentService {
  async charge(dto: PayOrderDto, amountCents: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const last4 = dto.cardNumber.slice(-4);
    const reference = `test_${randomUUID().slice(0, 12)}`;

    if (dto.cardNumber === DECLINE_CARD) {
      return { approved: false, reference, last4, declineReason: 'تم رفض البطاقة من البنك' };
    }

    if (!this.passesLuhn(dto.cardNumber)) {
      return { approved: false, reference, last4, declineReason: 'رقم البطاقة غير صالح' };
    }

    if (this.isExpired(dto.expiry)) {
      return { approved: false, reference, last4, declineReason: 'البطاقة منتهية الصلاحية' };
    }

    if (amountCents <= 0) {
      return { approved: false, reference, last4, declineReason: 'مبلغ غير صالح' };
    }

    return { approved: true, reference, last4 };
  }

  private passesLuhn(cardNumber: string): boolean {
    let sum = 0;
    let double = false;

    for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
      let digit = Number(cardNumber[i]);

      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      double = !double;
    }

    return sum % 10 === 0;
  }

  private isExpired(expiry: string): boolean {
    const [month, year] = expiry.split('/').map(Number);
    const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59);
    return expiryDate < new Date();
  }
}
