from datetime import datetime
from typing import List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.models import Routine, RoutineExercise, Exercise, User, Student
from app.schemas.schemas import RoutineCreate, RoutineOut, RoutineStatusUpdate
from app.api.deps import get_current_user, require_coach

router = APIRouter()

@router.post("/", response_model=RoutineOut)
def create_and_assign_routine(
    data: RoutineCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Coach selecciona un alumno, fecha/hora, título y una lista de ejercicios para crear y asignar una rutina.
    """
    target_student_id = data.target_student_id
    if not target_student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe especificar el ID del alumno (student_id)."
        )

    # Verificar que el alumno exista en tabla students
    target_student = db.query(Student).filter(Student.id == target_student_id).first()
    if not target_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El alumno especificado no existe."
        )

    if not data.exercises:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe incluir al menos un ejercicio en la rutina."
        )

    # Validar que todos los ejercicios existen
    exercise_ids = [e.exercise_id for e in data.exercises]
    existing_exercises = db.query(Exercise).filter(Exercise.id.in_(exercise_ids)).all()
    if len(existing_exercises) != len(set(exercise_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o más ejercicios seleccionados no existen en el sistema."
        )

    # Crear la rutina
    routine = Routine(
        student_id=target_student_id,
        coach_id=current_coach.id,
        title=data.title or "Rutina Mottus",
        scheduled_at=data.scheduled_at,
        notes=data.notes,
        is_executed=False
    )
    db.add(routine)
    db.flush() # Obtener routine.id

    # Asociar ejercicios
    for item in data.exercises:
        r_ex = RoutineExercise(
            routine_id=routine.id,
            exercise_id=item.exercise_id,
            series=item.series,
            repetitions=item.repetitions,
            rest_seconds=item.rest_seconds
        )
        db.add(r_ex)

    db.commit()

    # Recargar con relaciones
    fresh_routine = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category)
        )\
        .filter(Routine.id == routine.id)\
        .first()

    return fresh_routine

@router.get("/my-routines", response_model=List[RoutineOut])
def get_my_routines(
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Alumno consulta todas sus rutinas asignadas ordenadas por fecha programada.
    """
    routines = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category)
        )\
        .filter(Routine.student_id == current_user.id)\
        .order_by(Routine.scheduled_at.desc())\
        .all()
    return routines

@router.get("/coach-routines", response_model=List[RoutineOut])
def get_coach_routines(
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Coach consulta todas las rutinas creadas por él.
    """
    routines = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category)
        )\
        .filter(Routine.coach_id == current_coach.id)\
        .order_by(Routine.scheduled_at.desc())\
        .all()
    return routines

@router.get("/{routine_id}", response_model=RoutineOut)
def get_routine_detail(
    routine_id: UUID,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    routine = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category)
        )\
        .filter(Routine.id == routine_id)\
        .first()

    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    # Validar que pertenezca al alumno o a un coach/admin
    if current_user.role == "user" and routine.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a esta rutina.")

    return routine

@router.patch("/{routine_id}/toggle-execution", response_model=RoutineOut)
def toggle_routine_execution(
    routine_id: UUID,
    status_update: RoutineStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    El alumno marca su rutina como ejecutada (o desmarca).
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    if current_user.role == "user" and routine.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes modificar una rutina de otro alumno.")

    routine.is_executed = status_update.is_executed
    routine.executed_at = datetime.utcnow() if status_update.is_executed else None

    db.commit()

    fresh_routine = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category)
        )\
        .filter(Routine.id == routine.id)\
        .first()

    return fresh_routine

@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: UUID,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")
    db.delete(routine)
    db.commit()
    return None
