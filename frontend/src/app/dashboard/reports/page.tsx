'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, Calendar, DollarSign, Package, FileText,
  User, Search, RefreshCw, ChevronRight, ChevronDown,
  CreditCard, Banknote, QrCode, X, Filter, Award, ShoppingBag
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { employeeAPI } from '@/lib/api';
import { SalesReportResponse, EmployeeSaleStat, ItemSaleStat, SaleRecord, EmployeeDropdown } from '@/types/employee';

// Helpers สำหรับคำนวณช่วงวันที่
const getTodayStr = () => new Date().toISOString().split('T')[0];

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const getThisWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  // ให้วันจันทร์เป็นวันแรกของสัปดาห์ (day === 0 คือวันอาทิตย์)
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return {
    start: monday.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
};

const getLastWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - diffToMonday - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return {
    start: lastMonday.toISOString().split('T')[0],
    end: lastSunday.toISOString().split('T')[0],
  };
};

const getThisMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: firstDay.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
};

export default function SalesReportPage() {
  // ช่วงวันที่ที่เลือก
  const [periodPreset, setPeriodPreset] = useState<'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'custom'>('this_week');
  const [startDate, setStartDate] = useState(getThisWeekRange().start);
  const [endDate, setEndDate] = useState(getThisWeekRange().end);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');

  // ข้อมูลจาก API
  const [reportData, setReportData] = useState<SalesReportResponse | null>(null);
  const [employeesList, setEmployeesList] = useState<EmployeeDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // แท็บมุมมอง
  const [activeTab, setActiveTab] = useState<'employees' | 'items' | 'records'>('employees');

  // สำหรับขยายดูรายละเอียดสินค้าของพนักงาน
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null);

  // สำหรับเปิดดูรายละเอียดบิลแบบ Modal
  const [viewingRecord, setViewingRecord] = useState<SaleRecord | null>(null);

  // ค้นหาในตาราง
  const [itemSearch, setItemSearch] = useState('');

  // โหลดรายชื่อพนักงานสำหรับ Dropdown ตัวกรอง
  useEffect(() => {
    employeeAPI.getEmployeeList()
      .then((res) => setEmployeesList(res.data))
      .catch((err) => console.error('Failed to load employee list:', err));
  }, []);

  // ดึงข้อมูลรายงาน
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await employeeAPI.getSalesReport({
        start_date: startDate,
        end_date: endDate,
        employee_id: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
      });
      setReportData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch sales report:', err);
      setErrorMsg(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลรายงานการขายได้');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedEmployeeId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // เปลี่ยน Preset ช่วงเวลา
  const handleSelectPreset = (preset: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'custom') => {
    setPeriodPreset(preset);
    if (preset === 'today') {
      const today = getTodayStr();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yest = getYesterdayStr();
      setStartDate(yest);
      setEndDate(yest);
    } else if (preset === 'this_week') {
      const range = getThisWeekRange();
      setStartDate(range.start);
      setEndDate(range.end);
    } else if (preset === 'last_week') {
      const range = getLastWeekRange();
      setStartDate(range.start);
      setEndDate(range.end);
    } else if (preset === 'this_month') {
      const range = getThisMonthRange();
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  // กรองรายการสินค้าตามค้นหา
  const filteredItems = useMemo(() => {
    if (!reportData?.top_items) return [];
    if (!itemSearch.trim()) return reportData.top_items;
    const q = itemSearch.toLowerCase();
    return reportData.top_items.filter((it) => it.item_name.toLowerCase().includes(q));
  }, [reportData?.top_items, itemSearch]);

  // แปลงวิธีชำระเงิน
  const renderPaymentBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Banknote className="w-3 h-3" /> เงินสด
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <QrCode className="w-3 h-3" /> โอน/QR
          </span>
        );
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CreditCard className="w-3 h-3" /> บัตรเครดิต
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
            {method}
          </span>
        );
    }
  };

  // คำนวณยอดเฉลี่ยต่อบิล
  const avgTicket = useMemo(() => {
    if (!reportData || reportData.total_bills === 0) return 0;
    return reportData.total_revenue / reportData.total_bills;
  }, [reportData]);

  return (
    <ProtectedRoute requireOwner={true}>
      <div className="min-h-screen bg-[#f8fafc] p-6 font-sans text-slate-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-blue-600" />
                ระบบรายงานการขาย
              </h1>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">
                🔒 สิทธิเจ้าของร้าน (Owner)
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              สรุปยอดขายรายวัน / สัปดาห์ ตรวจสอบว่าพนักงานแต่ละคนขายได้กี่ชิ้น และขายสินค้าอะไรไปบ้าง
            </p>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            รีเฟรชข้อมูล
          </button>
        </div>

        {/* ฟิลเตอร์ช่วงเวลาและพนักงาน */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mr-2">
              <Calendar className="w-4 h-4 text-slate-500" /> ช่วงเวลา:
            </span>
            {[
              { key: 'today', label: 'วันนี้' },
              { key: 'yesterday', label: 'เมื่อวาน' },
              { key: 'this_week', label: 'สัปดาห์นี้' },
              { key: 'last_week', label: 'สัปดาห์ก่อน' },
              { key: 'this_month', label: 'เดือนนี้' },
              { key: 'custom', label: 'กำหนดเอง' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelectPreset(p.key as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  periodPreset === p.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                พนักงานผู้ออกบิล
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              >
                <option value="">-- พนักงานทุกคน --</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.username})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        {/* การ์ดสรุป KPI ภาพรวม */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ยอดขายรวม</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                ฿{reportData ? Number(reportData.total_revenue).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {startDate === endDate ? `วันที่ ${startDate}` : `${startDate} ถึง ${endDate}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">จำนวนชิ้นที่ขายได้</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {reportData ? reportData.total_items_sold.toLocaleString() : 0} <span className="text-sm font-normal text-slate-500">ชิ้น</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">รวมสินค้าทุกประเภท</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">จำนวนบิลที่ออก</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {reportData ? reportData.total_bills.toLocaleString() : 0} <span className="text-sm font-normal text-slate-500">บิล</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">ทำรายการสำเร็จ</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ยอดขายเฉลี่ย / บิล</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                ฿{avgTicket.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Avg Ticket Size</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6 bg-white px-4 pt-2 rounded-t-xl">
          {[
            { key: 'employees', label: '👥 สรุปตามพนักงาน (ใครขายได้กี่ชิ้น)', count: reportData?.employees_summary.length || 0 },
            { key: 'items', label: '📦 สินค้าที่ขายไป (ขายอะไรไปบ้าง)', count: reportData?.top_items.length || 0 },
            { key: 'records', label: '🧾 ประวัติบิลการขายแบบละเอียด', count: reportData?.records.length || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="bg-white p-16 rounded-2xl shadow-sm border text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p>กำลังประมวลผลรายงานการขาย...</p>
          </div>
        ) : (
          <>
            {/* ──────────────── TAB 1: สรุปตามพนักงาน ──────────────── */}
            {activeTab === 'employees' && (
              <div className="space-y-4">
                {reportData?.employees_summary.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl shadow-sm border text-center text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">ไม่มีข้อมูลการขายของพนักงานในช่วงเวลานี้</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนช่วงวันที่ หรือเลือกพนักงานคนอื่น</p>
                  </div>
                ) : (
                  reportData?.employees_summary.map((emp, index) => {
                    const isExpanded = expandedEmployeeId === emp.employee_id;
                    const revenuePercent = reportData.total_revenue > 0
                      ? ((emp.total_revenue / reportData.total_revenue) * 100).toFixed(1)
                      : '0';

                    return (
                      <div key={emp.employee_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                        {/* Header การ์ดพนักงาน */}
                        <div
                          onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.employee_id)}
                          className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                {emp.employee_name}
                                <span className="text-xs font-normal text-slate-400">(@{emp.username})</span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                รหัสพนักงาน #{emp.employee_id}
                              </p>
                            </div>
                          </div>

                          {/* สถิติ 3 ช่อง */}
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="text-left lg:text-right">
                              <p className="text-xs text-slate-400">จำนวนบิลที่ออก</p>
                              <p className="font-bold text-slate-800">{emp.total_bills} บิล</p>
                            </div>
                            <div className="text-left lg:text-right">
                              <p className="text-xs text-slate-400">ขายได้ทั้งหมด</p>
                              <p className="font-bold text-blue-600">{emp.total_items_sold} ชิ้น</p>
                            </div>
                            <div className="text-left lg:text-right">
                              <p className="text-xs text-slate-400">ยอดขายรวม</p>
                              <p className="font-bold text-green-600 text-base">
                                ฿{emp.total_revenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="w-24 text-right hidden sm:block">
                              <p className="text-xs text-slate-400">สัดส่วนยอดขาย</p>
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                                {revenuePercent}%
                              </span>
                            </div>

                            <button className="text-slate-400 hover:text-blue-600 p-1">
                              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* รายการสินค้าที่พนักงานคนนี้ขายได้ (เมื่อกดขยาย) */}
                        {isExpanded && (
                          <div className="bg-slate-50 p-5 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <ShoppingBag className="w-4 h-4 text-blue-600" />
                                สินค้าที่ {emp.employee_name} ขายไปแล้ว ({emp.items_breakdown.length} รายการ)
                              </h4>
                              <span className="text-xs text-slate-500">
                                รวมทั้งสิ้น {emp.total_items_sold} ชิ้น
                              </span>
                            </div>

                            {emp.items_breakdown.length === 0 ? (
                              <p className="text-xs text-slate-400 py-3 text-center">ไม่มีข้อมูลรายการสินค้า</p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                                    <tr>
                                      <th className="py-2.5 px-3">สินค้า</th>
                                      <th className="py-2.5 px-3 text-right">ราคา/ชิ้น</th>
                                      <th className="py-2.5 px-3 text-right">จำนวนที่ขายได้</th>
                                      <th className="py-2.5 px-3 text-right">ยอดรวม</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {emp.items_breakdown.map((item) => (
                                      <tr key={item.item_id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-slate-800">
                                          <span>{item.icon || '📦'}</span>
                                          {item.item_name}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-slate-600">
                                          ฿{item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                                          {item.total_qty} ชิ้น
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                          ฿{item.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ──────────────── TAB 2: รายการสินค้าที่ขายได้ ──────────────── */}
            {activeTab === 'items' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">จัดอันดับสินค้าที่ขายได้</h3>
                    <p className="text-xs text-slate-500">
                      แสดงรายการสินค้าที่ขายออกไปทั้งหมดในช่วงเวลาที่เลือก เรียงตามจำนวนชิ้นที่ขายดีที่สุด
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อสินค้า..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p>ไม่พบรายการสินค้าที่ขายได้</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b text-xs uppercase">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">อันดับ</th>
                          <th className="py-3 px-4">ชื่อสินค้า / อะไหล่</th>
                          <th className="py-3 px-4 text-right">ราคาต่อชิ้น</th>
                          <th className="py-3 px-4 text-right">จำนวนที่ขายได้</th>
                          <th className="py-3 px-4 text-right">ยอดขายรวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((item, idx) => (
                          <tr key={item.item_id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">
                              {idx === 0 ? <span className="text-amber-500 font-bold">🥇 1</span> : idx === 1 ? <span className="text-slate-400 font-bold">🥈 2</span> : idx === 2 ? <span className="text-amber-700 font-bold">🥉 3</span> : idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5 font-medium text-slate-800">
                                <span className="text-lg">{item.icon || '📦'}</span>
                                <div>
                                  <p>{item.item_name}</p>
                                  <span className="text-xs text-slate-400">รหัส ID #{item.item_id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">
                              ฿{item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-blue-600">
                              {item.total_qty.toLocaleString()} ชิ้น
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">
                              ฿{item.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ──────────────── TAB 3: รายละเอียดประวัติบิล ──────────────── */}
            {activeTab === 'records' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-slate-800">ประวัติบิลการขาย</h3>
                  <p className="text-xs text-slate-500">
                    รายการบิลทั้งหมดที่ชำระเงินสำเร็จ สามารถคลิกดูรายละเอียดสินค้าและข้อมูลลูกค้าในแต่ละบิลได้
                  </p>
                </div>

                {reportData?.records.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p>ไม่พบรายการบิลการขายในช่วงเวลานี้</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b text-xs uppercase">
                        <tr>
                          <th className="py-3 px-4">เลขที่บิล / วันที่</th>
                          <th className="py-3 px-4">พนักงานผู้ออกบิล</th>
                          <th className="py-3 px-4">ลูกค้า / ทะเบียนรถ</th>
                          <th className="py-3 px-4 text-center">ช่องทางชำระ</th>
                          <th className="py-3 px-4 text-right">ยอดเงินรวม</th>
                          <th className="py-3 px-4 text-center">การกระทำ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData?.records.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4">
                              <p className="font-mono font-bold text-slate-800">#BILL-{r.id.toString().padStart(5, '0')}</p>
                              <span className="text-xs text-slate-400">
                                {r.sale_date} {new Date(r.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {r.employee_name || `ID #${r.employee_id}`}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              <p className="font-semibold text-slate-800">{r.customer_name || 'ลูกค้าทั่วไป'}</p>
                              <span className="text-slate-400">
                                {r.license_plate ? `ทะเบียน: ${r.license_plate}` : ''} {r.vehicle_model ? `(${r.vehicle_model})` : ''}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {renderPaymentBadge(r.payment_method)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">
                              ฿{r.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setViewingRecord(r)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                              >
                                ดูรายละเอียด
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ──────────────── Modal ดูรายละเอียดบิล ──────────────── */}
        {viewingRecord && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    ใบเสร็จรับเงิน #BILL-{viewingRecord.id.toString().padStart(5, '0')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    วันที่ {viewingRecord.sale_date} {new Date(viewingRecord.created_at).toLocaleTimeString('th-TH')}
                  </p>
                </div>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ข้อมูลการออกบิล */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">พนักงานผู้ออกบิล:</span>
                  <span className="font-semibold text-slate-800">{viewingRecord.employee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ลูกค้า:</span>
                  <span className="font-semibold text-slate-800">{viewingRecord.customer_name || 'ลูกค้าทั่วไป'}</span>
                </div>
                {viewingRecord.license_plate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ทะเบียนรถ:</span>
                    <span className="font-mono text-slate-800">{viewingRecord.license_plate}</span>
                  </div>
                )}
                {viewingRecord.vehicle_model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">รุ่นรถ:</span>
                    <span className="text-slate-800">{viewingRecord.vehicle_model}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">ช่องทางชำระเงิน:</span>
                  <div>{renderPaymentBadge(viewingRecord.payment_method)}</div>
                </div>
                {viewingRecord.note && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">หมายเหตุ:</span>
                    <span className="text-slate-700 italic">{viewingRecord.note}</span>
                  </div>
                )}
              </div>

              {/* รายการสินค้าในบิล */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">รายการอะไหล่ / บริการ</h4>
              <div className="border rounded-xl overflow-hidden mb-4 text-xs">
                {(() => {
                  let items = [];
                  try {
                    items = viewingRecord.items_json ? JSON.parse(viewingRecord.items_json) : [];
                  } catch {
                    items = [];
                  }

                  if (items.length === 0) {
                    return <p className="p-4 text-center text-slate-400">ไม่มีข้อมูลรายการสินค้า</p>;
                  }

                  return (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                        <tr>
                          <th className="py-2 px-3">รายการ</th>
                          <th className="py-2 px-3 text-right">ราคา</th>
                          <th className="py-2 px-3 text-center">จำนวน</th>
                          <th className="py-2 px-3 text-right">รวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 px-3">
                              <span className="mr-1">{it.icon || '📦'}</span>
                              {it.name}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">
                              ฿{Number(it.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{it.qty}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">
                              ฿{(Number(it.price) * Number(it.qty)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* ยอดเงินรวม */}
              <div className="flex justify-between items-center text-base font-bold bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 mb-6">
                <span>ยอดเงินสุทธิ</span>
                <span>฿{viewingRecord.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <button
                onClick={() => setViewingRecord(null)}
                className="w-full py-2.5 bg-slate-800 text-white font-medium rounded-xl text-sm hover:bg-slate-700 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

