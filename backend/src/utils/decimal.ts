import { Decimal } from 'decimal.js';

export function toDecimal(val: number | string | Decimal | undefined | null): Decimal {
  if (val === undefined || val === null || val === '') return new Decimal(0);
  return new Decimal(val);
}

export function roundMoney(val: Decimal): Decimal {
  return val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculatePercentage(base: Decimal, percent: number | string | Decimal): Decimal {
  return roundMoney(base.times(toDecimal(percent)).dividedBy(100));
}

