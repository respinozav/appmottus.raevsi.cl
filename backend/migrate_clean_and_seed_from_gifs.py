import os
import json
import uuid
import psycopg2
from psycopg2.extras import execute_batch
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

print("\n=======================================================")
print("=== RESETEO Y POBLACIÓN DE CATEGORÍAS Y EJERCICIOS ===")
print("=======================================================\n")

cur.execute("SET search_path TO bdmottus, public;")

# 1. Asegurar esquema de tabla exercises (youtube_url NULLABLE, gif_url existente)
print("1. Ajustando constraints en bdmottus.exercises...")
cur.execute("""
    ALTER TABLE bdmottus.exercises
    ADD COLUMN IF NOT EXISTS gif_url VARCHAR(500);
""")
cur.execute("""
    ALTER TABLE bdmottus.exercises
    ALTER COLUMN youtube_url DROP NOT NULL;
""")
print("   -> youtube_url ahora es NULLABLE y gif_url está asegurado.")

# 2. Limpieza de datos previos
print("\n2. Limpiando datos antiguos de rutinas, plantillas, ejercicios y categorías...")
cur.execute("DELETE FROM bdmottus.routine_template_exercises;")
cur.execute("DELETE FROM bdmottus.routine_exercises;")
cur.execute("DELETE FROM bdmottus.exercises;")
cur.execute("DELETE FROM bdmottus.categories;")
print("   -> Limpieza completada con éxito.")

# 3. Creación de Categorías Oficiales
CATEGORIES_DATA = [
    ("Pecho", "Pectoral mayor, pectoral superior, fibras claviculares y esternales"),
    ("Espalda", "Dorsales, trapecios, romboides y erectores espinales"),
    ("Piernas", "Cuádriceps, isquiotibiales, glúteos, aductores, abductores y pantorrillas"),
    ("Hombros", "Deltoides anterior, lateral, posterior y manguito rotador"),
    ("Brazos", "Bíceps, tríceps, braquial y músculos del antebrazo"),
    ("Core", "Recto abdominal, oblicuos, transverso y estabilidad lumbar"),
    ("Cardio", "Acondicionamiento aeróbico, intervalos metabólicos y resistencia")
]

print("\n3. Creando las 7 categorías oficiales...")
category_map = {} # name -> UUID

