export type PaymentDirection = 'in' | 'out';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';

export interface Payment {
  id: number;
  reference: string;
  payable_type: string;
  payable_id: number;
  direction: PaymentDirection;
  direction_label: string;
  method: PaymentMethod;
  method_label: string;
  amount: number;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export type BankLineStatus = 'unmatched' | 'matched' | 'ignored';

export interface BankLine {
  id: number;
  reference: string | null;
  label: string;
  amount: number;
  direction: PaymentDirection;
  direction_label: string;
  value_date: string;
  status: BankLineStatus;
  status_label: string;
  payment_id: number | null;
  payment?: Payment | null;
  matched_at: string | null;
  created_at: string;
}

export interface BankLinePayload {
  label: string;
  amount: number;
  direction: PaymentDirection;
  value_date?: string;
  reference?: string | null;
}

export interface BankSummary {
  unmatched: number;
  matched: number;
  ignored: number;
}
