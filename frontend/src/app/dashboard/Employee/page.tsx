'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Pencil, Check, X, TrendingUp, Banknote, ShoppingBag,
  Calendar, History, UserPlus, Trash2, AlertTriangle, KeyRound
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authAPI, employeeAPI } from '@/lib/api';
import { EmployeeWithWage, SaleRecord } from '@/types/employee';

// ─── Modal เพิ่มลูกจ้างใหม่ ─────────────────────────────────────────────────────
interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    dailyWage: '400',
    wageNote: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim() || !formData.username.trim() || !formData.password.trim()) {
      setFormError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      // 1. สร้างบัญชีผู้ใช้ประเภท employee
      const res = await authAPI.registerUser({
        username: formData.username.trim(),
        full_name: formData.fullName.trim(),
        password: formData.password,
        role: 'employee',
      });

      const newUserId = res.data?.id;

      // 2. บันทึกค่าแรงเริ่มต้น (ถ้ามี)
      const wageNum = parseFloat(formData.dailyWage) || 0;
      if (newUserId && (wageNum > 0 || formData.wageNote.trim())) {
        try {
          await employeeAPI.setWage(newUserId, {
            daily_wage: wageNum,
            note: formData.wageNote.trim() || undefined,
          });
        } catch (wageErr) {
          console.warn('Set initial wage warning:', wageErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('already registered')) {
        setFormError('ชื่อผู้ใช้ (Username) นี้ถูกใช้งานแล้ว กรุณาตั้งชื่ออื่น');
      } else {
        setFormError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการเพิ่มลูกจ้าง กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">เพิ่มลูกจ้างใหม่</h2>
              <p className="text-xs text-slate-500">สร้างบัญชีผู้ใช้สำหรับลูกจ้างพร้อมกำหนดค่าแรงเริ่มต้น</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่อ - นามสกุลลูกจ้าง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น สมชาย ขยันซ่อม"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น staff02"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รหัสผ่านสำหรับเข้าระบบ <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="รหัสผ่านเข้าใช้งาน"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Wage Config */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-amber-500" />
              กำหนดค่าแรงเริ่มต้น (สามารถแก้ไขภายหลังได้)
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">ค่าแรงรายวัน (บาท)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0"
                    value={formData.dailyWage}
                    onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">หมายเหตุค่าแรง</label>
                <input
                  type="text"
                  placeholder="เช่น ช่างเครื่องยนต์"
                  value={formData.wageNote}
                  onChange={(e) => setFormData({ ...formData, wageNote: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal แก้ไขข้อมูลลูกจ้าง (เฉพาะเจ้าของร้าน) ──────────────────────────────────
interface EditEmployeeModalProps {
  employee: EmployeeWithWage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function EditEmployeeModal({ employee, isOpen, onClose, onSuccess }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    dailyWage: '',
    wageNote: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.full_name,
        username: employee.username,
        password: '',
        dailyWage: employee.daily_wage.toString(),
        wageNote: employee.wage_note || '',
        isActive: employee.is_active,
      });
      setFormError('');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim() || !formData.username.trim()) {
      setFormError('กรุณากรอกชื่อและ Username');
      return;
    }

    setLoading(true);
    try {
      await employeeAPI.updateEmployee(employee.id, {
        full_name: formData.fullName.trim(),
        username: formData.username.trim(),
        password: formData.password ? formData.password : undefined,
        is_active: formData.isActive,
        daily_wage: parseFloat(formData.dailyWage) || 0,
        wage_note: formData.wageNote.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('already registered')) {
        setFormError('ชื่อผู้ใช้ (Username) นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น');
      } else {
        setFormError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">แก้ไขข้อมูลลูกจ้าง</h2>
              <p className="text-xs text-slate-500">แก้ไขชื่อ บัญชีผู้ใช้ ค่าแรงรายวัน และสถานะการทำงาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่อ - นามสกุลลูกจ้าง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                placeholder="เว้นว่างถ้าไม่เปลี่ยน"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Wage Config */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-amber-500" />
              กำหนดค่าแรงรายวัน
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">ค่าแรงรายวัน (บาท)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0"
                    value={formData.dailyWage}
                    onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">หมายเหตุค่าแรง</label>
                <input
                  type="text"
                  placeholder="เช่น ช่างเครื่องยนต์"
                  value={formData.wageNote}
                  onChange={(e) => setFormData({ ...formData, wageNote: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* สถานะการทำงาน */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              เปิดใช้งาน (พนักงานพร้อมปฏิบัติงานและมีรายชื่อในระบบออกบิล)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal ยืนยันการลบลูกจ้าง (เฉพาะเจ้าของร้าน) ─────────────────────────────────
interface DeleteEmployeeModalProps {
  employee: EmployeeWithWage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteEmployeeModal({ employee, isOpen, onClose, onSuccess }: DeleteEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!isOpen || !employee) return null;

  const handleDelete = async () => {
    setLoading(true);
    setDeleteError('');
    try {
      await employeeAPI.deleteEmployee(employee.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการลบลูกจ้าง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบลูกจ้าง</h3>
          <p className="text-sm text-slate-600 mb-2">
            คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีลูกจ้าง:
          </p>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold text-slate-800 text-sm mb-4">
            {employee.full_name} <span className="font-normal text-slate-400">(@{employee.username})</span>
          </div>
          <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200">
            ⚠️ การลบนี้จะลบข้อมูลประวัติค่าแรงและการออกบิลที่เกี่ยวข้องของลูกจ้างคนนี้ และไม่สามารถกู้คืนได้
          </p>

          {deleteError && (
            <div className="mt-3 p-2.5 bg-red-100 text-red-700 text-xs rounded-lg">
              {deleteError}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'กำลังลบ...' : 'ยืนยันลบลูกจ้าง'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── หน้าหลัก Employee ────────────────────────────────────────────────────────
export default function EmployeePage() {
  const { user, isOwner, isLoading } = useAuth();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [employees, setEmployees] = useState<EmployeeWithWage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeWithWage | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeWithWage | null>(null);

  // Modal ประวัติการขาย
  const [showHistory, setShowHistory] = useState(false);
  const [historyEmpId, setHistoryEmpId] = useState<number | null>(null);
  const [historyEmpName, setHistoryEmpName] = useState('');
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStart, setHistoryStart] = useState(today);
  const [historyEnd, setHistoryEnd] = useState(today);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Guard: owner only
  useEffect(() => {
    if (!isLoading && !isOwner) {
      router.replace('/dashboard');
    }
  }, [isLoading, isOwner, router]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await employeeAPI.getEmployeesWithWage(selectedDate);
      setEmployees(res.data);
    } catch (e: any) {
      setError('ไม่สามารถดึงข้อมูลพนักงานได้');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isOwner) fetchEmployees();
  }, [isOwner, fetchEmployees]);

  const handleAddSuccess = () => {
    setSuccessMsg('เพิ่มลูกจ้างใหม่สำเร็จเรียบร้อย ✓');
    setTimeout(() => setSuccessMsg(''), 3500);
    fetchEmployees();
  };

  const handleEditSuccess = () => {
    setSuccessMsg('แก้ไขข้อมูลลูกจ้างสำเร็จเรียบร้อย ✓');
    setTimeout(() => setSuccessMsg(''), 3500);
    fetchEmployees();
  };

  const handleDeleteSuccess = () => {
    setSuccessMsg('ลบข้อมูลลูกจ้างสำเร็จเรียบร้อย ✓');
    setTimeout(() => setSuccessMsg(''), 3500);
    fetchEmployees();
  };

  const openHistory = async (emp: EmployeeWithWage) => {
    setHistoryEmpId(emp.id);
    setHistoryEmpName(emp.full_name);
    setShowHistory(true);
    fetchHistory(emp.id, historyStart, historyEnd);
  };

  const fetchHistory = async (empId: number, start: string, end: string) => {
    setHistoryLoading(true);
    try {
      const res = await employeeAPI.getSalesHistory({
        employee_id: empId,
        start_date: start,
        end_date: end,
        per_page: 50,
      });
      setSalesHistory(res.data.records);
      setHistoryTotal(res.data.total_amount);
    } catch {
      setSalesHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const paymentLabel = (method: string) => {
    if (method === 'cash') return '💵 เงินสด';
    if (method === 'transfer') return '📱 โอน/QR';
    return '💳 บัตรเครดิต';
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">กำลังโหลด...</div>;
  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans text-slate-800">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> จัดการลูกจ้าง
          </h1>
          <p className="text-sm text-slate-500">
            กำหนดค่าแรง แก้ไขรายชื่อ และดูสถิติการขายรายวัน — เฉพาะเจ้าของร้านเท่านั้น
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* วันที่เลือกดู */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm focus:outline-none bg-transparent"
            />
          </div>

          {/* ปุ่มเพิ่มลูกจ้าง */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> เพิ่มลูกจ้าง
          </button>
        </div>
      </header>

      {/* Alert */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <X className="w-4 h-4 text-red-600" /> {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-semibold text-blue-600">{employees.length}</div>
          <div className="text-slate-500 text-sm">ลูกจ้างทั้งหมด</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-semibold text-green-600">
            ฿{employees.reduce((s, e) => s + e.today_sales_total, 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-slate-500 text-sm">ยอดขายรวมวันที่เลือก</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-semibold text-amber-600">
            {employees.reduce((s, e) => s + e.today_sales_count, 0)}
          </div>
          <div className="text-slate-500 text-sm">บิลทั้งหมดวันที่เลือก</div>
        </div>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">กำลังโหลดข้อมูล...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 p-8">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">ยังไม่มีลูกจ้างในระบบ</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">
            คุณสามารถเพิ่มบัญชีลูกจ้างใหม่เพื่อกำหนดค่าแรงและบันทึกยอดขายได้ที่นี่
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" /> เพิ่มลูกจ้างคนแรก
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    emp.is_active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {emp.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                      {emp.full_name}
                      {!emp.is_active && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-normal">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">@{emp.username}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {emp.is_active ? '● ปฏิบัติงาน' : '● พักงาน'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-around md:justify-center gap-6 text-center border-y md:border-y-0 py-3 md:py-0 border-slate-100">
                  <div>
                    <div className="flex items-center gap-1 text-amber-600 justify-center">
                      <Banknote className="w-4 h-4" />
                      <span className="font-bold text-lg">
                        ฿{emp.daily_wage.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">ค่าแรง/วัน</div>
                    {emp.wage_note && <div className="text-xs text-slate-400 italic max-w-[120px] truncate">{emp.wage_note}</div>}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-blue-600 justify-center">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="font-bold text-lg">{emp.today_sales_count}</span>
                    </div>
                    <div className="text-xs text-slate-400">บิลที่ออก</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-green-600 justify-center">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold text-lg">
                        ฿{emp.today_sales_total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">ยอดขายรวม</div>
                  </div>
                </div>

                {/* Actions (Owner-only) */}
                <div className="flex gap-2 self-end md:self-center flex-wrap">
                  {/* แก้ไขข้อมูล */}
                  <button
                    onClick={() => setEditEmployee(emp)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-blue-600 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                  </button>

                  {/* ประวัติการขาย */}
                  <button
                    onClick={() => openHistory(emp)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
                  >
                    <History className="w-3.5 h-3.5" /> ประวัติการขาย
                  </button>

                  {/* ลบลูกจ้าง */}
                  <button
                    onClick={() => setDeleteEmployee(emp)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal เพิ่มลูกจ้าง */}
      <AddEmployeeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Modal แก้ไขข้อมูลลูกจ้าง */}
      <EditEmployeeModal
        employee={editEmployee}
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Modal ยืนยันการลบลูกจ้าง */}
      <DeleteEmployeeModal
        employee={deleteEmployee}
        isOpen={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        onSuccess={handleDeleteSuccess}
      />

      {/* Sales History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  ประวัติการขาย — {historyEmpName}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">กรองตามวันที่เพื่อดูรายละเอียดการออกบิล</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-3 px-5 py-3 border-b bg-slate-50 flex-wrap">
              <span className="text-sm font-medium text-slate-600">ช่วงวันที่:</span>
              <input
                type="date"
                value={historyStart}
                onChange={(e) => setHistoryStart(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-sm bg-white"
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                value={historyEnd}
                onChange={(e) => setHistoryEnd(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-sm bg-white"
              />
              <button
                onClick={() => historyEmpId && fetchHistory(historyEmpId, historyStart, historyEnd)}
                className="px-3.5 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                ค้นหา
              </button>
              <span className="ml-auto text-sm font-bold text-green-600">
                ยอดขายรวม: ฿{historyTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {historyLoading ? (
                <div className="text-center py-10 text-slate-400">กำลังโหลด...</div>
              ) : salesHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400">ไม่พบประวัติการขายในช่วงวันที่เลือก</div>
              ) : (
                salesHistory.map((s) => (
                  <div key={s.id} className="border border-slate-200 rounded-lg p-4 text-sm hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-slate-800">บิล #{s.id}</div>
                      <div className="font-bold text-green-600">
                        ฿{Number(s.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                      <span>📅 {new Date(s.sale_date).toLocaleDateString('th-TH')}</span>
                      <span>{paymentLabel(s.payment_method)}</span>
                      {s.license_plate && <span>🏍️ {s.license_plate}</span>}
                      {s.vehicle_model && <span>{s.vehicle_model}</span>}
                      {s.customer_name && <span>👤 {s.customer_name}</span>}
                    </div>
                    {s.items_json && (() => {
                      try {
                        const items = JSON.parse(s.items_json);
                        return (
                          <div className="mt-2 text-xs text-slate-400 border-t pt-2">
                            {items.map((it: any, idx: number) => (
                              <span key={idx} className="mr-3">{it.icon || '📦'} {it.name} ×{it.qty}</span>
                            ))}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
