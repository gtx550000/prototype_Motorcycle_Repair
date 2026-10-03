export interface Category {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  price: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  name_en?: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  price: number;
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
  page: number;
  per_page: number;
}
