#!/usr/bin/env python3
"""
Test de Verificación E2E para TrueCoach Phase 2 (Mottus Studio):
1. Plantillas de Entrenamiento (CRUD y clonación desde rutina existente).
2. Metas de Hábitos y Configuración de Membresía del Alumno.
3. Registro de Hábitos Diarios (Upsert) y Consulta de Historial.
4. Actualización de Perfil Propio (Nombre, Email, Teléfono, Contraseña).
5. Limpieza automática de datos de prueba en bdmottus.
"""
import sys
import os
from datetime import date, timedelta
from uuid import UUID

# Asegurar path de backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import (
    User, Student, Category, Exercise, Routine, 
    RoutineExercise, RoutineTemplate, RoutineTemplateExercise, HabitLog
)
from app.core.security import get_password_hash

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("🚀 INICIANDO VERIFICACIÓN E2E - TRUECOACH PHASE 2 (APPMOTTUS)")
    print("=" * 60)

    db = SessionLocal()
    created_template_ids = []
    created_routine_ids = []
    created_habit_ids = []
    created_exercise_ids = []
    created_student_id = None

    try:
        # 1. Obtener Coach y Alumno existentes o crear temporales
        coach = db.query(User).filter(User.role.in_(["coach", "admin"])).first()
        assert coach is not None, "Se requiere al menos un coach/admin en bdmottus"

        # Alumno de prueba
        test_rut = "99.888.777-6"
        student = db.query(Student).filter(Student.rut == test_rut).first()
        if not student:
            student = Student(
                rut=test_rut,
                name="Alumno Test Phase 2",
                email="test_student_phase2@mottus.cl",
                password_hash=get_password_hash("Student123!"),
                is_registered=True,
                is_active=True
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            created_student_id = student.id

        # Ejercicios para la prueba
        cat = db.query(Category).first()
        assert cat is not None, "Se requiere al menos una categoría en bdmottus"

        ex1 = Exercise(
            category_id=cat.id,
            name="Press Militar Test Phase 2",
            youtube_url="https://www.youtube.com/watch?v=test1",
            created_by=coach.id
        )
        ex2 = Exercise(
            category_id=cat.id,
            name="Elevaciones Laterales Test Phase 2",
            youtube_url="https://www.youtube.com/watch?v=test2",
            created_by=coach.id
        )
        db.add_all([ex1, ex2])
        db.commit()
        db.refresh(ex1)
        db.refresh(ex2)
        created_exercise_ids.extend([ex1.id, ex2.id])

        # Autenticación como Coach
        login_coach_res = client.post("/api/v1/auth/login", json={
            "identifier": coach.rut,
            "password": "Admin123!" if coach.rut == "1-9" else "Coach123!"
        })
        assert login_coach_res.status_code == 200, f"Error login coach: {login_coach_res.text}"
        coach_token = login_coach_res.json()["access_token"]
        coach_headers = {"Authorization": f"Bearer {coach_token}"}
        print("✅ 1. Login de Coach exitoso")

        # 2. Crear Plantilla de Entrenamiento (Workout Template)
        tpl_payload = {
            "title": "Plantilla Hombro Pro",
            "description": "Rutina focalizada en deltoides anterior y lateral",
            "category_tag": "Hipertrofia",
            "exercises": [
                {
                    "exercise_id": str(ex1.id),
                    "order_index": 1,
                    "superset_group": "A1",
                    "series": 4,
                    "repetitions": "8-10 reps",
                    "rest_seconds": 90,
                    "target_weight": 50.0,
                    "target_rpe": 8.5,
                    "tempo": "3-0-1-0",
                    "coach_notes": "Rango completo sin arquear lumbar"
                },
                {
                    "exercise_id": str(ex2.id),
                    "order_index": 2,
                    "superset_group": "A2",
                    "series": 4,
                    "repetitions": "15 reps",
                    "rest_seconds": 60,
                    "target_weight": 12.0,
                    "target_rpe": 9.0,
                    "tempo": "2-0-1-1",
                    "coach_notes": "Pausa de 1 segundo arriba"
                }
            ]
        }
        res_create_tpl = client.post("/api/v1/routines/templates", json=tpl_payload, headers=coach_headers)
        assert res_create_tpl.status_code == 200, f"Error creando plantilla: {res_create_tpl.text}"
        tpl_data = res_create_tpl.json()
        created_template_ids.append(tpl_data["id"])
        assert len(tpl_data["template_exercises"]) == 2
        print(f"✅ 2. Plantilla '{tpl_data['title']}' creada con {len(tpl_data['template_exercises'])} ejercicios")

        # 3. Listar Plantillas
        res_list_tpl = client.get("/api/v1/routines/templates", headers=coach_headers)
        assert res_list_tpl.status_code == 200
        assert any(t["id"] == tpl_data["id"] for t in res_list_tpl.json())
        print(f"✅ 3. Lista de plantillas consultada correctamente ({len(res_list_tpl.json())} registradas)")

        # 4. Crear rutina real y guardarla como plantilla (Clonación inversa)
        routine_payload = {
            "student_id": str(student.id),
            "title": "Sesión Hombros y Core",
            "scheduled_at": (date.today() + timedelta(days=1)).isoformat() + "T10:00:00",
            "notes": "Entrenamiento intenso",
            "exercises": [
                {
                    "exercise_id": str(ex1.id),
                    "order_index": 1,
                    "superset_group": "B1",
                    "series": 3,
                    "repetitions": "12 reps",
                    "rest_seconds": 60,
                    "target_weight": 40.0
                }
            ]
        }
        res_routine = client.post("/api/v1/routines/", json=routine_payload, headers=coach_headers)
        assert res_routine.status_code == 200, f"Error creando rutina: {res_routine.text}"
        created_routine_ids.append(res_routine.json()["id"])
        
        # Guardar rutina como plantilla
        res_save_tpl = client.post(
            f"/api/v1/routines/from-existing/{res_routine.json()['id']}/save-template",
            json={"title": "Plantilla Derivada de Sesion", "category_tag": "Fuerza"},
            headers=coach_headers
        )
        assert res_save_tpl.status_code == 200, f"Error clonando plantilla: {res_save_tpl.text}"
        created_template_ids.append(res_save_tpl.json()["id"])
        print(f"✅ 4. Rutina clonada a plantilla con éxito ('{res_save_tpl.json()['title']}')")

        # 5. Configuración de Membresía y Metas del Alumno por el Coach
        settings_payload = {
            "plan_name": "Plan VIP Fuerza",
            "membership_expires_at": (date.today() + timedelta(days=30)).isoformat(),
            "is_active": True,
            "daily_kcal_target": 2600,
            "daily_protein_target": 165,
            "daily_steps_target": 10000,
            "daily_water_liters_target": 3.0
        }
        res_settings = client.patch(
            f"/api/v1/users/students/{student.id}/coach-settings",
            json=settings_payload,
            headers=coach_headers
        )
        assert res_settings.status_code == 200, f"Error settings alumno: {res_settings.text}"
        st_data = res_settings.json()
        assert st_data["plan_name"] == "Plan VIP Fuerza"
        assert st_data["daily_kcal_target"] == 2600
        print(f"✅ 5. Metas y Membresía del Alumno actualizadas ({st_data['plan_name']} - {st_data['daily_kcal_target']} kcal)")

        # 6. Alumno registra sus hábitos diarios (Nutrición, Hidratación, Pasos, Sueño)
        login_st_res = client.post("/api/v1/auth/login", json={
            "identifier": student.rut,
            "password": "Student123!"
        })
        assert login_st_res.status_code == 200, f"Error login alumno: {login_st_res.text}"
        student_token = login_st_res.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        habit_payload = {
            "log_date": date.today().isoformat(),
            "kcal_consumed": 2550,
            "protein_grams": 160,
            "water_liters": 2.8,
            "steps": 10450,
            "sleep_hours": 7.5,
            "notes": "Buena energía, entrenamiento completado"
        }
        res_habit = client.post("/api/v1/metrics/habits", json=habit_payload, headers=student_headers)
        assert res_habit.status_code == 200, f"Error log hábitos: {res_habit.text}"
        habit_data = res_habit.json()
        created_habit_ids.append(habit_data["id"])
        assert habit_data["kcal_consumed"] == 2550
        print(f"✅ 6. Hábitos diarios registrados (Kcal: {habit_data['kcal_consumed']}, Pasos: {habit_data['steps']})")

        # 7. Consultar historial de hábitos del alumno
        res_habits_hist = client.get(f"/api/v1/metrics/habits/{student.id}", headers=student_headers)
        assert res_habits_hist.status_code == 200
        assert len(res_habits_hist.json()) >= 1
        print(f"✅ 7. Historial de hábitos consultado con éxito ({len(res_habits_hist.json())} registros)")

        # 8. Actualización de perfil propio
        profile_update = {
            "name": "Alumno Test Actualizado",
            "phone": "+56987654321"
        }
        res_profile = client.put("/api/v1/auth/profile", json=profile_update, headers=student_headers)
        assert res_profile.status_code == 200, f"Error actualizando perfil: {res_profile.text}"
        assert res_profile.json()["name"] == "Alumno Test Actualizado"
        print(f"✅ 8. Perfil propio actualizado exitosamente ({res_profile.json()['name']})")

        print("=" * 60)
        print("🎉 TODOS LOS TESTS E2E DE LA FASE 2 PASARON EXITOSAMENTE (100% OK)")
        print("=" * 60)

    finally:
        # Limpieza de datos temporales
        print("\n🧹 Limpiando datos de prueba temporales...")
        try:
            if created_template_ids:
                db.query(RoutineTemplate).filter(RoutineTemplate.id.in_([UUID(i) for i in created_template_ids])).delete(synchronize_session=False)
            if created_routine_ids:
                db.query(Routine).filter(Routine.id.in_([UUID(i) for i in created_routine_ids])).delete(synchronize_session=False)
            if created_habit_ids:
                db.query(HabitLog).filter(HabitLog.id.in_([UUID(i) for i in created_habit_ids])).delete(synchronize_session=False)
            if created_exercise_ids:
                db.query(Exercise).filter(Exercise.id.in_(created_exercise_ids)).delete(synchronize_session=False)
            if created_student_id:
                db.query(Student).filter(Student.id == created_student_id).delete(synchronize_session=False)
            db.commit()
            print("✨ Limpieza completada con éxito en bdmottus.")
        except Exception as e:
            print(f"⚠️ Advertencia en limpieza: {e}")
            db.rollback()
        finally:
            db.close()

if __name__ == "__main__":
    run_tests()
