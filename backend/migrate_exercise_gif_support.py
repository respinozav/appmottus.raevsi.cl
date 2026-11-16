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

print("--- EJECUTANDO MIGRACIÓN: GIF_URL EN BDMOTTUS.EXERCISES ---")

cur.execute("SET search_path TO bdmottus, public;")

# 1. Agregar columna gif_url si no existe
print("1. Agregando columna gif_url a bdmottus.exercises si no existe...")
cur.execute("""
    ALTER TABLE bdmottus.exercises
    ADD COLUMN IF NOT EXISTS gif_url VARCHAR(500);
""")
print("   -> Columna gif_url verificada/agregada exitosamente.")

# 2. Conceder permisos
print("2. Verificando permisos para usr_mottus...")
cur.execute("""
    GRANT ALL PRIVILEGES ON TABLE bdmottus.exercises TO usr_mottus;
""")
print("   -> Permisos concedidos a usr_mottus.")

# 3. Mostrar estructura
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'bdmottus' AND table_name = 'exercises'
    ORDER BY ordinal_position;
""")
columns = cur.fetchall()
print("\nEstructura actual de bdmottus.exercises:")
for col in columns:
    print(f" - {col[0]}: {col[1]} (Nullable: {col[2]})")

cur.close()
conn.close()
print("\n--- MIGRACIÓN GIF_URL COMPLETADA EXITOSAMENTE AL 100% ---")
