from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: DB):
    exists = await db.scalar(select(User).where(User.phone == data.phone))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Энэ утасны дугаар бүртгэлтэй байна")
    user = User(
        phone=data.phone,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return Token(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: DB):
    user = await db.scalar(select(User).where(User.phone == data.phone))
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Утас эсвэл нууц үг буруу")
    return Token(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user
