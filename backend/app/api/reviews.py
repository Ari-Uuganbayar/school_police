from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.api.shifts import load_shift
from app.models import Review, ShiftStatus, User
from app.schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(data: ReviewCreate, db: DB, user: CurrentUser):
    shift = await load_shift(db, data.shift_id)
    if shift.status != ShiftStatus.completed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Зөвхөн дууссан ээлжийг үнэлнэ")
    if user.id == shift.parent_id:
        to_id = shift.worker_id
    elif user.id == shift.worker_id:
        to_id = shift.parent_id
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Энэ ээлжид оролцоогүй")
    if to_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Үнэлэх хүн байхгүй")
    dup = await db.scalar(
        select(Review).where(Review.shift_id == shift.id, Review.from_user_id == user.id)
    )
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, "Та аль хэдийн үнэлсэн байна")

    review = Review(shift_id=shift.id, from_user_id=user.id, to_user_id=to_id, rating=data.rating, comment=data.comment)
    db.add(review)

    target = await db.get(User, to_id)
    total = target.rating_avg * target.rating_count + data.rating
    target.rating_count += 1
    target.rating_avg = round(total / target.rating_count, 2)
    await db.commit()
    await db.refresh(review)
    return review


@router.get("/users/{user_id}", response_model=list[ReviewOut])
async def user_reviews(user_id: int, db: DB):
    stmt = select(Review).where(Review.to_user_id == user_id).order_by(Review.created_at.desc())
    return (await db.scalars(stmt)).all()
