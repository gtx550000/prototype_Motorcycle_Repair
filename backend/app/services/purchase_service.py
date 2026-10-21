from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4
from typing import Optional
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from ..models.category import Category
from ..models.purchase import PurchaseOrder, PurchaseOrderItem, PurchasePayment, Supplier
from ..schemas.purchase import PurchaseOrderCreate, PurchasePaymentCreate, PurchaseReceiveCreate, SupplierCreate, SupplierUpdate

CENT = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def supplier_totals(supplier: Supplier) -> tuple[Decimal, Decimal]:
    orders = [order for order in supplier.purchase_orders if order.status != "cancelled"]
    purchase_total = sum((Decimal(order.total_amount) for order in orders), Decimal("0"))
    outstanding = sum(
        (
            Decimal(order.total_amount)
            - sum((Decimal(payment.amount) for payment in order.payments), Decimal("0"))
            for order in orders
        ),
        Decimal("0"),
    )
    return money(purchase_total), money(max(outstanding, Decimal("0")))


def list_suppliers(db: Session, search: str = "", include_inactive: bool = False):
    query = db.query(Supplier).options(
        joinedload(Supplier.purchase_orders).joinedload(PurchaseOrder.payments)
    )
    if not include_inactive:
        query = query.filter(Supplier.is_active.is_(True))
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Supplier.code.ilike(term), Supplier.name.ilike(term)))
    suppliers = query.order_by(Supplier.name).all()
    results = []
    for supplier in suppliers:
        purchase_total, outstanding = supplier_totals(supplier)
        results.append({
            "id": supplier.id,
            "code": supplier.code,
            "name": supplier.name,
            "phone": supplier.phone,
            "email": supplier.email,
            "address": supplier.address,
            "note": supplier.note,
            "is_active": supplier.is_active,
            "purchase_total": purchase_total,
            "outstanding_balance": outstanding,
            "created_at": supplier.created_at,
        })
    return results


def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
    supplier_data = data.model_dump()
    supplier_data["code"] = supplier_data["code"].strip()
    supplier_data["name"] = supplier_data["name"].strip()
    if not supplier_data["code"] or not supplier_data["name"]:
        raise ValueError("กรุณาระบุรหัสและชื่อบริษัท")
    supplier = Supplier(**supplier_data)
    db.add(supplier)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("รหัสบริษัทนี้มีอยู่ในระบบแล้ว")
    db.refresh(supplier)
    return supplier


def update_supplier(db: Session, supplier_id: int, data: SupplierUpdate) -> Optional[Supplier]:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if supplier is None:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field in ("code", "name"):
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].strip()
            if not update_data[field]:
                raise ValueError("รหัสและชื่อบริษัทไม่สามารถเว้นว่างได้")
    for key, value in update_data.items():
        setattr(supplier, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("รหัสบริษัทนี้มีอยู่ในระบบแล้ว")
    db.refresh(supplier)
    return supplier


def get_supplier(db: Session, supplier_id: int) -> Optional[Supplier]:
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def list_purchase_orders(db: Session, supplier_id: int):
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.items), joinedload(PurchaseOrder.payments), joinedload(PurchaseOrder.supplier))
        .filter(PurchaseOrder.supplier_id == supplier_id)
        .order_by(PurchaseOrder.created_at.desc())
        .all()
    )


def get_purchase_order(db: Session, order_id: int) -> Optional[PurchaseOrder]:
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.items), joinedload(PurchaseOrder.payments), joinedload(PurchaseOrder.supplier))
        .filter(PurchaseOrder.id == order_id)
        .first()
    )


def lock_purchase_order(db: Session, order_id: int) -> None:
    db.query(PurchaseOrder.id).filter(PurchaseOrder.id == order_id).with_for_update().first()


