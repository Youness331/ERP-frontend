/**
 * Catalogue types (categories and products) mirroring the ERP API.
 */

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  products_count?: number;
}

export interface Product {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: number | null;
  category?: Category | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  cost_price: number;
  tax_rate: number;
  reorder_level: number;
  track_stock: boolean;
  is_active: boolean;
  stock_quantity?: number;
  reserved_quantity?: number;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  sku: string;
  name: string;
  barcode?: string | null;
  description?: string | null;
  category_id?: number | null;
  unit?: string;
  purchase_price?: number;
  sale_price?: number;
  tax_rate?: number;
  reorder_level?: number;
  track_stock?: boolean;
  is_active?: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_default: boolean;
  is_active: boolean;
}
