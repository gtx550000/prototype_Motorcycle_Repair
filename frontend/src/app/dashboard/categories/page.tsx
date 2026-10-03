'use client';
import React from 'react';
import { CategoryList } from '@/components/categories/CategoryList';

export default function CategoriesPage() {
  return (
    <div className="h-full">
      <div className="p-6 pb-0">
        <h2 className="text-2xl font-bold text-gray-800">จัดการหมวดหมู่อะไหล่</h2>
        <p className="text-gray-500 mt-1">เพิ่ม แก้ไข หรือลบ หมวดหมู่อะไหล่ของร้าน</p>
      </div>
      <CategoryList />
    </div>
  );
}
