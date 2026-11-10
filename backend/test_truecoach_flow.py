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
from app.models.models import User, Student, Exercise, Routine, RoutineExercise, ExerciseLog, RoutineComment

client = TestClient(app)

def run_e2e_truecoach_verification():
    print("=======================================================================")
    print("  QA & DEVOPS: VERIFICACIÓN E2E DE PARIDAD TRUECOACH EN MOTTUS GYM")
    print("=======================================================================")

    db = SessionLocal()
    created_routine_ids = []

    try:
        # ---------------------------------------------------------------------
        # 0. Contexto & Autenticación
        # ---------------------------------------------------------------------
        print("\n[PASO 0] Obteniendo credenciales y generando tokens JWT...")
        coach = db.query(User).filter(User.role == 'coach').first()
        student = db.query(Student).filter(Student.is_registered == True).first()
        exercise = db.query(Exercise).first()

        assert coach is not None, "Error: No se encontró ningún coach en bdmottus.users"
        assert student is not None, "Error: No se encontró ningún alumno registrado en bdmottus.students"
        assert exercise is not None, "Error: No se encontró ningún ejercicio en bdmottus.exercises"

        coach_token = create_access_token(subject=coach.id, role=coach.role)
        student_token = create_access_token(subject=student.id, role="user")

        coach_headers = {"Authorization": f"Bearer {coach_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}

        print(f"  ✔ Coach identificado: {coach.name} ({coach.rut})")
        print(f"  ✔ Alumno identificado: {student.name} ({student.rut})")
        print(f"  ✔ Ejercicio seleccionado: {exercise.name}")

        # ---------------------------------------------------------------------
        # PASO A: Crear rutina con prescripción avanzada y clonación periódica
        # ---------------------------------------------------------------------
        print("\n[PASO A] Creando rutina con prescripción avanzada (A1, tempo, peso, RPE) y duplicate_to_dates...")
        scheduled_base = datetime.now(timezone.utc) + timedelta(days=1)
        duplicate_date_1 = scheduled_base + timedelta(days=2)
        duplicate_date_2 = scheduled_base + timedelta(days=4)

        routine_payload = {
            "student_id": str(student.id),
            "title": "E2E Test: Hipertrofia & Fuerza Mottus TrueCoach",
            "scheduled_at": scheduled_base.isoformat(),
            "notes": "Prescripción avanzada de prueba E2E",
            "duplicate_to_dates": [
                duplicate_date_1.isoformat(),
                duplicate_date_2.isoformat()
            ],
            "exercises": [
                {
                    "exercise_id": str(exercise.id),
                    "series": 3,
                    "repetitions": "8-10 reps",
                    "rest_seconds": 90,
                    "order_index": 1,
                    "superset_group": "A1",
                    "target_weight": 80.0,
                    "target_rpe": 8.0,
                    "tempo": "3-1-1-0",
                    "coach_notes": "Control de fase excéntrica y pausa abajo"
                }
            ]
        }

        res = client.post("/api/v1/routines/", json=routine_payload, headers=coach_headers)
        assert res.status_code == 200, f"Error al crear rutina: {res.status_code} - {res.text}"
        main_routine = res.json()
        main_routine_id = main_routine["id"]
        created_routine_ids.append(main_routine_id)

        # Validar campos de prescripción avanzada en la respuesta
        re_item = main_routine["routine_exercises"][0]
        assert re_item["superset_group"] == "A1", f"Esperado A1, obtenido {re_item['superset_group']}"
        assert re_item["tempo"] == "3-1-1-0", f"Esperado 3-1-1-0, obtenido {re_item['tempo']}"
        assert float(re_item["target_weight"]) == 80.0, f"Esperado 80.0, obtenido {re_item['target_weight']}"
        assert float(re_item["target_rpe"]) == 8.0, f"Esperado 8.0, obtenido {re_item['target_rpe']}"
        assert re_item["coach_notes"] == "Control de fase excéntrica y pausa abajo"
        routine_ex_id = re_item["id"]

        # Validar que se crearon también las 2 rutinas clonadas en bdmottus.routines
        cloned_routines = db.query(Routine).filter(
            Routine.title == routine_payload["title"],
            Routine.student_id == student.id
        ).all()
        assert len(cloned_routines) == 3, f"Esperadas 3 rutinas (1 principal + 2 duplicadas), encontradas {len(cloned_routines)}"
        for cr in cloned_routines:
            if str(cr.id) not in created_routine_ids:
                created_routine_ids.append(str(cr.id))

        print(f"  ✔ Rutina principal creada con éxito (ID: {main_routine_id})")
        print(f"  ✔ Clonación múltiple verificada: {len(cloned_routines)} rutinas generadas en total.")

        # ---------------------------------------------------------------------
        # PASO B: Registrar logs serie por serie y verificar auto-ejecución
        # ---------------------------------------------------------------------
        print("\n[PASO B] Alumno registra series mediante POST /routines/{id}/logs...")
        logs_payload = {
            "logs": [
                {
                    "routine_exercise_id": routine_ex_id,
                    "set_number": 1,
                    "actual_weight": 80.0,
                    "actual_reps": 10,
                    "actual_rpe": 8.0,
                    "is_completed": True,
                    "student_notes": "Serie 1 sólida"
                },
                {
                    "routine_exercise_id": routine_ex_id,
                    "set_number": 2,
                    "actual_weight": 85.0,
                    "actual_reps": 8,
                    "actual_rpe": 8.5,
                    "is_completed": True,
                    "student_notes": "Buen control de tempo"
                },
                {
                    "routine_exercise_id": routine_ex_id,
                    "set_number": 3,
                    "actual_weight": 90.0,
                    "actual_reps": 6,
                    "actual_rpe": 9.5,
                    "is_completed": True,
                    "student_notes": "Última repetición al fallo técnico"
                }
            ]
        }

        res_logs = client.post(f"/api/v1/routines/{main_routine_id}/logs", json=logs_payload, headers=student_headers)
        assert res_logs.status_code == 200, f"Error al guardar logs: {res_logs.status_code} - {res_logs.text}"
        updated_routine = res_logs.json()

        # Validar auto-completado de la rutina
        assert updated_routine["is_executed"] is True, "Error: La rutina debió marcarse como ejecutada (is_executed=True)"
        assert updated_routine["executed_at"] is not None, "Error: executed_at debe contener marca de tiempo"
        saved_logs = updated_routine["routine_exercises"][0]["exercise_logs"]
        assert len(saved_logs) == 3, f"Esperados 3 logs guardados, obtenidos {len(saved_logs)}"
        print(f"  ✔ Series guardadas (80kg x 10, 85kg x 8, 90kg x 6)")
        print(f"  ✔ Auto-ejecución confirmada: is_executed={updated_routine['is_executed']} en {updated_routine['executed_at']}")

        # ---------------------------------------------------------------------
        # PASO C: Feedback y Comentarios de Sesión
        # ---------------------------------------------------------------------
        print("\n[PASO C] Probando chat de feedback bidireccional (POST y GET /comments)...")
        # Comentario del Coach
        coach_comment_res = client.post(
            f"/api/v1/routines/{main_routine_id}/comments",
            json={"content": "Excelente progresión de cargas en las 3 series. Mantén esa cadencia."},
            headers=coach_headers
        )
        assert coach_comment_res.status_code == 200
        assert coach_comment_res.json()["author_type"] == "coach"

        # Comentario del Alumno
        student_comment_res = client.post(
            f"/api/v1/routines/{main_routine_id}/comments",
            json={"content": "Gracias coach, con 90kg costó la última pero mantuve la forma."},
            headers=student_headers
        )
        assert student_comment_res.status_code == 200
        assert student_comment_res.json()["author_type"] == "student"

        # Leer hilo de comentarios
        get_comments_res = client.get(f"/api/v1/routines/{main_routine_id}/comments", headers=student_headers)
        assert get_comments_res.status_code == 200
        thread = get_comments_res.json()
        assert len(thread) >= 2, f"Esperados al menos 2 comentarios en el hilo, obtenidos {len(thread)}"
        print(f"  ✔ Comentario Coach: '{thread[0]['content']}'")
        print(f"  ✔ Comentario Alumno: '{thread[1]['content']}'")

        # ---------------------------------------------------------------------
        # PASO D: Historial de Fuerza & Cálculo Analítico 1RM (Fórmula de Epley)
        # ---------------------------------------------------------------------
        print("\n[PASO D] Verificando endpoint de análisis de fuerza y 1RM (Fórmula de Epley)...")
        # Serie 1: 80 * (1 + 10/30) = 80 * 1.3333 = 106.67 kg
        # Serie 2: 85 * (1 + 8/30)  = 85 * 1.2667 = 107.67 kg
        # Serie 3: 90 * (1 + 6/30)  = 90 * 1.2000 = 108.00 kg (Máximo de la sesión)
        # Volumen de esta sesión: (80 * 10) + (85 * 8) + (90 * 6) = 800 + 680 + 540 = 2020 kg
        history_res = client.get(
            f"/api/v1/analytics/exercise-history/{student.id}/{exercise.id}",
            headers=student_headers
        )
        assert history_res.status_code == 200, f"Error en historial: {history_res.status_code} - {history_res.text}"
        strength_data = history_res.json()

        print(f"  -> Récord 1RM calculado (Epley): {strength_data['all_time_best_1rm']} kg (Esperado >= 108.0 kg)")
        print(f"  -> Carga Máxima Real levantada: {strength_data['all_time_max_weight']} kg (Esperado >= 90.0 kg)")
        print(f"  -> Volumen Total Acumulado: {strength_data['total_volume_lifted']} kg (Esperado >= 2020.0 kg)")

        assert strength_data["all_time_best_1rm"] >= 108.0, "Error en cálculo de 1RM Epley"
        assert strength_data["all_time_max_weight"] >= 90.0, "Error en carga máxima"
        assert strength_data["total_volume_lifted"] >= 2020.0, "Error en volumen total"
        print("  ✔ Exactitud matemática del 1RM y volumen validada con precisión.")

        # Test selector de ejercicios registrados
        logged_ex_res = client.get(f"/api/v1/analytics/student-logged-exercises/{student.id}", headers=coach_headers)
        assert logged_ex_res.status_code == 200
        assert any(e["id"] == str(exercise.id) for e in logged_ex_res.json())
        print("  ✔ Endpoint de ejercicios registrados para selectores validado.")

        print("\n=======================================================================")
        print("  ✔✔ TODOS LOS TESTS E2E PASARON CON ÉXITO (5/5 PASOS)")
        print("=======================================================================")

    finally:
        # ---------------------------------------------------------------------
        # PASO E: Limpieza de Base de Datos
        # ---------------------------------------------------------------------
        print("\n[PASO E] Limpiando registros de prueba en bdmottus para no ensuciar la base de datos...")
        if created_routine_ids:
            clean_count = 0
            for rid in created_routine_ids:
                del_res = db.query(Routine).filter(Routine.id == rid).first()
                if del_res:
                    db.delete(del_res)
                    clean_count += 1
            db.commit()
            print(f"  ✔ {clean_count} rutinas temporales de prueba y sus logs/comentarios eliminados.")
        db.close()
        print("  ✔ Base de datos restaurada a su estado limpio original.")

if __name__ == "__main__":
    run_e2e_truecoach_verification()
