# TAP Admission - arquitectura y defensa tecnica

## Lectura del examen

El examen solicita un sistema con Laravel 11/PHP 8.2+, Angular 19/TypeScript 5.x, base de datos NoSQL, control de versiones, documentacion de API y buenas practicas. Las funcionalidades obligatorias son consulta/alta/edicion/eliminacion/detalle de productos, usuarios y perfiles, exportacion PDF/Excel, autenticacion, recuperacion de contrasena, control de accesos por perfil y bitacora comparativa.

## Decisiones tecnicas

- Backend: Laravel 11 con PHP 8.4 portable. Cumple PHP 8.2+ y permite ejecutar Composer sin instalar software global.
- NoSQL: MongoDB mediante `mongodb/laravel-mongodb`. Se modelan documentos en `products`, `users`, `profiles` y `audit_logs`.
- Frontend: Angular 19.2 con TypeScript 5.8. Angular 19 no acepta TypeScript 5.0 exacto; usa TypeScript `>=5.5 <5.9`, por eso se usa una version 5.x compatible.
- Autenticacion: Laravel Sanctum con token Bearer. Es simple para SPA/API y permite proteger exportaciones y CRUD.
- Recuperacion de contrasena: se genera una contrasena temporal y se envia al correo registrado. No se reenvia la contrasena actual porque esta cifrada y no debe poder recuperarse.
- Codigos automaticos: prefijos `PRD`, `USR`, `PRF` con fecha y sufijo aleatorio. Evita capturar codigos manualmente y mantiene legibilidad.
- Bitacora: cada alta, edicion y eliminacion crea un documento con `previous`, `current`, entidad, accion y usuario actor.
- Exportaciones: `maatwebsite/excel` para XLSX y `barryvdh/laravel-dompdf` para PDF.
- Documentacion API: especificacion OpenAPI 3.0 en `public/docs/openapi.yaml` y Swagger UI en `public/docs/index.html`.

## Modelo NoSQL

`profiles`

- `profile_code`
- `name`
- `section_keys`: arreglo con `products`, `users`, `profiles`
- timestamps

`users`

- `user_code`
- `email`
- `name`
- `phone`
- `profile_photo_path`
- `profile_ids`: arreglo de ids de perfiles
- `password` cifrada
- timestamps

`products`

- `product_code`
- `name`
- `brand`
- `price`
- timestamps

`audit_logs`

- `entity`
- `entity_id`
- `action`
- `previous`
- `current`
- `actor_user_code`
- timestamps

## Como defenderlo en revision

1. Mostrar que el acceso se decide por `profile.section_keys`, no por menus ocultos del frontend.
2. Explicar que las validaciones estan en backend con FormRequest, y el frontend solo mejora UX.
3. Mostrar que las contrasenas usan hashing de Laravel y que recuperacion genera una temporal.
4. Mostrar un update y revisar `audit_logs` para comprobar comparacion antes/despues.
5. Explicar la decision Angular 19 + TypeScript 5.8 por compatibilidad oficial.
6. Abrir Swagger UI en `/docs/`, autenticar con token Bearer y demostrar el contrato de endpoints con ejemplos.
