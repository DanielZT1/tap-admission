# Guia de ejecucion local

## Requisitos

- MongoDB local en `mongodb://127.0.0.1:27017` o una URI de MongoDB Atlas.
- PHP portable incluido en `../../tools/php/php.exe`.
- Composer portable incluido en `../../tools/composer/composer.phar`.

## Backend

Desde `tap-admission/backend`:

```powershell
../../tools/php/php.exe artisan key:generate --force
../../tools/php/php.exe artisan db:seed
../../tools/php/php.exe -S 127.0.0.1:8091 -t public
```

Credenciales iniciales:

- Usuario: `admin@tap.local`
- Contrasena: `Password123!`

## Frontend

Desde `tap-admission/frontend`:

```powershell
pnpm install
pnpm start
```

Abrir `http://127.0.0.1:4200`.

Nota: en el sandbox de Codex el build de Angular puede fallar por permisos de lectura al resolver rutas padre con esbuild. Los archivos existen y Node puede leerlos; en una terminal normal de Windows el build debe ejecutarse con la estructura creada.
