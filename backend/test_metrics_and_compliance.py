import requests
import sys
import time

BASE_URL = "http://127.0.0.1:8006/api/v1"

def test_metrics_and_compliance():
    print("--- INICIANDO TEST DE MÉTRICAS Y CUMPLIMIENTO ---")
    
    # 1. Login Coach
    print("1. Autenticando Coach...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"identifier": "2-7", "password": "Coach123!"})
    if res.status_code != 200:
        print("Error login coach:", res.text)
        sys.exit(1)
    coach_token = res.json()["access_token"]
    coach_headers = {"Authorization": f"Bearer {coach_token}"}
    print("   -> Coach autenticado!")

    # 2. Obtener lista de alumnos
    print("2. Buscando alumnos...")
    res = requests.get(f"{BASE_URL}/users/students", headers=coach_headers)
    students = res.json()
    if not students:
        print("No se encontraron alumnos para la prueba.")
        sys.exit(1)
    test_student = students[0]
    student_id = test_student["id"]
    print(f"   -> Alumno seleccionado: {test_student['name']} ({test_student['rut']}, ID: {student_id})")

    # 3. Coach registra métrica corporal para el alumno
    print("3. Coach registra evaluación antropométrica...")
    res = requests.post(f"{BASE_URL}/metrics/student/{student_id}", headers=coach_headers, json={
        "weight": 79.5,
        "height": 178.0,
        "body_fat_percentage": 16.2,
        "muscle_mass": 36.4,
        "notes": "Evaluación mensual en sede. Buena evolución en masa magra."
    })
    if res.status_code != 200:
        print("Error registrando métrica por Coach:", res.text)
        sys.exit(1)
    metric_coach = res.json()
    print(f"   -> Métrica registrada. IMC calculado: {metric_coach['bmi']} kg/m²")

    # 4. Login Alumno (si tiene clave) o consultar métricas del alumno
    print("4. Coach consulta historial de métricas del alumno...")
    res = requests.get(f"{BASE_URL}/metrics/student/{student_id}", headers=coach_headers)
    metrics_list = res.json()
    print(f"   -> Total mediciones históricas del alumno: {len(metrics_list)}")
    assert len(metrics_list) >= 1

    # 5. Coach consulta Dashboard de Estadísticas de Cumplimiento
    print("5. Coach consulta Dashboard de Cumplimiento...")
    res = requests.get(f"{BASE_URL}/analytics/coach-compliance", headers=coach_headers)
    if res.status_code != 200:
        print("Error obteniendo analítica:", res.text)
        sys.exit(1)
    stats = res.json()
    print(f"   -> Total Rutinas: {stats['total_routines']}")
    print(f"   -> Rutinas Ejecutadas: {stats['executed_routines']}")
    print(f"   -> Rutinas Pendientes: {stats['pending_routines']}")
    print(f"   -> Tasa Global de Cumplimiento: {stats['overall_compliance_rate']}%")
    print(f"   -> Alumnos Evaluados: {len(stats['students_summary'])}")
    print(f"   -> Puntos en Timeline: {len(stats['timeline'])}")

    print("\n¡TODAS LAS PRUEBAS DE MÉTRICAS Y CUMPLIMIENTO PASARON EXITOSAMENTE!")

if __name__ == "__main__":
    test_metrics_and_compliance()
