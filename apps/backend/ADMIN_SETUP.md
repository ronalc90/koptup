# Admin Setup Guide

> Nunca escribas cadenas de conexión, contraseñas ni tokens en este archivo ni en
> ningún otro archivo versionado: el repositorio es público. Usa variables de
> entorno o la CLI de Railway.

## Dar el rol admin a un usuario

El usuario debe existir (haberse registrado o haber entrado al menos una vez).

### Local (desarrollo)

```bash
cd apps/backend
MONGODB_URI="<tu-cadena-de-conexion>" npx ts-node --transpile-only src/scripts/set-admin.ts <email>
```

### Producción (Railway)

```bash
railway run npx ts-node --transpile-only src/scripts/set-admin.ts <email>
```

`railway run` inyecta las variables del servicio (incluida `MONGODB_URI`), así
que la cadena de conexión nunca pasa por la terminal ni por el historial.

### Arranque del servidor (opcional)

Si defines `ADMIN_EMAIL` en las variables del entorno, el backend asegura el
rol `admin` de esa cuenta al arrancar (solo si la cuenta ya existe). Si
`ADMIN_EMAIL` no está definida, el arranque no modifica ningún rol.

## Notas

- El script falla si el usuario no existe en la base de datos.
- Los usuarios admin entran a `/admin` en lugar de `/dashboard`.
- El panel `/admin` y el portal `/dashboard` se verifican en el servidor: la
  web consulta `GET /api/auth/me` con la sesión antes de mostrar la página.
