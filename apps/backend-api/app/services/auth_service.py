from sqlalchemy.orm import Session
from app.repositories.user_repo import user_repository
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.exceptions import UserAlreadyExistsException, InvalidCredentialsException

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        # Check if user already exists
        existing_user = user_repository.get_by_email(db, user_in.email)
        if existing_user:
            raise UserAlreadyExistsException()
            
        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            password_hash=hashed_password,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            country=user_in.country,
            postal_code=user_in.postal_code,
            total_points=0
        )
        
        return user_repository.create(db, obj_in=new_user)

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> Token:
        user = user_repository.get_by_email(db, credentials.email)
        if not user or not verify_password(credentials.password, user.password_hash):
            raise InvalidCredentialsException()
            
        access_token = create_access_token(subject=user.id)
        return Token(access_token=access_token, token_type="bearer")
