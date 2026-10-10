from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user, require_owner, get_password_hash
from ..models.user import User
from ..models.employee import EmployeeWage, SaleRecord
from ..schemas.employee import (
    EmployeeWithWage, EmployeeWageUpdate, EmployeeWageResponse,
    EmployeeUpdate, SaleRecordCreate, SaleRecordResponse, SaleRecordListResponse
)
from ..schemas.user import UserResponse
from ..services.employee_service import (
    get_all_employees_with_wage,
    upsert_wage,
    create_sale_record,
    get_sale_records,
)

router = APIRouter(prefix="/api/employees", tags=["employees"])


# ─── ดึงรายชื่อลูกจ้างทั้งหมด (พร้อม wage + สถิติวันนั้น) — Owner only ──────
@router.get("/", response_model=List[EmployeeWithWage])
def list_employees(
    target_date: Optional[date] = Query(None, description="วันที่ดูสถิติ (default: วันนี้)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    return get_all_employees_with_wage(db, target_date)


# ─── ดึงรายชื่อลูกจ้างสำหรับ dropdown ในหน้า Payment — ทุกคนเข้าได้ ────────
@router.get("/list", response_model=List[UserResponse])
def list_employees_for_dropdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employees = db.query(User).filter(User.is_active == True).order_by(User.full_name).all()
    return employees


# ─── ตั้งค่า / แก้ไขค่าแรงลูกจ้าง — Owner only ──────────────────────────────
@router.put("/{user_id}/wage", response_model=EmployeeWageResponse)
def set_employee_wage(
    user_id: int,
    wage_data: EmployeeWageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    # ตรวจสอบว่า user มีอยู่จริง
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return upsert_wage(db, user_id, wage_data, current_user.id)


# ─── แก้ไขข้อมูลลูกจ้าง (ชื่อ, username, รหัสผ่าน, สถานะ, ค่าแรง) — Owner only ───
@router.put("/{user_id}", response_model=EmployeeWithWage)
def update_employee(
    user_id: int,
    emp_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found")
    if target.role != "employee":
        raise HTTPException(status_code=400, detail="สามารถแก้ไขได้เฉพาะบัญชีลูกจ้างเท่านั้น")

    # ตรวจสอบ username ซ้ำ (หากเปลี่ยน)
    if emp_data.username and emp_data.username != target.username:
        existing = db.query(User).filter(User.username == emp_data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="ชื่อผู้ใช้ (Username) นี้ถูกใช้งานแล้ว")
        target.username = emp_data.username

    if emp_data.full_name is not None:
        target.full_name = emp_data.full_name

    if emp_data.password:
        target.password_hash = get_password_hash(emp_data.password)

    if emp_data.is_active is not None:
        target.is_active = emp_data.is_active

    db.commit()
    db.refresh(target)

    # อัปเดตค่าแรง (ถ้าส่งมา)
    if emp_data.daily_wage is not None or emp_data.wage_note is not None:
        upsert_wage(
            db,
            user_id,
            EmployeeWageUpdate(daily_wage=emp_data.daily_wage, note=emp_data.wage_note),
            current_user.id,
        )

    wage_rec = db.query(EmployeeWage).filter(EmployeeWage.user_id == user_id).first()
    return EmployeeWithWage(
        id=target.id,
        username=target.username,
        full_name=target.full_name,
        role=target.role,
        is_active=target.is_active,
        daily_wage=float(wage_rec.daily_wage) if wage_rec else 0.0,
        wage_note=wage_rec.note if wage_rec else None,
        today_sales_count=0,
        today_sales_total=0.0,
    )


# ─── ลบลูกจ้าง — Owner only ──────────────────────────────────────────────────
@router.delete("/{user_id}")
def delete_employee(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found")
    if target.role != "employee":
        raise HTTPException(status_code=400, detail="ไม่อนุญาตให้ลบบัญชีเจ้าของร้าน")

    # ล้าง foreign key ที่เกี่ยวข้อง
    db.query(EmployeeWage).filter(EmployeeWage.user_id == user_id).delete()
    db.query(EmployeeWage).filter(EmployeeWage.updated_by == user_id).update({EmployeeWage.updated_by: None})
    db.query(SaleRecord).filter(SaleRecord.employee_id == user_id).delete()

    db.delete(target)
    db.commit()
    return {"message": "ลบพนักงานสำเร็จเรียบร้อย"}


# ─── บันทึกประวัติการขาย (ชำระเงินสำเร็จ) — ทุกคน Login แล้วทำได้ ─────────
@router.post("/sales", response_model=SaleRecordResponse)
def record_sale(
    sale_data: SaleRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = create_sale_record(db, sale_data)
    # map employee_name
    emp = db.query(User).filter(User.id == record.employee_id).first()
    return SaleRecordResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=emp.full_name if emp else "",
        sale_date=record.sale_date,
        license_plate=record.license_plate,
        vehicle_model=record.vehicle_model,
        customer_name=record.customer_name,
        note=record.note,
        payment_method=record.payment_method,
        total_amount=float(record.total_amount),
        items_json=record.items_json,
        created_at=record.created_at,
    )


# ─── ดูประวัติการขาย — Owner ดูของทุกคนได้, Employee ดูของตัวเองได้ ─────────
@router.get("/sales", response_model=SaleRecordListResponse)
def get_sales_history(
    employee_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Employee ดูได้เฉพาะของตัวเอง
    if current_user.role == "employee":
        employee_id = current_user.id

    skip = (page - 1) * per_page
    records, total, total_amount = get_sale_records(
        db, employee_id=employee_id,
        start_date=start_date, end_date=end_date,
        skip=skip, limit=per_page
    )
    return SaleRecordListResponse(records=records, total=total, total_amount=total_amount)

