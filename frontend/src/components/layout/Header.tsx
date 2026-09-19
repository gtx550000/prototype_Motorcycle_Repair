'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-bold text-gray-800">ระบบจัดการอะไหล่</h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{user.full_name}</span>
            <Badge variant={user.role === 'owner' ? 'owner' : 'employee'}>{user.role === 'owner' ? 'เจ้าของร้าน' : 'พนักงาน'}</Badge>
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={logout}>ออกจากระบบ</Button>
      </div>
    </header>
  );
};
