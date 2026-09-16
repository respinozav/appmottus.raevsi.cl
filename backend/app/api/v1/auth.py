from datetime import timedelta
from typing import Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.models import User, Student
from app.schemas.schemas import Token, UserLogin, UserOut, StudentOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    identifier = login_data.identifier.strip().upper()
    identifier_raw = login_data.identifier.strip()

    # 1. Buscar en User (Admin, Coach)
    user = db.query(User).filter(
        (User.rut == identifier) | (User.email == identifier_raw)
    ).first()

    target_account = user
    is_student = False

    # 2. Si no es User, buscar en Student (Alumno)
    if not target_account:
        student = db.query(Student).filter(
            (Student.rut == identifier) | (Student.email == identifier_raw)
        ).first()
        if student:
            target_account = student
            is_student = True

    if not target_account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="RUT o correo no registrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not target_account.password_hash or not verify_password(login_data.password, target_account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if is_student and not target_account.is_registered:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta aún no completa el registro inicial. Utiliza el enlace enviado por tu Coach."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(target_account.id),
        role=target_account.role,
        expires_delta=access_token_expires
    )

    if is_student:
        user_payload = StudentOut.model_validate(target_account).model_dump()
    else:
        user_payload = UserOut.model_validate(target_account).model_dump()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.get("/me", response_model=Union[StudentOut, UserOut])
def read_current_user(current_user: Union[User, Student] = Depends(get_current_user)):
    if isinstance(current_user, Student):
        return StudentOut.model_validate(current_user)
    return UserOut.model_validate(current_user)
