import os
import psycopg2
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

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

print("--- EJECUTANDO MIGRACIÓN: TRUECOACH FASE 2 (PLANTILLAS, HÁBITOS, MEMBRESÍAS) ---")

# 1. Tablas para Plantillas de Entrenamiento (Workout Templates)
print("1. Creando tablas bdmottus.routine_templates y bdmottus.routine_template_exercises...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS bdmottus.routine_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_id UUID REFERENCES bdmottus.users(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category_tag VARCHAR(50) DEFAULT 'General',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS bdmottus.routine_template_exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES bdmottus.routine_templates(id) ON DELETE CASCADE,
        exercise_id UUID NOT NULL REFERENCES bdmottus.exercises(id) ON DELETE CASCADE,
        order_index INTEGER DEFAULT 1,
        superset_group VARCHAR(10),
        series INTEGER DEFAULT 3,
        repetitions VARCHAR(50) DEFAULT '12 reps',
        rest_seconds INTEGER DEFAULT 60,
        target_weight NUMERIC(6, 2),
        target_rpe NUMERIC(3, 1),
        tempo VARCHAR(20),
        coach_notes TEXT
    );
""")

cur.execute("""
    ALTER TABLE bdmottus.routine_template_exercises
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
""")

cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON bdmottus.routine_template_exercises (template_id, order_index);
""")
print("   -> Tablas de plantillas creadas con éxito.")

# 2. Ampliar bdmottus.students con metas de nutrición, hábitos y membresía
print("2. Agregando columnas de membresía y metas diarias a bdmottus.students...")
cur.execute("""
    ALTER TABLE bdmottus.students
    ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100) DEFAULT 'Plan Mensual Mottus',
    ADD COLUMN IF NOT EXISTS membership_expires_at DATE,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS daily_kcal_target INTEGER,
    ADD COLUMN IF NOT EXISTS daily_protein_target INTEGER,
    ADD COLUMN IF NOT EXISTS daily_steps_target INTEGER,
    ADD COLUMN IF NOT EXISTS daily_water_liters_target NUMERIC(3, 1);
""")
print("   -> Columnas de plan y metas nutricionales agregadas a bdmottus.students.")

# 3. Crear tabla bdmottus.habit_logs para registro de hábitos diarios
print("3. Creando tabla bdmottus.habit_logs para registro de nutrición y hábitos...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS bdmottus.habit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES bdmottus.students(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        kcal_consumed INTEGER,
        protein_grams INTEGER,
        steps_count INTEGER,
        water_liters NUMERIC(3, 1),
        sleep_hours NUMERIC(3, 1),
        completed_habits BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_student_habit_date UNIQUE (student_id, log_date)
    );
""")

cur.execute("""
    ALTER TABLE bdmottus.habit_logs
    ADD COLUMN IF NOT EXISTS steps INTEGER,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
""")

cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_habit_logs_student_date ON bdmottus.habit_logs (student_id, log_date DESC);
""")
print("   -> Tabla bdmottus.habit_logs e índice creados con éxito.")

# 4. Asegurar privilegios para usr_mottus
print("4. Otorgando permisos sobre los nuevos objetos a usr_mottus...")
cur.execute("""
    GRANT ALL PRIVILEGES ON TABLE bdmottus.routine_templates TO usr_mottus;
    GRANT ALL PRIVILEGES ON TABLE bdmottus.routine_template_exercises TO usr_mottus;
    GRANT ALL PRIVILEGES ON TABLE bdmottus.habit_logs TO usr_mottus;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;
""")
print("   -> Permisos aplicados con éxito.")

cur.close()
conn.close()
print("--- MIGRACIÓN TRUECOACH FASE 2 COMPLETADA EXITOSAMENTE AL 100% ---")
