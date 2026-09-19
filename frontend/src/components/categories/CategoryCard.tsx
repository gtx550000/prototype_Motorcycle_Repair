'use client';
import React from 'react';
import { Category } from '@/types/category';
import { Badge } from '../ui/Badge';

export const CategoryCard = ({ category }: { category: Category }) => {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon || '📦'}</span>
          <div>
            <h3 className="font-bold text-lg">{category.name}</h3>
            <p className="text-sm text-gray-500">{category.name_en}</p>
          </div>
        </div>
        <Badge variant={category.is_active ? 'active' : 'inactive'}>
          {category.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </Badge>
      </div>
      <p className="text-gray-600 text-sm mt-3">{category.description || 'ไม่มีคำอธิบาย'}</p>
    </div>
  );
};
