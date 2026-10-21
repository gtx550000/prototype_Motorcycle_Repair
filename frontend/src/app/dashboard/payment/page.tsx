'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Check, CreditCard, Banknote, Printer, ChevronRight, ChevronLeft,
  User, Wrench, CheckCircle, ArrowLeft, QrCode, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { employeeAPI } from '@/lib/api';
import { EmployeeDropdown } from '@/types/employee';

interface CartItem {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  price: number;
  qty: number;
}

export default function MultiStepCheckout() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cashReceived, setCashReceived] = useState('');
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [saleId, setSaleId] = useState<number | null>(null);
  const [saleCreatedAt, setSaleCreatedAt] = useState<string | null>(null);
  const [printFormat, setPrintFormat] = useState<'large' | 'small'>('large');

  // ข้อมูลรถ/ลูกค้า
  const [customerInfo, setCustomerInfo] = useState({
    licensePlate: '',
    vehicleModel: '',
    customerName: '',
    note: '',
  });

  // ── Dropdown พนักงาน ──────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<EmployeeDropdown[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');

  // โหลดรายชื่อพนักงาน
  useEffect(() => {
    employeeAPI.getEmployeeList()
      .then((res) => {
        setEmployees(res.data);
        // ถ้าผู้ใช้ปัจจุบันเป็น employee ให้ auto-select ตัวเอง
        if (user) {
          const me = res.data.find((e: EmployeeDropdown) => e.id === (user as any).id);
          if (me) setSelectedEmployeeId(me.id);
        }
      })
      .catch(() => {});
  }, [user]);

  // อ่าน cart จาก localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
          return;
        }
      } catch (err) {
        console.error('Error reading pos_cart in payment:', err);
      }
    }
    router.push('/dashboard/store');
  }, [router]);

  // คำนวณ
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeAmount = cashReceivedNum - totalAmount;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const canProceed = () => {
    if (step === 3) {
      if (!paymentMethod) return false;
      if (!selectedEmployeeId) return false;
      if (paymentMethod === 'cash' && cashReceivedNum < totalAmount) return false;
      return true;
    }
    return true;
  };

  // ยืนยันชำระเงิน → บันทึกประวัติ → Step 4
  const handleConfirmPayment = async () => {
    if (!selectedEmployeeId) return;
    setSaving(true);
    setPaymentError('');
    try {
      const response = await employeeAPI.recordSale({
        employee_id: selectedEmployeeId,
        license_plate: customerInfo.licensePlate || undefined,
        vehicle_model: customerInfo.vehicleModel || undefined,
        customer_name: customerInfo.customerName || undefined,
        note: customerInfo.note || undefined,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        items: cartItems,
      });
      setSaleId(response.data.id);
      setSaleCreatedAt(response.data.created_at);
      localStorage.removeItem('pos_cart');
      nextStep();
    } catch (e) {
      console.error('Failed to record sale:', e);
      const detail = axios.isAxiosError(e) ? e.response?.data?.detail : undefined;
      setPaymentError(typeof detail === 'string' ? detail : 'บันทึกการขายไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const goBackToStore = () => router.push('/dashboard/store');
  const handlePrintReceipt = () => window.print();

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const receiptDate = saleCreatedAt ? new Date(saleCreatedAt) : new Date();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="text-center text-slate-400"><p>กำลังโหลดข้อมูล...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6 text-slate-800 print:min-h-0 print:block print:bg-white print:p-0">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden border border-slate-100 print:max-w-none print:rounded-none print:border-0 print:shadow-none print:overflow-visible">

        {/* Progress Bar */}
        <div className="bg-slate-100 p-4 border-b print:hidden">
          <div className="flex justify-between items-center max-w-lg mx-auto relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-300`}
              style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > num ? <Check className="w-4 h-4" /> : num}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-lg mx-auto mt-2 text-xs font-medium text-slate-500">
            <span>สรุปรายการ</span>
            <span>ข้อมูลรถ</span>
            <span>ชำระเงิน</span>
            <span>เสร็จสิ้น</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 min-h-[400px] print:min-h-0 print:p-0">

          {/* Step 1: สรุปรายการ */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-600" /> ตรวจสอบรายการซ่อม/อะไหล่
              </h2>
              <div className="bg-slate-50 rounded-lg border p-4 space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{item.icon || '📦'}</span>{item.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.name_en && <span className="mr-2">{item.name_en}</span>}
                        จำนวน: {item.qty} ชิ้น
                      </div>
                    </div>
                    <div className="font-medium text-right">
                      <div>฿{(item.price * item.qty).toLocaleString()}</div>
                      {item.qty > 1 && <div className="text-xs text-slate-400">({item.qty} x ฿{item.price.toLocaleString()})</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-xl font-bold bg-blue-50 p-4 rounded-lg">
                <span>ยอดรวมทั้งสิ้น ({totalQty} รายการ)</span>
                <span>฿{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Step 2: ข้อมูลรถ/ลูกค้า */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" /> ข้อมูลรถและลูกค้า
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ป้ายทะเบียนรถ</label>
                  <input type="text" placeholder="เช่น 1กข 1234 กทม"
                    value={customerInfo.licensePlate}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, licensePlate: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ / รุ่นรถ</label>
                  <input type="text" placeholder="เช่น Honda Wave 110i"
                    value={customerInfo.vehicleModel}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, vehicleModel: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อลูกค้า / เบอร์โทรติดต่อ</label>
                  <input type="text" placeholder="ระบุหรือไม่ระบุก็ได้"
                    value={customerInfo.customerName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
                  <textarea placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                    value={customerInfo.note}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                    rows={3}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">* ข้อมูลนี้ไม่บังคับกรอก สามารถข้ามไปขั้นตอนถัดไปได้เลย</p>
            </div>
          )}

          {/* Step 3: ชำระเงิน + เลือกพนักงาน */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-6">เลือกช่องทางการชำระเงิน</h2>
              <div className="text-center mb-6">
                <div className="text-slate-500 mb-1">ยอดที่ต้องชำระ</div>
                <div className="text-4xl font-bold text-blue-600">฿{totalAmount.toLocaleString()}</div>
              </div>

              {/* เลือกพนักงานผู้ออกบิล */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="block text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> เลือกพนักงานผู้ออกบิล *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-slate-800"
                >
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.username}) {emp.role === 'owner' ? '👑' : ''}
                    </option>
                  ))}
                </select>
                {!selectedEmployeeId && (
                  <p className="text-xs text-amber-600 mt-1">* กรุณาเลือกพนักงานก่อนดำเนินการต่อ</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <button onClick={() => { setPaymentMethod('cash'); setCashReceived(''); }}
                  className={`p-4 sm:p-5 border-2 rounded-xl flex flex-row sm:flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <Banknote className={`w-8 h-8 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm">เงินสด</span>
                </button>
                <button onClick={() => setPaymentMethod('transfer')}
                  className={`p-4 sm:p-5 border-2 rounded-xl flex flex-row sm:flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <QrCode className={`w-8 h-8 ${paymentMethod === 'transfer' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm">โอน / QR Code</span>
                </button>
                <button onClick={() => setPaymentMethod('card')}
                  className={`p-4 sm:p-5 border-2 rounded-xl flex flex-row sm:flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <CreditCard className={`w-8 h-8 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm">บัตรเครดิต</span>
                </button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">รับเงินจากลูกค้า (บาท)</label>
                    <input type="number" placeholder="0" value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xl font-bold text-center"
                      min={0} />
                  </div>
                  {cashReceivedNum > 0 && (
                    <div className={`text-center text-lg font-bold p-2 rounded ${changeAmount >= 0 ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                      {changeAmount >= 0
                        ? `เงินทอน: ฿${changeAmount.toLocaleString()}`
                        : `เงินไม่พอ ขาดอีก ฿${Math.abs(changeAmount).toLocaleString()}`}
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <QrCode className="w-24 h-24 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">แสดง QR Code ให้ลูกค้าสแกนจ่ายเงิน</p>
                  <p className="text-xs text-slate-400 mt-1">(สามารถเชื่อมต่อกับ PromptPay ได้ในอนาคต)</p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <CreditCard className="w-16 h-16 mx-auto text-purple-400 mb-3" />
                  <p className="text-sm text-slate-500">รูดบัตรเครดิตผ่านเครื่อง EDC</p>
                  <p className="text-xs text-slate-400 mt-1">กรุณาตรวจสอบยอดเงินกับเครื่องรูดบัตรให้ตรงกัน</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: เสร็จสิ้น */}
          {step === 4 && (
            <div>
              <div className="print:hidden text-center py-8 sm:py-10">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">ทำรายการสำเร็จ!</h2>
                <p className="text-slate-500 mb-6">บันทึกข้อมูลการซ่อมและรับชำระเงินเรียบร้อยแล้ว</p>
              </div>

              <p className="print:hidden text-center text-sm font-semibold text-slate-600 mb-3">
                ตัวอย่าง{printFormat === 'large' ? 'บิลใหญ่ · ฟอร์มเต็มพร้อมลายเซ็น' : 'บิลเล็ก · ใบเสร็จปกติ'}
              </p>
              <section className={`receipt-print mx-auto max-w-3xl border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-lg print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none ${printFormat === 'small' ? 'receipt-print-small' : ''}`}>
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" aria-hidden="true">🏍️</span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">MotoShop Service &amp; Parts</h2>
                        <p className="receipt-secondary text-xs text-slate-600">ระบบจัดการอะไหล่และร้านซ่อมมอเตอร์ไซค์</p>
                        <p className="text-xs text-slate-500">ใบเสร็จรับเงิน / RECEIPT</p>
                      </div>
                    </div>
                    <p className="receipt-secondary text-xs text-slate-500 mt-3">
                      123/45 ถนนพัฒนาการ แขวงสวนหลวง กรุงเทพมหานคร 10250<br />
                      โทรศัพท์: 081-234-5678 | อีเมล: contact@motoshop.local
                    </p>
                  </div>
                  <div className="sm:text-right text-sm">
                    <p className="font-bold text-slate-900">เลขที่ใบเสร็จ: {saleId ? `BILL-${String(saleId).padStart(5, '0')}` : '-'}</p>
                    <p className="text-slate-600">วันที่: {receiptDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-slate-600">เวลา: {receiptDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </header>

                <div className="receipt-meta grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-700">ข้อมูลลูกค้า</h3>
                    <p>ชื่อ: {customerInfo.customerName || 'ลูกค้าทั่วไป'}</p>
                    <p className="receipt-secondary">ทะเบียนรถ: {customerInfo.licensePlate || '-'}</p>
                    <p className="receipt-secondary">ยี่ห้อ/รุ่นรถ: {customerInfo.vehicleModel || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-700">ข้อมูลการขายและชำระเงิน</h3>
                    <p className="receipt-secondary">พนักงาน: {selectedEmployee?.full_name || user?.full_name || '-'}</p>
                    <p>ช่องทาง: {paymentMethod === 'cash' ? 'เงินสด' : paymentMethod === 'transfer' ? 'โอน / QR Code' : 'บัตรเครดิต'}</p>
                    {paymentMethod === 'cash' && <p className="receipt-secondary">รับเงิน: ฿{cashReceivedNum.toLocaleString()}</p>}
                  </div>
                </div>

                <div className="overflow-x-auto print:overflow-visible">
                  <table className="receipt-items w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-semibold text-left">
                        <th className="receipt-secondary py-2.5 px-3 text-center font-semibold">ลำดับ</th>
                        <th className="py-2.5 px-3 font-semibold">รายการ</th>
                        <th className="receipt-unit-price py-2.5 px-3 text-right font-semibold whitespace-nowrap">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 text-center font-semibold">จำนวน</th>
                        <th className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="receipt-secondary py-2.5 px-3 text-center">{index + 1}</td>
                          <td className="py-2.5 px-3">{item.icon || '📦'} {item.name}</td>
                          <td className="receipt-unit-price py-2.5 px-3 text-right whitespace-nowrap">฿{item.price.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">{item.qty}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">฿{(item.price * item.qty).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="receipt-total ml-auto mt-5 w-full sm:max-w-xs space-y-2 text-sm">
                  <div className="receipt-secondary flex justify-between text-slate-600">
                    <span>รวมรายการ ({totalQty} ชิ้น)</span>
                    <span>฿{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-900 text-white rounded-xl text-sm font-bold">
                    <span>ยอดสุทธิทั้งสิ้น (Net Total):</span>
                    <span className="text-base">฿{totalAmount.toLocaleString()}</span>
                  </div>
                  {paymentMethod === 'cash' && (
                    <div className="flex justify-between text-slate-600">
                      <span>เงินทอน</span>
                      <span>฿{Math.max(0, changeAmount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="receipt-signatures grid grid-cols-2 gap-8 text-center text-sm text-slate-600 mt-12 pt-6 border-t border-dashed border-slate-300">
                  <div>
                    <p className="mb-12 font-medium">ลงชื่อ ...........................................................</p>
                    <p className="font-bold text-slate-800">({selectedEmployee?.full_name || user?.full_name || 'ผู้จัดทำ'})</p>
                    <p className="text-xs text-slate-400 mt-1">ผู้รับเงิน / ผู้จัดทำใบเสร็จ</p>
                  </div>
                  <div>
                    <p className="mb-12 font-medium">ลงชื่อ ...........................................................</p>
                    <p className="font-bold text-slate-800">({customerInfo.customerName || '...........................................................'})</p>
                    <p className="text-xs text-slate-400 mt-1">ลูกค้า / ผู้ชำระเงิน</p>
                  </div>
                </div>
                {customerInfo.note && (
                  <p className="receipt-note mt-5 text-sm text-slate-600 border-t border-slate-200 pt-3">หมายเหตุ: {customerInfo.note}</p>
                )}
                <p className="receipt-footer text-center text-xs text-slate-500 mt-8">เอกสารนี้ออกจากระบบเพื่อเป็นหลักฐานการรับชำระเงิน</p>
              </section>

              <div className="print:hidden flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <div>
                  <div className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      aria-pressed={printFormat === 'large'}
                      onClick={() => setPrintFormat('large')}
                      className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${printFormat === 'large' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      เลือกบิลใหญ่
                    </button>
                    <button
                      type="button"
                      aria-pressed={printFormat === 'small'}
                      onClick={() => setPrintFormat('small')}
                      className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${printFormat === 'small' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      เลือกบิลเล็ก
                    </button>
                  </div>
                  <p className="mt-1 text-center text-xs text-slate-500">
                    {printFormat === 'large' ? 'ฟอร์มเต็มพร้อมรายละเอียดและลายเซ็น' : 'ใบเสร็จปกติแบบกระชับ'}
                  </p>
                </div>
                <button onClick={handlePrintReceipt} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                  <Printer className="w-5 h-5" /> {printFormat === 'large' ? 'ออกบิลใหญ่' : 'ออกบิลเล็ก'}
                </button>
                <button onClick={goBackToStore}
                  className="flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-50">
                  <ArrowLeft className="w-5 h-5" /> กลับหน้าขายหลัก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {step < 4 && (
          <div className="bg-slate-50 p-4 border-t flex justify-between print:hidden">
            <button onClick={step === 1 ? goBackToStore : prevStep}
              className="flex items-center gap-1 px-4 py-2 font-medium rounded-lg text-slate-600 hover:bg-slate-200">
              {step === 1 ? <><ArrowLeft className="w-5 h-5" /> กลับหน้าร้าน</> : <><ChevronLeft className="w-5 h-5" /> ย้อนกลับ</>}
            </button>
            <button
              onClick={step === 3 ? handleConfirmPayment : nextStep}
              disabled={!canProceed() || saving}
              className={`flex items-center gap-1 px-6 py-2 font-medium rounded-lg text-white transition-colors ${!canProceed() || saving ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {step === 3 ? (saving ? 'กำลังบันทึก...' : 'ยืนยันการชำระเงิน') : 'ถัดไป'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {paymentError && step === 3 && (
          <div role="alert" className="px-4 pb-4 text-sm text-red-700 print:hidden">
            {paymentError}
          </div>
        )}
      </div>
    </div>
  );
}