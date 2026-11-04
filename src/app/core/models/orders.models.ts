import { Product } from './catalog.models';

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'partially_delivered'
  | 'delivered'
  | 'invoiced'
  | 'cancelled';

export type PurchaseOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface SalesOrderLine {
  id: number;
  product_id: number;
  product?: Product | null;
  description: string | null;
  quantity: number;
  delivered_quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  line_total: number;
}

export interface SalesOrder {
  id: number;
  reference: string;
  status: SalesOrderStatus;
  status_label: string;
  order_date: string;
  delivery_date: string | null;
  client?: { id: number; name: string } | null;
  warehouse?: { id: number; name: string } | null;
  lines?: SalesOrderLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export interface PurchaseOrderLine {
  id: number;
  product_id: number;
  product?: Product | null;
  description: string | null;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  line_total: number;
}

export interface PurchaseOrder {
  id: number;
  reference: string;
  status: PurchaseOrderStatus;
  status_label: string;
  order_date: string;
  expected_date: string | null;
  received_at: string | null;
  supplier?: { id: number; name: string } | null;
  warehouse?: { id: number; name: string } | null;
  lines?: PurchaseOrderLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  notes: string | null;
  created_at: string;
}

export interface OrderLinePayload {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
}

export interface SalesOrderPayload {
  client_id: number;
  warehouse_id: number;
  order_date?: string;
  lines: OrderLinePayload[];
}

export interface PurchaseOrderPayload {
  supplier_id: number;
  warehouse_id: number;
  order_date?: string;
  expected_date?: string;
  lines: OrderLinePayload[];
}
