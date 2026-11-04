export interface ReportPeriod {
  from: string;
  to: string;
}

export interface SalesReport {
  period: ReportPeriod;
  invoice_count: number;
  revenue: number;
  tax_collected: number;
  discounts_granted: number;
  average_invoice: number;
  by_month: { month: string; total: number }[];
  top_products: { product_id: number; name: string; sku: string; quantity: number; revenue: number }[];
  top_clients: { client_id: number; client: string; revenue: number; invoices: number }[];
}

export interface PurchasesReport {
  period: ReportPeriod;
  order_count: number;
  spend: number;
  paid: number;
  outstanding: number;
  by_supplier: { supplier_id: number; supplier: string; spend: number; orders: number }[];
}

export interface StockValuation {
  total_value: number;
  by_warehouse: { warehouse_id: number; warehouse: string; quantity: number; value: number }[];
}

export interface ReceivablesAging {
  total: number;
  invoice_count: number;
  buckets: { key: string; label: string; amount: number; count: number }[];
}
