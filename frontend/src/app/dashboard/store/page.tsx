'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Clock, CheckCircle, Search, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { Category } from '@/types/category';

// ประเภทรายการในตะกร้า
interface CartItem {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  price: number;
  qty: number;
}

export default function POSPage() {
  const { categories, fetchCategories, loading } = useCategories();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // โหลดตะกร้าจาก localStorage ตอนเปิดหน้า (เก็บสถานะไว้เมื่อย้อนกลับมา)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // บันทึกตะกร้าลง localStorage ทุกครั้งที่ตะกร้าเปลี่ยน (เฉพาะหลังจากโหลดข้อมูลเดิมเสร็จแล้วเท่านั้น)
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart, isLoaded]);

  // ฟังก์ชันชำระเงิน: นำทางไปหน้า Payment (บันทึกข้อมูลตะกร้าลง localStorage เพื่อความชัวร์)
  const handleCheckout = () => {
    if (cart.length === 0) return;
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    router.push('/dashboard/payment');
  };

  // ดึงข้อมูลหมวดหมู่จาก API (per_page=100 เพื่อดึงมาทั้งหมด)
  useEffect(() => {
    fetchCategories(1, '', activeTab === 'all' ? '' : activeTab);
  }, [fetchCategories, activeTab]);

  // กรองตามคำค้นหา
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.name_en?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // กำหนดสีการ์ดตามประเภท
  const getCardColor = (cat: Category) => {
    const code = cat.description?.replace('รหัสอ้างอิง: ', '') || '';
    if (code.startsWith('CAT')) return 'from-amber-50 to-amber-100 border-amber-200';
    if (code.startsWith('SUB')) return 'from-blue-50 to-blue-100 border-blue-200';
    return 'from-slate-50 to-slate-100 border-slate-200';
  };

  // เพิ่มสินค้าเข้าตะกร้า
  const addToCart = (cat: Category) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cat.id);
      if (existing) {
        return prev.map((item) =>
          item.id === cat.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cat.id,
          name: cat.name,
          name_en: cat.name_en,
          icon: cat.icon,
          price: cat.price ?? 0,
          qty: 1,
        },
      ];
    });
  };

  // ลดจำนวนสินค้าในตะกร้า
  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // คำนวณยอดรวม
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Tab ตัวกรอง
  const tabs = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'main', label: 'หมวดหมู่หลัก' },
    { key: 'sub', label: 'หมวดหมู่ย่อย' },
    { key: 'product', label: 'ประเภทอะไหล่' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans text-slate-800">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">🏍️ MotoShop POS — หน้าร้าน</h1>
          <p className="text-sm text-slate-500">ระบบขายสินค้าและอะไหล่หน้าร้าน</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            พนักงาน: {user?.full_name || user?.username || 'ไม่ทราบชื่อ'}
          </span>
        </div>
      </header>

      {/* สรุปข้อมูล */}
      <div className="grid grid-cols-3 gap-4 mb-8 text-center text-sm">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-semibold">{categories.length}</div>
          <div className="text-slate-500">รายการสินค้าทั้งหมด</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-semibold text-blue-600">{totalItems}</div>
          <div className="text-slate-500">รายการในตะกร้า</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-semibold text-green-600">฿{totalAmount.toLocaleString()}</div>
          <div className="text-slate-500">ยอดรวมในตะกร้า</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ฝั่งซ้าย: รายการสินค้า */}
        <div className="lg:col-span-2">
          {/* ช่องค้นหา */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า / อะไหล่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tab กรองประเภท */}
          <div className="flex gap-4 mb-4 border-b pb-2 text-sm font-medium text-slate-500">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2 transition ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid สินค้า */}
          {loading ? (
            <div className="text-center py-10 text-slate-400">กำลังโหลดข้อมูล...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
              <Package className="w-10 h-10" />
              <p>ไม่พบรายการสินค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className={`bg-gradient-to-br ${getCardColor(item)} p-4 rounded-xl shadow-sm border relative group`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="text-xl">{item.icon || '📦'}</span>
                      {item.name}
                    </h3>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-600 transition"
                    >
                      <Plus className="w-3 h-3" /> เพิ่ม
                    </button>
                  </div>

                  <div className="text-sm text-slate-500 mb-1">
                    {item.name_en || '-'}
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <span className="text-xs font-mono text-slate-400 bg-white/60 px-2 py-0.5 rounded">
                      {item.description?.replace('รหัสอ้างอิง: ', '') || '-'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {item.is_active ? '● พร้อมขาย' : '● ปิดการขาย'}
                    </span>
                  </div>
                  {/* แสดงราคา */}
                  <div className="mt-2 text-right">
                    <span className="text-base font-bold text-slate-800">
                      {item.price > 0
                        ? `฿${Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : <span className="text-xs text-slate-400 font-normal">ยังไม่มีราคา</span>
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ฝั่งขวา: ตะกร้าสินค้า */}
        <div className="space-y-6">
          {/* Card: Current Order */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              รายการบิลปัจจุบัน
              {cart.length > 0 && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {cart.length} รายการ
                </span>
              )}
            </h3>

            {cart.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-8 flex flex-col items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
                กดปุ่ม "เพิ่ม" เพื่อเลือกสินค้าเข้าตะกร้า
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm items-center">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">
                          {item.icon} {item.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.qty} x ฿{item.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => decreaseQty(item.id)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.qty}</span>
                        <button
                          onClick={() => addToCart({ id: item.id, name: item.name, icon: item.icon } as Category)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <Trash2
                          className="w-4 h-4 text-red-400 cursor-pointer hover:text-red-600 ml-1"
                          onClick={() => removeFromCart(item.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>ยอดรวม</span>
                    <span>฿{totalAmount.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    ชำระเงิน
                  </button>
                  <button
                    onClick={() => {
                      setCart([]);
                      localStorage.removeItem('pos_cart');
                    }}
                    className="w-full mt-2 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition"
                  >
                    ล้างตะกร้า
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Card: ประวัติล่าสุด */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ประวัติบิลล่าสุด
              </h3>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">วันนี้</span>
            </div>
            <div className="text-sm text-slate-500 text-center py-6 flex flex-col items-center gap-2">
              <CheckCircle className="w-6 h-6 text-slate-300" />
              ยังไม่มีประวัติการขายในรอบบิลนี้
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}