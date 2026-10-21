import axios from 'axios';
import { getToken, removeToken } from './auth';
import { PurchaseOrder, PurchaseOrderItemInput, Supplier } from '@/types/purchase';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      removeToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: any) => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => api.get('/api/auth/me'),
  registerUser: (data: any) => api.post('/api/auth/register', data),
};

export const categoryAPI = {
  getCategories: (params?: { page?: number; per_page?: number; search?: string; is_active?: boolean; category_type?: string }) => 
    api.get('/api/categories', { params }),
  getCategory: (id: number) => api.get(`/api/categories/${id}`),
  createCategory: (data: any) => api.post('/api/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/api/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/api/categories/${id}`),
};

export const employeeAPI = {
  // ดึงรายชื่อลูกจ้างพร้อม wage + สถิติวันที่ (owner only)
  getEmployeesWithWage: (targetDate?: string) =>
    api.get('/api/employees/', { params: targetDate ? { target_date: targetDate } : {} }),
  // dropdown สำหรับ payment (ทุกคน)
  getEmployeeList: () => api.get('/api/employees/list'),
  // ตั้งค่าค่าแรง (owner only)
  setWage: (userId: number, data: { daily_wage: number; note?: string }) =>
    api.put(`/api/employees/${userId}/wage`, data),
  // แก้ไขข้อมูลลูกจ้าง (owner only)
  updateEmployee: (userId: number, data: {
    full_name?: string;
    username?: string;
    password?: string;
    is_active?: boolean;
    daily_wage?: number;
    wage_note?: string;
  }) => api.put(`/api/employees/${userId}`, data),
  // ลบลูกจ้าง (owner only)
  deleteEmployee: (userId: number) => api.delete(`/api/employees/${userId}`),
  // บันทึกการขาย
  recordSale: (data: any) => api.post('/api/employees/sales', data),
  // ดูประวัติการขาย
  getSalesHistory: (params?: {
    employee_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }) => api.get('/api/employees/sales', { params }),
  // ดูรายงานสรุปการขาย (owner only)
  getSalesReport: (params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: number;
  }) => api.get('/api/employees/reports/sales', { params }),
};

export const purchaseAPI = {
  getSuppliers: (params?: { search?: string; include_inactive?: boolean }) =>
    api.get<Supplier[]>('/api/purchases/suppliers', { params }),
  createSupplier: (data: {
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    note?: string | null;
  }) => api.post<Supplier>('/api/purchases/suppliers', data),
  updateSupplier: (id: number, data: {
    code?: string;
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    note?: string | null;
    is_active?: boolean;
  }) => api.put<Supplier>(`/api/purchases/suppliers/${id}`, data),
  getOrders: (supplierId: number) =>
    api.get<PurchaseOrder[]>(`/api/purchases/suppliers/${supplierId}/orders`),
  createOrder: (supplierId: number, data: {
    order_date: string;
    items: PurchaseOrderItemInput[];
    discount_amount: number;
    tax_rate: number;
    initial_payment: number;
    note?: string;
  }) => api.post<PurchaseOrder>(`/api/purchases/suppliers/${supplierId}/orders`, data),
  receiveItems: (orderId: number, items: { item_id: number; quantity: number }[]) =>
    api.post<PurchaseOrder>(`/api/purchases/orders/${orderId}/receive`, { items }),
  addPayment: (orderId: number, data: { amount: number; note?: string }) =>
    api.post<PurchaseOrder>(`/api/purchases/orders/${orderId}/payments`, data),
  cancelOrder: (orderId: number) =>
    api.post<PurchaseOrder>(`/api/purchases/orders/${orderId}/cancel`),
};

export default api;
