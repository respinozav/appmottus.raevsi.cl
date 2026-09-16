from typing import List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_coach
from app.models.models import User, Student, BodyMetric
from app.schemas.schemas import BodyMetricCreate, BodyMetricOut

router = APIRouter()

def compute_bmi(weight: Optional[float], height: Optional[float]) -> Optional[float]:
    if weight and height and height > 0:
        # height in cm to meters
        h_m = height / 100.0
        return round(weight / (h_m * h_m), 2)
    return None

def build_metric_out(metric: BodyMetric, student_height: Optional[float] = None) -> BodyMetricOut:
    # Use height from metric or fallback to student profile height
    h = float(metric.height) if metric.height else student_height
    w = float(metric.weight) if metric.weight else None
    bmi = compute_bmi(w, h)
    
    return BodyMetricOut(
        id=metric.id,
        student_id=metric.student_id,
        user_id=metric.student_id, # compatibilidad
        recorded_by=metric.recorded_by,
        weight=float(metric.weight),
        height=float(metric.height) if metric.height else None,
        body_fat_percentage=float(metric.body_fat_percentage) if metric.body_fat_percentage else None,
        muscle_mass=float(metric.muscle_mass) if metric.muscle_mass else None,
        notes=metric.notes,
        measured_at=metric.measured_at,
        created_at=metric.created_at,
        bmi=bmi
    )

@router.get("/my-metrics", response_model=List[BodyMetricOut])
def get_my_metrics(
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Alumno obtiene su historial de métricas corporales ordenado por fecha descendente.
    """
    metrics = (
        db.query(BodyMetric)
        .filter(BodyMetric.student_id == current_user.id)
        .order_by(BodyMetric.measured_at.desc())
        .all()
    )
    user_h = float(current_user.height) if getattr(current_user, "height", None) else None
    return [build_metric_out(m, user_h) for m in metrics]

@router.post("/my-metrics", response_model=BodyMetricOut)
def log_my_metric(
    metric_in: BodyMetricCreate,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Alumno registra un nuevo peso/métrica corporal.
    Actualiza además el peso actual en su ficha en bdmottus.students.
    """
    height_val = metric_in.height or (float(current_user.height) if getattr(current_user, "height", None) else None)

    recorded_by_id = current_user.id if isinstance(current_user, User) else None

    metric = BodyMetric(
        student_id=current_user.id,
        recorded_by=recorded_by_id,
        weight=metric_in.weight,
        height=height_val,
        body_fat_percentage=metric_in.body_fat_percentage,
        muscle_mass=metric_in.muscle_mass,
        notes=metric_in.notes,
        measured_at=metric_in.measured_at
    )
    db.add(metric)
    
    # Actualizar peso actual en el perfil del alumno
    if hasattr(current_user, "weight"):
        current_user.weight = metric_in.weight
    if metric_in.height and hasattr(current_user, "height"):
        current_user.height = metric_in.height

    db.commit()
    db.refresh(metric)
    db.refresh(current_user)

    user_h = float(current_user.height) if getattr(current_user, "height", None) else None
    return build_metric_out(metric, user_h)

@router.get("/student/{student_id}", response_model=List[BodyMetricOut])
def get_student_metrics(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    El Coach o Admin consulta el historial antropométrico de un alumno desde bdmottus.students.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    metrics = (
        db.query(BodyMetric)
        .filter(BodyMetric.student_id == student_id)
        .order_by(BodyMetric.measured_at.desc())
        .all()
    )
    user_h = float(student.height) if student.height else None
    return [build_metric_out(m, user_h) for m in metrics]

@router.post("/student/{student_id}", response_model=BodyMetricOut)
def record_student_metric_by_coach(
    student_id: UUID,
    metric_in: BodyMetricCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    El Coach registra una evaluación antropométrica oficial para un alumno.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    height_val = metric_in.height or (float(student.height) if student.height else None)

    metric = BodyMetric(
        student_id=student.id,
        recorded_by=current_coach.id,
        weight=metric_in.weight,
        height=height_val,
        body_fat_percentage=metric_in.body_fat_percentage,
        muscle_mass=metric_in.muscle_mass,
        notes=metric_in.notes,
        measured_at=metric_in.measured_at
    )
    db.add(metric)
    
    # Actualizar peso y altura del alumno en su perfil en bdmottus.students
    student.weight = metric_in.weight
    if metric_in.height:
        student.height = metric_in.height

    db.commit()
    db.refresh(metric)
    db.refresh(student)

    user_h = float(student.height) if student.height else None
    return build_metric_out(metric, user_h)

@router.delete("/{metric_id}")
def delete_metric(
    metric_id: UUID,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Elimina un registro de métrica. Alumno solo puede borrar las suyas; coach puede borrar cualquiera.
    """
    metric = db.query(BodyMetric).filter(BodyMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Métrica no encontrada")

    if current_user.role not in ["coach", "admin"] and metric.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar este registro")

    db.delete(metric)
    db.commit()
    return {"message": "Métrica eliminada exitosamente"}
