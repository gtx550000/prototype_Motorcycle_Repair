from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from ..database import Base


class EmployeeWage(Base):
    """ค่าแรงรายวันของลูกจ้างแต่ละคน"""
    __tablename__ = "employee_wages"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    daily_wage = Column(Numeric(10, 2), default=0.00, nullable=False)
    note = Column(String(255), nullable=True)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    updater = relationship("User", foreign_keys=[updated_by])


class SaleRecord(Base):
    """ประวัติการขายของลูกจ้างแต่ละบิล"""
    __tablename__ = "sale_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    employee_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    sale_date = Column(Date, default=date.today, nullable=False)

    # ข้อมูลรถ/ลูกค้า
    license_plate = Column(String(50), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    customer_name = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)

    # การชำระเงิน
    payment_method = Column(String(20), nullable=False)  # cash / transfer / card
    total_amount = Column(Numeric(10, 2), nullable=False)

    # Items (เก็บ JSON string)
    items_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("User", foreign_keys=[employee_id])

