'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Printer, ArrowLeft, ArrowRight, Wrench,
  User, Car, Phone, Calendar, Check, DollarSign,
  AlertCircle, ShoppingCart, Sparkles, Tag, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  price: number;
  qty: number;
}

// ฟังก์ชันแปลงตัวเลขเป็นตัวหนังสือภาษาไทย (Thai Baht Text)
function thaiBahtText(num: number): string {
  if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const parts = num.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  function convertGroup(n: number): string {
    let s = '';
    const str = n.toString();
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(str[i], 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          s += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          s += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1) {
          s += 'เอ็ด';
        } else {
          s += digits[digit] + units[pos];
        }
      }
    }
    return s;
  }

  let text = '';
  if (integerPart > 0) {
    text += convertGroup(integerPart) + 'บาท';
  } else {
    text += 'ศูนย์บาท';
  }

  if (decimalPart > 0) {
    text += convertGroup(decimalPart) + 'สตางค์';
  } else {
    text += 'ถ้วน';
  }

  return text;
}

export default function QuotationPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ข้อมูลตะกร้าสินค้า
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // เลขที่ใบเสนอราคา (สร้างเลขอัตโนมัติ)
  const quotationNo = useMemo(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `QT-${dateStr}-${rand}`;
  }, []);

  // ตัวเลือกการคิดราคา
  const [includeLabor, setIncludeLabor] = useState(false);
  const [laborCost, setLaborCost] = useState<number>(200);
  const [laborDescription, setLaborDescription] = useState('ค่าแรงและบริการช่างติดตั้ง / ตรวจเช็คระบบ');
  const [discount, setDiscount] = useState<number>(0);
  const [printFormat, setPrintFormat] = useState<'large' | 'small'>('large');

  // ข้อมูลลูกค้าและรถ
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [notes, setNotes] = useState('ราคานี้ยังไม่รวมภาษีมูลค่าเพิ่ม (ถ้ามี) / เป็นราคาประเมินเบื้องต้น อะไหล่อาจปรับเปลี่ยนตามสภาพการตรวจสอบหน้างานจริง');
  const [validDays, setValidDays] = useState(7);

  // โหลดรายการจาก pos_cart
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load cart for quotation:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // วันที่ออกและวันที่หมดอายุ
  const todayStr = useMemo(() => new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }), []);
  const validUntilStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + validDays);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [validDays]);

  // คำนวณราคา
  const partsSubtotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + (it.price * it.qty), 0);
  }, [cartItems]);

  const effectiveLabor = includeLabor ? Math.max(0, laborCost) : 0;
  const effectiveDiscount = Math.max(0, discount);
  const grandTotal = Math.max(0, partsSubtotal + effectiveLabor - effectiveDiscount);

  // สั่งพิมพ์หรือบันทึก PDF
  const handlePrint = () => {
    window.print();
  };

  // กลับหน้าร้าน
  const goBackToStore = () => {
    router.push('/dashboard/store');
  };

  // ดำเนินการต่อสู่หน้าชำระเงิน
  const proceedToPayment = () => {
    router.push('/dashboard/payment');
  };

  if (isLoaded && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีรายการสินค้าในตะกร้า</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          กรุณาเลือกรายการอะไหล่หรือสินค้าจากหน้าร้านก่อน เพื่อนำมาออกใบเสนอราคา
        </p>
        <button
          onClick={goBackToStore}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> กลับไปยังหน้าร้าน
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* ──────────────── Action Bar / Controls (ซ่อนตอนพิมพ์) ──────────────── */}
      <div className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goBackToStore}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="กลับหน้าร้าน"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  ใบเสนอราคา (Price Estimate)
                </h1>
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                  ร่างเพื่อประเมินราคา • ไม่ตัดสต็อก
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ให้ลูกค้าทราบราคาก่อนตัดสินใจซื้อ สามารถเลือกค่าช่างและบันทึกเป็น PDF ได้
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                aria-pressed={printFormat === 'large'}
                onClick={() => setPrintFormat('large')}
                className={`min-w-[76px] whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold transition ${printFormat === 'large' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                บิลใหญ่
              </button>
              <button
                type="button"
                aria-pressed={printFormat === 'small'}
                onClick={() => setPrintFormat('small')}
                className={`min-w-[76px] whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold transition ${printFormat === 'small' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                บิลเล็ก
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ / ออกไฟล์ PDF
            </button>
            <button
              onClick={proceedToPayment}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              ไปหน้าชำระเงิน <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="quotation-layout max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ──────────────── ฝั่งซ้าย: ฟอร์มตั้งค่าตัวเลือก (ซ่อนตอนพิมพ์) ──────────────── */}
        <div className="print:hidden space-y-5">
          {/* กล่องตัวเลือกการคิดราคา */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              ตัวเลือกการคำนวณราคา
            </h3>

            {/* สลับโหมด: ราคารวมปกติ vs ราคารวมค่าช่าง */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">รูปแบบการเสนอราคา</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeLabor(false)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    !includeLabor
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>📦 ราคารวม ปกติ</span>
                  <span className="text-[10px] font-normal text-slate-400">เฉพาะค่าอะไหล่</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeLabor(true)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    includeLabor
                      ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    ราคารวมค่าช่าง
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">อะไหล่ + ค่าแรง</span>
                </button>
              </div>
            </div>

            {/* ช่องกรอกค่าช่าง (เมื่อเลือกราคารวมค่าช่าง) */}
            {includeLabor && (
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    ค่าแรง / บริการช่าง (บาท)
                  </label>
                  <span className="text-[10px] text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded font-medium">
                    จะแสดงในบิล
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={laborCost}
                    onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-800 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                </div>

                {/* ปุ่มลัดเลือกค่าช่าง */}
                <div className="flex gap-1.5 text-xs">
                  {[100, 150, 200, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLaborCost(amt)}
                      className={`flex-1 py-1 rounded border text-center transition ${
                        laborCost === amt
                          ? 'bg-amber-600 text-white font-bold border-amber-600'
                          : 'bg-white text-slate-600 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] text-amber-800 mb-1">คำอธิบายงานช่าง</label>
                  <input
                    type="text"
                    value={laborDescription}
                    onChange={(e) => setLaborDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    placeholder="เช่น ค่าแรงติดตั้งและตรวจเช็ค"
                  />
                </div>
              </div>
            )}

            {/* ส่วนลด */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> ส่วนลดพิเศษ (บาท)
              </label>
              <input
                type="number"
                min="0"
                value={discount === 0 ? '' : discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* กล่องข้อมูลลูกค้าและรถ */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4 text-blue-600" />
              ข้อมูลลูกค้า / ยานพาหนะ
            </h3>

            <div>
              <label className="block text-xs text-slate-500 mb-1">ชื่อลูกค้า</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น คุณสมชาย มุ่งมั่น"
                className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">ทะเบียนรถ</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="เช่น 1กข 1234 กทม."
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ยี่ห้อ / รุ่นรถ</label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="เช่น Honda Wave 110i"
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">อายุใบเสนอราคา (วัน)</label>
              <select
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value={3}>3 วัน</option>
                <option value={7}>7 วัน (แนะนำ)</option>
                <option value={15}>15 วัน</option>
                <option value={30}>30 วัน</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">หมายเหตุเพิ่มเติม</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ──────────────── ฝั่งขวา / พื้นที่พิมพ์: ตัวกระดาษใบเสนอราคา (Printable Document) ──────────────── */}
        <div className="lg:col-span-2">
          {/* Printable Paper Canvas */}
          <div className={`quotation-paper bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none ${printFormat === 'small' ? 'quotation-paper-small' : ''}`}>
            {/* หัวเอกสาร */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">MotoShop Service & Parts</h2>
                    <p className="text-xs text-slate-600">ระบบจัดการอะไหล่และร้านซ่อมมอเตอร์ไซค์</p>
                  </div>
                </div>
                <p className="quotation-secondary text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                  123/45 ถนนพัฒนาการ แขวงสวนหลวง กรุงเทพมหานคร 10250<br />
                  โทรศัพท์: 081-234-5678 | อีเมล: contact@motoshop.local
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded tracking-widest uppercase mb-1">
                  ใบเสนอราคา / QUOTATION
                </span>
                <p className="font-mono font-bold text-sm text-slate-800 mt-1">{quotationNo}</p>
                <p className="text-xs text-slate-500 mt-1">
                  วันที่ออก: <span className="font-medium text-slate-700">{todayStr}</span>
                </p>
                <p className="quotation-secondary text-xs text-amber-700 font-medium mt-0.5">
                  ใช้ได้ถึง: {validUntilStr}
                </p>
              </div>
            </div>

            {/* กล่องข้อมูลลูกค้า & รถ */}
            <div className="quotation-meta grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
              <div className="space-y-1">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">ข้อมูลลูกค้า (Customer)</p>
                <p><span className="text-slate-500">ชื่อลูกค้า:</span> <span className="font-semibold text-slate-800">{customerName || 'ลูกค้าทั่วไป (ยังไม่ระบุชื่อ)'}</span></p>
                {customerPhone && <p className="quotation-secondary"><span className="text-slate-500">เบอร์โทร:</span> <span className="font-medium text-slate-800">{customerPhone}</span></p>}
                <p className="quotation-secondary"><span className="text-slate-500">ผู้จัดทำข้อเสนอ:</span> <span className="font-medium text-slate-800">{user?.full_name || user?.username || 'พนักงานหน้าร้าน'}</span></p>
              </div>

              <div className="quotation-secondary space-y-1 border-l pl-4 border-slate-200">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">ข้อมูลรถ (Vehicle Info)</p>
                <p><span className="text-slate-500">ทะเบียนรถ:</span> <span className="font-mono font-semibold text-slate-800">{licensePlate || '-'}</span></p>
                <p><span className="text-slate-500">ยี่ห้อ/รุ่นรถ:</span> <span className="font-medium text-slate-800">{vehicleModel || '-'}</span></p>
                <p><span className="text-slate-500">ประเภทบริการ:</span> <span className="font-medium text-blue-700">{includeLabor ? 'อะไหล่พร้อมงานบริการช่าง' : 'เฉพาะรายการอะไหล่'}</span></p>
              </div>
            </div>

            {/* ตารางรายการสินค้า / อะไหล่ */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-semibold">
                    <th className="quotation-secondary py-2.5 px-3 w-10 text-center rounded-l">ลำดับ</th>
                    <th className="py-2.5 px-3">รายการอะไหล่ / บริการ</th>
                    <th className="py-2.5 px-3 text-center w-20">จำนวน</th>
                    <th className="quotation-unit-price py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                    <th className="py-2.5 px-3 text-right w-28 rounded-r">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {cartItems.map((item, index) => {
                    const rowTotal = item.price * item.qty;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="quotation-secondary py-2.5 px-3 text-center text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          <span className="mr-1.5">{item.icon || '📦'}</span>
                          {item.name}
                          {item.name_en && (
                            <span className="quotation-secondary block text-[11px] text-slate-400 font-normal">{item.name_en}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.qty}</td>
                        <td className="quotation-unit-price py-2.5 px-3 text-right font-mono">
                          ฿{Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                          ฿{rowTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}

                  {/* แถวแสดงค่าแรงช่าง (ถ้าเลือกไว้) */}
                  {includeLabor && effectiveLabor > 0 && (
                    <tr className="bg-amber-50/60 font-medium text-amber-900 border-t-2 border-amber-200">
                      <td className="quotation-secondary py-2.5 px-3 text-center font-mono text-amber-600">{cartItems.length + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          <span>งานบริการช่าง (Service Fee)</span>
                        </div>
                        <span className="block text-[11px] text-amber-700 font-normal">{laborDescription}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">1 งาน</td>
                      <td className="quotation-unit-price py-2.5 px-3 text-right font-mono">
                        ฿{effectiveLabor.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-900">
                        ฿{effectiveLabor.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ส่วนสรุปตัวเลขและตัวอักษรไทย */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-slate-200 pt-4 mb-8">
              {/* ตัวหนังสือบาทไทย */}
              <div className="quotation-summary-words bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">จำนวนเงินตัวอักษร:</span>
                  <p className="font-bold text-slate-800 text-sm">
                    ({thaiBahtText(grandTotal)})
                  </p>
                </div>
                {notes && (
                  <p className="quotation-notes text-[11px] text-slate-500 italic mt-3 pt-2 border-t border-slate-200">
                    หมายเหตุ: {notes}
                  </p>
                )}
              </div>

              {/* ยอดตัวเลขสรุป */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>รวมค่าอะไหล่ ({cartItems.reduce((acc, c) => acc + c.qty, 0)} ชิ้น):</span>
                  <span className="font-mono font-medium">฿{partsSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>

                {includeLabor && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-amber-800 font-medium">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-amber-600" /> ค่าแรง/บริการช่าง:
                    </span>
                    <span className="font-mono">+฿{effectiveLabor.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {effectiveDiscount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-red-600">
                    <span>ส่วนลดพิเศษ:</span>
                    <span className="font-mono">-฿{effectiveDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 px-3 bg-slate-900 text-white rounded-xl text-sm font-bold mt-2">
                  <span>ยอดสุทธิทั้งสิ้น (Net Total):</span>
                  <span className="text-base font-mono">฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* ลายเซ็นและข้อตกลง */}
            <div className="quotation-signatures grid grid-cols-2 gap-8 text-center text-xs text-slate-600 pt-6 border-t border-dashed border-slate-300">
              <div>
                <p className="mb-12 font-medium">ลงชื่อ ...........................................................</p>
                <p className="font-bold text-slate-800">({user?.full_name || user?.username || 'ผู้เสนอราคา'})</p>
                <p className="text-[11px] text-slate-400 mt-0.5">ผู้จัดทำใบเสนอราคา / ร้านค้า</p>
              </div>

              <div>
                <p className="mb-12 font-medium">ลงชื่อ ...........................................................</p>
                <p className="font-bold text-slate-800">({customerName || '...........................................................'})</p>
                <p className="text-[11px] text-slate-400 mt-0.5">ลูกค้ารับทราบและยินยอมราคา</p>
              </div>
            </div>

            {/* Footer คำเตือน */}
            <div className="quotation-footer mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              เอกสารนี้ออกโดยระบบบริหารจัดการร้าน MotoShop POS • ยังไม่มีผลตัดสต็อกสินค้าจนกว่าจะได้รับชำระเงินจริง
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
