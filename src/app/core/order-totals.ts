/**
 * Shared money arithmetic for document line editors (orders, quotes).
 */

export interface OrderLineDraft {
  product_id: number | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function computeTotals(lines: readonly OrderLineDraft[]): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const tax = lines.reduce(
    (sum, line) => sum + (line.quantity * line.unit_price * line.tax_rate) / 100,
    0,
  );

  return { subtotal, tax, total: subtotal + tax };
}
