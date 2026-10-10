import json
from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..models.employee import EmployeeWage, SaleRecord
from ..models.user import User
from ..schemas.employee import (
    EmployeeWageCreate, EmployeeWageUpdate,
    SaleRecordCreate, EmployeeWithWage, SaleRecordResponse
)


# ─── Employee Wage ────────────────────────────────────────────────────────────

def get_all_employees_with_wage(db: Session, target_date: Optional[date] = None) -> List[EmployeeWithWage]:
    """ดึงลูกจ้างทุกคนพร้อม wage และสถิติการขายในวันที่กำหนด"""
    if target_date is None:
        target_date = date.today()

    employees = db.query(User).filter(User.role == "employee").order_by(User.id.asc()).all()

    result = []
    for emp in employees:
        # ดึง wage
        wage_record = db.query(EmployeeWage).filter(EmployeeWage.user_id == emp.id).first()
        daily_wage = float(wage_record.daily_wage) if wage_record else 0.0
        wage_note = wage_record.note if wage_record else None

        # สถิติการขายวันนั้น
        sales_stats = db.query(
            func.count(SaleRecord.id).label("count"),
            func.coalesce(func.sum(SaleRecord.total_amount), 0).label("total")
        ).filter(
            SaleRecord.employee_id == emp.id,
            SaleRecord.sale_date == target_date
        ).first()

        result.append(EmployeeWithWage(
            id=emp.id,
            username=emp.username,
            full_name=emp.full_name,
            role=emp.role,
            is_active=emp.is_active,
            daily_wage=daily_wage,
            wage_note=wage_note,
            today_sales_count=sales_stats.count if sales_stats else 0,
            today_sales_total=float(sales_stats.total) if sales_stats else 0.0,
        ))

    return result


def get_wage_by_user(db: Session, user_id: int) -> Optional[EmployeeWage]:
    return db.query(EmployeeWage).filter(EmployeeWage.user_id == user_id).first()


def upsert_wage(db: Session, user_id: int, wage_data: EmployeeWageUpdate, updater_id: int) -> EmployeeWage:
    """สร้างหรืออัปเดต wage ของลูกจ้าง"""
    existing = get_wage_by_user(db, user_id)
    if existing:
        if wage_data.daily_wage is not None:
            existing.daily_wage = wage_data.daily_wage
        if wage_data.note is not None:
            existing.note = wage_data.note
        existing.updated_by = updater_id
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_wage = EmployeeWage(
            user_id=user_id,
            daily_wage=wage_data.daily_wage or 0.0,
            note=wage_data.note,
            updated_by=updater_id
        )
        db.add(new_wage)
        db.commit()
        db.refresh(new_wage)
        return new_wage


# ─── Sale Record ─────────────────────────────────────────────────────────────

def create_sale_record(db: Session, sale_data: SaleRecordCreate) -> SaleRecord:
    items_json_str = json.dumps([item.model_dump() for item in sale_data.items], ensure_ascii=False)
    record = SaleRecord(
        employee_id=sale_data.employee_id,
        sale_date=sale_data.sale_date or date.today(),
        license_plate=sale_data.license_plate,
        vehicle_model=sale_data.vehicle_model,
        customer_name=sale_data.customer_name,
        note=sale_data.note,
        payment_method=sale_data.payment_method,
        total_amount=sale_data.total_amount,
        items_json=items_json_str,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_sale_records(
    db: Session,
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[SaleRecordResponse], int, float]:
    query = db.query(SaleRecord)

    if employee_id:
        query = query.filter(SaleRecord.employee_id == employee_id)
    if start_date:
        query = query.filter(SaleRecord.sale_date >= start_date)
    if end_date:
        query = query.filter(SaleRecord.sale_date <= end_date)

    total = query.count()
    total_amount_result = query.with_entities(
        func.coalesce(func.sum(SaleRecord.total_amount), 0)
    ).scalar()
    total_amount = float(total_amount_result)

    records = query.order_by(SaleRecord.created_at.desc()).offset(skip).limit(limit).all()

    # map employee_name
    result = []
    for r in records:
        emp = db.query(User).filter(User.id == r.employee_id).first()
        resp = SaleRecordResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=emp.full_name if emp else "",
            sale_date=r.sale_date,
            license_plate=r.license_plate,
            vehicle_model=r.vehicle_model,
            customer_name=r.customer_name,
            note=r.note,
            payment_method=r.payment_method,
            total_amount=float(r.total_amount),
            items_json=r.items_json,
            created_at=r.created_at,
        )
        result.append(resp)

    return result, total, total_amount

