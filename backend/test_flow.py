import requests
import sys

BASE_URL = "http://127.0.0.1:8006/api/v1"

def test_flow():
    print("1. Probando Login de Coach (2-7)...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"identifier": "2-7", "password": "Coach123!"})
    if res.status_code != 200:
        print(f"Error login coach: {res.status_code} - {res.text}")
        sys.exit(1)
    coach_token = res.json()["access_token"]
    coach_headers = {"Authorization": f"Bearer {coach_token}"}
    print("   -> Coach autenticado correctamente!")

    print("2. Consultando Categorías...")
    res = requests.get(f"{BASE_URL}/categories/", headers=coach_headers)
    categories = res.json()
    print(f"   -> Categorías encontradas: {len(categories)}")
    cat_id = categories[0]["id"]

    print("3. Creando Ejercicio de prueba con YouTube URL...")
    res = requests.post(f"{BASE_URL}/exercises/", headers=coach_headers, json={
        "category_id": cat_id,
        "name": "Sentadilla Libre Profunda",
        "description": "Mantener pecho erguido, rodillas alineadas con la punta de los pies.",
        "youtube_url": "https://www.youtube.com/watch?v=aclHkVaku9U"
    })
    if res.status_code != 200:
        print(f"Error creando ejercicio: {res.status_code} - {res.text}")
        sys.exit(1)
    exercise = res.json()
    print(f"   -> Ejercicio creado: {exercise['name']} (ID: {exercise['id']})")

    print("4. Coach invita alumno por RUT...")
    import time
    student_rut = f"19{int(time.time()) % 10000000}-K"
    res = requests.post(f"{BASE_URL}/users/invite-by-rut", headers=coach_headers, json={"rut": student_rut})
    invite_data = res.json()
    token = invite_data["registration_token"]
    print(f"   -> Enlace generado: {invite_data['registration_url']}")

    print("5. Alumno completa registro con token...")
    student_email = f"matias_{int(time.time())}@mottus.cl"
    res = requests.post(f"{BASE_URL}/users/complete-registration", json={
        "token": token,
        "name": "Matías Silva",
        "gender": "Masculino",
        "phone": "+56987654321",
        "password": "MatiasPassword123!",
        "weight": 82.5,
        "height": 178.0,
        "email": student_email
    })
    if res.status_code != 200:
        print(f"Error activando alumno: {res.status_code} - {res.text}")
        sys.exit(1)
    student = res.json()
    student_id = student["id"]
    print(f"   -> Alumno registrado y activado: {student['name']} (ID: {student_id})")

    print("6. Coach asigna rutina al alumno...")
    res = requests.post(f"{BASE_URL}/routines/", headers=coach_headers, json={
        "user_id": student_id,
        "title": "Día 1: Fuerza de Piernas",
        "scheduled_at": "2026-09-09T10:00:00Z",
        "notes": "Controlar la fase excéntrica en cada repetición.",
        "exercises": [
            {
                "exercise_id": exercise["id"],
                "series": 4,
                "repetitions": "8 reps",
                "rest_seconds": 90
            }
        ]
    })
    if res.status_code != 200:
        print(f"Error asignando rutina: {res.status_code} - {res.text}")
        sys.exit(1)
    routine = res.json()
    routine_id = routine["id"]
    print(f"   -> Rutina asignada con éxito: {routine['title']} (ID: {routine_id})")

    print("7. Login del alumno y consulta de sus rutinas...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"identifier": student_rut, "password": "MatiasPassword123!"})
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    res = requests.get(f"{BASE_URL}/routines/my-routines", headers=student_headers)
    my_routines = res.json()
    print(f"   -> Rutinas encontradas para el alumno: {len(my_routines)}")

    print("8. Alumno marca la rutina como ejecutada...")
    res = requests.patch(f"{BASE_URL}/routines/{routine_id}/toggle-execution", headers=student_headers, json={
        "is_executed": True
    })
    updated_routine = res.json()
    print(f"   -> Estado de ejecución actualizado: {updated_routine['is_executed']} a las {updated_routine['executed_at']}")

    print("9. Alumno registra una métrica corporal...")
    res = requests.post(f"{BASE_URL}/metrics/my-metrics", headers=student_headers, json={
        "weight": 83.2,
        "notes": "Progreso post-entrenamiento pierna"
    })
    if res.status_code != 200:
        print(f"Error registrando métrica: {res.status_code} - {res.text}")
        sys.exit(1)
    metric = res.json()
    print(f"   -> Métrica registrada para student_id: {metric['student_id']} (Peso: {metric['weight']} kg, IMC: {metric.get('bmi')})")

    print("10. Coach consulta analítica y cumplimiento...")
    res = requests.get(f"{BASE_URL}/analytics/coach-compliance", headers=coach_headers)
    if res.status_code != 200:
        print(f"Error en analítica: {res.status_code} - {res.text}")
        sys.exit(1)
    analytics_data = res.json()
    print(f"   -> Alumnos totales: {analytics_data['total_students']}, Rutinas totales: {analytics_data['total_routines']}, Cumplimiento: {analytics_data['overall_compliance_rate']}%")

    print("\nTODAS LAS PRUEBAS DE LA ARQUITECTURA COMPLETADAS CON ÉXITO AL 100%!")

if __name__ == "__main__":
    test_flow()
