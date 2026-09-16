#!/bin/bash

##############################################################################
# DEPLOY UNIVERSAL - Mottus Gym / React + FastAPI
#
# Soporta:
#   - HTML estático
#   - React dentro de /frontend
#   - React en la raíz del proyecto
#   - FastAPI dentro de /backend (puerto interno 8006)
#   - React + FastAPI
#   - Docker Compose Sidecars (si existen)
##############################################################################

set -e
set -o pipefail

START_TIME=$(date +%s)

############################################
# COLORES
############################################

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
NC="\033[0m"

############################################
# RUTAS
############################################

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME=$(basename "$PROJECT_DIR")

BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# React ubicado directamente en la raíz
ROOT_PACKAGE_JSON="$PROJECT_DIR/package.json"
ROOT_DIST_DIR="$PROJECT_DIR/dist"

DEPLOY_DIR="$PROJECT_DIR/deploy"
LOG_DIR="$PROJECT_DIR/logs"
BACKUP_DIR="$PROJECT_DIR/backup"

mkdir -p "$DEPLOY_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

DATE=$(date +"%Y-%m-%d_%H-%M-%S")

LOG_FILE="$LOG_DIR/deploy-$DATE.log"

exec > >(tee -a "$LOG_FILE") 2>&1

############################################
# CABECERA
############################################

echo ""
echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}          DEPLOY $PROJECT_NAME${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""

############################################
# INFORMACIÓN GIT
############################################

echo -e "${BLUE}Repositorio:${NC} $PROJECT_DIR"
echo -e "${BLUE}Usuario:${NC} $(whoami)"
echo -e "${BLUE}Fecha:${NC} $(date)"

CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

echo -e "${BLUE}Branch:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}Commit:${NC} $CURRENT_COMMIT"

############################################
# SERVICIO SYSTEMD
############################################

SERVICE_NAME=""

case "$PROJECT_NAME" in

    appmottus.raevsi.cl|appmottus)
        SERVICE_NAME="appmottus-api"
        ;;

    pedidos.santamena.cl)
        SERVICE_NAME="pedidos-santamena"
        ;;

    pedidos.distribuidoratridente.cl)
        SERVICE_NAME="pedidos-tridente"
        ;;

    *)
        if [ -f "/etc/systemd/system/${PROJECT_NAME}-api.service" ]; then
            SERVICE_NAME="${PROJECT_NAME}-api"
        elif [ -f "/etc/systemd/system/appmottus-api.service" ]; then
            SERVICE_NAME="appmottus-api"
        fi
        ;;

esac

############################################
# NGINX ROOT
############################################

NGINX_ROOT="/var/www/html/$PROJECT_NAME"

############################################
# GIT PULL
############################################

echo ""
echo -e "${YELLOW}>> Actualizando repositorio...${NC}"

git pull origin "$CURRENT_BRANCH"

NEW_COMMIT=$(git rev-parse --short HEAD)

echo "Commit desplegado: $NEW_COMMIT"

############################################
# DETECCIÓN DEL PROYECTO
############################################

IS_BACKEND=false
IS_FRONTEND=false
IS_ROOT_REACT=false
IS_HTML=false

if [ -d "$BACKEND_DIR" ]; then
    IS_BACKEND=true
fi

if [ -d "$FRONTEND_DIR" ]; then
    IS_FRONTEND=true
fi

# Detectar React cuando package.json está en la raíz
if [ "$IS_FRONTEND" = false ] && [ -f "$ROOT_PACKAGE_JSON" ]; then
    IS_ROOT_REACT=true
fi

# HTML estático:
# index.html en raíz y no es React
if [ "$IS_ROOT_REACT" = false ] && [ -f "$PROJECT_DIR/index.html" ]; then
    IS_HTML=true
fi

############################################
# MOSTRAR TIPO DE PROYECTO
############################################

echo ""
echo -e "${CYAN}>> Tipo de proyecto detectado${NC}"

if [ "$IS_BACKEND" = true ] && [ "$IS_FRONTEND" = true ]; then

    echo -e "${GREEN}React + FastAPI (Backend: puerto 8006)${NC}"

