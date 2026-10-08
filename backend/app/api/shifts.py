from datetime import date, datetime, timezone
from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser
from app.models import Crossing, Shift, ShiftStatus, UserRole
from app.schemas import CheckIn, ShiftCreate, ShiftOut, ShiftUpdate

router = APIRouter(prefix="/shifts", tags=["shifts"])

LOAD = (
    selectinload(Shift.crossing).selectinload(Crossing.school),
    selectinload(Shift.parent),
    selectinload(Shift.worker),
)


def distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine, метрээр"""
    r = 6_371_000
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


async def load_shift(db, shift_id: int) -> Shift:
    shift = await db.scalar(
        select(Shift).options(*LOAD).execution_options(populate_existing=True).where(Shift.id == shift_id)
    )
    if not shift:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ээлж олдсонгүй")
    return shift


@router.get("", response_model=list[ShiftOut])
async def list_shifts(
    db: DB,
    user: CurrentUser,
    status_: ShiftStatus | None = None,
    mine: bool = False,
    crossing_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    """Нээлттэй ээлжүүд (гүйцэтгэгчид) эсвэл өөрийн ээлжүүд (mine=true)."""
    stmt = select(Shift).options(*LOAD).order_by(Shift.shift_date, Shift.start_time)
    if mine:
        stmt = stmt.where((Shift.parent_id == user.id) | (Shift.worker_id == user.id))
    elif user.role != UserRole.admin:
        stmt = stmt.where(Shift.status == ShiftStatus.open, Shift.shift_date >= date.today())
    if status_:
        stmt = stmt.where(Shift.status == status_)
    if crossing_id:
        stmt = stmt.where(Shift.crossing_id == crossing_id)
    if date_from:
        stmt = stmt.where(Shift.shift_date >= date_from)
    if date_to:
        stmt = stmt.where(Shift.shift_date <= date_to)
    return (await db.scalars(stmt)).all()


@router.post("", response_model=ShiftOut, status_code=201)
async def create_shift(data: ShiftCreate, db: DB, user: CurrentUser):
    if user.role not in (UserRole.parent, UserRole.admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Зөвхөн эцэг эх ээлж үүсгэнэ")
    if not await db.get(Crossing, data.crossing_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Гарц олдсонгүй")
    if data.shift_date < date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Өнгөрсөн огноонд ээлж үүсгэх боломжгүй")
    shift = Shift(parent_id=user.id, **data.model_dump())
    db.add(shift)
    await db.commit()
    return await load_shift(db, shift.id)


@router.get("/{shift_id}", response_model=ShiftOut)
async def get_shift(shift_id: int, db: DB, user: CurrentUser):
    return await load_shift(db, shift_id)


@router.patch("/{shift_id}", response_model=ShiftOut)
async def update_shift(shift_id: int, data: ShiftUpdate, db: DB, user: CurrentUser):
    shift = await load_shift(db, shift_id)
    if shift.parent_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Зөвхөн үүсгэсэн хүн засна")
    if shift.status != ShiftStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Зөвхөн нээлттэй ээлжийг засах боломжтой")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(shift, k, v)
    await db.commit()
    return await load_shift(db, shift_id)


@router.post("/{shift_id}/accept", response_model=ShiftOut)
async def accept_shift(shift_id: int, db: DB, user: CurrentUser):
    """Гүйцэтгэгч ээлжийг авна."""
    if user.role != UserRole.worker:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Зөвхөн гүйцэтгэгч ээлж авна")
    shift = await load_shift(db, shift_id)
    if shift.status != ShiftStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ээлж нээлттэй биш байна")
    if shift.parent_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Өөрийн ээлжийг авах боломжгүй")
    shift.worker_id = user.id
    shift.status = ShiftStatus.accepted
    await db.commit()
    return await load_shift(db, shift_id)


@router.post("/{shift_id}/checkin", response_model=ShiftOut)
async def check_in(shift_id: int, data: CheckIn, db: DB, user: CurrentUser):
    """Гүйцэтгэгч гарц дээр ирснээ GPS-ээр баталгаажуулна."""
    shift = await load_shift(db, shift_id)
    if shift.worker_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Энэ ээлжийн гүйцэтгэгч биш")
    if shift.status != ShiftStatus.accepted:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ээлжийн төлөв буруу")
    d = distance_m(data.lat, data.lng, shift.crossing.lat, shift.crossing.lng)
    if d > shift.crossing.checkin_radius_m:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Гарцаас {int(d)} м зайтай байна, ойртож check-in хийнэ үү"
        )
    shift.status = ShiftStatus.in_progress
    shift.checked_in_at = datetime.now(timezone.utc)
    shift.checkin_lat, shift.checkin_lng = data.lat, data.lng
    await db.commit()
    return await load_shift(db, shift_id)


@router.post("/{shift_id}/checkout", response_model=ShiftOut)
async def check_out(shift_id: int, db: DB, user: CurrentUser):
    shift = await load_shift(db, shift_id)
    if shift.worker_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Энэ ээлжийн гүйцэтгэгч биш")
    if shift.status != ShiftStatus.in_progress:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ээлж эхлээгүй байна")
    shift.status = ShiftStatus.completed
    shift.checked_out_at = datetime.now(timezone.utc)
    await db.commit()
    return await load_shift(db, shift_id)


@router.post("/{shift_id}/cancel", response_model=ShiftOut)
async def cancel_shift(shift_id: int, db: DB, user: CurrentUser):
    shift = await load_shift(db, shift_id)
    is_owner = shift.parent_id == user.id
    is_worker = shift.worker_id == user.id
    if not (is_owner or is_worker or user.role == UserRole.admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Эрхгүй")
    if shift.status in (ShiftStatus.completed, ShiftStatus.cancelled):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Дууссан ээлжийг цуцлах боломжгүй")
    if is_worker and not is_owner:
        # гүйцэтгэгч татгалзвал ээлж дахин нээлттэй болно
        shift.worker_id = None
        shift.status = ShiftStatus.open
    else:
        shift.status = ShiftStatus.cancelled
    await db.commit()
    return await load_shift(db, shift_id)
