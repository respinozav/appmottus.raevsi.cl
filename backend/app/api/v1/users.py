import secrets
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.models import User, Student
from app.schemas.schemas import (
    StudentCreateByCoach,
    StudentCompleteRegistration,
    StudentOut,
    StudentWithTokenOut,
    StudentCoachSettingsUpdate,
    UserOut,
)
from app.api.deps import get_current_user, require_coach, require_admin

router = APIRouter()

@router.post("/invite-by-rut", response_model=StudentWithTokenOut)
def invite_user_by_rut(
    data: StudentCreateByCoach,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Endpoint para que el Coach ingrese el RUT del nuevo alumno y genere un enlace único de registro en la tabla students.
    """
    clean_rut = data.rut.strip().upper()
    existing_student = db.query(Student).filter(Student.rut == clean_rut).first()

    if existing_student:
        if existing_student.is_registered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este RUT ya se encuentra completamente registrado en Mottus Gym como alumno."
            )
        # Re-generar o devolver token existente si no está registrado
        if not existing_student.registration_token:
            existing_student.registration_token = secrets.token_urlsafe(32)
            db.commit()
            db.refresh(existing_student)
        
        reg_url = f"{settings.FRONTEND_URL}/register?token={existing_student.registration_token}"
        return {
            "id": existing_student.id,
            "rut": existing_student.rut,
            "role": "user",
            "registration_token": existing_student.registration_token,
            "registration_url": reg_url
        }

    # Crear nuevo registro en tabla students
    token = secrets.token_urlsafe(32)
    new_student = Student(
        rut=clean_rut,
        registration_token=token,
        is_registered=False
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    reg_url = f"{settings.FRONTEND_URL}/register?token={token}"
    return {
        "id": new_student.id,
        "rut": new_student.rut,
        "role": "user",
        "registration_token": token,
        "registration_url": reg_url
    }

@router.get("/verify-token/{token}", response_model=StudentOut)
def verify_registration_token(token: str, db: Session = Depends(get_db)):
    """
    Permite al frontend verificar si el token de registro de alumno es válido antes de mostrar el formulario.
    """
    student = db.query(Student).filter(
        Student.registration_token == token,
        Student.is_registered == False
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token de registro inválido o la cuenta de alumno ya ha sido activada."
        )
    return student

@router.post("/complete-registration", response_model=StudentOut)
def complete_registration(data: StudentCompleteRegistration, db: Session = Depends(get_db)):
    """
    El alumno completa Nombre, Sexo, Celular, Clave, Peso y Estatura para activar su cuenta en students.
    """
    student = db.query(Student).filter(
        Student.registration_token == data.token,
        Student.is_registered == False
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado."
        )

    # Validar email si fue provisto
    if data.email:
        email_clean = data.email.strip().lower()
        # Verificar en students y en users
        email_in_students = db.query(Student).filter(Student.email == email_clean, Student.id != student.id).first()
        email_in_users = db.query(User).filter(User.email == email_clean).first()
        if email_in_students or email_in_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado en el sistema."
            )
        student.email = email_clean

    student.name = data.name.strip()
    student.gender = data.gender
    student.phone = data.phone.strip()
    student.password_hash = get_password_hash(data.password)
    student.weight = data.weight
    student.height = data.height
    student.is_registered = True
    student.registration_token = None # Invalidar token tras activación

    db.commit()
    db.refresh(student)
    return student

@router.get("/students", response_model=List[StudentOut])
def get_students(
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Lista todos los alumnos registrados en bdmottus.students para que el Coach pueda asignarles rutinas.
    """
    return db.query(Student).order_by(Student.name.asc()).all()

@router.patch("/students/{student_id}/coach-settings", response_model=StudentOut)
def update_student_coach_settings(
    student_id: UUID,
    data: StudentCoachSettingsUpdate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Coach o Admin configura el plan, vigencia de membresía, estado y objetivos nutricionales / hábitos del alumno.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumno no encontrado.")

    if data.plan_name is not None:
        student.plan_name = data.plan_name
    if data.membership_expires_at is not None:
        student.membership_expires_at = data.membership_expires_at
    if data.is_active is not None:
        student.is_active = data.is_active
    if data.daily_kcal_target is not None:
        student.daily_kcal_target = data.daily_kcal_target
    if data.daily_protein_target is not None:
        student.daily_protein_target = data.daily_protein_target
    if data.daily_steps_target is not None:
        student.daily_steps_target = data.daily_steps_target
    if data.daily_water_liters_target is not None:
        student.daily_water_liters_target = data.daily_water_liters_target

    db.commit()
    db.refresh(student)
    return student

@router.get("/", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Solo Administradores pueden ver el personal interno (Coaches y Admins).
    """
    return db.query(User).order_by(User.created_at.desc()).all()
