from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from utils.auth import get_current_admin
from services.email_service import send_welcome_email
import models
import schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.TenantOut], summary="List all tenants")
def list_tenants(
    active_only: bool = True,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.Tenant)
    if active_only:
        query = query.filter(models.Tenant.is_active == True)
    return query.order_by(models.Tenant.full_name).all()


@router.get("/{tenant_id}", response_model=schemas.TenantOut, summary="Get tenant details (private)")
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.post("/", response_model=schemas.TenantOut, status_code=201, summary="Add a tenant")
def create_tenant(
    data: schemas.TenantCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    # Check ID number uniqueness
    if data.id_number:
        existing = db.query(models.Tenant).filter(models.Tenant.id_number == data.id_number).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Tenant with ID '{data.id_number}' already exists")

    # Validate house
    house = None
    if data.house_id:
        house = db.query(models.House).filter(models.House.id == data.house_id).first()
        if not house:
            raise HTTPException(status_code=404, detail="House not found")
        if house.is_occupied:
            raise HTTPException(status_code=400, detail=f"House '{house.name}' is already occupied")

    tenant = models.Tenant(**data.model_dump())
    db.add(tenant)

    if house:
        house.is_occupied = True

    db.commit()
    db.refresh(tenant)

    # Send welcome email in background
    if tenant.email and house:
        background_tasks.add_task(
            send_welcome_email,
            tenant_email=tenant.email,
            tenant_name=tenant.full_name,
            house_name=house.name,
            rent_amount=house.rent_amount,
            move_in_date=tenant.move_in_date,
        )

    return tenant


@router.put("/{tenant_id}", response_model=schemas.TenantOut, summary="Update tenant info")
def update_tenant(
    tenant_id: int,
    data: schemas.TenantUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Handle house reassignment
    if data.house_id is not None and data.house_id != tenant.house_id:
        new_house = db.query(models.House).filter(models.House.id == data.house_id).first()
        if not new_house:
            raise HTTPException(status_code=404, detail="New house not found")
        if new_house.is_occupied:
            raise HTTPException(status_code=400, detail=f"House '{new_house.name}' is already occupied")

        # Free old house
        if tenant.house_id:
            old_house = db.query(models.House).filter(models.House.id == tenant.house_id).first()
            if old_house:
                old_house.is_occupied = False
        new_house.is_occupied = True

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)

    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", summary="Remove (deactivate) a tenant")
def remove_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.is_active = False

    # Free the house
    if tenant.house_id:
        house = db.query(models.House).filter(models.House.id == tenant.house_id).first()
        if house:
            house.is_occupied = False

    db.commit()
    return {"message": f"Tenant '{tenant.full_name}' removed successfully"}


@router.get("/{tenant_id}/payments", summary="Get all payments for a tenant")
def get_tenant_payments(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    payments = db.query(models.Payment).filter(models.Payment.tenant_id == tenant_id).order_by(models.Payment.created_at.desc()).all()
    total_paid = sum(p.amount_paid for p in payments)
    return {
        "tenant": tenant.full_name,
        "house": tenant.house.name if tenant.house else None,
        "total_paid": total_paid,
        "payment_count": len(payments),
        "payments": payments,
    }
