'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">ยินดีต้อนรับ, {user?.full_name}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
            📦
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">จัดการหมวดหมู่อะไหล่</p>
            <p className="text-xl font-bold">ไปยังเมนูหมวดหมู่</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl">
            ⚙️
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">สถานะระบบ</p>
            <p className="text-xl font-bold text-green-600">ทำงานปกติ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
