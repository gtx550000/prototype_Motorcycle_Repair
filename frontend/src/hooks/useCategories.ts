'use client';
import { useState, useCallback } from 'react';
import { categoryAPI } from '@/lib/api';
import { Category, CategoryFormData, CategoryListResponse } from '@/types/category';

export const useCategories = () => {
  const [data, setData] = useState<CategoryListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (page = 1, search = '', category_type = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryAPI.getCategories({ page, search, category_type: category_type || undefined });
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = async (payload: CategoryFormData) => {
    await categoryAPI.createCategory(payload);
    await fetchCategories(1);
  };

  const editCategory = async (id: number, payload: CategoryFormData) => {
    await categoryAPI.updateCategory(id, payload);
    await fetchCategories(data?.page || 1);
  };

  const removeCategory = async (id: number) => {
    await categoryAPI.deleteCategory(id);
    await fetchCategories(data?.page || 1);
  };

  return {
    categories: data?.categories || [],
    pagination: {
      page: data?.page || 1,
      total: data?.total || 0,
      per_page: data?.per_page || 10,
    },
    loading,
    error,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
  };
};
