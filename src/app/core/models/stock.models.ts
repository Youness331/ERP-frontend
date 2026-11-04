import { Product, Warehouse } from './catalog.models';

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out';

export interface StockLevel {
  id: number;
  product_id: number;
  warehouse_id: number;
  product?: Product | null;
  warehouse?: Warehouse | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  type: StockMovementType;
  type_label: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost: number | null;
  reason: string | null;
  reference_type: string | null;
  reference_id: number | null;
  product?: Product | null;
  warehouse?: Warehouse | null;
  user?: { id: number; name: string } | null;
  created_at: string;
}

export interface StockMovementPayload {
  product_id: number;
  warehouse_id: number;
  type: StockMovementType;
  quantity: number;
  unit_cost?: number | null;
  reason?: string | null;
}
