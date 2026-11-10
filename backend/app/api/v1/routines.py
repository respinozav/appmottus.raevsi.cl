from datetime import datetime
from typing import List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.models import (
    Routine, 
    RoutineExercise, 
    Exercise, 
    User, 
    Student, 
    ExerciseLog, 
    RoutineComment
)
from app.schemas.schemas import (
    RoutineCreate, 
    RoutineUpdate,
    RoutineOut, 
    RoutineStatusUpdate,
    ExerciseLogBatchUpsert,
    RoutineCommentCreate,
    RoutineCommentOut
)
from app.api.deps import get_current_user, require_coach

router = APIRouter()

def get_routine_eager_query(db: Session, routine_id: UUID) -> Optional[Routine]:
    """
    Carga ansiosa de una rutina con todas sus dependencias anidadas:
    - Alumno y Coach
    - Ejercicios asociados con categorías y logs serie por serie
    - Comentarios de feedback
    """
    return db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise_logs),
            joinedload(Routine.comments)
        )\
        .filter(Routine.id == routine_id)\
        .first()

@router.post("/", response_model=RoutineOut)
def create_and_assign_routine(
    data: RoutineCreate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Coach crea y asigna una rutina con prescripción avanzada (TrueCoach):
    - Grupo de superseries (A1, A2, B1...)
    - Peso objetivo, RPE objetivo, Tempo y notas técnicas
    - Opcional: clonación / duplicación semanal en múltiples fechas
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

    def _create_single_routine(scheduled_time: datetime) -> Routine:
        routine = Routine(
            student_id=target_student_id,
            coach_id=current_coach.id,
            title=data.title or "Rutina Mottus",
            scheduled_at=scheduled_time,
            notes=data.notes,
            is_executed=False
        )
        db.add(routine)
        db.flush()

        for idx, item in enumerate(data.exercises):
            r_ex = RoutineExercise(
                routine_id=routine.id,
                exercise_id=item.exercise_id,
                series=item.series,
                repetitions=item.repetitions,
                rest_seconds=item.rest_seconds,
                order_index=item.order_index if item.order_index is not None else (idx + 1),
                superset_group=item.superset_group.strip().upper() if item.superset_group else None,
                target_weight=item.target_weight,
                target_rpe=item.target_rpe,
                tempo=item.tempo,
                coach_notes=item.coach_notes
            )
            db.add(r_ex)
        return routine

    # Rutina principal
    main_routine = _create_single_routine(data.scheduled_at)

    # Si se especificaron fechas adicionales para duplicar / clonar (programación periódica)
    if data.duplicate_to_dates:
        for extra_date in data.duplicate_to_dates:
            _create_single_routine(extra_date)

    db.commit()

    return get_routine_eager_query(db, main_routine.id)

@router.put("/{routine_id}", response_model=RoutineOut)
def update_routine(
    routine_id: UUID,
    data: RoutineUpdate,
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Coach actualiza datos generales o prescripción de ejercicios de una rutina existente.
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    if current_coach.role != "admin" and routine.coach_id != current_coach.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para editar esta rutina.")

    if data.title is not None:
        routine.title = data.title
    if data.scheduled_at is not None:
        routine.scheduled_at = data.scheduled_at
    if data.notes is not None:
        routine.notes = data.notes

    # Si se actualizan ejercicios
    if data.exercises is not None:
        # Eliminar anteriores (logs asociados se eliminarán por cascade si aplica o se actualizan)
        db.query(RoutineExercise).filter(RoutineExercise.routine_id == routine.id).delete()
        for idx, item in enumerate(data.exercises):
            r_ex = RoutineExercise(
                routine_id=routine.id,
                exercise_id=item.exercise_id,
                series=item.series,
                repetitions=item.repetitions,
                rest_seconds=item.rest_seconds,
                order_index=item.order_index if item.order_index is not None else (idx + 1),
                superset_group=item.superset_group.strip().upper() if item.superset_group else None,
                target_weight=item.target_weight,
                target_rpe=item.target_rpe,
                tempo=item.tempo,
                coach_notes=item.coach_notes
            )
            db.add(r_ex)

    db.commit()
    return get_routine_eager_query(db, routine.id)

@router.get("/my-routines", response_model=List[RoutineOut])
def get_my_routines(
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Alumno consulta todas sus rutinas asignadas con todos sus ejercicios y series registradas.
    """
    routines = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise_logs),
            joinedload(Routine.comments)
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
    Coach consulta todas las rutinas creadas por él (o todas si es admin).
    """
    query = db.query(Routine)\
        .options(
            joinedload(Routine.student),
            joinedload(Routine.coach),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise).joinedload(Exercise.category),
            joinedload(Routine.routine_exercises).joinedload(RoutineExercise.exercise_logs),
            joinedload(Routine.comments)
        )
    if current_coach.role != "admin":
        query = query.filter(Routine.coach_id == current_coach.id)

    return query.order_by(Routine.scheduled_at.desc()).all()

@router.get("/{routine_id}", response_model=RoutineOut)
def get_routine_detail(
    routine_id: UUID,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    routine = get_routine_eager_query(db, routine_id)
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
    Alterna manualmente el estado completado de la sesión.
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    if current_user.role == "user" and routine.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes modificar una rutina de otro alumno.")

    routine.is_executed = status_update.is_executed
    routine.executed_at = datetime.utcnow() if status_update.is_executed else None

    db.commit()
    return get_routine_eager_query(db, routine.id)

@router.post("/{routine_id}/logs", response_model=RoutineOut)
def upsert_routine_logs(
    routine_id: UUID,
    payload: ExerciseLogBatchUpsert,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Workout Logging TrueCoach:
    Guarda o actualiza en bloque las series realizadas por el alumno.
    Si todas las series se completan, marca automáticamente la rutina como completada.
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    if current_user.role == "user" and routine.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes registrar series en rutinas ajenas.")

    # Validar que los routine_exercises pertenezcan a esta rutina
    valid_ex_ids = {re.id: re for re in routine.routine_exercises}

    for log_in in payload.logs:
        if log_in.routine_exercise_id not in valid_ex_ids:
            continue

        existing_log = db.query(ExerciseLog).filter(
            ExerciseLog.routine_exercise_id == log_in.routine_exercise_id,
            ExerciseLog.set_number == log_in.set_number
        ).first()

        if existing_log:
            existing_log.actual_weight = log_in.actual_weight
            existing_log.actual_reps = log_in.actual_reps
            existing_log.actual_rpe = log_in.actual_rpe
            existing_log.is_completed = log_in.is_completed
            existing_log.student_notes = log_in.student_notes
            existing_log.logged_at = datetime.utcnow()
        else:
            new_log = ExerciseLog(
                routine_exercise_id=log_in.routine_exercise_id,
                student_id=routine.student_id,
                set_number=log_in.set_number,
                actual_weight=log_in.actual_weight,
                actual_reps=log_in.actual_reps,
                actual_rpe=log_in.actual_rpe,
                is_completed=log_in.is_completed,
                student_notes=log_in.student_notes,
                logged_at=datetime.utcnow()
            )
            db.add(new_log)

    db.flush()

    # Verificar si todas las series prescritas de la sesión están completadas
    total_prescribed_sets = sum(re.series for re in routine.routine_exercises)
    all_logs = db.query(ExerciseLog).filter(
        ExerciseLog.routine_exercise_id.in_(list(valid_ex_ids.keys())),
        ExerciseLog.is_completed == True
    ).all()

    if total_prescribed_sets > 0 and len(all_logs) >= total_prescribed_sets:
        routine.is_executed = True
        if not routine.executed_at:
            routine.executed_at = datetime.utcnow()

    db.commit()
    return get_routine_eager_query(db, routine.id)

@router.get("/{routine_id}/comments", response_model=List[RoutineCommentOut])
def get_routine_comments(
    routine_id: UUID,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Obtiene el hilo de comentarios de feedback de una rutina.
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    if current_user.role == "user" and routine.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a los comentarios de esta rutina.")

    return db.query(RoutineComment)\
        .filter(RoutineComment.routine_id == routine_id)\
        .order_by(RoutineComment.created_at.asc())\
        .all()

@router.post("/{routine_id}/comments", response_model=RoutineCommentOut)
def post_routine_comment(
    routine_id: UUID,
    payload: RoutineCommentCreate,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Publica un comentario en la sesión (Alumno o Coach).
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada.")

    if current_user.role == "user" and routine.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes comentar en una rutina ajena.")

    is_student = current_user.role == "user"
    author_type = "student" if is_student else "coach"
    author_name = current_user.name or (f"Alumno ({current_user.rut})" if is_student else "Coach")

    comment = RoutineComment(
        routine_id=routine.id,
        author_type=author_type,
        author_id=current_user.id,
        author_name=author_name,
        content=payload.content.strip()
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

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
