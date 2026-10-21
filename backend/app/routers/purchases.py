from fastapi import APIRouter, Depends, HTTPException, Query, status
from decimal import Decimal
from sqlalchemy.orm import Session
from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.user import User
from ..schemas.purchase import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchasePaymentCreate,
    PurchaseReceiveCreate,
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from ..services import purchase_service

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


def serialize_order(order):
    paid = sum((Decimal(payment.amount) for payment in order.payments), Decimal("0"))
    return {
        "id": order.id,
        "purchase_no": order.purchase_no,
        "supplier_id": order.supplier_id,
        "supplier_name": order.supplier.name,
        "order_date": order.order_date,
        "status": order.status,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "tax_rate": order.tax_rate,
        "tax_amount": order.tax_amount,
        "total_amount": order.total_amount,
        "paid_amount": paid,
        "outstanding_balance": max(Decimal(order.total_amount) - paid, Decimal("0")),
        "note": order.note,
        "created_at": order.created_at,
        "items": order.items,
        "payments": order.payments,
    }


@router.get("/suppliers", response_model=list[SupplierResponse])
def read_suppliers(
    search: str = Query(default="", max_length=100),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return purchase_service.list_suppliers(db, search=search, include_inactive=include_inactive)


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        supplier = purchase_service.create_supplier(db, data)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    result = next(item for item in purchase_service.list_suppliers(db, include_inactive=True) if item["id"] == supplier.id)
    return result


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        supplier = purchase_service.update_supplier(db, supplier_id, data)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if supplier is None:
        raise HTTPException(status_code=404, detail="ไม่พบบริษัทผู้จำหน่าย")
    return next(item for item in purchase_service.list_suppliers(db, include_inactive=True) if item["id"] == supplier.id)


@router.get("/suppliers/{supplier_id}/orders", response_model=list[PurchaseOrderResponse])
def read_purchase_orders(
    supplier_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if purchase_service.get_supplier(db, supplier_id) is None:
        raise HTTPException(status_code=404, detail="ไม่พบบริษัทผู้จำหน่าย")
    return [serialize_order(order) for order in purchase_service.list_purchase_orders(db, supplier_id)]


@router.post("/suppliers/{supplier_id}/orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    supplier_id: int,
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = purchase_service.create_purchase_order(db, supplier_id, data, current_user.id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return serialize_order(order)


@router.post("/orders/{order_id}/receive", response_model=PurchaseOrderResponse)
def receive_purchase_items(
    order_id: int,
    data: PurchaseReceiveCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        order = purchase_service.receive_purchase_items(db, order_id, data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if order is None:
        raise HTTPException(status_code=404, detail="ไม่พบใบสั่งซื้อ")
    return serialize_order(order)


@router.post("/orders/{order_id}/payments", response_model=PurchaseOrderResponse)
def add_purchase_payment(
    order_id: int,
    data: PurchasePaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = purchase_service.add_purchase_payment(db, order_id, data, current_user.id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if order is None:
        raise HTTPException(status_code=404, detail="ไม่พบใบสั่งซื้อ")
    return serialize_order(order)


@router.post("/orders/{order_id}/cancel", response_model=PurchaseOrderResponse)
def cancel_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        order = purchase_service.cancel_purchase_order(db, order_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if order is None:
        raise HTTPException(status_code=404, detail="ไม่พบใบสั่งซื้อ")
    return serialize_order(order)
