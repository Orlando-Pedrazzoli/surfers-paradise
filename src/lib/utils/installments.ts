import { company } from '@/lib/config/company';

export interface InstallmentInfo {
  count: number;
  value: number;
  total: number;
  hasFees: boolean;
}

export function calculateInstallments(price: number): InstallmentInfo {
  const { maxInstallments, minInstallmentValue } = company.payment;

  let count = maxInstallments;

  while (count > 1 && price / count < minInstallmentValue) {
    count--;
  }

  return {
    count,
    value: price / count,
    total: price,
    hasFees: false,
  };
}

export function calculatePixPrice(price: number): number {
  const discount = company.payment.pixDiscountPercent;
  return price * (1 - discount / 100);
}
