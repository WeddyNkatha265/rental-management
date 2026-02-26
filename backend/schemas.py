from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime


# ─── Auth Schemas ─────────────────────────────────────────────────────

class AdminCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    admin_name: str


# ─── House Schemas ────────────────────────────────────────────────────

class HouseCreate(BaseModel):
    name: str = Field(..., example="Bedsitter B1")
    house_type: str = Field(..., example="bedsitter")
    rent_amount: float = Field(..., gt=0, example=8000)
    floor: Optional[str] = None
    description: Optional[str] = None


class HouseUpdate(BaseModel):
    name: Optional[str] = None
    house_type: Optional[str] = None
    rent_amount: Optional[float] = None
    floor: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class HouseOut(BaseModel):
    id: int
    name: str
    house_type: str
    rent_amount: float
    floor: Optional[str]
    description: Optional[str]
    is_occupied: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class HouseWithTenant(HouseOut):
    current_tenant: Optional[str] = None


# ─── Tenant Schemas ───────────────────────────────────────────────────

class TenantCreate(BaseModel):
    full_name: str
    id_number: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    house_id: Optional[int] = None
    move_in_date: Optional[date] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    occupation: Optional[str] = None
    private_notes: Optional[str] = None
    deposit_paid: Optional[float] = 0.0


class TenantUpdate(BaseModel):
    full_name: Optional[str] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    house_id: Optional[int] = None
    move_in_date: Optional[date] = None
    move_out_date: Optional[date] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    occupation: Optional[str] = None
    private_notes: Optional[str] = None
    deposit_paid: Optional[float] = None
    is_active: Optional[bool] = None


class TenantOut(BaseModel):
    id: int
    full_name: str
    id_number: Optional[str]
    phone: str
    email: Optional[str]
    house_id: Optional[int]
    move_in_date: Optional[date]
    move_out_date: Optional[date]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    occupation: Optional[str]
    private_notes: Optional[str]
    deposit_paid: float
    is_active: bool
    created_at: datetime
    house: Optional[HouseOut] = None

    class Config:
        from_attributes = True


class TenantPublic(BaseModel):
    """Public tenant info — no private notes"""
    id: int
    full_name: str
    phone: str
    email: Optional[str]
    house_id: Optional[int]
    move_in_date: Optional[date]
    is_active: bool

    class Config:
        from_attributes = True


# ─── Payment Schemas ──────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    tenant_id: int
    house_id: int
    amount_paid: float = Field(..., gt=0)
    payment_date: date
    month_paid_for: str = Field(..., example="2025-02")
    payment_method: str = Field(..., example="mpesa")
    reference_code: Optional[str] = None
    notes: Optional[str] = None
    send_email: bool = True


class PaymentUpdate(BaseModel):
    amount_paid: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference_code: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    tenant_id: int
    house_id: int
    amount_paid: float
    payment_date: date
    month_paid_for: str
    payment_method: str
    reference_code: Optional[str]
    notes: Optional[str]
    email_sent: bool
    created_at: datetime
    tenant: Optional[TenantPublic] = None
    house: Optional[HouseOut] = None

    class Config:
        from_attributes = True


# ─── Dashboard Schemas ────────────────────────────────────────────────

class MonthlyRevenue(BaseModel):
    month: str
    amount: float


class RecentPayment(BaseModel):
    id: int
    tenant_name: str
    house_name: str
    amount: float
    method: str
    date: date


class DashboardStats(BaseModel):
    total_units: int
    occupied_units: int
    vacant_units: int
    total_expected_rent: float
    total_received_rent: float
    outstanding_rent: float
    overdue_tenants: int
    occupancy_rate: float
    monthly_revenue: List[MonthlyRevenue]
    recent_payments: List[RecentPayment]
    top_houses: List[dict]
