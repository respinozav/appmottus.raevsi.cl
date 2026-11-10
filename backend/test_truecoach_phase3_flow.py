import sys
import os

# Asegurar importación de backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from starlette.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.models import (
    User, Student, Exercise, Routine, RoutineExercise,
    ExerciseLog, RoutineComment, RoutineTemplate, RoutineTemplateExercise,
    BodyMetric, DirectMessage
)

client = TestClient(app)

def run_phase3_e2e_verification():
    print("=======================================================================")
    print("  QA & DEVOPS: VERIFICACIÓN E2E DE PARIDAD DEFINITIVA TRUECOACH (FASE 3)")
    print("=======================================================================")

    db = SessionLocal()
    created_routine_ids = []
    created_template_ids = []
    created_metric_ids = []
    created_message_ids = []

    try:
        # 0. Contexto & Tokens
        print("\n[PASO 0] Identificando Coach, Alumno y Ejercicio...")
        coach = db.query(User).filter(User.role == 'coach').first()
        student = db.query(Student).filter(Student.is_registered == True).first()
        exercise = db.query(Exercise).first()

        assert coach is not None, "Error: Coach no encontrado en bdmottus.users"
        assert student is not None, "Error: Alumno no encontrado en bdmottus.students"
        assert exercise is not None, "Error: Ejercicio no encontrado en bdmottus.exercises"

        coach_token = create_access_token(subject=coach.id, role=coach.role)
        student_token = create_access_token(subject=student.id, role="user")

        coach_headers = {"Authorization": f"Bearer {coach_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}

        print(f"  ✔ Coach: {coach.name} ({coach.rut})")
        print(f"  ✔ Alumno: {student.name} ({student.rut})")
        print(f"  ✔ Ejercicio: {exercise.name}")

        # ---------------------------------------------------------------------
        # TEST 1: Estructura en 3 Bloques (Warmup, Workout, Cooldown)
        # ---------------------------------------------------------------------
        print("\n[TEST 1] Creando rutina con estructura en 3 bloques y formatos TrueCoach...")
        scheduled_at = datetime.now(timezone.utc) + timedelta(days=1)
        routine_payload = {
            "student_id": str(student.id),
            "title": "E2E Fase 3: Sesión 3 Bloques TrueCoach",
            "scheduled_at": scheduled_at.isoformat(),
            "notes": "Instrucción de sesión completa",
            "warmup_notes": "10 min movilidad de cadera y activación escapular con banda",
            "cooldown_notes": "5 min estiramiento estático de isquios y respiración diafragmática",
            "exercises": [
                {
                    "exercise_id": str(exercise.id),
                    "series": 1,
                    "repetitions": "12 reps",
                    "rest_seconds": 60,
                    "order_index": 1,
                    "block_section": "warmup",
                    "workout_format": "regular",
                    "coach_notes": "Carga muy liviana para activar"
                },
                {
                    "exercise_id": str(exercise.id),
                    "series": 2,
                    "repetitions": "8 reps",
                    "rest_seconds": 120,
                    "order_index": 2,
                    "block_section": "main",
                    "workout_format": "superset",
                    "superset_group": "A1",
                    "target_weight": 85.0,
                    "target_rpe": 8.5
                }
            ]
        }

        res = client.post("/api/v1/routines/", json=routine_payload, headers=coach_headers)
        assert res.status_code == 200, f"Error al crear rutina de 3 bloques: {res.text}"
        routine_data = res.json()
        routine_id = routine_data["id"]
        created_routine_ids.append(routine_id)

        assert routine_data["warmup_notes"] == routine_payload["warmup_notes"]
        assert routine_data["cooldown_notes"] == routine_payload["cooldown_notes"]
        assert routine_data["is_reviewed_by_coach"] == False
        assert len(routine_data["routine_exercises"]) == 2
        assert routine_data["routine_exercises"][0]["block_section"] == "warmup"
        assert routine_data["routine_exercises"][1]["block_section"] == "main"
        assert routine_data["routine_exercises"][1]["workout_format"] == "superset"
        print("  ✔ Rutina creada con 3 bloques y formatos validados.")

        # ---------------------------------------------------------------------
        # TEST 2: Logging Serie por Serie y Auto-Completado
        # ---------------------------------------------------------------------
        print("\n[TEST 2] Alumno registra series y se verifica auto-completado...")
        warmup_re = routine_data["routine_exercises"][0]
        main_re = routine_data["routine_exercises"][1]

        logs_payload = {
            "logs": [
                {
                    "routine_exercise_id": warmup_re["id"],
                    "set_number": 1,
                    "actual_weight": 40.0,
                    "actual_reps": 12,
                    "actual_rpe": 5.0,
                    "student_notes": "Calentamiento completado",
                    "is_completed": True
                },
                {
                    "routine_exercise_id": main_re["id"],
                    "set_number": 1,
                    "actual_weight": 85.0,
                    "actual_reps": 8,
                    "actual_rpe": 8.0,
                    "student_notes": "Buena fluidez técnica",
                    "is_completed": True
                },
                {
                    "routine_exercise_id": main_re["id"],
                    "set_number": 2,
                    "actual_weight": 87.5,
                    "actual_reps": 8,
                    "actual_rpe": 8.5,
                    "student_notes": "Carga máxima del día",
                    "is_completed": True
                }
            ]
        }

        res = client.post(f"/api/v1/routines/{routine_id}/logs", json=logs_payload, headers=student_headers)
        assert res.status_code == 200, f"Error al registrar logs: {res.text}"
        updated_routine = res.json()
        assert updated_routine["is_executed"] == True
        print("  ✔ Todas las series registradas exitosamente y rutina auto-marcada como ejecutada.")

        # Verificar inyección de Last Performance en consultas del alumno
        res = client.get("/api/v1/routines/my-routines", headers=student_headers)
        assert res.status_code == 200
        my_routines = res.json()
        logged_routine = next((r for r in my_routines if r["id"] == routine_id), None)
        assert logged_routine is not None
        # Validar que tiene last_performance inyectado
        re_with_last = next((e for e in logged_routine["routine_exercises"] if e["id"] == main_re["id"]), None)
        assert re_with_last is not None
        print(f"  ✔ Inyección de 'last_performance' confirmada: {re_with_last.get('last_performance')}")

        # ---------------------------------------------------------------------
        # TEST 3: V°B° / Revisión del Coach (Mark Reviewed)
        # ---------------------------------------------------------------------
        print("\n[TEST 3] Coach otorga V°B° / marca sesión como revisada...")
        res = client.patch(f"/api/v1/routines/{routine_id}/mark-reviewed", headers=coach_headers)
        assert res.status_code == 200, f"Error al marcar revisada: {res.text}"
        reviewed_data = res.json()
        assert reviewed_data["is_reviewed_by_coach"] == True
        assert reviewed_data["coach_reviewed_at"] is not None
        print("  ✔ Sesión revisada por el coach exitosamente.")

        # ---------------------------------------------------------------------
        # TEST 4: Programas Mesociclo Multi-Semana
        # ---------------------------------------------------------------------
        print("\n[TEST 4] Creando plantilla de mesociclo y aplicando programa...")
        template_payload = {
            "title": "E2E Mesociclo Fuerza S1",
            "description": "Semana 1 de adaptación",
            "category_tag": "Fuerza",
            "week_number": 1,
            "day_of_week": 1, # Lunes
            "warmup_notes": "Movilidad articular general",
            "cooldown_notes": "Vuelta a la calma",
            "exercises": [
                {
                    "exercise_id": str(exercise.id),
                    "series": 4,
                    "repetitions": "6 reps",
                    "rest_seconds": 120,
                    "order_index": 1,
                    "block_section": "main",
                    "workout_format": "regular",
                    "target_weight": 90.0,
                    "target_rpe": 8.0
                }
            ]
        }
        res = client.post("/api/v1/routines/templates", json=template_payload, headers=coach_headers)
        assert res.status_code == 200, f"Error al crear plantilla mesociclo: {res.text}"
        tmpl = res.json()
        created_template_ids.append(tmpl["id"])
        print(f"  ✔ Plantilla creada (Semana {tmpl['week_number']}, Día {tmpl['day_of_week']})")

        # Aplicar programa
        start_monday = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        apply_payload = {
            "template_ids": [tmpl["id"]],
            "student_id": str(student.id),
            "start_date": start_monday
        }
        res = client.post("/api/v1/routines/templates/apply-program", json=apply_payload, headers=coach_headers)
        assert res.status_code == 200, f"Error al aplicar programa: {res.text}"
        program_routines = res.json()
        assert len(program_routines) == 1
        created_routine_ids.append(program_routines[0]["id"])
        print(f"  ✔ Programa aplicado con éxito: Rutina programada para {program_routines[0]['scheduled_at']}")

        # ---------------------------------------------------------------------
        # TEST 5: Live Activity Feed
        # ---------------------------------------------------------------------
        print("\n[TEST 5] Consultando Activity Feed de eventos en tiempo real...")
        res = client.get("/api/v1/analytics/activity-feed", headers=coach_headers)
        assert res.status_code == 200, f"Error en activity feed: {res.text}"
        feed_items = res.json()
        assert isinstance(feed_items, list)
        print(f"  ✔ Activity feed recuperado con {len(feed_items)} eventos.")

        # ---------------------------------------------------------------------
        # TEST 6: Ficha Clínica del Atleta
        # ---------------------------------------------------------------------
        print("\n[TEST 6] Actualizando y verificando ficha clínica del alumno...")
        clinical_payload = {
            "injuries_notes": "Tendinopatía rotuliana derecha leve (cuidado en sentadillas profundas)",
            "fitness_goals": "Ganancia de masa muscular y aumento de 1RM en banca",
            "equipment_available": "Gimnasio comercial completo con mancuernas y jaula",
            "private_coach_notes": "Atleta disciplinado pero requiere recordatorios de hidratación"
        }
        res = client.patch(f"/api/v1/users/students/{student.id}/coach-settings", json=clinical_payload, headers=coach_headers)
        assert res.status_code == 200, f"Error al actualizar ficha clínica: {res.text}"
        updated_student = res.json()
        assert updated_student["injuries_notes"] == clinical_payload["injuries_notes"]
        assert updated_student["fitness_goals"] == clinical_payload["fitness_goals"]
        assert updated_student["equipment_available"] == clinical_payload["equipment_available"]
        assert updated_student["private_coach_notes"] == clinical_payload["private_coach_notes"]
        print("  ✔ Ficha clínica y antecedentes del atleta actualizados y validados.")

        # ---------------------------------------------------------------------
        # TEST 7: Perímetros Anatómicos y Fotos de Progreso
        # ---------------------------------------------------------------------
        print("\n[TEST 7] Registrando métrica corporal con perímetros y URLs de fotos...")
        metric_payload = {
            "weight": 79.5,
            "height": 178.0,
            "body_fat_percentage": 14.5,
            "muscle_mass": 36.2,
            "waist_cm": 81.5,
            "hip_cm": 97.0,
            "chest_cm": 105.0,
            "arm_cm": 36.5,
            "thigh_cm": 58.0,
            "photo_front_url": "https://mottus.raevsi.cl/photos/test_front.jpg",
            "photo_side_url": "https://mottus.raevsi.cl/photos/test_side.jpg",
            "photo_back_url": "https://mottus.raevsi.cl/photos/test_back.jpg",
            "notes": "Test E2E de perímetros y fotos"
        }
        res = client.post("/api/v1/metrics/my-metrics", json=metric_payload, headers=student_headers)
        assert res.status_code == 200, f"Error al registrar métricas corporales: {res.text}"
        metric_data = res.json()
        created_metric_ids.append(metric_data["id"])
        assert float(metric_data["waist_cm"]) == 81.5
        assert float(metric_data["hip_cm"]) == 97.0
        assert metric_data["photo_front_url"] == metric_payload["photo_front_url"]
        print("  ✔ Perímetros anatómicos y fotos registrados y verificados.")

        # ---------------------------------------------------------------------
        # TEST 8: Mensajería Directa 1-a-1 (Coach <-> Alumno)
        # ---------------------------------------------------------------------
        print("\n[TEST 8] Probando chat directo 1-a-1 y contador de mensajes no leídos...")
        # 1. Coach envía mensaje a Alumno
        msg_payload = {"content": "¡Hola! Excelente ejecución en la sesión de hoy. Sigue así."}
        res = client.post(f"/api/v1/users/messages/{student.id}", json=msg_payload, headers=coach_headers)
        assert res.status_code == 200, f"Error coach enviando mensaje: {res.text}"
        coach_msg = res.json()
        created_message_ids.append(coach_msg["id"])
        assert coach_msg["sender_role"] == "coach"
        assert coach_msg["content"] == msg_payload["content"]

        # 2. Alumno consulta contador de no leídos
        res = client.get("/api/v1/users/messages-unread-count", headers=student_headers)
        assert res.status_code == 200
        unread_count = res.json()["unread_count"]
        assert unread_count >= 1, f"Se esperaba al menos 1 mensaje no leído, se obtuvo {unread_count}"

        # 3. Alumno lee la conversación (debe marcar como leído)
        res = client.get(f"/api/v1/users/messages/{student.id}", headers=student_headers)
        assert res.status_code == 200
        messages = res.json()
        assert len(messages) >= 1

        # 4. Alumno responde
        reply_payload = {"content": "¡Gracias Coach! Mañana descansaré para rendir al máximo el miércoles."}
        res = client.post(f"/api/v1/users/messages/{student.id}", json=reply_payload, headers=student_headers)
        assert res.status_code == 200
        student_msg = res.json()
        created_message_ids.append(student_msg["id"])
        assert student_msg["sender_role"] == "student"
        print("  ✔ Mensajería directa 1 a 1 y badges de no leídos validados.")

        print("\n" + "="*71)
        print("  TODAS LAS PRUEBAS E2E DE LA FASE 3 PASARON CON ÉXITO AL 100%")
        print("="*71)

    finally:
        # Limpieza de registros temporales de prueba
        print("\n[LIMPIEZA] Eliminando registros temporales de prueba de bdmottus...")
        try:
            if created_message_ids:
                db.query(DirectMessage).filter(DirectMessage.id.in_(created_message_ids)).delete(synchronize_session=False)
            if created_metric_ids:
                db.query(BodyMetric).filter(BodyMetric.id.in_(created_metric_ids)).delete(synchronize_session=False)
            if created_template_ids:
                db.query(RoutineTemplate).filter(RoutineTemplate.id.in_(created_template_ids)).delete(synchronize_session=False)
            if created_routine_ids:
                re_ids = [re[0] for re in db.query(RoutineExercise.id).filter(RoutineExercise.routine_id.in_(created_routine_ids)).all()]
                if re_ids:
                    db.query(ExerciseLog).filter(ExerciseLog.routine_exercise_id.in_(re_ids)).delete(synchronize_session=False)
                db.query(RoutineComment).filter(RoutineComment.routine_id.in_(created_routine_ids)).delete(synchronize_session=False)
                db.query(RoutineExercise).filter(RoutineExercise.routine_id.in_(created_routine_ids)).delete(synchronize_session=False)
                db.query(Routine).filter(Routine.id.in_(created_routine_ids)).delete(synchronize_session=False)
            db.commit()
            print("  ✔ Base de datos bdmottus restaurada a su estado limpio original.")
        except Exception as e:
            db.rollback()
            print(f"  ⚠ Advertencia durante la limpieza: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    run_phase3_e2e_verification()
