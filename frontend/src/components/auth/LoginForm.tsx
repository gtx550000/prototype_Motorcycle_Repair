'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const LoginForm = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🏍️</div>
        <h2 className="text-2xl font-bold text-gray-900">ระบบจัดการอะไหล่</h2>
        <p className="text-gray-500">ร้านซ่อมมอเตอร์ไซค์</p>
      </div>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">{error}</div>}
      
      <Input
        label="ชื่อผู้ใช้"
        type="text"
        placeholder="กรอกชื่อผู้ใช้..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      
      <Input
        label="รหัสผ่าน"
        type="password"
        placeholder="กรอกรหัสผ่าน..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <Button type="submit" className="w-full mt-4" loading={loading}>
        เข้าสู่ระบบ
      </Button>
    </form>
  );
};
