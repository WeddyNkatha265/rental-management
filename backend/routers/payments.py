from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import date, datetime
from database import get_db
from utils.auth import get_current_admin
from services.email_service import send_payment_confirmation, send_payment_reminder
import models
import schemas

router = APIRouter()


@router.get("/dashboard", response_model=schemas.DashboardStats, summary="Get dashboard statistics")
def get_dashboard(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    today = date.today()
    current_month = today.strftime("%Y-%m")

    # Unit stats
    total_units = db.query(models.House).filter(models.House.is_active == True).count()
    occupied = db.query(models.House).filter(models.House.is_active == True, models.House.is_occupied == True).count()
    vacant = total_units - occupied

    # Rent stats
    occupied_houses = db.query(models.House).filter(models.House.is_active == True, models.House.is_occupied == True).all()
    expected_rent = sum(h.rent_amount for h in occupied_houses)

    received = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.month_paid_for == current_month
    ).scalar() or 0.0

    outstanding = expected_rent - received

    # Overdue tenants: active tenants who haven't paid this month
    active_tenants = db.query(models.Tenant).filter(models.Tenant.is_active == True, models.Tenant.house_id.isnot(None)).all()
    paid_tenant_ids_this_month = {
        p.tenant_id for p in db.query(models.Payment).filter(models.Payment.month_paid_for == current_month).all()
    }
    overdue_count = sum(1 for t in active_tenants if t.id not in paid_tenant_ids_this_month)

    # Monthly revenue — last 7 months
    monthly_revenue = []
    for i in range(6, -1, -1):
        month_date = date(today.year, today.month, 1)
        # Go back i months
        month_num = today.month - i
        year = today.year
        while month_num <= 0:
            month_num += 12
            year -= 1
        month_str = f"{year}-{month_num:02d}"
        month_label = datetime.strptime(month_str, "%Y-%m").strftime("%b")
        total = db.query(func.sum(models.Payment.amount_paid)).filter(
            models.Payment.month_paid_for == month_str
        ).scalar() or 0.0
        monthly_revenue.append(schemas.MonthlyRevenue(month=month_label, amount=total))

    # Recent payments (last 6)
    recent_raw = (
        db.query(models.Payment)
        .order_by(models.Payment.created_at.desc())
        .limit(6)
        .all()
    )
    recent_payments = [
        schemas.RecentPayment(
            id=p.id,
            tenant_name=p.tenant.full_name if p.tenant else "Unknown",
            house_name=p.house.name if p.house else "Unknown",
            amount=p.amount_paid,
            method=p.payment_method,
            date=p.payment_date,
        )
        for p in recent_raw
    ]

    # Top houses by revenue this month
    top_houses = []
    for h in occupied_houses:
        house_total = db.query(func.sum(models.Payment.amount_paid)).filter(
            models.Payment.house_id == h.id,
            models.Payment.month_paid_for == current_month,
        ).scalar() or 0.0
        top_houses.append({"name": h.name, "expected": h.rent_amount, "received": house_total})
    top_houses.sort(key=lambda x: x["received"], reverse=True)

    return schemas.DashboardStats(
        total_units=total_units,
        occupied_units=occupied,
        vacant_units=vacant,
        total_expected_rent=expected_rent,
        total_received_rent=received,
        outstanding_rent=outstanding,
        overdue_tenants=overdue_count,
        occupancy_rate=round((occupied / total_units * 100) if total_units > 0 else 0, 1),
        monthly_revenue=monthly_revenue,
        recent_payments=recent_payments,
        top_houses=top_houses[:5],
    )


@router.get("/", response_model=List[schemas.PaymentOut], summary="List all payments")
def list_payments(
    month: str = None,
    tenant_id: int = None,
    house_id: int = None,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.Payment)
    if month:
        query = query.filter(models.Payment.month_paid_for == month)
    if tenant_id:
        query = query.filter(models.Payment.tenant_id == tenant_id)
    if house_id:
        query = query.filter(models.Payment.house_id == house_id)
    return query.order_by(models.Payment.created_at.desc()).all()


@router.get("/{payment_id}", response_model=schemas.PaymentOut, summary="Get a single payment")
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=schemas.PaymentOut, status_code=201, summary="Record a payment")
def record_payment(
    data: schemas.PaymentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    # Validate tenant
    tenant = db.query(models.Tenant).filter(models.Tenant.id == data.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Validate house
    house = db.query(models.House).filter(models.House.id == data.house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")

    payment = models.Payment(
        tenant_id=data.tenant_id,
        house_id=data.house_id,
        amount_paid=data.amount_paid,
        payment_date=data.payment_date,
        month_paid_for=data.month_paid_for,
        payment_method=data.payment_method,
        reference_code=data.reference_code,
        notes=data.notes,
        email_sent=False,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Send confirmation email in background
    if data.send_email and tenant.email:
        background_tasks.add_task(
            send_payment_confirmation,
            tenant_email=tenant.email,
            tenant_name=tenant.full_name,
            amount=data.amount_paid,
            month_paid_for=data.month_paid_for,
            house_name=house.name,
            payment_method=data.payment_method,
            reference_code=data.reference_code,
            payment_date=data.payment_date,
        )
        payment.email_sent = True
        db.commit()

    return payment


@router.put("/{payment_id}", response_model=schemas.PaymentOut, summary="Update a payment")
def update_payment(
    payment_id: int,
    data: schemas.PaymentUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", summary="Delete a payment")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted"}


@router.post("/send-reminders", summary="Send payment reminders to all unpaid tenants")
def send_reminders(
    month: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    """Send email reminders to all tenants who haven't paid for the given month."""
    paid_tenant_ids = {
        p.tenant_id for p in db.query(models.Payment).filter(models.Payment.month_paid_for == month).all()
    }

    active_tenants = (
        db.query(models.Tenant)
        .filter(models.Tenant.is_active == True, models.Tenant.house_id.isnot(None))
        .all()
    )

    sent_count = 0
    skipped_count = 0

    for tenant in active_tenants:
        if tenant.id not in paid_tenant_ids and tenant.email and tenant.house:
            background_tasks.add_task(
                send_payment_reminder,
                tenant_email=tenant.email,
                tenant_name=tenant.full_name,
                amount=tenant.house.rent_amount,
                month=month,
                house_name=tenant.house.name,
            )
            sent_count += 1
        else:
            skipped_count += 1

    return {
        "message": f"Reminders queued for {sent_count} tenants",
        "sent": sent_count,
        "skipped": skipped_count,
        "month": month,
    }
