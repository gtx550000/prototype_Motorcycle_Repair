export interface Supplier {
  id: number;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  is_active: boolean;
  purchase_total: number;
  outstanding_balance: number;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  category_id?: number | null;
  sku?: string | null;
  name: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PurchasePayment {
  id: number;
  amount: number;
  note?: string | null;
  paid_at: string;
}

export type PurchaseStatus = 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: number;
  purchase_no: string;
  supplier_id: number;
  supplier_name: string;
  order_date: string;
  status: PurchaseStatus;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  note?: string | null;
  created_at: string;
  items: PurchaseOrderItem[];
  payments: PurchasePayment[];
}

export interface PurchaseOrderItemInput {
  category_id?: number | null;
  sku?: string;
  name: string;
  quantity: number;
  unit_price: number;
}
