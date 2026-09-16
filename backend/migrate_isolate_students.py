import psycopg2

DB_HOST = 'ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com'
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'dbmasteruser'
DB_PASS = 'aDxD*,r.lNk`5lY8eN+^ABk3T+*97W`N'

conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS, sslmode='require')
conn.autocommit = True
cur = conn.cursor()

print("--- EJECUTANDO MIGRACION DB ---")

# 1. Crear tabla students
cur.execute("""
CREATE TABLE IF NOT EXISTS bdmottus.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    gender VARCHAR(20),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    weight NUMERIC(5, 2),
    height NUMERIC(5, 2),
    registration_token VARCHAR(255) UNIQUE,
    is_registered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
""")
print("1. Tabla bdmottus.students creada.")

# 2. Migrar registros de rol 'user' hacia students
cur.execute("""
INSERT INTO bdmottus.students (id, rut, email, name, gender, phone, password_hash, weight, height, registration_token, is_registered, created_at)
SELECT id, rut, email, name, gender, phone, password_hash, weight, height, registration_token, is_registered, created_at
FROM bdmottus.users
WHERE role = 'user'
ON CONFLICT (id) DO NOTHING;
""")
print("2. Registros migrados a bdmottus.students.")

# 3. FK en routines
cur.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'bdmottus' AND table_name = 'routines' AND column_name IN ('user_id', 'student_id');
""")
cols = [r[0] for r in cur.fetchall()]

cur.execute("ALTER TABLE bdmottus.routines DROP CONSTRAINT IF EXISTS routines_user_id_fkey;")
cur.execute("ALTER TABLE bdmottus.routines DROP CONSTRAINT IF EXISTS routines_student_id_fkey;")

if 'user_id' in cols and 'student_id' not in cols:
    cur.execute("ALTER TABLE bdmottus.routines RENAME COLUMN user_id TO student_id;")
    print("3a. Columna user_id renombrada a student_id en routines.")

cur.execute("""
    ALTER TABLE bdmottus.routines 
    ADD CONSTRAINT routines_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES bdmottus.students(id) ON DELETE CASCADE;
""")
print("3b. FK routines_student_id_fkey creada hacia bdmottus.students.")

# 4. FK en body_metrics
cur.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'bdmottus' AND table_name = 'body_metrics' AND column_name IN ('user_id', 'student_id');
""")
bm_cols = [r[0] for r in cur.fetchall()]

cur.execute("ALTER TABLE bdmottus.body_metrics DROP CONSTRAINT IF EXISTS body_metrics_user_id_fkey;")
cur.execute("ALTER TABLE bdmottus.body_metrics DROP CONSTRAINT IF EXISTS body_metrics_student_id_fkey;")

if 'user_id' in bm_cols and 'student_id' not in bm_cols:
    cur.execute("ALTER TABLE bdmottus.body_metrics RENAME COLUMN user_id TO student_id;")
    print("4a. Columna user_id renombrada a student_id en body_metrics.")

cur.execute("""
    ALTER TABLE bdmottus.body_metrics 
    ADD CONSTRAINT body_metrics_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES bdmottus.students(id) ON DELETE CASCADE;
""")
print("4b. FK body_metrics_student_id_fkey creada hacia bdmottus.students.")

# 5. Eliminar usuarios de rol 'user' de bdmottus.users
cur.execute("DELETE FROM bdmottus.user_roles WHERE user_id IN (SELECT id FROM bdmottus.users WHERE role = 'user');")
cur.execute("DELETE FROM bdmottus.users WHERE role = 'user';")
print("5. Alumnos eliminados de bdmottus.users.")

# 6. Remover vistas dependientes y columnas de peso, estatura y registro de bdmottus.users
cur.execute("DROP VIEW IF EXISTS bdmottus.vw_users CASCADE;")
cur.execute("""
    ALTER TABLE bdmottus.users 
    DROP COLUMN IF EXISTS weight,
    DROP COLUMN IF EXISTS height,
    DROP COLUMN IF EXISTS registration_token,
    DROP COLUMN IF EXISTS is_registered;
""")
print("6. Columnas de peso y estatura eliminadas de bdmottus.users.")

# 7. Restriccion de roles en bdmottus.users
cur.execute("ALTER TABLE bdmottus.users DROP CONSTRAINT IF EXISTS users_role_check;")
cur.execute("ALTER TABLE bdmottus.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'coach'));")
print("7. Restriccion de rol actualizada a solo 'admin' y 'coach'.")

# 8. Permisos
cur.execute("GRANT ALL PRIVILEGES ON TABLE bdmottus.students TO usr_mottus;")
print("8. Permisos otorgados sobre bdmottus.students.")

cur.close()
conn.close()
print("--- MIGRACION COMPLETADA CON EXITO AL 100% ---")
