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

print("--- EJECUTANDO MIGRACIÓN: CATEGORÍAS MUSCULARES (IS_ACTIVE) ---")

# 1. Agregar columna is_active a bdmottus.categories
print("1. Agregando columna is_active a bdmottus.categories si no existe...")
cur.execute("""
    ALTER TABLE bdmottus.categories
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
""")
print("   -> Columna is_active agregada exitosamente.")

# 2. Asegurar que las categorías existentes estén activas
print("2. Asegurando que las categorías existentes tengan is_active = TRUE...")
cur.execute("""
    UPDATE bdmottus.categories
    SET is_active = TRUE
    WHERE is_active IS NULL;
""")
print("   -> Registros existentes validados.")

# 3. Permisos a usr_mottus
print("3. Verificando permisos para usr_mottus...")
cur.execute("""
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bdmottus TO usr_mottus;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;
""")
print("   -> Permisos verificados con éxito.")

# 4. Verificación de categorías actuales
cur.execute("""
    SELECT id, name, is_active FROM bdmottus.categories ORDER BY name ASC;
""")
rows = cur.fetchall()
print(f"   -> Categorías actuales en bdmottus ({len(rows)} encontradas):")
for r in rows:
    print(f"      - ID: {r[0]} | Nombre: {r[1]} | is_active: {r[2]}")

cur.close()
conn.close()
print("--- MIGRACIÓN CATEGORÍAS COMPLETADA EXITOSAMENTE AL 100% ---")

