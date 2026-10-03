'use client';
import React, { useEffect, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Category } from '@/types/category';
import { CategoryForm } from './CategoryForm';
import { CategoryDeleteModal } from './CategoryDeleteModal';

export const CategoryList = () => {
  const { categories, pagination, loading, fetchCategories, addCategory, editCategory, removeCategory } = useCategories();
  const { isOwner } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryType, setCategoryType] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  useEffect(() => {
    fetchCategories(1, search, categoryType);
  }, [fetchCategories, search, categoryType]);

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (cat: Category) => {
    setSelectedCategory(cat);
    setIsDeleteOpen(true);
  };

  const onFormSubmit = async (data: any) => {
    if (selectedCategory) {
      await editCategory(selectedCategory.id, data);
    } else {
      await addCategory(data);
    }
    setIsFormOpen(false);
  };

  const onDeleteConfirm = async () => {
    if (selectedCategory) {
      await removeCategory(selectedCategory.id);
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'รหัสหมวดหมู่',
      accessor: (row: Category) => (
        <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {row.description?.replace('รหัสอ้างอิง: ', '') || '-'}
        </span>
      )
    },
    {
      header: 'ชื่อภาษาไทย',
      accessor: (row: Category) => (
        <div className="flex items-center gap-2">
          <span>{row.icon}</span>
          <span className="font-semibold">{row.name}</span>
        </div>
      )
    },
    { header: 'ชื่อภาษาอังกฤษ', accessor: (row: Category) => row.name_en || '-' },
    { 
      header: 'รายละเอียด', 
      accessor: (row: Category) => row.description?.startsWith('รหัสอ้างอิง:') ? '-' : row.description 
    },
    {
      header: 'สถานะ',
      accessor: (row: Category) => (
        <Badge variant={row.is_active ? 'active' : 'inactive'}>
          {row.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </Badge>
      )
    }
  ];

  if (isOwner) {
    columns.push({
      header: 'จัดการ',
      accessor: (row: Category) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>แก้ไข</Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>ลบ</Button>
        </div>
      )
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6">
        <div className="flex gap-4">
          <div className="w-64">
            <Input 
              type="text" 
              placeholder="ค้นหาหมวดหมู่..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <select 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="main">หมวดหมู่หลัก (CAT)</option>
              <option value="sub">หมวดหมู่ย่อย (SUB)</option>
              <option value="product">ประเภทอะไหล่ (PT)</option>
            </select>
          </div>
        </div>
        {isOwner && (
          <Button className="mb-4" onClick={handleCreate}>+ เพิ่มหมวดหมู่</Button>
        )}
      </div>

      {loading ? (
         <div className="text-center py-10">กำลังโหลด...</div>
      ) : (
        <>
          <Table data={categories} columns={columns} emptyMessage="ไม่พบข้อมูลหมวดหมู่" />
          
          <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
            <span>แสดงผลหน้า {pagination.page} (ทั้งหมด {pagination.total} รายการ)</span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={pagination.page <= 1}
                onClick={() => fetchCategories(pagination.page - 1, search)}
              >
                ก่อนหน้า
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={categories.length < pagination.per_page}
                onClick={() => fetchCategories(pagination.page + 1, search)}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        </>
      )}

      {isFormOpen && (
        <CategoryForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={onFormSubmit}
          initialData={selectedCategory}
          categories={categories}
        />
      )}

      {isDeleteOpen && selectedCategory && (
        <CategoryDeleteModal 
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={onDeleteConfirm}
          categoryName={selectedCategory.name}
        />
      )}
    </div>
  );
};