for cat_name, cat_desc in CATEGORIES_DATA:
    cat_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO bdmottus.categories (id, name, description, is_active)
        VALUES (%s, %s, %s, TRUE)
        RETURNING id;
    """, (cat_id, cat_name, cat_desc))
    category_map[cat_name.lower()] = cat_id
    print(f"   [+] Categoría '{cat_name}' creada (ID: {cat_id})")

# 4. Mapeo de tutoriales populares de YouTube en español
YOUTUBE_TUTORIAL_PATTERNS = [
    # Pecho
    (["banca", "barra", "plano"], "https://www.youtube.com/watch?v=0ZXn5bUa2bQ"),
    (["banca", "mancuerna", "inclinad"], "https://www.youtube.com/watch?v=8iPEnn-ltC8"),
    (["fondo", "paralela"], "https://www.youtube.com/watch?v=2z8JmcrW-As"),
    (["apertura", "máquina"], "https://www.youtube.com/watch?v=O-b_iF0G1pE"),
    (["flexión", "brazo"], "https://www.youtube.com/watch?v=IODxDxX7oi4"),
    (["cruce", "polea"], "https://www.youtube.com/watch?v=taI4XduLpTk"),
    # Espalda
    (["peso muerto", "barra"], "https://www.youtube.com/watch?v=op9kVnSso6Q"),
    (["dominada", "prona"], "https://www.youtube.com/watch?v=eGo4IYlbE5g"),
    (["dominada", "supina"], "https://www.youtube.com/watch?v=brhRXlOhsAM"),
    (["jalón", "pecho"], "https://www.youtube.com/watch?v=CAwf7n6Luuc"),
    (["remo", "barra", "inclinado"], "https://www.youtube.com/watch?v=vT2GjY_Umpw"),
    (["remo", "mancuerna"], "https://www.youtube.com/watch?v=roCP6wCXPqo"),
    (["remo", "polea", "sentado"], "https://www.youtube.com/watch?v=GZbfZ033f74"),
    # Piernas
    (["sentadilla", "barra", "espalda"], "https://www.youtube.com/watch?v=bEv6CCg2BC8"),
    (["sentadilla", "frontal"], "https://www.youtube.com/watch?v=tlfahndHPC4"),
    (["prensa", "pierna"], "https://www.youtube.com/watch?v=IZxyjW7MPJQ"),
    (["extensión", "cuádriceps"], "https://www.youtube.com/watch?v=YyvSfVjQeL0"),
    (["curl", "femoral", "acostado"], "https://www.youtube.com/watch?v=1Tq3QdYUuHs"),
    (["peso muerto", "rumano"], "https://www.youtube.com/watch?v=JCXUYuzwNrM"),
    (["hip thrust", "barra"], "https://www.youtube.com/watch?v=SEdqd1n0cvg"),
    (["elevación", "talón"], "https://www.youtube.com/watch?v=-M4-G8p8fmc"),
    # Hombros
    (["press militar", "barra"], "https://www.youtube.com/watch?v=2yjwXTZQDDI"),
    (["press", "hombro", "mancuerna"], "https://www.youtube.com/watch?v=qEwKCR5JCog"),
    (["elevación", "lateral"], "https://www.youtube.com/watch?v=3VcKaXpzqRo"),
    (["pájaro"], "https://www.youtube.com/watch?v=ttvfGg9d76c"),
    (["face pull"], "https://www.youtube.com/watch?v=rep-qVOkqgk"),
    (["encogimiento", "hombro"], "https://www.youtube.com/watch?v=cJRVVxmytaM"),
    # Brazos
    (["curl", "bíceps", "barra"], "https://www.youtube.com/watch?v=kwG2ipFRgfo"),
    (["curl", "martillo"], "https://www.youtube.com/watch?v=zC3nLlEvin4"),
    (["extensión", "tríceps", "polea"], "https://www.youtube.com/watch?v=2-LAMcpzODU"),
    (["press francés"], "https://www.youtube.com/watch?v=d_KZxkY_0cM"),
    # Core
    (["plancha", "frontal"], "https://www.youtube.com/watch?v=pSHjTRCQxIw"),
    (["elevación", "pierna", "colgado"], "https://www.youtube.com/watch?v=hdng3Nm1x_E"),
    (["rueda", "abdominal"], "https://www.youtube.com/watch?v=rqiTPdK1cWg"),
    (["crunch", "polea"], "https://www.youtube.com/watch?v=2fO41lq7b0I"),
    (["burpee"], "https://www.youtube.com/watch?v=dZgVxmf6jkA")
]

def find_youtube_url(name: str) -> str:
    name_lower = name.lower()
    for keywords, url in YOUTUBE_TUTORIAL_PATTERNS:
        if all(kw in name_lower for kw in keywords):
            return url
    return None

# 5. Cargar catálogo de GIFs y generar lote de inserción
catalog_file = os.path.join(os.path.dirname(__file__), 'app', 'data', 'exercise_gifs_catalog.json')
with open(catalog_file, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

exercises = catalog.get('exercises', [])
print(f"\n4. Procesando {len(exercises)} ejercicios del catálogo para inserción masiva...")

insert_batch = []
yt_count = 0
gif_only_count = 0

for item in exercises:
    ex_id = str(uuid.uuid4())
    name = item.get('name', '').strip()
    body_part = item.get('bodyPart', '').strip().lower()
    cat_id = category_map.get(body_part)
    
    # Fallback si no matchea directo
    if not cat_id:
        for k, v in category_map.items():
            if k in body_part:
                cat_id = v
                break
    if not cat_id:
        cat_id = list(category_map.values())[0]

    muscle = item.get('muscle', '')
    equipment = item.get('equipment', '')
    description = f"Equipamiento: {equipment}. Músculo principal: {muscle}."
    
    gif_url = item.get('gifUrl')
    yt_url = find_youtube_url(name)
    
    if yt_url:
        yt_count += 1
    else:
        gif_only_count += 1

    insert_batch.append((
        ex_id,
        cat_id,
        name,
        description,
        yt_url,
        gif_url
    ))

# 6. Inserción por lotes
print("5. Ejecutando inserción en base de datos...")
insert_query = """
    INSERT INTO bdmottus.exercises (id, category_id, name, description, youtube_url, gif_url)
    VALUES (%s, %s, %s, %s, %s, %s);
"""
execute_batch(cur, insert_query, insert_batch, page_size=200)
print(f"   -> {len(insert_batch)} ejercicios insertados exitosamente.")

# 7. Conceder permisos a usr_mottus
print("\n6. Concediendo permisos a usr_mottus...")
cur.execute("GRANT ALL PRIVILEGES ON TABLE bdmottus.categories TO usr_mottus;")
cur.execute("GRANT ALL PRIVILEGES ON TABLE bdmottus.exercises TO usr_mottus;")
print("   -> Permisos aplicados.")

# 8. Estadísticas finales
cur.execute("""
    SELECT c.name, COUNT(e.id)
    FROM bdmottus.categories c
    LEFT JOIN bdmottus.exercises e ON e.category_id = c.id
    GROUP BY c.name
    ORDER BY COUNT(e.id) DESC;
""")
stats = cur.fetchall()

print("\n=======================================================")
print("=== RESUMEN DE LA POBLACIÓN DE EJERCICIOS ===")
print("=======================================================")
for cat, count in stats:
    print(f" • {cat}: {count} ejercicios")

print("-------------------------------------------------------")
print(f"Total ejercicios en base de datos: {len(insert_batch)}")
print(f" • Con Video YouTube y GIF Animado: {yt_count}")
print(f" • Con GIF Animado de Técnica (Loop 3D): {gif_only_count}")
print("=======================================================\n")

cur.close()
conn.close()
