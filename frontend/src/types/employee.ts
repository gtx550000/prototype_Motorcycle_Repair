// Employee & Sale types for frontend
export interface EmployeeWithWage {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  daily_wage: number;
  wage_note?: string;
  today_sales_count: number;
  today_sales_total: number;
}

export interface SaleItem {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  price: number;
  qty: number;
}

export interface SaleRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  sale_date: string;
  license_plate?: string;
  vehicle_model?: string;
  customer_name?: string;
  note?: string;
  payment_method: string;
  total_amount: number;
  items_json?: string;
  created_at: string;
}

export interface SaleRecordListResponse {
  records: SaleRecord[];
  total: number;
  total_amount: number;
}

export interface EmployeeDropdown {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface ItemSaleStat {
  item_id: number;
  item_name: string;
  icon?: string;
  price: number;
  total_qty: number;
  total_amount: number;
}

export interface EmployeeSaleStat {
  employee_id: number;
  employee_name: string;
  username: string;
  total_revenue: number;
  total_bills: number;
  total_items_sold: number;
  items_breakdown: ItemSaleStat[];
}

export interface SalesReportResponse {
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_bills: number;
  total_items_sold: number;
  employees_summary: EmployeeSaleStat[];
  top_items: ItemSaleStat[];
  records: SaleRecord[];
}

