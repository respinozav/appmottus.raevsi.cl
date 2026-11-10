import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.path.dirname(__file__))

import secrets
from starlette.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import User, Student
from app.core.security import create_access_token

client = TestClient(app)

def run_profile_test():
    print("=======================================================================")
    print("  QA & DEVOPS: VERIFICACIÓN E2E DE FICHA DE PERFIL TRUECOACH (APPMOTTUS)")
    print("=======================================================================")

    db = SessionLocal()
    test_student = None

    try:
        coach = db.query(User).filter(User.role == 'coach').first()
        assert coach is not None, "Error: No se encontró ningún coach"
        coach_token = create_access_token(subject=coach.id, role=coach.role)
        coach_headers = {"Authorization": f"Bearer {coach_token}"}

        # 1. Crear invitación para nuevo alumno de prueba
        test_rut = f"99{secrets.randbelow(899999)+100000}-K"
        print(f"\n[PASO 1] Coach invita a alumno con RUT de prueba: {test_rut}...")
        res = client.post("/api/v1/users/invite-by-rut", json={"rut": test_rut}, headers=coach_headers)
        assert res.status_code == 200, f"Error al invitar alumno: {res.text}"
        invite_data = res.json()
        token = invite_data["registration_token"]
        student_id = invite_data["id"]
        print(f"  ✔ Invitación creada. Token: {token}")

        # 2. Completar registro con todos los campos TrueCoach Profile
        print("\n[PASO 2] Alumno completa su registro con perfil TrueCoach...")
        complete_payload = {
            "token": token,
            "name": "Vicente",
            "last_name": "López Santander",
            "email": f"vicente_{secrets.token_hex(4)}@mottus.cl",
            "gender": "Masculino",
            "phone": "+56 9 8765 4321",
            "password": "Password123!",
            "birth_date": "1995-08-24",
            "location": "Viña del Mar, Chile",
            "unit_preference": "metric",
            "weight": 82.5,
            "height": 181.0
        }

        res = client.post("/api/v1/users/complete-registration", json=complete_payload)
        assert res.status_code == 200, f"Error al completar registro: {res.text}"
        registered_data = res.json()
        assert registered_data["name"] == "Vicente"
        assert registered_data["last_name"] == "López Santander"
        assert registered_data["birth_date"] == "1995-08-24"
        assert registered_data["location"] == "Viña del Mar, Chile"
        assert registered_data["unit_preference"] == "metric"
        assert float(registered_data["weight"]) == 82.5
        assert float(registered_data["height"]) == 181.0
        print("  ✔ Registro completado y campos TrueCoach guardados con éxito.")

        # 3. Iniciar sesión como alumno
        print("\n[PASO 3] Iniciando sesión como alumno...")
        login_res = client.post("/api/v1/auth/login", json={"identifier": test_rut, "password": "Password123!"})
        assert login_res.status_code == 200, f"Error al iniciar sesión: {login_res.text}"
        login_data = login_res.json()
        student_token = login_data["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print("  ✔ Sesión iniciada con éxito.")

        # 4. Consultar /auth/me
        print("\n[PASO 4] Consultando perfil actual en /auth/me...")
        me_res = client.get("/api/v1/auth/me", headers=student_headers)
        assert me_res.status_code == 200, f"Error en /auth/me: {me_res.text}"
        me_data = me_res.json()
        assert me_data["last_name"] == "López Santander"
        assert me_data["location"] == "Viña del Mar, Chile"
        assert me_data["unit_preference"] == "metric"
        print("  ✔ Perfil verificado con éxito en /auth/me.")

        # 5. Actualizar perfil desde el modal de usuario (PUT /auth/profile)
        print("\n[PASO 5] Actualizando perfil desde el modal del usuario...")
        update_payload = {
            "name": "Vicente Andrés",
            "last_name": "López S.",
            "location": "Concón, Chile",
            "unit_preference": "imperial",
            "weight": 182.0,
            "height": 71.2
        }
        update_res = client.put("/api/v1/auth/profile", json=update_payload, headers=student_headers)
        assert update_res.status_code == 200, f"Error en /auth/profile: {update_res.text}"
        updated_data = update_res.json()
        assert updated_data["name"] == "Vicente Andrés"
        assert updated_data["last_name"] == "López S."
        assert updated_data["location"] == "Concón, Chile"
        assert updated_data["unit_preference"] == "imperial"
        assert float(updated_data["weight"]) == 182.0
        assert float(updated_data["height"]) == 71.2
        print("  ✔ Perfil actualizado exitosamente vía /auth/profile.")

        print("\n" + "="*71)
        print("  TODAS LAS PRUEBAS DE PERFIL TRUECOACH PASARON CON ÉXITO AL 100%")
        print("="*71)

    finally:
        print("\n[LIMPIEZA] Eliminando alumno de prueba de bdmottus...")
        try:
            db.query(Student).filter(Student.rut == test_rut).delete()
            db.commit()
            print("  ✔ Alumno de prueba eliminado limpiamente.")
        except Exception as e:
            db.rollback()
            print(f"  ⚠ Advertencia en limpieza: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    run_profile_test()
