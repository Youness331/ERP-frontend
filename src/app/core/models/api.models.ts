/**
 * Types mirroring the Laravel REST API payloads (see docs/API.md in ERP-backend).
 */

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface Role {
  id: number;
  name: string;
  label: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
  is_active: boolean;
  role: Role | null;
  permissions: string[];
  is_admin: boolean;
  last_login_at: string | null;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  user: AuthUser;
}

export interface Client {
  id: number;
  code: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  ice: string | null;
  tax_id: string | null;
  rc: string | null;
  patente: string | null;
  credit_limit: number;
  notes: string | null;
  is_active: boolean;
  sales_orders_count?: number;
  invoices_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientPayload {
  name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  ice?: string | null;
  tax_id?: string | null;
  rc?: string | null;
  patente?: string | null;
  credit_limit?: number;
  notes?: string | null;
  is_active?: boolean;
}

export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
}

export interface Company {
  name: string;
  city: string;
  address: string;
  country: string;
  phone: string;
  email: string;
  ice: string;
  tax_id: string;
  rc: string;
  patente: string;
}

export interface DashboardSummary {
  company: Company;
  currency: Currency;
  period: { from: string; to: string };
  revenue: {
    current_month: number;
    previous_month: number;
    growth_percent: number | null;
    collected_this_month: number;
  };
  receivables: { outstanding: number; overdue_amount: number; overdue_count: number };
  sales: { open_orders: number; to_deliver: number; orders_this_month: number };
  purchasing: { pending_orders: number; orders_this_month: number };
  inventory: { low_stock_count: number; stock_value: number; product_count: number };
  partners: { clients: number; suppliers: number };
  charts: {
    sales_last_12_months: { month: string; label: string; total: number }[];
  };
  top_products: { id: number; name: string; sku: string; quantity: number; revenue: number }[];
  low_stock_products: {
    id: number;
    sku: string;
    name: string;
    reorder_level: number;
    quantity: number;
  }[];
  recent_invoices: {
    id: number;
    reference: string;
    client: string | null;
    status: string;
    status_label: string;
    issue_date: string;
    total: number;
    balance_due: number;
  }[];
}

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiMessage {
  message: string;
}
