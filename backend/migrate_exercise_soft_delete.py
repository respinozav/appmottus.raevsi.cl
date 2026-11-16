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

print(f"Conectando a PostgreSQL '{DB_NAME}' en {DB_HOST}:{DB_PORT}...")

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
    print(f"Fallo conexión como {DB_USER} ({e}), reintentando como usr_mottus...")
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

print("--- EJECUTANDO MIGRACIÓN: IS_ACTIVE EN BDMOTTUS.EXERCISES ---")

cur.execute("SET search_path TO bdmottus, public;")

# 1. Agregar columna is_active con DEFAULT TRUE
print("1. Agregando columna is_active a bdmottus.exercises si no existe...")
cur.execute("""
    ALTER TABLE bdmottus.exercises
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
""")
print("   -> Columna is_active verificada/agregada exitosamente.")

# 2. Conceder permisos
print("2. Verificando permisos para usr_mottus...")
cur.execute("""
    GRANT ALL PRIVILEGES ON TABLE bdmottus.exercises TO usr_mottus;
""")
print("   -> Permisos concedidos a usr_mottus.")

# 3. Contar registros activos
cur.execute("SELECT COUNT(*) FROM bdmottus.exercises WHERE is_active = TRUE;")
active_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM bdmottus.exercises WHERE is_active = FALSE;")
inactive_count = cur.fetchone()[0]

print(f"\nEstado actual de ejercicios:")
print(f" - Ejercicios activos (is_active = TRUE): {active_count}")
print(f" - Ejercicios archivados (is_active = FALSE): {inactive_count}")

cur.close()
conn.close()
print("--- MIGRACIÓN COMPLETADA EXITOSAMENTE ---")
