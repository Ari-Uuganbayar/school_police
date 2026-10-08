from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, require_role
from app.models import Crossing, School, UserRole
from app.schemas import CrossingCreate, CrossingOut, SchoolCreate, SchoolOut

router = APIRouter(tags=["schools"])
admin_only = Depends(require_role(UserRole.admin))


@router.get("/schools", response_model=list[SchoolOut])
async def list_schools(db: DB, q: str | None = None):
    stmt = select(School).order_by(School.name)
    if q:
        stmt = stmt.where(School.name.ilike(f"%{q}%"))
    return (await db.scalars(stmt)).all()


@router.post("/schools", response_model=SchoolOut, status_code=201, dependencies=[admin_only])
async def create_school(data: SchoolCreate, db: DB):
    school = School(**data.model_dump())
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return school


@router.get("/crossings", response_model=list[CrossingOut])
async def list_crossings(db: DB, school_id: int | None = None):
    stmt = select(Crossing).options(selectinload(Crossing.school)).order_by(Crossing.name)
    if school_id:
        stmt = stmt.where(Crossing.school_id == school_id)
    return (await db.scalars(stmt)).all()


@router.get("/crossings/{crossing_id}", response_model=CrossingOut)
async def get_crossing(crossing_id: int, db: DB):
    crossing = await db.scalar(
        select(Crossing).options(selectinload(Crossing.school)).where(Crossing.id == crossing_id)
    )
    if not crossing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Гарц олдсонгүй")
    return crossing


@router.post("/crossings", response_model=CrossingOut, status_code=201, dependencies=[admin_only])
async def create_crossing(data: CrossingCreate, db: DB):
    if not await db.get(School, data.school_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сургууль олдсонгүй")
    crossing = Crossing(**data.model_dump())
    db.add(crossing)
    await db.commit()
    return await get_crossing(crossing.id, db)