elif [ "$IS_BACKEND" = true ] && [ "$IS_ROOT_REACT" = true ]; then

    echo -e "${GREEN}React raíz + FastAPI (Backend: puerto 8006)${NC}"

elif [ "$IS_FRONTEND" = true ]; then

    echo -e "${GREEN}React /frontend${NC}"

elif [ "$IS_ROOT_REACT" = true ]; then

    echo -e "${GREEN}React raíz${NC}"

elif [ "$IS_HTML" = true ]; then

    echo -e "${GREEN}HTML estático${NC}"

else

    echo -e "${YELLOW}Proyecto no clasificado${NC}"

fi

############################################
# BACKEND
############################################

if [ "$IS_BACKEND" = true ]; then

    echo ""
    echo -e "${YELLOW}>> Backend${NC}"

    cd "$BACKEND_DIR"

    ########################################
    # VARIABLES DE ENTORNO (.ENV)
    ########################################

    if [ ! -f "$BACKEND_DIR/.env" ] || grep -q "your-rds-host" "$BACKEND_DIR/.env" 2>/dev/null; then
        echo "Configurando .env de producción para Mottus Gym..."
        cat << 'EOF' > "$BACKEND_DIR/.env"
PROJECT_NAME="Mottus Gym API"
API_V1_STR="/api/v1"

# Database Configuration (Dedicated user 'usr_mottus' on RDS schema 'bdmottus')
DB_HOST=ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=usr_mottus
DB_PASSWORD=M0ttus#Gym_2026_SecPass!
DB_SCHEMA=bdmottus

DATABASE_URL=postgresql+psycopg://usr_mottus:M0ttus%23Gym_2026_SecPass!@ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com:5432/postgres

# Security & JWT (Secret key 256 bits)
SECRET_KEY=mottus_gym_super_secret_jwt_key_2026_military_green_secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Frontend & Domain
FRONTEND_URL=https://appmottus.raevsi.cl
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","https://appmottus.raevsi.cl"]
EOF
        cp "$BACKEND_DIR/.env" "$PROJECT_DIR/.env"
    fi

    ########################################
    # VIRTUAL ENVIRONMENT
    ########################################

    if [ ! -d "venv" ]; then

        echo "Creando entorno virtual..."

        python3 -m venv venv

    fi

    ########################################
    # ACTIVAR VENV
    ########################################

    source venv/bin/activate

    ########################################
    # DEPENDENCIAS
    ########################################

    echo "Instalando dependencias Python..."

    pip install -r requirements.txt

    ########################################
    # SEED USERS & PASSWORDS
    ########################################

    if [ -f "seed_passwords.py" ]; then
        echo "Verificando usuarios y contraseñas de prueba (seed)..."
        python seed_passwords.py || echo "Aviso: seed_passwords omitido o fallido"
    fi

    ########################################
    # ALEMBIC
    ########################################

    if [ -f "alembic.ini" ]; then

        echo "Ejecutando Alembic..."

        alembic upgrade head

    fi

    ########################################
    # DESACTIVAR VENV
    ########################################

    deactivate

    ########################################
    # SYSTEMD AUTO-INSTALACIÓN
    ########################################

    if [ ! -f "/etc/systemd/system/appmottus-api.service" ] && [ -f "$PROJECT_DIR/deploy/ubuntu/appmottus-api.service.example" ]; then
        echo "Instalando servicio systemd appmottus-api..."
        sudo cp "$PROJECT_DIR/deploy/ubuntu/appmottus-api.service.example" /etc/systemd/system/appmottus-api.service
        sudo systemctl daemon-reload
        sudo systemctl enable appmottus-api
    fi

    ########################################
    # SYSTEMD
    ########################################

    if [ ! -z "$SERVICE_NAME" ]; then

        # Asegurar permisos de lectura para www-data
        chmod 644 "$PROJECT_DIR/.env" "$BACKEND_DIR/.env" 2>/dev/null || true
        sudo chown -R $USER:www-data "$BACKEND_DIR"
        sudo chmod -R 775 "$BACKEND_DIR"

        echo "Reiniciando servicio $SERVICE_NAME..."

        sudo systemctl restart "$SERVICE_NAME"

        sleep 2

        if ! sudo systemctl --no-pager --full status "$SERVICE_NAME"; then
            echo ""
            echo -e "${RED}ERROR: El servicio $SERVICE_NAME falló al iniciar. Mostrando journalctl:${NC}"
            sudo journalctl -u "$SERVICE_NAME" -n 50 --no-pager
            exit 1
        fi

        echo ""
        echo "Verificando respuesta del backend en 127.0.0.1:8006..."
        curl -s -i http://127.0.0.1:8006/ || true

    else

        echo -e "${YELLOW}No hay servicio systemd configurado para $PROJECT_NAME${NC}"

    fi

