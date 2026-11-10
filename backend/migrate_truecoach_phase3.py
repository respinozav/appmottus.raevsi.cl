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

print("--- EJECUTANDO MIGRACIÓN: TRUECOACH FASE 3 (PARIDAD DEFINITIVA) ---")

# 1. Warm-up, Cool-down, Coach Review y Workout Formats
print("1. Ampliando routines, routine_templates, routine_exercises y routine_template_exercises...")
cur.execute("""
    ALTER TABLE bdmottus.routines
    ADD COLUMN IF NOT EXISTS warmup_notes TEXT,
    ADD COLUMN IF NOT EXISTS cooldown_notes TEXT,
    ADD COLUMN IF NOT EXISTS is_reviewed_by_coach BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS coach_reviewed_at TIMESTAMP WITH TIME ZONE;
""")

cur.execute("""
    ALTER TABLE bdmottus.routine_templates
    ADD COLUMN IF NOT EXISTS warmup_notes TEXT,
    ADD COLUMN IF NOT EXISTS cooldown_notes TEXT,
    ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS day_of_week INTEGER DEFAULT 1;
""")

cur.execute("""
    ALTER TABLE bdmottus.routine_exercises
    ADD COLUMN IF NOT EXISTS block_section VARCHAR(20) DEFAULT 'main',
    ADD COLUMN IF NOT EXISTS workout_format VARCHAR(30) DEFAULT 'regular';
""")

cur.execute("""
    ALTER TABLE bdmottus.routine_template_exercises
    ADD COLUMN IF NOT EXISTS block_section VARCHAR(20) DEFAULT 'main',
    ADD COLUMN IF NOT EXISTS workout_format VARCHAR(30) DEFAULT 'regular';
""")
print("   -> Bloques de sesión y formatos aplicados con éxito.")

# 2. Ficha Clínica del Alumno en bdmottus.students
print("2. Ampliando bdmottus.students con Ficha Clínica (lesiones, metas, equipamiento, notas privadas)...")
cur.execute("""
    ALTER TABLE bdmottus.students
    ADD COLUMN IF NOT EXISTS injuries_notes TEXT,
    ADD COLUMN IF NOT EXISTS fitness_goals TEXT,
    ADD COLUMN IF NOT EXISTS equipment_available TEXT,
    ADD COLUMN IF NOT EXISTS private_coach_notes TEXT;
""")
print("   -> Ficha clínica agregada a bdmottus.students.")

# 3. Perímetros anatómicos y Fotos en bdmottus.body_metrics
print("3. Ampliando bdmottus.body_metrics con perímetros y fotos de progreso...")
cur.execute("""
    ALTER TABLE bdmottus.body_metrics
    ADD COLUMN IF NOT EXISTS waist_cm NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS hip_cm NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS chest_cm NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS arm_cm NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS thigh_cm NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS photo_front_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_side_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_back_url TEXT;
""")
print("   -> Perímetros y fotos agregados a bdmottus.body_metrics.")

# 4. Tabla de Mensajería Directa 1 a 1 (Direct Inbox)
print("4. Creando tabla bdmottus.direct_messages...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS bdmottus.direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES bdmottus.students(id) ON DELETE CASCADE,
        coach_id UUID NOT NULL REFERENCES bdmottus.users(id) ON DELETE CASCADE,
        sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('coach', 'student')),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
""")

cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation 
    ON bdmottus.direct_messages (student_id, coach_id, created_at ASC);
""")

cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_direct_messages_unread 
    ON bdmottus.direct_messages (student_id, coach_id, is_read) 
    WHERE is_read = FALSE;
""")
print("   -> Tabla de mensajería directa creada con éxito.")

# 5. Permisos sobre los nuevos objetos
print("5. Otorgando permisos sobre nuevos objetos a usr_mottus...")
cur.execute("""
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bdmottus TO usr_mottus;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;
""")
print("   -> Permisos aplicados.")

print("--- MIGRACIÓN TRUECOACH FASE 3 COMPLETADA EXITOSAMENTE AL 100% ---")
cur.close()
conn.close()

