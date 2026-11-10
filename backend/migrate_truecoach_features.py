import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno de backend/.env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Intentar primero con dbmasteruser (propietario DDL) o usr_mottus
DB_HOST = os.getenv('DB_HOST', 'ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com')
DB_PORT = int(os.getenv('DB_PORT', 5432))
DB_NAME = os.getenv('DB_NAME', 'postgres')
DB_USER = 'dbmasteruser'
DB_PASS = 'aDxD*,r.lNk`5lY8eN+^ABk3T+*97W`N'

print(f"Connecting to PostgreSQL database '{DB_NAME}' on {DB_HOST}:{DB_PORT} as {DB_USER}...")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        sslmode='require'
    )
except Exception as e:
    print(f"Connection as {DB_USER} failed ({e}), attempting fallback as usr_mottus...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=os.getenv('DB_USER', 'usr_mottus'),
        password=os.getenv('DB_PASSWORD', 'M0ttus#Gym_2026_SecPass!'),
        sslmode='require'
    )

conn.autocommit = True
cur = conn.cursor()

print("--- EJECUTANDO MIGRACIÓN: TRUECOACH ADVANCED FEATURES (FASE 1) ---")

# 1. Ampliar bdmottus.routine_exercises con prescripción avanzada
print("1. Agregando columnas de prescripción avanzada a bdmottus.routine_exercises...")
cur.execute("""
    ALTER TABLE bdmottus.routine_exercises
    ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS superset_group VARCHAR(10),
    ADD COLUMN IF NOT EXISTS target_weight NUMERIC(6, 2),
    ADD COLUMN IF NOT EXISTS target_rpe NUMERIC(3, 1),
    ADD COLUMN IF NOT EXISTS tempo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS coach_notes TEXT;
""")
print("   -> Columnas order_index, superset_group, target_weight, target_rpe, tempo, coach_notes agregadas con éxito.")

# 2. Crear tabla bdmottus.exercise_logs
print("2. Creando tabla bdmottus.exercise_logs para logging serie por serie...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS bdmottus.exercise_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        routine_exercise_id UUID NOT NULL REFERENCES bdmottus.routine_exercises(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES bdmottus.students(id) ON DELETE CASCADE,
        set_number INTEGER NOT NULL,
        actual_weight NUMERIC(6, 2),
        actual_reps INTEGER,
        actual_rpe NUMERIC(3, 1),
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        student_notes TEXT,
        logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_routine_ex_set UNIQUE (routine_exercise_id, set_number)
    );
""")
cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_routine_ex_set ON bdmottus.exercise_logs (routine_exercise_id, set_number);
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_student_date ON bdmottus.exercise_logs (student_id, logged_at DESC);
""")
print("   -> Tabla e índices para bdmottus.exercise_logs creados con éxito.")

# 3. Crear tabla bdmottus.routine_comments
print("3. Creando tabla bdmottus.routine_comments para feedback bidireccional...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS bdmottus.routine_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        routine_id UUID NOT NULL REFERENCES bdmottus.routines(id) ON DELETE CASCADE,
        author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('coach', 'student')),
        author_id UUID NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
""")
cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_routine_comments_routine_created ON bdmottus.routine_comments (routine_id, created_at ASC);
""")
print("   -> Tabla e índices para bdmottus.routine_comments creados con éxito.")

# 4. Asegurar privilegios para usr_mottus
print("4. Otorgando permisos a usr_mottus sobre los nuevos objetos...")
cur.execute("""
    GRANT ALL PRIVILEGES ON TABLE bdmottus.exercise_logs TO usr_mottus;
    GRANT ALL PRIVILEGES ON TABLE bdmottus.routine_comments TO usr_mottus;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;
""")
print("   -> Permisos aplicados con éxito.")

cur.close()
conn.close()
print("--- MIGRACIÓN TRUECOACH COMPLETADA CON ÉXITO AL 100% ---")
