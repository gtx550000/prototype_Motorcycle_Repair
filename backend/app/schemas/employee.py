from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any
from datetime import datetime, date


# ─── Employee Wage ────────────────────────────────────────────────────────────

class EmployeeWageBase(BaseModel):
    daily_wage: float = 0.0
    note: Optional[str] = None


class EmployeeWageCreate(EmployeeWageBase):
    user_id: int


class EmployeeWageUpdate(BaseModel):
    daily_wage: Optional[float] = None
    note: Optional[str] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    daily_wage: Optional[float] = None
    wage_note: Optional[str] = None


class EmployeeWageResponse(EmployeeWageBase):
    id: int
    user_id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmployeeWithWage(BaseModel):
    """รวม user + wage info + สถิติประจำวัน"""
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    daily_wage: float
    wage_note: Optional[str] = None
    today_sales_count: int = 0
    today_sales_total: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ─── Sale Record ─────────────────────────────────────────────────────────────

class SaleItemSchema(BaseModel):
    id: int = Field(gt=0)
    name: str
    name_en: Optional[str] = None
    icon: Optional[str] = None
    price: float = Field(ge=0)
    qty: int = Field(gt=0)


class SaleRecordCreate(BaseModel):
    employee_id: int
    sale_date: Optional[date] = None
    license_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    customer_name: Optional[str] = None
    note: Optional[str] = None
    payment_method: str
    total_amount: float = Field(ge=0)
    items: List[SaleItemSchema] = []


class SaleRecordResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str = ""
    sale_date: date
    license_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    customer_name: Optional[str] = None
    note: Optional[str] = None
    payment_method: str
    total_amount: float
    items_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SaleRecordListResponse(BaseModel):
    records: List[SaleRecordResponse]
    total: int
    total_amount: float


class ItemSaleStat(BaseModel):
    item_id: int
    item_name: str
    icon: Optional[str] = "📦"
    price: float
    total_qty: int
    total_amount: float


class EmployeeSaleStat(BaseModel):
    employee_id: int
    employee_name: str
    username: str
    total_revenue: float
    total_bills: int
    total_items_sold: int
    items_breakdown: List[ItemSaleStat] = []


class SalesReportResponse(BaseModel):
    start_date: date
    end_date: date
    total_revenue: float
    total_bills: int
    total_items_sold: int
    employees_summary: List[EmployeeSaleStat] = []
    top_items: List[ItemSaleStat] = []
    records: List[SaleRecordResponse] = []
