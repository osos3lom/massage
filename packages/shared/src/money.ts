export const VAT_RATE = 15;

/**
 * Menu prices are shown to consumers VAT-inclusive (KSA rule),
 * so VAT is extracted, not added: VAT = Price * 15 / 115.
 */
export const vatOf = (inclusiveHalalas: number): number =>
  Math.round((inclusiveHalalas * VAT_RATE) / (100 + VAT_RATE));

/** Converts SAR decimal to integer halalas (e.g. 250.50 -> 25050) */
export const toHalalas = (sar: number): number => Math.round(sar * 100);

/** Converts integer halalas to SAR decimal string (e.g. 25050 -> "250.50") */
export const fmtMoney = (halalas: number): string => (halalas / 100).toFixed(2);

export type DiscountKind = 'percent' | 'amount';

export interface DiscountConfig {
  id: string;
  kind: DiscountKind;
  value: number; // percent (e.g. 10) or halalas (e.g. 5000 = 50.00 SAR)
}

/** Computes discount in halalas capped at subtotal */
export const discountAmount = (discount: DiscountConfig | undefined, subtotalHalalas: number): number => {
  if (!discount || discount.value <= 0) return 0;
  const amount =
    discount.kind === 'percent'
      ? Math.round((subtotalHalalas * discount.value) / 100)
      : discount.value;
  return Math.min(subtotalHalalas, Math.max(0, amount));
};