fi

############################################
# DOCKER SIDECARS (OPCIONAL)
############################################

if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then

    echo ""
    echo -e "${YELLOW}>> Levantando contenedores auxiliares Docker...${NC}"

    cd "$DEPLOY_DIR"

    if command -v docker &> /dev/null; then

        sudo docker compose up -d

    else

        echo -e "${RED}Docker no está instalado o no disponible en PATH${NC}"

    fi

fi

############################################
# FRONTEND / REACT
############################################

FRONTEND_FOUND=false

############################################
# REACT DENTRO DE /frontend
############################################

if [ -d "$FRONTEND_DIR" ]; then

    FRONTEND_FOUND=true

    echo ""
    echo -e "${YELLOW}>> Frontend React (/frontend)${NC}"

    cd "$FRONTEND_DIR"

    ########################################
    # NPM INSTALL
    ########################################

    npm install

    ########################################
    # BUILD
    ########################################

    npm run build

    ########################################
    # BACKUP
    ########################################

    mkdir -p "$BACKUP_DIR/$DATE"

    if [ -d "$NGINX_ROOT" ]; then

        sudo cp -R "$NGINX_ROOT"/. \
            "$BACKUP_DIR/$DATE/" \
            2>/dev/null || true

    fi

    ########################################
    # NGINX DIRECTORY
    ########################################

    sudo mkdir -p "$NGINX_ROOT"

    ########################################
    # LIMPIAR
    ########################################

    sudo rm -rf "$NGINX_ROOT"/*

    ########################################
    # COPIAR DIST
    ########################################

    sudo cp -R dist/* "$NGINX_ROOT"/

    ########################################
    # PERMISOS
    ########################################

    sudo chown -R www-data:www-data "$NGINX_ROOT"

fi

############################################
# REACT EN RAÍZ
############################################

if [ "$FRONTEND_FOUND" = false ] && [ "$IS_ROOT_REACT" = true ]; then

    FRONTEND_FOUND=true

    echo ""
    echo -e "${YELLOW}>> React (raíz del proyecto)${NC}"

    cd "$PROJECT_DIR"

    ########################################
    # NPM INSTALL
    ########################################

    npm install

    ########################################
    # BUILD
    ########################################

    npm run build

    ########################################
    # VERIFICAR DIST
    ########################################

    if [ ! -d "$ROOT_DIST_DIR" ]; then

        echo -e "${RED}ERROR: No se generó la carpeta dist/${NC}"

        exit 1

    fi

    ########################################
    # BACKUP
    ########################################

    mkdir -p "$BACKUP_DIR/$DATE"

    if [ -d "$NGINX_ROOT" ]; then

        sudo cp -R "$NGINX_ROOT"/. \
            "$BACKUP_DIR/$DATE/" \
            2>/dev/null || true

    fi

    ########################################
    # NGINX DIRECTORY
    ########################################

    sudo mkdir -p "$NGINX_ROOT"

    ########################################
    # LIMPIAR
    ########################################

    sudo rm -rf "$NGINX_ROOT"/*

    ########################################
    # COPIAR DIST
    ########################################

    sudo cp -R "$ROOT_DIST_DIR"/* "$NGINX_ROOT"/

    ########################################
    # PERMISOS
    ########################################

    sudo chown -R www-data:www-data "$NGINX_ROOT"

fi

############################################
# HTML
############################################

if [ "$FRONTEND_FOUND" = false ] && [ "$IS_HTML" = true ]; then

    echo ""
    echo -e "${YELLOW}>> Sitio HTML${NC}"

    ########################################
    # BACKUP
    ########################################

    mkdir -p "$BACKUP_DIR/$DATE"

    if [ -d "$NGINX_ROOT" ]; then

        sudo cp -R "$NGINX_ROOT"/. \
            "$BACKUP_DIR/$DATE/" \
            2>/dev/null || true

    fi

    ########################################
    # NGINX DIRECTORY
    ########################################

    sudo mkdir -p "$NGINX_ROOT"

    ########################################
    # COPIAR HTML
    ########################################

    sudo rsync -av \
        --delete \
        --exclude ".git" \
        --exclude "deploy" \
        --exclude "logs" \
        --exclude "backup" \
        "$PROJECT_DIR"/ \
        "$NGINX_ROOT"/

    ########################################
    # PERMISOS
    ########################################

    sudo chown -R www-data:www-data "$NGINX_ROOT"

fi

############################################
# NGINX
############################################

if [ ! -f "/etc/nginx/sites-available/appmottus.raevsi.cl" ] && [ -f "$PROJECT_DIR/deploy/ubuntu/nginx-appmottus.raevsi.cl.conf.example" ]; then
    echo "Instalando configuración de virtualhost Nginx..."
    sudo cp "$PROJECT_DIR/deploy/ubuntu/nginx-appmottus.raevsi.cl.conf.example" /etc/nginx/sites-available/appmottus.raevsi.cl
    sudo ln -sf /etc/nginx/sites-available/appmottus.raevsi.cl /etc/nginx/sites-enabled/
fi

# Corregir configuración si aún apunta a localhost:3000 (legacy proxy)
if [ -f "/etc/nginx/sites-available/appmottus.raevsi.cl" ] && grep -q "localhost:3000" "/etc/nginx/sites-available/appmottus.raevsi.cl"; then
    echo "Actualizando configuración de Nginx para appmottus.raevsi.cl (apuntando a root /var/www/html/ y api 8006)..."
    sudo tee /etc/nginx/sites-available/appmottus.raevsi.cl > /dev/null << 'EOF'
server {
    server_name appmottus.raevsi.cl;

    root /var/www/html/appmottus.raevsi.cl;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:8006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/appmottus.raevsi.cl/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/appmottus.raevsi.cl/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = appmottus.raevsi.cl) {
        return 301 https://$host$request_uri;
    } # managed by Certbot
    listen 80;
    server_name appmottus.raevsi.cl;
    return 404; # managed by Certbot
}
EOF
fi

echo ""
echo -e "${YELLOW}>> Verificando Nginx${NC}"

sudo nginx -t

echo ""
echo -e "${YELLOW}>> Recargando Nginx${NC}"

sudo systemctl reload nginx

echo ""
echo -e "${YELLOW}>> Configuración de Nginx en sites-enabled:${NC}"
for f in /etc/nginx/sites-enabled/*; do
    if grep -q "appmottus.raevsi.cl" "$f" 2>/dev/null; then
        echo "=== Archivo Nginx: $f ==="
        cat "$f"
    fi
done

############################################
# TIEMPO
############################################

END_TIME=$(date +%s)

SECONDS_TOTAL=$((END_TIME-START_TIME))

############################################
# FIN
############################################

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}DEPLOY FINALIZADO CORRECTAMENTE${NC}"
echo -e "${GREEN}====================================================${NC}"

echo "Proyecto : $PROJECT_NAME"
echo "Branch   : $CURRENT_BRANCH"
echo "Commit   : $NEW_COMMIT"
echo "Usuario  : $(whoami)"
echo "Duración : ${SECONDS_TOTAL} segundos"
echo "Log      : $LOG_FILE"

echo -e "${GREEN}====================================================${NC}"

echo ""
