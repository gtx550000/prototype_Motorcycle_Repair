'use client';
import React, { useState, useEffect } from 'react';
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
    try {
      await employeeAPI.recordSale({
        employee_id: selectedEmployeeId,
        license_plate: customerInfo.licensePlate || undefined,
        vehicle_model: customerInfo.vehicleModel || undefined,
        customer_name: customerInfo.customerName || undefined,
        note: customerInfo.note || undefined,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        items: cartItems,
      });
    } catch (e) {
      console.error('Failed to record sale:', e);
    } finally {
      setSaving(false);
    }
    localStorage.removeItem('pos_cart');
    nextStep();
  };

  const goBackToStore = () => router.push('/dashboard/store');

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="text-center text-slate-400"><p>กำลังโหลดข้อมูล...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden border border-slate-100">

        {/* Progress Bar */}
        <div className="bg-slate-100 p-4 border-b">
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
        <div className="p-8 min-h-[400px]">

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

              <div className="grid grid-cols-3 gap-4 mb-6">
                <button onClick={() => { setPaymentMethod('cash'); setCashReceived(''); }}
                  className={`p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <Banknote className={`w-8 h-8 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm">เงินสด</span>
                </button>
                <button onClick={() => setPaymentMethod('transfer')}
                  className={`p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <QrCode className={`w-8 h-8 ${paymentMethod === 'transfer' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm">โอน / QR Code</span>
                </button>
                <button onClick={() => setPaymentMethod('card')}
                  className={`p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
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
            <div className="text-center py-10">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">ทำรายการสำเร็จ!</h2>
              <p className="text-slate-500 mb-2">บันทึกข้อมูลการซ่อมและรับชำระเงินเรียบร้อยแล้ว</p>

              <div className="bg-slate-50 rounded-lg border p-4 max-w-sm mx-auto mb-6 text-left text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">ยอดชำระ:</span>
                  <span className="font-bold">฿{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">ช่องทาง:</span>
                  <span className="font-medium">
                    {paymentMethod === 'cash' ? '💵 เงินสด' : paymentMethod === 'transfer' ? '📱 โอน/QR' : '💳 บัตรเครดิต'}
                  </span>
                </div>
                {paymentMethod === 'cash' && changeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">เงินทอน:</span>
                    <span className="font-medium text-green-600">฿{changeAmount.toLocaleString()}</span>
                  </div>
                )}
                {customerInfo.licensePlate && (
                  <div className="flex justify-between mt-2 pt-2 border-t">
                    <span className="text-slate-500">ทะเบียนรถ:</span>
                    <span className="font-medium">{customerInfo.licensePlate}</span>
                  </div>
                )}
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">พนักงาน:</span>
                  <span className="font-medium">{selectedEmployee?.full_name || user?.full_name || '-'}</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                  <Printer className="w-5 h-5" /> พิมพ์ใบเสร็จ
                </button>
                <button onClick={goBackToStore}
                  className="flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-50">
                  <ArrowLeft className="w-5 h-5" /> กลับหน้าขายหลัก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {step < 4 && (
          <div className="bg-slate-50 p-4 border-t flex justify-between">
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
      </div>
    </div>
  );
}