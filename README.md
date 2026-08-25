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

Crear carpeta de datos dentro del proyecto:

```powershell
mkdir .\work\mongodb-data
```

Si `mongod` esta disponible en el PATH:

```powershell
mongod --dbpath .\work\mongodb-data --bind_ip 127.0.0.1 --port 27017
```

Si `mongod` no esta disponible, busca el ejecutable instalado:

```powershell
Get-ChildItem "C:\Program Files\MongoDB" -Recurse -Filter mongod.exe
```

Y ejecutalo con la ruta encontrada. Ejemplo:

```powershell
& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath .\work\mongodb-data --bind_ip 127.0.0.1 --port 27017
```

Si no existe `mongod.exe`, instala MongoDB Community Server o usa MongoDB Atlas.

Conexion en MongoDB Compass:

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

Si `php` no se reconoce en PowerShell, agrega PHP de Laragon al PATH de esa terminal:

```powershell
$env:Path = "F:\laragon\bin\php\php-8.4.24;$env:Path"
php -v
```

Si `composer` no se reconoce, instala Composer o ejecutalo desde Laragon si lo tienes configurado.

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
php artisan config:clear
php artisan cache:clear
php artisan db:seed
```

## 4. Levantar backend con Laragon

Virtual host:

```text
<RUTA_DEL_PROYECTO>/backend/public
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

Si el proyecto fue copiado o movido y Angular marca que no encuentra `node_modules/@angular/cli`, reinstala dependencias:

```powershell
Remove-Item -Recurse -Force .\node_modules
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
$env:Path = "F:\laragon\bin\php\php-8.4.24;$env:Path"
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
