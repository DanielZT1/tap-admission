# Despliegue gratuito y CI/CD

Este proyecto esta preparado para una demo publica con:

- MongoDB Atlas Free para la base de datos.
- Render Free Web Service para la API Laravel.
- Netlify Free para el frontend Angular.
- GitHub Actions para CI/CD.

## 1. Crear MongoDB Atlas Free

1. Entra a MongoDB Atlas y crea un Free cluster.
2. Crea un database user.
3. En Network Access agrega `0.0.0.0/0` para la demo. En produccion se restringe.
4. Copia tu connection string SRV:

```text
mongodb+srv://USUARIO:PASSWORD@cluster0.xxxxx.mongodb.net/tap_admission?retryWrites=true&w=majority
```

## 2. Subir `tap-admission` a GitHub

Desde `C:\Users\PC\Documents\Codex\2026-08-20\ne\tap-admission`:

```powershell
git init
git add .
git commit -m "Initial TAP admission project"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tap-admission.git
git push -u origin main
```

## 3. Backend en Render

1. En Render, crea un nuevo Web Service desde tu repo.
2. Selecciona Free.
3. Si Render detecta `render.yaml`, usa Blueprint. Si lo haces manual:
   - Root directory: `backend`
   - Runtime/Language: Docker
   - Dockerfile path: `./Dockerfile`
   - Health check path: `/api/health`
4. Variables de entorno:

```text
APP_NAME=TAP Admission
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=America/Mexico_City
APP_KEY=base64:TU_APP_KEY
APP_URL=https://TU_BACKEND.onrender.com
DB_CONNECTION=mongodb
MONGODB_URI=mongodb+srv://...
DB_DATABASE=tap_admission
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stderr
MAIL_MAILER=log
```

Genera `APP_KEY` localmente:

```powershell
cd backend
..\..\tools\php\php.exe artisan key:generate --show
```

5. Cuando Render termine, abre:

```text
https://TU_BACKEND.onrender.com/api/health
```

## 4. Sembrar datos en Atlas

La forma simple para demo:

```powershell
cd backend
$env:MONGODB_URI="mongodb+srv://..."
$env:DB_DATABASE="tap_admission"
..\..\tools\php\php.exe artisan db:seed
```

## 5. Frontend en Netlify

Antes de desplegar, actualiza estas dos referencias:

- `frontend/netlify.toml`
- `frontend/public/_redirects`

Reemplaza:

```text
https://REPLACE_WITH_YOUR_RENDER_BACKEND.onrender.com
```

por tu URL real de Render.

En Netlify:

1. New site from Git.
2. Base directory: `frontend`
3. Build command: `pnpm build`
4. Publish directory: `dist/tap-admission-frontend/browser`

## 6. CI/CD con GitHub Actions

El workflow esta en:

```text
.github/workflows/ci-cd.yml
```

En cada push o pull request a `main`:

- Instala PHP y extension MongoDB.
- Corre lint PHP.
- Corre tests Laravel.
- Instala dependencias Angular.
- Corre typecheck.
- Compila Angular.

Para deploy automatico agrega estos secretos en GitHub:

```text
RENDER_DEPLOY_HOOK_URL
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

Render deploy hook:

1. Render > tu servicio > Settings.
2. Copia Deploy Hook URL.
3. GitHub > Settings > Secrets and variables > Actions > New repository secret.

Netlify:

1. Site settings > Site details > API ID = `NETLIFY_SITE_ID`.
2. User settings > Applications > Personal access tokens = `NETLIFY_AUTH_TOKEN`.

## Nota para explicar en la prueba

Render Free es suficiente para demo, pero entra en reposo tras inactividad. Atlas Free conserva la base sin depender del filesystem del servidor. El pipeline demuestra CI/CD porque los cambios pasan por pruebas/build antes de disparar despliegue.
