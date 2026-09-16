from typing import List, Dict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import require_coach
from app.models.models import User, Student, Routine, BodyMetric
from app.schemas.schemas import CoachComplianceStats, StudentComplianceSummary, ComplianceTimelinePoint

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
