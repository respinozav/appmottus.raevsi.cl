-- Script de inicialización de Base de Datos para Mottus Gym (appmottus.raevsi.cl)
-- Conectarse como superusuario / dbmasteruser a la base 'postgres'

-- 1. Extensiones necesarias para UUIDs y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Crear el esquema bdmottus
CREATE SCHEMA IF NOT EXISTS bdmottus;

-- 3. Crear el usuario de aplicación usr_mottus con contraseña segura (si no existe)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'usr_mottus') THEN
      CREATE ROLE usr_mottus WITH LOGIN PASSWORD 'M0ttus#Gym_2026_SecPass!';
   ELSE
      ALTER ROLE usr_mottus WITH PASSWORD 'M0ttus#Gym_2026_SecPass!';
   END IF;
END
$do$;

-- 4. Otorgar permisos totales sobre el esquema y objetos
GRANT ALL PRIVILEGES ON SCHEMA bdmottus TO usr_mottus;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bdmottus TO usr_mottus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA bdmottus TO usr_mottus;

-- Configurar permisos por defecto para futuros objetos creados en bdmottus
ALTER DEFAULT PRIVILEGES IN SCHEMA bdmottus GRANT ALL PRIVILEGES ON TABLES TO usr_mottus;
ALTER DEFAULT PRIVILEGES IN SCHEMA bdmottus GRANT ALL PRIVILEGES ON SEQUENCES TO usr_mottus;
ALTER DEFAULT PRIVILEGES IN SCHEMA bdmottus GRANT ALL PRIVILEGES ON FUNCTIONS TO usr_mottus;

-- 5. Creación de tablas bajo el esquema bdmottus utilizando UUID como PK

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS bdmottus.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    gender VARCHAR(20),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    weight NUMERIC(5, 2),
    height NUMERIC(5, 2),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coach', 'user')),
    registration_token VARCHAR(255) UNIQUE,
    is_registered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Categorías de Ejercicios
CREATE TABLE IF NOT EXISTS bdmottus.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Tabla de Ejercicios
CREATE TABLE IF NOT EXISTS bdmottus.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES bdmottus.categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    youtube_url VARCHAR(500) NOT NULL,
    created_by UUID REFERENCES bdmottus.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Rutinas
CREATE TABLE IF NOT EXISTS bdmottus.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES bdmottus.users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES bdmottus.users(id) ON DELETE RESTRICT,
    title VARCHAR(200) DEFAULT 'Rutina Mottus',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_executed BOOLEAN NOT NULL DEFAULT FALSE,
    executed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Detalle Rutina - Ejercicios
CREATE TABLE IF NOT EXISTS bdmottus.routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES bdmottus.routines(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES bdmottus.exercises(id) ON DELETE CASCADE,
    series INT DEFAULT 3,
    repetitions VARCHAR(50) DEFAULT '12 reps',
    rest_seconds INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reotorgar permisos a las tablas recién creadas a usr_mottus
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bdmottus TO usr_mottus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bdmottus TO usr_mottus;

-- 6. Semilla inicial de datos
INSERT INTO bdmottus.categories (name, description) VALUES
('Pecho y Tríceps', 'Ejercicios de empuje para tren superior, pectoral mayor, menor y tríceps braquial.'),
('Espalda y Bíceps', 'Ejercicios de tracción horizontal y vertical, dorsales, romboides y bíceps.'),
('Piernas y Glúteos', 'Tren inferior, cuádriceps, isquiotibiales, glúteos y pantorrillas.'),
('Hombros y Core', 'Deltoides anterior, lateral, posterior y fortalecimiento de la zona media/abdominal.'),
('Cardio & Funcional', 'Circuitos metabólicos, resistencia cardiovascular y movilidad funcional.')
ON CONFLICT (name) DO NOTHING;
