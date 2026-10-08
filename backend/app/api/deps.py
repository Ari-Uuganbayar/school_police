from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DB = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(db: DB, token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    sub = decode_token(token)
    if sub is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Нэвтрэх эрх хүчингүй")
    user = await db.get(User, int(sub))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Хэрэглэгч олдсонгүй")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole):
    async def _check(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Энэ үйлдлийг хийх эрхгүй")
        return user

    return _check
