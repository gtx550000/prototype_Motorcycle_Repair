'use client';
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Category, CategoryFormData } from '@/types/category';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData?: Category;
  categories: Category[];
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ isOpen, onClose, onSubmit, initialData, categories }) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_en: '',
    description: '',
    icon: '🔧',
    is_active: true,
    sort_order: 1,
    price: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        name_en: initialData.name_en || '',
        description: initialData.description || '',
        icon: initialData.icon || '🔧',
        parent_id: initialData.parent_id,
        is_active: initialData.is_active,
        sort_order: initialData.sort_order || 1,
        price: initialData.price ?? 0,
      });
    } else {
      setFormData({
        name: '',
        name_en: '',
        description: '',
        icon: '🔧',
        is_active: true,
        sort_order: 1,
        price: 0,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input 
          label="ชื่อหมวดหมู่ *" 
          required 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
        <Input 
          label="ชื่อภาษาอังกฤษ" 
          value={formData.name_en} 
          onChange={(e) => setFormData({...formData, name_en: e.target.value})} 
        />
        
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-sm font-medium text-gray-700">คำอธิบาย</label>
          <textarea 
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <Input 
          label="ไอคอน (Emoji)" 
          value={formData.icon} 
          onChange={(e) => setFormData({...formData, icon: e.target.value})} 
        />

        {/* ราคาสินค้า */}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-sm font-medium text-gray-700">ราคา (บาท)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border border-gray-300 pl-7 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-sm font-medium text-gray-700">หมวดหมู่หลัก (ไม่บังคับ)</label>
          <select 
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={formData.parent_id || ''}
            onChange={(e) => setFormData({...formData, parent_id: e.target.value ? Number(e.target.value) : undefined})}
          >
            <option value="">-- ไม่มีหมวดหมู่หลัก --</option>
            {categories.filter(c => c.id !== initialData?.id).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <Input 
          label="ลำดับการแสดงผล" 
          type="number"
          value={formData.sort_order} 
          onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})} 
        />

        <div className="flex items-center gap-2 mb-4">
          <input 
            type="checkbox" 
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            className="w-4 h-4 text-primary-600 rounded"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">เปิดใช้งาน</label>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit" loading={loading}>บันทึก</Button>
        </div>
      </form>
    </Modal>
  );
};
