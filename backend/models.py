from sqlalchemy import (
    Column, Integer, String, Float, Date, Boolean,
    ForeignKey, DateTime, Text, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class HouseType(str, enum.Enum):
    bedsitter = "bedsitter"
    single_room = "single_room"


class PaymentMethod(str, enum.Enum):
    mpesa = "mpesa"
    cash = "cash"
    bank = "bank"


class House(Base):
    __tablename__ = "houses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)        # e.g. "Bedsitter B1"
    house_type = Column(String(50), nullable=False)                 # bedsitter | single_room
    rent_amount = Column(Float, nullable=False)
    floor = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    is_occupied = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tenants = relationship("Tenant", back_populates="house")
    payments = relationship("Payment", back_populates="house")


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    id_number = Column(String(50), unique=True, nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=True)
    move_in_date = Column(Date, nullable=True)
    move_out_date = Column(Date, nullable=True)
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    occupation = Column(String(100), nullable=True)
    # Secret/private notes — only visible when authenticated
    private_notes = Column(Text, nullable=True)
    deposit_paid = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    house = relationship("House", back_populates="tenants")
    payments = relationship("Payment", back_populates="tenant")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=False)
    amount_paid = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    month_paid_for = Column(String(7), nullable=False)          # format: "2025-02"
    payment_method = Column(String(20), nullable=False)          # mpesa | cash | bank
    reference_code = Column(String(100), nullable=True)          # M-Pesa code / bank ref
    notes = Column(Text, nullable=True)
    email_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="payments")
    house = relationship("House", back_populates="payments")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(200), unique=True, nullable=True)
    full_name = Column(String(200), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
