from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import InvalidCredentialsException
from app.repositories.user_repo import user_repository
from app.models.user import User

# Standard oauth2 scheme resolving token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise InvalidCredentialsException()
    except JWTError:
        raise InvalidCredentialsException()
        
    user = user_repository.get(db, id=int(user_id))
    if user is None:
        raise InvalidCredentialsException()
        
    return user
