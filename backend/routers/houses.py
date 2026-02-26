from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from utils.auth import get_current_admin
import models
import schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.HouseOut], summary="List all houses")
def list_houses(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.House)
    if not include_inactive:
        query = query.filter(models.House.is_active == True)
    return query.order_by(models.House.name).all()


@router.get("/with-tenants", summary="List houses with current tenant info")
def list_houses_with_tenants(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    houses = db.query(models.House).filter(models.House.is_active == True).order_by(models.House.name).all()
    result = []
    for h in houses:
        active_tenant = next(
            (t for t in h.tenants if t.is_active), None
        )
        result.append({
            "id": h.id,
            "name": h.name,
            "house_type": h.house_type,
            "rent_amount": h.rent_amount,
            "floor": h.floor,
            "is_occupied": h.is_occupied,
            "is_active": h.is_active,
            "created_at": h.created_at,
            "current_tenant": active_tenant.full_name if active_tenant else None,
            "tenant_id": active_tenant.id if active_tenant else None,
        })
    return result


@router.get("/{house_id}", response_model=schemas.HouseOut, summary="Get a single house")
def get_house(
    house_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    house = db.query(models.House).filter(models.House.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    return house


@router.post("/", response_model=schemas.HouseOut, status_code=201, summary="Create a house")
def create_house(
    data: schemas.HouseCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    if db.query(models.House).filter(models.House.name == data.name).first():
        raise HTTPException(status_code=400, detail=f"House '{data.name}' already exists")

    house = models.House(**data.model_dump())
    db.add(house)
    db.commit()
    db.refresh(house)
    return house


@router.put("/{house_id}", response_model=schemas.HouseOut, summary="Update a house")
def update_house(
    house_id: int,
    data: schemas.HouseUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    house = db.query(models.House).filter(models.House.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(house, field, value)
    db.commit()
    db.refresh(house)
    return house


@router.delete("/{house_id}", summary="Delete a house")
def delete_house(
    house_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    house = db.query(models.House).filter(models.House.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    if house.is_occupied:
        raise HTTPException(status_code=400, detail="Cannot delete an occupied house. Remove the tenant first.")
    db.delete(house)
    db.commit()
    return {"message": f"House '{house.name}' deleted successfully"}
