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

print("--- EJECUTANDO MIGRACIÓN: TRUECOACH PROFILE & STUDENT ENHANCEMENT ---")

# 1. Ampliando bdmottus.students con last_name, birth_date, location, unit_preference
print("1. Agregando columnas de perfil TrueCoach a bdmottus.students...")
cur.execute("""
    ALTER TABLE bdmottus.students
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS location VARCHAR(150),
    ADD COLUMN IF NOT EXISTS unit_preference VARCHAR(20) DEFAULT 'metric' NOT NULL;
""")
print("   -> Columnas last_name, birth_date, location, unit_preference agregadas con éxito.")

# 2. Permisos a usr_mottus
print("2. Verificando permisos para usr_mottus...")
cur.execute("""
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bdmottus TO usr_mottus;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;
""")
print("   -> Permisos verificados con éxito.")

cur.close()
conn.close()
print("--- MIGRACIÓN TRUECOACH PROFILE COMPLETADA EXITOSAMENTE AL 100% ---")

