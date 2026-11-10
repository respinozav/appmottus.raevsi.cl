from typing import List, Dict, Optional, Union
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import require_coach, get_current_user
from app.models.models import User, Student, Routine, RoutineExercise, Exercise, Category, BodyMetric, ExerciseLog
from app.schemas.schemas import (
    CoachComplianceStats, 
    StudentComplianceSummary, 
    ComplianceTimelinePoint,
    ExerciseStrengthAnalysis,
    ExerciseHistorySession,
    ExerciseHistoryPoint
)

router = APIRouter()

@router.get("/coach-compliance", response_model=CoachComplianceStats)
def get_coach_compliance_stats(
    db: Session = Depends(get_db),
    current_coach: User = Depends(require_coach)
):
    """
    Dashboard de Estadísticas y Cumplimiento de Entrenamientos para el Coach.
    Analiza las rutinas asignadas, tasa de ejecución, desglose por alumno y actividad reciente.
    """
    # 1. Rutinas creadas por el coach (o todas si es admin)
    routine_query = db.query(Routine)
    if current_coach.role != "admin":
        routine_query = routine_query.filter(Routine.coach_id == current_coach.id)
    
    routines = routine_query.all()
    total_routines = len(routines)
    executed_routines = sum(1 for r in routines if r.is_executed)
    pending_routines = total_routines - executed_routines
    overall_compliance_rate = round((executed_routines / total_routines * 100), 1) if total_routines > 0 else 0.0

    # 2. Obtener todos los alumnos registrados desde la tabla students
    students = db.query(Student).all()
    total_students = len(students)

    # 3. Resumen por Alumno
    students_summary: List[StudentComplianceSummary] = []
    students_with_routines_count = 0

    for s in students:
        s_routines = [r for r in routines if r.student_id == s.id]
        s_total = len(s_routines)
        if s_total > 0:
            students_with_routines_count += 1
        
        s_executed = sum(1 for r in s_routines if r.is_executed)
        s_pending = s_total - s_executed
        s_rate = round((s_executed / s_total * 100), 1) if s_total > 0 else 0.0

        # Última fecha ejecutada
        executed_dates = [r.executed_at for r in s_routines if r.is_executed and r.executed_at]
        last_executed = max(executed_dates) if executed_dates else None

        # Último peso registrado
        last_metric = (
            db.query(BodyMetric)
            .filter(BodyMetric.student_id == s.id)
            .order_by(BodyMetric.measured_at.desc())
            .first()
        )
        last_w = float(last_metric.weight) if last_metric else (float(s.weight) if s.weight else None)

        students_summary.append(
            StudentComplianceSummary(
                student_id=s.id,
                user_id=s.id, # compatibilidad retroactiva
                name=s.name,
                rut=s.rut,
                total_routines=s_total,
                executed_routines=s_executed,
                pending_routines=s_pending,
                compliance_rate=s_rate,
                last_executed_at=last_executed,
                last_weight=last_w
            )
        )

    # Ordenar alumnos por tasa de cumplimiento descendente
    students_summary.sort(key=lambda x: (x.total_routines > 0, x.compliance_rate), reverse=True)

    # 4. Timeline de los últimos 14 días
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=13)
    timeline: List[ComplianceTimelinePoint] = []

    # Mapa de días
    day_map: Dict[str, Dict[str, int]] = {}
    for i in range(14):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        day_map[d] = {"scheduled": 0, "executed": 0}

    for r in routines:
        if r.scheduled_at:
            sched_str = r.scheduled_at.strftime("%Y-%m-%d")
            if sched_str in day_map:
                day_map[sched_str]["scheduled"] += 1
        if r.is_executed and r.executed_at:
            exec_str = r.executed_at.strftime("%Y-%m-%d")
            if exec_str in day_map:
                day_map[exec_str]["executed"] += 1

    for d_str, counts in sorted(day_map.items()):
        timeline.append(
            ComplianceTimelinePoint(
                date=d_str,
                scheduled=counts["scheduled"],
                executed=counts["executed"]
            )
        )

    return CoachComplianceStats(
        total_routines=total_routines,
        executed_routines=executed_routines,
        pending_routines=pending_routines,
        overall_compliance_rate=overall_compliance_rate,
        total_students=total_students,
        active_students_with_routines=students_with_routines_count,
        students_summary=students_summary,
        timeline=timeline
    )

