import axios from 'axios';
import { getToken, removeToken } from './auth';

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
};

export default api;
