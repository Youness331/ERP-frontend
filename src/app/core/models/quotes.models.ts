import { OrderLinePayload } from './orders.models';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteLine {
  id: number;
  product_id: number;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  line_total: number;
}

export interface Quote {
  id: number;
  reference: string;
  status: QuoteStatus;
  status_label: string;
  quote_date: string;
  valid_until: string | null;
  client?: { id: number; name: string } | null;
  warehouse?: { id: number; name: string } | null;
  lines?: QuoteLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  notes: string | null;
  sales_order_id: number | null;
  is_expired: boolean;
  can_be_converted: boolean;
  created_at: string;
}

export interface QuotePayload {
  client_id: number;
  warehouse_id: number;
  valid_until?: string | null;
  notes?: string | null;
  lines: OrderLinePayload[];
}
