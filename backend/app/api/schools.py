from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, require_role
from app.models import Crossing, School, Shift, UserRole
from app.schemas import CrossingCreate, CrossingOut, CrossingUpdate, SchoolCreate, SchoolOut, SchoolUpdate

router = APIRouter(tags=["schools"])
admin_only = Depends(require_role(UserRole.admin))


def _school_out(school: School, count: int) -> SchoolOut:
    out = SchoolOut.model_validate(school)
    out.crossing_count = count
    return out


async def _get_school(db, school_id: int) -> School:
    school = await db.get(School, school_id)
    if not school:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сургууль олдсонгүй")
    return school


async def _get_crossing(db, crossing_id: int) -> Crossing:
    crossing = await db.scalar(
        select(Crossing)
        .options(selectinload(Crossing.school))
        .execution_options(populate_existing=True)
        .where(Crossing.id == crossing_id)
    )
    if not crossing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Гарц олдсонгүй")
    return crossing


# ---------- Schools ----------
@router.get("/schools", response_model=list[SchoolOut])
async def list_schools(db: DB, q: str | None = None):
    count = func.count(Crossing.id)
    stmt = (
        select(School, count)
        .outerjoin(Crossing, Crossing.school_id == School.id)
        .group_by(School.id)
        .order_by(School.name)
    )
    if q:
        stmt = stmt.where(School.name.ilike(f"%{q}%"))
    rows = (await db.execute(stmt)).all()
    return [_school_out(s, c) for s, c in rows]


@router.get("/schools/{school_id}", response_model=SchoolOut)
async def get_school(school_id: int, db: DB):
    school = await _get_school(db, school_id)
    count = await db.scalar(select(func.count(Crossing.id)).where(Crossing.school_id == school_id))
    return _school_out(school, count or 0)


@router.post("/schools", response_model=SchoolOut, status_code=201, dependencies=[admin_only])
async def create_school(data: SchoolCreate, db: DB):
    school = School(**data.model_dump())
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return _school_out(school, 0)


@router.patch("/schools/{school_id}", response_model=SchoolOut, dependencies=[admin_only])
async def update_school(school_id: int, data: SchoolUpdate, db: DB):
    school = await _get_school(db, school_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(school, k, v)
    await db.commit()
    return await get_school(school_id, db)


@router.delete("/schools/{school_id}", status_code=204, dependencies=[admin_only])
async def delete_school(school_id: int, db: DB):
    school = await _get_school(db, school_id)
    has_shifts = await db.scalar(
        select(func.count(Shift.id)).join(Crossing, Shift.crossing_id == Crossing.id).where(Crossing.school_id == school_id)
    )
    if has_shifts:
        raise HTTPException(status.HTTP_409_CONFLICT, "Энэ сургуулийн гарцад ээлж бүртгэлтэй тул устгах боломжгүй")
    await db.delete(school)
    await db.commit()


# ---------- Crossings ----------
@router.get("/crossings", response_model=list[CrossingOut])
async def list_crossings(db: DB, school_id: int | None = None):
    stmt = select(Crossing).options(selectinload(Crossing.school)).order_by(Crossing.name)
    if school_id:
        stmt = stmt.where(Crossing.school_id == school_id)
    return (await db.scalars(stmt)).all()


@router.get("/crossings/{crossing_id}", response_model=CrossingOut)
async def get_crossing(crossing_id: int, db: DB):
    return await _get_crossing(db, crossing_id)


@router.post("/crossings", response_model=CrossingOut, status_code=201, dependencies=[admin_only])
async def create_crossing(data: CrossingCreate, db: DB):
    await _get_school(db, data.school_id)
    crossing = Crossing(**data.model_dump())
    db.add(crossing)
    await db.commit()
    return await _get_crossing(db, crossing.id)


@router.patch("/crossings/{crossing_id}", response_model=CrossingOut, dependencies=[admin_only])
async def update_crossing(crossing_id: int, data: CrossingUpdate, db: DB):
    crossing = await _get_crossing(db, crossing_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(crossing, k, v)
    await db.commit()
    return await _get_crossing(db, crossing_id)


@router.delete("/crossings/{crossing_id}", status_code=204, dependencies=[admin_only])
async def delete_crossing(crossing_id: int, db: DB):
    crossing = await _get_crossing(db, crossing_id)
    has_shifts = await db.scalar(select(func.count(Shift.id)).where(Shift.crossing_id == crossing_id))
    if has_shifts:
        raise HTTPException(status.HTTP_409_CONFLICT, "Энэ гарцад ээлж бүртгэлтэй тул устгах боломжгүй")
    await db.delete(crossing)
    await db.commit()