@router.get("/exercise-history/{student_id}/{exercise_id}", response_model=ExerciseStrengthAnalysis)
def get_exercise_strength_analysis(
    student_id: UUID,
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Análisis de Fuerza y Evolución de 1RM (Fórmula de Epley: Peso * (1 + Reps/30)).
    Muestra la evolución cronológica de cargas máximas, repeticiones y volumen para un alumno en un ejercicio.
    """
    if current_user.role == "user" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes autorización para ver las métricas de otro alumno."
        )

    # 1. Obtener información del ejercicio y categoría
    exercise = db.query(Exercise).options(joinedload(Exercise.category)).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado.")

    # 2. Consultar todos los logs del alumno para este ejercicio
    logs = (
        db.query(ExerciseLog, RoutineExercise, Routine)
        .join(RoutineExercise, ExerciseLog.routine_exercise_id == RoutineExercise.id)
        .join(Routine, RoutineExercise.routine_id == Routine.id)
        .filter(
            ExerciseLog.student_id == student_id,
            RoutineExercise.exercise_id == exercise_id,
            ExerciseLog.actual_weight > 0
        )
        .order_by(ExerciseLog.logged_at.asc(), ExerciseLog.set_number.asc())
        .all()
    )

    all_time_best_1rm = 0.0
    all_time_max_weight = 0.0
    total_volume_lifted = 0.0

    # Agrupar por sesión / fecha
    sessions_dict: Dict[str, Dict] = {}

    for log, re, routine in logs:
        weight = float(log.actual_weight or 0.0)
        reps = int(log.actual_reps or 1)
        rpe = float(log.actual_rpe) if log.actual_rpe else None
        
        # Fórmula de Epley: 1RM = Peso * (1 + Reps / 30)
        estimated_1rm = round(weight * (1.0 + (reps / 30.0)), 2) if reps > 0 else weight
        volume = round(weight * reps, 2)

        if estimated_1rm > all_time_best_1rm:
            all_time_best_1rm = estimated_1rm
        if weight > all_time_max_weight:
            all_time_max_weight = weight
        total_volume_lifted += volume

        session_key = str(routine.id)
        date_str = (log.logged_at or routine.scheduled_at).strftime("%Y-%m-%d")

        if session_key not in sessions_dict:
            sessions_dict[session_key] = {
                "date": date_str,
                "routine_id": routine.id,
                "routine_title": routine.title or "Sesión de Entrenamiento",
                "max_weight": 0.0,
                "max_estimated_1rm": 0.0,
                "total_volume": 0.0,
                "sets": []
            }

        s_entry = sessions_dict[session_key]
        if weight > s_entry["max_weight"]:
            s_entry["max_weight"] = weight
        if estimated_1rm > s_entry["max_estimated_1rm"]:
            s_entry["max_estimated_1rm"] = estimated_1rm
        s_entry["total_volume"] = round(s_entry["total_volume"] + volume, 2)

        s_entry["sets"].append(
            ExerciseHistoryPoint(
                logged_at=log.logged_at,
                routine_id=routine.id,
                routine_title=routine.title or "Sesión",
                set_number=log.set_number,
                actual_weight=weight,
                actual_reps=reps,
                actual_rpe=rpe,
                estimated_1rm=estimated_1rm,
                volume=volume,
                student_notes=log.student_notes
            )
        )

    sessions_list = [
        ExerciseHistorySession(**s_data)
        for s_data in sessions_dict.values()
    ]

    return ExerciseStrengthAnalysis(
        student_id=student_id,
        exercise_id=exercise.id,
        exercise_name=exercise.name,
        category_name=exercise.category.name if exercise.category else None,
        all_time_best_1rm=round(all_time_best_1rm, 2),
        all_time_max_weight=round(all_time_max_weight, 2),
        total_volume_lifted=round(total_volume_lifted, 2),
        total_sessions_count=len(sessions_list),
        sessions=sessions_list
    )

@router.get("/student-logged-exercises/{student_id}", response_model=List[dict])
def get_student_logged_exercises(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: Union[User, Student] = Depends(get_current_user)
):
    """
    Lista todos los ejercicios en los que el alumno tiene registros de peso/series.
    Útil para poblar selectores de progreso y gráficas de fuerza.
    """
    if current_user.role == "user" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="No autorizado.")

    exercises_with_logs = (
        db.query(Exercise.id, Exercise.name, Category.name.label("category_name"), func.count(ExerciseLog.id).label("logs_count"))
        .join(RoutineExercise, RoutineExercise.exercise_id == Exercise.id)
        .join(ExerciseLog, ExerciseLog.routine_exercise_id == RoutineExercise.id)
        .outerjoin(Category, Exercise.category_id == Category.id)
        .filter(ExerciseLog.student_id == student_id)
        .group_by(Exercise.id, Exercise.name, Category.name)
        .order_by(func.count(ExerciseLog.id).desc())
        .all()
    )

    return [
        {
            "id": str(e.id),
            "name": e.name,
            "category": e.category_name or "General",
            "logs_count": e.logs_count
        }
        for e in exercises_with_logs
    ]
