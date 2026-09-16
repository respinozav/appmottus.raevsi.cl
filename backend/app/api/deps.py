from typing import Generator, Optional, Union
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, Student

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Union[User, Student]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales de autenticación",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # 1. Buscar primero en User (Admin, Coach)
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if user:
        return user
    
    # 2. Si no es User, buscar en Student (Alumno)
    student = db.query(Student).filter(Student.id == UUID(user_id)).first()
    if student:
        return student

    raise credentials_exception

def require_role(roles: list[str]):
    def role_checker(current_user: Union[User, Student] = Depends(get_current_user)) -> Union[User, Student]:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Requiere uno de los siguientes roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker

require_admin = require_role(["admin"])
require_coach = require_role(["admin", "coach"])
require_any_user = require_role(["admin", "coach", "user"])
