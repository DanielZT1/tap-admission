# TAP Admission

Comandos para levantar el proyecto en local.

## Requisitos

- PHP 8.4+
- Composer
- Node.js 24+
- pnpm
- MongoDB local o MongoDB Atlas
- Laragon recomendado en Windows

## 1. Clonar proyecto

```powershell
git clone <URL_DEL_REPOSITORIO>
cd tap-admission
```

## 2. Levantar MongoDB local

Con MongoDB instalado globalmente:

```powershell
mongod --dbpath C:\data\db --bind_ip 127.0.0.1 --port 27017
```

Con el binario del workspace:

```powershell
cd C:\Users\PC\Documents\Codex\2026-08-20\ne
.\tools\mongodb\mongodb-win32-x86_64-windows-8.0.20\bin\mongod.exe --dbpath .\work\mongodb-data --bind_ip 127.0.0.1 --port 27017
```

MongoDB Compass:

```text
mongodb://127.0.0.1:27017
```

## 3. Configurar backend

```powershell
cd backend
copy .env.example .env
composer install
php artisan key:generate
```

Variables minimas en `backend/.env`:

```env
APP_URL=http://tap-admission-api.test
DB_CONNECTION=mongodb
MONGODB_URI=mongodb://127.0.0.1:27017
DB_DATABASE=tap_admission
MAIL_MAILER=log
```

Seed inicial:

```powershell
php artisan db:seed
```

## 4. Levantar backend con Laragon

Virtual host:

```text
tap-admission/backend/public
```

URL local esperada:

```text
http://tap-admission-api.test
```

Health check:

```text
http://tap-admission-api.test/api/health
```

## 5. Levantar frontend

```powershell
cd frontend
pnpm install
pnpm start
```

URL frontend:

```text
http://localhost:4300
```

El proxy local debe apuntar a:

```json
{
  "/api": {
    "target": "http://tap-admission-api.test",
    "secure": false,
    "changeOrigin": true
  }
}
```

## 6. Credenciales iniciales

```text
Correo: admin@tap.local
Password: Password123!
```

## 7. Comandos utiles

Backend:

```powershell
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan test
```

Frontend:

```powershell
pnpm build
```

## 8. Documentacion API

```text
backend/public/docs/openapi.yaml
backend/postman/tap-admission.postman_collection.json
```
