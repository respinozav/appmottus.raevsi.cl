# Guía de Despliegue en AWS (Ubuntu) - Mottus Gym

Esta guía detalla la configuración inicial del servidor AWS (EC2 / Lightsail) para **`appmottus.raevsi.cl`** utilizando Nginx, Systemd, FastAPI y GitHub Actions.

---

## 1. Arquitectura y Puertos

- **Dominio**: `https://appmottus.raevsi.cl`
- **Puerto Interno Backend**: **`8006`** (FastAPI / Uvicorn).
  > **IMPORTANTE**: No abras el puerto `8006` en los Grupos de Seguridad de AWS. Solo los puertos `80` (HTTP) y `443` (HTTPS) deben estar abiertos hacia el público. Nginx actúa como Reverse Proxy seguro hacia `127.0.0.1:8006`.
- **Ruta del Proyecto**: `/var/www/appmottus.raevsi.cl`
- **Ruta Web Nginx**: `/var/www/html/appmottus.raevsi.cl`
- **Servicio Systemd**: `appmottus-api.service`

---

## 2. Preparación Inicial en el Servidor AWS

Conéctate por SSH a tu instancia de Ubuntu en AWS:

```bash
ssh -i tu-llave.pem ubuntu@IP_DEL_SERVIDOR
```

### A. Clonar el repositorio

```bash
sudo mkdir -p /var/www/appmottus.raevsi.cl
sudo chown -R ubuntu:www-data /var/www/appmottus.raevsi.cl
sudo chmod -R 775 /var/www/appmottus.raevsi.cl

git clone https://github.com/respinozav/appmottus.raevsi.cl.git /var/www/appmottus.raevsi.cl
cd /var/www/appmottus.raevsi.cl
```

### B. Configurar Variables de Entorno (`.env`)

Copia la plantilla y completa las credenciales de tu base de datos RDS PostgreSQL:

```bash
cp .env.example .env
nano .env
```

Asegúrate de definir:
- `DB_HOST`: Endpoint de tu RDS en AWS.
- `DB_USER`: `usr_mottus` (o tu usuario configurado).
- `DB_PASSWORD`: Clave segura.
- `DB_SCHEMA`: `bdmottus`.
- `PORT`: `8006`.
- `SECRET_KEY`: Llave secreta para JWT.
- `CORS_ORIGINS`: `["https://appmottus.raevsi.cl"]`.

Copia también el `.env` al directorio de backend por compatibilidad:
```bash
cp .env backend/.env
```

### C. Configurar el Entorno Virtual de Python y Dependencias Iniciales

```bash
cd /var/www/appmottus.raevsi.cl/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

---

## 3. Configurar el Servicio Systemd (FastAPI en puerto 8006)

1. Copia la plantilla del servicio al directorio del sistema:
   ```bash
   sudo cp /var/www/appmottus.raevsi.cl/deploy/ubuntu/appmottus-api.service.example /etc/systemd/system/appmottus-api.service
   ```

2. Recarga systemd y activa el servicio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now appmottus-api
   ```

3. Verifica que esté corriendo en el puerto 8006:
   ```bash
   sudo systemctl status appmottus-api
   curl http://127.0.0.1:8006/
   ```

---

## 4. Configurar Nginx y Certificado SSL

1. Copia el archivo de configuración a `sites-available`:
   ```bash
   sudo cp /var/www/appmottus.raevsi.cl/deploy/ubuntu/nginx-appmottus.raevsi.cl.conf.example /etc/nginx/sites-available/appmottus.raevsi.cl
   ```

2. Crea el enlace simbólico en `sites-enabled`:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/appmottus.raevsi.cl /etc/nginx/sites-enabled/
   ```

3. Valida la sintaxis de Nginx y recarga:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Genera el certificado HTTPS gratuito con Certbot:
   ```bash
   sudo certbot --nginx -d appmottus.raevsi.cl
   ```

---

## 5. Permisos Sudo sin Contraseña para el Despliegue Automático

Para que el script `deploy.sh` ejecutado por el usuario `ubuntu` mediante GitHub Actions pueda reiniciar el servicio y recargar Nginx sin pedir contraseña interactiva, añade las siguientes reglas:

```bash
sudo visudo -f /etc/sudoers.d/deploy-appmottus
```

Agrega las siguientes líneas:
```text
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart appmottus-api
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl --no-pager --full status appmottus-api
ubuntu ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
ubuntu ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/html/appmottus.raevsi.cl
ubuntu ALL=(ALL) NOPASSWD: /bin/rm -rf /var/www/html/appmottus.raevsi.cl/*
ubuntu ALL=(ALL) NOPASSWD: /bin/cp -R * /var/www/html/appmottus.raevsi.cl/
ubuntu ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/html/appmottus.raevsi.cl
ubuntu ALL=(ALL) NOPASSWD: /bin/cp -R /var/www/html/appmottus.raevsi.cl/. *
```
*(O de manera general si el usuario `ubuntu` ya cuenta con `sudo NOPASSWD: ALL` en tu servidor).*

---

## 6. Configuración de Secretos en GitHub

En tu repositorio de GitHub (`https://github.com/respinozav/appmottus.raevsi.cl`), ve a:
**Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Agrega los 3 secretos:
1. `AWS_HOST`: La dirección IP pública de tu servidor AWS (o el hostname DNS).
2. `AWS_USERNAME`: Usuario SSH (`ubuntu`).
3. `AWS_PRIVATE_KEY`: El contenido completo de tu llave privada SSH (`.pem`), incluyendo las líneas `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`.

---

## 7. Verificación del Primer Despliegue

Puedes ejecutar el script manualmente la primera vez en el servidor:
```bash
cd /var/www/appmottus.raevsi.cl/deploy
bash deploy.sh
```

A partir de este momento, cada vez que hagas `git push` a la rama `main`, GitHub Actions ejecutará automáticamente el script y actualizará tanto el Backend como el Frontend sin interrupciones.
