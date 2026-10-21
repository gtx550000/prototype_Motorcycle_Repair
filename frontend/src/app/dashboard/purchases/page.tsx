'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle, Building2, Check, ChevronRight, CircleDollarSign, ClipboardList,
  PackageCheck, Pencil, Plus, Printer, Search, Truck, X,
} from 'lucide-react';
import { categoryAPI, purchaseAPI } from '@/lib/api';
import { Category } from '@/types/category';
import { PurchaseOrder, PurchaseOrderItemInput, Supplier } from '@/types/purchase';

interface SupplierFormData {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
}

interface DraftItem {
  key: number;
  categoryId: string;
  sku: string;
  name: string;
  quantity: string;
  unitPrice: string;
}

const emptySupplierForm: SupplierFormData = {
  code: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  note: '',
};

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
  }
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}

function formatMoney(value: number): string {
  return `฿${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function localDateString(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function statusLabel(status: PurchaseOrder['status']): string {
  const labels: Record<PurchaseOrder['status'], string> = {
    ordered: 'สั่งซื้อแล้ว',
    partially_received: 'รับสินค้าแล้วบางส่วน',
    received: 'รับสินค้าครบแล้ว',
    cancelled: 'ยกเลิก',
  };
  return labels[status];
}

function statusColor(status: PurchaseOrder['status']): string {
  const classes: Record<PurchaseOrder['status'], string> = {
    ordered: 'bg-blue-100 text-blue-700',
    partially_received: 'bg-amber-100 text-amber-800',
    received: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return classes[status];
}

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>(emptySupplierForm);
  const [supplierFormError, setSupplierFormError] = useState('');

  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(localDateString);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [initialPayment, setInitialPayment] = useState('0');
  const [orderNote, setOrderNote] = useState('');
  const [nextDraftKey, setNextDraftKey] = useState(1);

  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveFormError, setReceiveFormError] = useState('');
  const [printingOrder, setPrintingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, string>>({});
  const [paymentValues, setPaymentValues] = useState<Record<number, string>>({});
  const activeSupplierId = useRef<number | null>(null);

  const loadSuppliers = useCallback(async () => {
    const response = await purchaseAPI.getSuppliers({ search, include_inactive: true });
    setSuppliers(response.data);
  }, [search]);

  const loadOrders = useCallback(async (supplierId: number) => {
    const response = await purchaseAPI.getOrders(supplierId);
    if (activeSupplierId.current === supplierId) setOrders(response.data);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    purchaseAPI.getSuppliers({ search, include_inactive: true })
      .then((response) => {
        if (active) setSuppliers(response.data);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [search]);

  useEffect(() => {
    categoryAPI.getCategories({ page: 1, per_page: 100, is_active: true, category_type: 'product' })
      .then((response) => setCategories(response.data.categories))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  useEffect(() => {
    if (!printingOrder) return;
    const finishPrint = () => setPrintingOrder(null);
    document.body.classList.add('printing-purchase-order');
    window.addEventListener('afterprint', finishPrint);
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', finishPrint);
      document.body.classList.remove('printing-purchase-order');
    };
  }, [printingOrder]);

  const subtotal = useMemo(() => draftItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  ), [draftItems]);
  const matchingProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase();
    if (!query) return [];
    return categories.filter((category) => {
      const sku = category.description?.replace('รหัสอ้างอิง: ', '') || '';
      return `${category.name} ${sku}`.toLocaleLowerCase().includes(query);
    }).slice(0, 8);
  }, [categories, productSearch]);
  const discountAmount = Number(discount) || 0;
  const parsedTaxRate = Number(taxRate) || 0;
  const taxBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxBase * parsedTaxRate / 100;
  const grandTotal = taxBase + taxAmount;

  const selectSupplier = async (supplier: Supplier) => {
    activeSupplierId.current = supplier.id;
    setSelectedSupplier(supplier);
    setOrders([]);
    setError('');
    try {
      await loadOrders(supplier.id);
    } catch (requestError) {
      if (activeSupplierId.current === supplier.id) {
        setError(errorMessage(requestError));
        setOrders([]);
      }
    }
  };

  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setSupplierFormError('');
    setSupplierFormOpen(true);
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormError('');
    setSupplierForm({
      code: supplier.code,
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      note: supplier.note || '',
    });
    setSupplierFormOpen(true);
  };

  const saveSupplier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setSupplierFormError('');
    try {
      const payload = {
        code: supplierForm.code.trim(),
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim() || null,
        email: supplierForm.email.trim() || null,
        address: supplierForm.address.trim() || null,
        note: supplierForm.note.trim() || null,
      };
      if (editingSupplier) {
        await purchaseAPI.updateSupplier(editingSupplier.id, payload);
      } else {
        await purchaseAPI.createSupplier(payload);
      }
      await loadSuppliers();
      if (selectedSupplier) {
        const refreshed = await purchaseAPI.getSuppliers({ include_inactive: true });
        const updatedSupplier = refreshed.data.find((item) => item.id === selectedSupplier.id);
        if (updatedSupplier) setSelectedSupplier(updatedSupplier);
      }
      setSupplierFormOpen(false);
      setSuccess(editingSupplier ? 'แก้ไขข้อมูลบริษัทเรียบร้อยแล้ว' : 'เพิ่มบริษัทผู้จำหน่ายเรียบร้อยแล้ว');
    } catch (requestError) {
      setSupplierFormError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const toggleSupplierStatus = async (supplier: Supplier) => {
    setBusy(true);
    setError('');
    try {
      await purchaseAPI.updateSupplier(supplier.id, { is_active: !supplier.is_active });
      await loadSuppliers();
      const refreshed = await purchaseAPI.getSuppliers({ include_inactive: true });
      const updatedSupplier = refreshed.data.find((item) => item.id === supplier.id);
      if (updatedSupplier && selectedSupplier?.id === supplier.id) setSelectedSupplier(updatedSupplier);
      setSuccess(supplier.is_active ? 'ปิดใช้งานบริษัทแล้ว' : 'เปิดใช้งานบริษัทแล้ว');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const addDraftItem = (category?: Category) => {
    setDraftItems((items) => [...items, {
      key: nextDraftKey,
      categoryId: category ? String(category.id) : '',
      sku: category?.description?.replace('รหัสอ้างอิง: ', '') || '',
      name: category?.name || '',
      quantity: '1',
      unitPrice: '',
    }]);
    setNextDraftKey((key) => key + 1);
  };

  const updateDraftItem = (key: number, updates: Partial<DraftItem>) => {
    setDraftItems((items) => items.map((item) => item.key === key ? { ...item, ...updates } : item));
  };

  const selectDraftProduct = (key: number, categoryId: string) => {
    const category = categories.find((item) => item.id === Number(categoryId));
    updateDraftItem(key, {
      categoryId,
      sku: category?.description?.replace('รหัสอ้างอิง: ', '') || '',
      name: category?.name || '',
      unitPrice: '',
    });
  };

  const startOrder = () => {
    setDraftItems([]);
    setProductSearch('');
    setDiscount('0');
    setTaxRate('0');
    setInitialPayment('0');
    setOrderNote('');
    setOrderDate(localDateString());
    setOrderFormOpen(true);
  };

  const createOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSupplier) return;
    if (draftItems.length === 0) {
      setError('เพิ่มสินค้าอย่างน้อย 1 รายการก่อนบันทึกใบสั่งซื้อ');
      return;
    }
    const invalidItem = draftItems.find((item) =>
      !item.name.trim() || Number(item.quantity) < 1 || Number(item.unitPrice) < 0
      || !Number.isFinite(Number(item.quantity)) || !Number.isFinite(Number(item.unitPrice))
      || !Number.isInteger(Number(item.quantity))
    );
    if (invalidItem) {
      setError('กรุณาตรวจสอบชื่อสินค้า จำนวน และราคาให้ถูกต้องทุกรายการ');
      return;
    }
    if (discountAmount < 0 || discountAmount > subtotal) {
      setError('ส่วนลดต้องเป็น 0 หรือมากกว่า และไม่เกินยอดรวมสินค้า');
      return;
    }
    if (parsedTaxRate < 0 || parsedTaxRate > 100) {
      setError('อัตราภาษีต้องอยู่ระหว่าง 0 ถึง 100 เปอร์เซ็นต์');
      return;
    }
    if ((Number(initialPayment) || 0) < 0 || (Number(initialPayment) || 0) > grandTotal) {
      setError('ยอดชำระเริ่มต้นต้องเป็น 0 หรือมากกว่า และไม่เกินยอดสั่งซื้อ');
      return;
    }
    const items: PurchaseOrderItemInput[] = draftItems.map((item) => ({
      category_id: item.categoryId ? Number(item.categoryId) : null,
      sku: item.sku.trim() || undefined,
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }));
    setBusy(true);
    setError('');
    try {
      await purchaseAPI.createOrder(selectedSupplier.id, {
        order_date: orderDate,
        items,
        discount_amount: discountAmount,
        tax_rate: parsedTaxRate,
        initial_payment: Math.max(0, Number(initialPayment) || 0),
        note: orderNote.trim() || undefined,
      });
      await Promise.all([loadOrders(selectedSupplier.id), loadSuppliers()]);
      setOrderFormOpen(false);
      setSuccess('บันทึกใบสั่งซื้อสินค้าแล้ว');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const openReceiveForm = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceiveFormError('');
    setReceiveQuantities(Object.fromEntries(
      order.items
        .filter((item) => item.quantity > item.received_quantity)
        .map((item) => [item.id, String(item.quantity - item.received_quantity)]),
    ));
  };

  const receiveItems = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receivingOrder || !selectedSupplier) return;
    const items = Object.entries(receiveQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([itemId, quantity]) => ({ item_id: Number(itemId), quantity: Number(quantity) }));
    if (items.length === 0 || items.some((item) => !Number.isInteger(item.quantity))) {
      setReceiveFormError('กรอกจำนวนสินค้าที่รับอย่างน้อย 1 รายการ');
      return;
    }
    setBusy(true);
    setReceiveFormError('');
    try {
      await purchaseAPI.receiveItems(receivingOrder.id, items);
      await Promise.all([loadOrders(selectedSupplier.id), loadSuppliers()]);
      setReceivingOrder(null);
      setSuccess('บันทึกการรับสินค้าแล้ว และเพิ่มเข้าสต็อกสินค้าเรียบร้อย');
    } catch (requestError) {
      setReceiveFormError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const recordPayment = async (order: PurchaseOrder) => {
    const amount = Number(paymentValues[order.id]) || 0;
    if (amount <= 0) {
      setError('กรอกยอดชำระที่มากกว่า 0');
      return;
    }
    if (!selectedSupplier) return;
    setBusy(true);
    setError('');
    try {
      await purchaseAPI.addPayment(order.id, { amount });
      setPaymentValues((values) => ({ ...values, [order.id]: '' }));
      await Promise.all([loadOrders(selectedSupplier.id), loadSuppliers()]);
      setSuccess('บันทึกการชำระเงินให้บริษัทแล้ว');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async (order: PurchaseOrder) => {
    if (!selectedSupplier || !window.confirm(`ยืนยันยกเลิกใบสั่งซื้อ ${order.purchase_no} หรือไม่?`)) return;
    setBusy(true);
    setError('');
    try {
      await purchaseAPI.cancelOrder(order.id);
      await Promise.all([loadOrders(selectedSupplier.id), loadSuppliers()]);
      setSuccess('ยกเลิกใบสั่งซื้อแล้ว');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const closeMessage = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-800 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Truck className="h-7 w-7 text-blue-600" /> จัดซื้อสินค้าเข้าร้าน
          </h1>
          <p className="mt-1 text-sm text-slate-500">จัดการบริษัทผู้จำหน่าย ใบสั่งซื้อ การรับสินค้า และยอดค้างชำระ</p>
        </div>
        <button onClick={openCreateSupplier} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> เพิ่มบริษัทผู้จำหน่าย
        </button>
      </header>

      {(error || success) && (
        <div className={`mb-5 flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          <div className="flex items-start gap-2">
            {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{error || success}</span>
          </div>
          <button onClick={closeMessage} aria-label="ปิดข้อความ"><X className="h-4 w-4" /></button>
        </div>
      )}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold"><Building2 className="h-5 w-5 text-blue-600" /> บริษัทผู้จำหน่าย</h2>
            <p className="text-xs text-slate-500">ค้นหาด้วยรหัสหรือตัวย่อบริษัท และชื่อบริษัท</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหารหัสหรือชื่อบริษัท..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูลบริษัท...</div>
        ) : suppliers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
            ไม่พบบริษัทผู้จำหน่ายที่ตรงกับการค้นหา
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">รหัสบริษัท</th>
                  <th className="px-3 py-3">ชื่อบริษัท</th>
                  <th className="px-3 py-3 text-right">ยอดซื้อ</th>
                  <th className="px-3 py-3 text-right">ยอดค้างจ่าย</th>
                  <th className="px-3 py-3 text-center">สถานะ</th>
                  <th className="px-3 py-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className={selectedSupplier?.id === supplier.id ? 'bg-blue-50/70' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-700">{supplier.code}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => selectSupplier(supplier)} className="text-left font-semibold text-blue-700 hover:underline">{supplier.name}</button>
                      {supplier.phone && <p className="text-xs text-slate-400">{supplier.phone}</p>}
                    </td>
                    <td className="px-3 py-3 text-right">{formatMoney(supplier.purchase_total)}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${supplier.outstanding_balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>{formatMoney(supplier.outstanding_balance)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${supplier.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {supplier.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openEditSupplier(supplier)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700" title="แก้ไขบริษัท"><Pencil className="h-4 w-4" /></button>
                        <button disabled={busy} onClick={() => toggleSupplierStatus(supplier)} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                          {supplier.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                        <button onClick={() => selectSupplier(supplier)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                          เลือก <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSupplier && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">บริษัทที่เลือก</div>
              <h2 className="mt-1 text-xl font-bold">{selectedSupplier.name} <span className="font-mono text-sm text-slate-500">({selectedSupplier.code})</span></h2>
              <p className="text-sm text-slate-500">{selectedSupplier.phone || 'ไม่ระบุโทรศัพท์'}{selectedSupplier.email ? ` · ${selectedSupplier.email}` : ''}</p>
            </div>
            <button disabled={!selectedSupplier.is_active} onClick={startOrder} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              <Plus className="h-4 w-4" /> สร้างใบสั่งซื้อ
            </button>
          </div>

          {orderFormOpen && (
            <form onSubmit={createOrder} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold"><ClipboardList className="h-5 w-5 text-blue-600" /> ใบสั่งซื้อสินค้าใหม่</h3>
                <button type="button" onClick={() => setOrderFormOpen(false)} className="rounded p-1 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
              </div>
              <label className="mb-4 block max-w-xs text-sm font-medium text-slate-700">
                วันที่สั่งซื้อ
                <input required type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
              </label>

              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-semibold">รายการสินค้า</h4>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-1 sm:justify-end">
                  <div className="relative min-w-0 flex-1 sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && matchingProducts[0]) {
                          event.preventDefault();
                          addDraftItem(matchingProducts[0]);
                          setProductSearch('');
                        }
                      }}
                      placeholder="ค้นหาสินค้าจากชื่อหรือรหัส..."
                      aria-label="ค้นหาสินค้าในระบบ"
                      className="block h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm"
                    />
                    {productSearch.trim() && (
                      <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        {matchingProducts.length > 0 ? matchingProducts.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              addDraftItem(category);
                              setProductSearch('');
                            }}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50"
                          >
                            <span className="truncate font-medium text-slate-700">{category.name}</span>
                            <span className="shrink-0 text-xs text-slate-500">{category.description?.replace('รหัสอ้างอิง: ', '') || `ID ${category.id}`}</span>
                          </button>
                        )) : (
                          <p className="px-3 py-2 text-sm text-slate-500">ไม่พบสินค้าที่ค้นหา</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => addDraftItem()} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"><Plus className="h-4 w-4" /> รายการกำหนดเอง</button>
                </div>
              </div>

              {draftItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white py-6 text-center text-sm text-slate-500">เลือกสินค้าในระบบหรือเพิ่มรายการกำหนดเอง</div>
              ) : (
                <div className="space-y-3">
                  {draftItems.map((item, index) => (
                    <div key={item.key} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-12">
                      <div className="sm:col-span-1 flex items-center text-xs font-semibold text-slate-400">#{index + 1}</div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-slate-500">สินค้าในระบบ</label>
                        <select value={item.categoryId} onChange={(event) => selectDraftProduct(item.key, event.target.value)} className="mt-1 block h-10 w-full box-border rounded border border-slate-300 px-2 text-sm">
                          <option value="">รายการกำหนดเอง</option>
                          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                      </div>
                      <label className="sm:col-span-2 text-xs text-slate-500">รหัสสินค้า<input value={item.sku} onChange={(event) => updateDraftItem(item.key, { sku: event.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm" /></label>
                      <label className="sm:col-span-3 text-xs text-slate-500">ชื่อสินค้า<input required value={item.name} onChange={(event) => updateDraftItem(item.key, { name: event.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm" /></label>
                      <label className="sm:col-span-1 text-xs text-slate-500">จำนวน<input required type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateDraftItem(item.key, { quantity: event.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm" /></label>
                      <label className="sm:col-span-1 text-xs text-slate-500">ราคาต่อหน่วย<input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateDraftItem(item.key, { unitPrice: event.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm" /></label>
                      <div className="sm:col-span-1 flex items-end justify-end">
                        <button type="button" onClick={() => setDraftItems((items) => items.filter((entry) => entry.key !== item.key))} className="rounded p-2 text-red-600 hover:bg-red-50" title="ลบรายการ"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="sm:col-span-12 text-right text-xs text-slate-500">รวมรายการ: <span className="font-semibold text-slate-700">{formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</span></div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-slate-600">ส่วนลด (บาท)<input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
                <label className="text-sm text-slate-600">ภาษี (%)<input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
                <label className="text-sm text-slate-600">ชำระเริ่มต้น (บาท)<input type="number" min="0" step="0.01" value={initialPayment} onChange={(event) => setInitialPayment(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
                <div className="rounded-lg bg-white p-3 text-right">
                  <div className="text-xs text-slate-500">ยอดก่อนภาษี {formatMoney(subtotal)} · ภาษี {formatMoney(taxAmount)}</div>
                  <div className="mt-1 text-lg font-bold text-blue-700">ยอดสุทธิ {formatMoney(grandTotal)}</div>
                </div>
              </div>
              <label className="mt-3 block text-sm text-slate-600">หมายเหตุ (ถ้ามี)<textarea rows={2} value={orderNote} onChange={(event) => setOrderNote(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setOrderFormOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">ยกเลิก</button>
                <button disabled={busy} type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'กำลังบันทึก...' : 'บันทึกใบสั่งซื้อ'}</button>
              </div>
            </form>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold"><ClipboardList className="h-5 w-5 text-slate-500" /> ประวัติใบสั่งซื้อ</h3>
            <span className="text-xs text-slate-400">{orders.length} รายการ</span>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">บริษัทยังไม่มีใบสั่งซื้อ</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold">{order.purchase_no}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                        <button type="button" onClick={() => setPrintingOrder(order)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          <Printer className="h-3.5 w-3.5" /> พิมพ์ PO
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">วันที่สั่งซื้อ {new Date(`${order.order_date}T00:00:00`).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-bold text-slate-800">{formatMoney(order.total_amount)}</div>
                      <div className="text-xs text-green-700">ชำระแล้ว {formatMoney(order.paid_amount)}</div>
                      <div className="text-xs text-amber-700">ค้างชำระ {formatMoney(order.outstanding_balance)}</div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="text-xs text-slate-500">
                        <tr><th className="py-2">รหัส / รายการสินค้า</th><th className="py-2 text-right">ราคา/หน่วย</th><th className="py-2 text-center">สั่ง</th><th className="py-2 text-center">รับแล้ว</th><th className="py-2 text-right">รวม</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2"><span className="mr-2 font-mono text-xs text-slate-400">{item.sku || '-'}</span>{item.name}</td>
                            <td className="py-2 text-right">{formatMoney(item.unit_price)}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-center">{item.received_quantity}/{item.quantity}</td>
                            <td className="py-2 text-right">{formatMoney(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>ยอดสินค้า {formatMoney(order.subtotal)}</span>
                      {order.discount_amount > 0 && <span>ส่วนลด {formatMoney(order.discount_amount)}</span>}
                      {order.tax_rate > 0 && <span>ภาษี {order.tax_rate}% ({formatMoney(order.tax_amount)})</span>}
                      {order.note && <span>หมายเหตุ: {order.note}</span>}
                    </div>
                    {order.status !== 'cancelled' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status !== 'received' && (
                          <button disabled={busy} onClick={() => openReceiveForm(order)} className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100 disabled:opacity-50">
                            <PackageCheck className="h-4 w-4" /> รับสินค้า
                          </button>
                        )}
                        {order.outstanding_balance > 0 && (
                          <div className="flex items-center gap-1">
                            <input type="number" min="0.01" max={order.outstanding_balance} step="0.01" placeholder="ยอดชำระ" value={paymentValues[order.id] || ''} onChange={(event) => setPaymentValues((values) => ({ ...values, [order.id]: event.target.value }))} className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-xs" />
                            <button disabled={busy} onClick={() => recordPayment(order)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><CircleDollarSign className="h-4 w-4" /> ชำระ</button>
                          </div>
                        )}
                        {order.status === 'ordered' && order.paid_amount === 0 && order.items.every((item) => item.received_quantity === 0) && (
                          <button disabled={busy} onClick={() => cancelOrder(order)} className="rounded-lg px-2 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">ยกเลิก PO</button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {supplierFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveSupplier} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingSupplier ? 'แก้ไขบริษัทผู้จำหน่าย' : 'เพิ่มบริษัทผู้จำหน่าย'}</h2>
              <button type="button" onClick={() => setSupplierFormOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {supplierFormError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{supplierFormError}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-600">รหัสบริษัท / ตัวย่อ<input required maxLength={30} value={supplierForm.code} onChange={(event) => setSupplierForm({ ...supplierForm, code: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm text-slate-600">ชื่อบริษัท<input required maxLength={150} value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm text-slate-600">โทรศัพท์<input value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm text-slate-600">อีเมล<input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm text-slate-600 sm:col-span-2">ที่อยู่<textarea rows={2} value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm text-slate-600 sm:col-span-2">หมายเหตุ<textarea rows={2} value={supplierForm.note} onChange={(event) => setSupplierForm({ ...supplierForm, note: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSupplierFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">ยกเลิก</button>
              <button disabled={busy} type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'กำลังบันทึก...' : 'บันทึกบริษัท'}</button>
            </div>
          </form>
        </div>
      )}

      {receivingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={receiveItems} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">รับสินค้าเข้าร้าน</h2>
                <p className="text-sm text-slate-500">{receivingOrder.purchase_no} · ระบุจำนวนที่รับรอบนี้</p>
              </div>
              <button type="button" onClick={() => setReceivingOrder(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {receiveFormError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{receiveFormError}</p>}
            <div className="space-y-3">
              {receivingOrder.items.filter((item) => item.quantity > item.received_quantity).map((item) => (
                <label key={item.id} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <span><span className="block font-medium">{item.name}</span><span className="text-xs text-slate-500">รับแล้ว {item.received_quantity} จาก {item.quantity} · เหลือ {item.quantity - item.received_quantity}</span></span>
                  <span className="text-xs text-slate-500">รับรอบนี้</span>
                  <input required type="number" min="0" max={item.quantity - item.received_quantity} step="1" value={receiveQuantities[item.id] ?? ''} onChange={(event) => setReceiveQuantities((values) => ({ ...values, [item.id]: event.target.value }))} className="w-28 rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">จำนวนที่บันทึกจะเพิ่มเข้าสต็อกของสินค้าที่เชื่อมกับรายการในระบบ</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setReceivingOrder(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">ยกเลิก</button>
              <button disabled={busy} type="submit" className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{busy ? 'กำลังบันทึก...' : 'ยืนยันรับสินค้า'}</button>
            </div>
          </form>
        </div>
      )}

      {printingOrder && selectedSupplier && (
        <article className="purchase-print hidden print:block">
          <header className="mb-6 flex items-start justify-between border-b-2 border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ใบสั่งซื้อสินค้า</h1>
              <p className="text-sm text-slate-500">PURCHASE ORDER</p>
              <div className="mt-4 text-sm">
                <p className="font-bold">{selectedSupplier.name} ({selectedSupplier.code})</p>
                {selectedSupplier.address && <p className="whitespace-pre-line">{selectedSupplier.address}</p>}
                {selectedSupplier.phone && <p>โทรศัพท์: {selectedSupplier.phone}</p>}
                {selectedSupplier.email && <p>อีเมล: {selectedSupplier.email}</p>}
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-xl font-bold">{printingOrder.purchase_no}</p>
              <p>วันที่สั่งซื้อ: {new Date(`${printingOrder.order_date}T00:00:00`).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>สถานะ: {statusLabel(printingOrder.status)}</p>
            </div>
          </header>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-left text-white">
                <th className="border border-slate-300 px-3 py-2">รหัสสินค้า</th>
                <th className="border border-slate-300 px-3 py-2">รายการสินค้า</th>
                <th className="border border-slate-300 px-3 py-2 text-center">จำนวน</th>
                <th className="border border-slate-300 px-3 py-2 text-right">ราคา/หน่วย</th>
                <th className="border border-slate-300 px-3 py-2 text-right">รวม (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {printingOrder.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 px-3 py-2">{item.sku || '-'}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.name}</td>
                  <td className="border border-slate-300 px-3 py-2 text-center">{item.quantity}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">{formatMoney(item.unit_price)}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">{formatMoney(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto mt-5 w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between"><span>รวมสินค้า</span><span>{formatMoney(printingOrder.subtotal)}</span></div>
            <div className="flex justify-between"><span>ส่วนลด</span><span>-{formatMoney(printingOrder.discount_amount)}</span></div>
            <div className="flex justify-between"><span>ภาษี {printingOrder.tax_rate}%</span><span>{formatMoney(printingOrder.tax_amount)}</span></div>
            <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-bold"><span>ยอดสุทธิ</span><span>{formatMoney(printingOrder.total_amount)}</span></div>
          </div>
          {printingOrder.note && <p className="mt-6 border-t border-slate-200 pt-3 text-sm">หมายเหตุ: {printingOrder.note}</p>}
          <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
            <div><p className="mb-12">ลงชื่อ ....................................................</p><p>ผู้สั่งซื้อ</p></div>
            <div><p className="mb-12">ลงชื่อ ....................................................</p><p>ผู้อนุมัติ</p></div>
          </div>
        </article>
      )}
    </div>
  );
}
