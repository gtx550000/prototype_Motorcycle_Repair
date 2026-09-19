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

export default api;
