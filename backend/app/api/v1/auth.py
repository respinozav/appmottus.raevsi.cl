from datetime import timedelta
from typing import Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.models import User, Student
from app.schemas.schemas import Token, UserLogin, UserOut, StudentOut, UserProfileUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    identifier = login_data.identifier.strip().upper()
    identifier_raw = login_data.identifier.strip()
    cleaned_rut = identifier.replace(".", "")
    dashed_rut = f"{cleaned_rut[:-1]}-{cleaned_rut[-1]}" if ("-" not in cleaned_rut and len(cleaned_rut) >= 2) else cleaned_rut

    # 1. Buscar en User (Admin, Coach)
    user = db.query(User).filter(
        (User.rut == identifier) |
        (User.rut == cleaned_rut) |
        (User.rut == dashed_rut) |
        (func.lower(User.email) == identifier_raw.lower())
    ).first()

    target_account = user
    is_student = False

    # 2. Si no es User, buscar en Student (Alumno)
    if not target_account:
        student = db.query(Student).filter(
            (Student.rut == identifier) |
            (Student.rut == cleaned_rut) |
            (Student.rut == dashed_rut) |
            (func.lower(Student.email) == identifier_raw.lower())
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

@router.put("/profile", response_model=Union[StudentOut, UserOut])
def update_my_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Permite al usuario autenticado (Coach, Admin o Alumno) actualizar sus datos de contacto y/o contraseña.
    """
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Debe ingresar su contraseña actual para establecer una nueva.")
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="La contraseña actual ingresada es incorrecta.")
        current_user.password_hash = get_password_hash(data.new_password)

    if data.email:
        clean_email = data.email.strip().lower()
        if clean_email != (current_user.email or "").lower():
            in_users = db.query(User).filter(func.lower(User.email) == clean_email, User.id != current_user.id).first()
            in_students = db.query(Student).filter(func.lower(Student.email) == clean_email, Student.id != current_user.id).first()
            if in_users or in_students:
                raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado por otro usuario.")
            current_user.email = clean_email

    if data.name is not None and data.name.strip():
        current_user.name = data.name.strip()
    if data.phone is not None:
        current_user.phone = data.phone.strip()

    db.commit()
    db.refresh(current_user)

    if isinstance(current_user, Student):
        return StudentOut.model_validate(current_user)
    return UserOut.model_validate(current_user)
