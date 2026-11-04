export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceType = 'invoice' | 'credit_note';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';

export interface InvoiceLine {
  id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  line_total: number;
}

export interface Invoice {
  id: number;
  reference: string;
  type: InvoiceType;
  type_label: string;
  status: InvoiceStatus;
  status_label: string;
  issue_date: string;
  due_date: string;
  client?: { id: number; name: string } | null;
  lines?: InvoiceLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  credited_amount: number;
  balance_due: number;
  is_overdue: boolean;
  parent_invoice_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentPayload {
  amount: number;
  method?: PaymentMethod;
  payment_date?: string;
  reference_number?: string | null;
  notes?: string | null;
}

export const PAYMENT_METHODS: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'card', label: 'Carte' },
  { value: 'other', label: 'Autre' },
];
