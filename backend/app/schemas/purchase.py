from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SupplierCreate(BaseModel):
    code: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=150)
    address: Optional[str] = None
    note: Optional[str] = None


class SupplierUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=30)
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=150)
    address: Optional[str] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(BaseModel):
    id: int
    code: str
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    note: Optional[str]
    is_active: bool
    purchase_total: Decimal
    outstanding_balance: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderItemCreate(BaseModel):
    category_id: Optional[int] = None
    sku: Optional[str] = Field(default=None, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class PurchaseOrderCreate(BaseModel):
    order_date: date
    items: List[PurchaseOrderItemCreate] = Field(min_length=1)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100, max_digits=5, decimal_places=2)
    initial_payment: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    note: Optional[str] = None


class PurchaseOrderItemResponse(BaseModel):
    id: int
    category_id: Optional[int]
    sku: Optional[str]
    name: str
    quantity: int
    received_quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class PurchasePaymentResponse(BaseModel):
    id: int
    amount: Decimal
    note: Optional[str]
    paid_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderResponse(BaseModel):
    id: int
    purchase_no: str
    supplier_id: int
    supplier_name: str
    order_date: date
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    outstanding_balance: Decimal
    note: Optional[str]
    created_at: datetime
    items: List[PurchaseOrderItemResponse]
    payments: List[PurchasePaymentResponse]


class ReceiveItemQuantity(BaseModel):
    item_id: int
    quantity: int = Field(gt=0)


class PurchaseReceiveCreate(BaseModel):
    items: List[ReceiveItemQuantity] = Field(min_length=1)


class PurchasePaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    note: Optional[str] = None