def create_purchase_order(db: Session, supplier_id: int, data: PurchaseOrderCreate, user_id: int) -> PurchaseOrder:
    supplier = get_supplier(db, supplier_id)
    if supplier is None or not supplier.is_active:
        raise ValueError("ไม่พบบริษัทผู้จำหน่าย หรือบริษัทถูกปิดใช้งาน")

    subtotal = Decimal("0")
    items = []
    for item_data in data.items:
        if item_data.category_id is not None:
            category = db.query(Category).filter(Category.id == item_data.category_id).first()
            if category is None:
                raise ValueError(f"ไม่พบสินค้า ID {item_data.category_id}")
            if not item_data.sku:
                item_data.sku = category.description or str(category.id)
        if not item_data.name.strip():
            raise ValueError("ชื่อสินค้าไม่สามารถเว้นว่างได้")
        unit_price = money(item_data.unit_price)
        line_total = money(unit_price * item_data.quantity)
        subtotal += line_total
        items.append(PurchaseOrderItem(
            category_id=item_data.category_id,
            sku=item_data.sku,
            name=item_data.name.strip(),
            quantity=item_data.quantity,
            unit_price=unit_price,
            line_total=line_total,
        ))

    subtotal = money(subtotal)
    discount = money(data.discount_amount)
    if discount > subtotal:
        raise ValueError("ส่วนลดต้องไม่มากกว่ายอดรวมสินค้า")
    tax_base = subtotal - discount
    tax_amount = money(tax_base * data.tax_rate / Decimal("100"))
    total = money(tax_base + tax_amount)
    if data.initial_payment > total:
        raise ValueError("ยอดชำระเริ่มต้นต้องไม่เกินยอดสั่งซื้อ")

    order = PurchaseOrder(
        purchase_no=f"PO-TEMP-{uuid4().hex}",
        supplier_id=supplier_id,
        order_date=data.order_date,
        status="ordered",
        subtotal=subtotal,
        discount_amount=discount,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total_amount=total,
        note=data.note,
        created_by=user_id,
        items=items,
    )
    db.add(order)
    db.flush()
    order.purchase_no = f"PO-{date.today():%Y%m%d}-{order.id:06d}"
    if data.initial_payment > 0:
        order.payments.append(PurchasePayment(
            amount=money(data.initial_payment),
            note="ชำระเงินเริ่มต้นพร้อมสร้างใบสั่งซื้อ",
            created_by=user_id,
        ))
    db.commit()
    return get_purchase_order(db, order.id)


def receive_purchase_items(db: Session, order_id: int, data: PurchaseReceiveCreate) -> Optional[PurchaseOrder]:
    lock_purchase_order(db, order_id)
    order = get_purchase_order(db, order_id)
    if order is None:
        return None
    if order.status == "cancelled":
        raise ValueError("ไม่สามารถรับสินค้าจากใบสั่งซื้อที่ยกเลิกแล้ว")

    order_items = {item.id: item for item in order.items}
    quantities = {}
    for received in data.items:
        quantities[received.item_id] = quantities.get(received.item_id, 0) + received.quantity
    for item_id, quantity in quantities.items():
        item = order_items.get(item_id)
        if item is None:
            raise ValueError(f"รายการสินค้า {item_id} ไม่อยู่ในใบสั่งซื้อนี้")
        if item.received_quantity + quantity > item.quantity:
            raise ValueError(f"จำนวนรับสินค้า {item.name} เกินจำนวนที่สั่ง")

    for item_id, quantity in quantities.items():
        item = order_items[item_id]
        item.received_quantity += quantity
        if item.category_id is not None:
            category = db.query(Category).filter(Category.id == item.category_id).with_for_update().first()
            if category is not None:
                category.stock_quantity += quantity
                category.stock_tracked = True

    fully_received = all(item.received_quantity >= item.quantity for item in order.items)
    order.status = "received" if fully_received else "partially_received"
    db.commit()
    return get_purchase_order(db, order_id)


def add_purchase_payment(db: Session, order_id: int, data: PurchasePaymentCreate, user_id: int) -> Optional[PurchaseOrder]:
    lock_purchase_order(db, order_id)
    order = get_purchase_order(db, order_id)
    if order is None:
        return None
    if order.status == "cancelled":
        raise ValueError("ไม่สามารถชำระเงินให้ใบสั่งซื้อที่ยกเลิกแล้ว")
    paid = sum((Decimal(payment.amount) for payment in order.payments), Decimal("0"))
    amount = money(data.amount)
    if paid + amount > Decimal(order.total_amount):
        raise ValueError("ยอดชำระเกินยอดค้างชำระ")
    order.payments.append(PurchasePayment(
        amount=amount,
        note=data.note,
        created_by=user_id,
    ))
    db.commit()
    return get_purchase_order(db, order_id)


def cancel_purchase_order(db: Session, order_id: int) -> Optional[PurchaseOrder]:
    lock_purchase_order(db, order_id)
    order = get_purchase_order(db, order_id)
    if order is None:
        return None
    if any(item.received_quantity > 0 for item in order.items):
        raise ValueError("ยกเลิกใบสั่งซื้อไม่ได้ เนื่องจากมีการรับสินค้าแล้ว")
    if any(payment.amount > 0 for payment in order.payments):
        raise ValueError("ยกเลิกใบสั่งซื้อไม่ได้ เนื่องจากมีการชำระเงินแล้ว")
    order.status = "cancelled"
    db.commit()
    return get_purchase_order(db, order_id)
