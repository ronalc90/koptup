# Admin Setup Guide

> Nunca escribas cadenas de conexión, contraseñas ni tokens en este archivo ni en
> ningún otro archivo versionado: el repositorio es público. Usa variables de
> entorno o la CLI de Railway.

## Dar el rol admin a un usuario

El usuario debe existir (haberse registrado o activado su cuenta).

### Local (desarrollo)

Desde `apps/backend`. El script lee `apps/backend/.env` (dotenv); una
`MONGODB_URI` escrita en la terminal tiene prioridad sobre la del archivo:

```bash
cd apps/backend
npx ts-node --transpile-only src/scripts/set-admin.ts <email>
```

### Producción (Railway)

```bash
railway run npx ts-node --transpile-only src/scripts/set-admin.ts <email>
```

`railway run` inyecta las variables del servicio (incluida `MONGODB_URI`), así
que la cadena de conexión nunca pasa por la terminal ni por el historial.

El cambio queda en la bitácora (`AuditLog`, acción `user.role_change` con
`detalle.origen: "set-admin"`).

### Arranque del servidor con `ADMIN_EMAIL` (primer admin)

Si defines `ADMIN_EMAIL`, al arrancar el backend esa cuenta recibe el rol
`admin` **solo si existe, está activa y no hay ningún otro admin** (el primer
admin, o recuperar el panel cuando no queda ninguno). Si ya hay otro admin, el
arranque no cambia roles: así, si un admin le quita el rol a esa cuenta desde
el panel, la decisión se respeta. El cambio queda en la bitácora con
`detalle.origen: "ADMIN_EMAIL"`. Sin `ADMIN_EMAIL`, el arranque no modifica
ningún rol.

Los avisos de nuevos contactos por correo van a `NOTIFY_EMAIL`; si no está
definida, se usa `ADMIN_EMAIL` como respaldo, y sin ninguna de las dos no se
envían (no hay una dirección fija en el código). La configuración completa de
los avisos por correo y WhatsApp está en
[Doc-11 §4.5](../../docs/wiki/Doc-11-Operacion-y-Despliegue.md#45-configurar-los-avisos-al-dueño-paso-a-paso).

## Notas

- El script falla (código 1) si el usuario no existe o la base no conecta.
- Los usuarios admin entran a `/admin` en lugar de `/dashboard`; deben cerrar
  sesión y volver a entrar para ver el panel después de recibir el rol.
- El panel `/admin` y el portal `/dashboard` se verifican en el servidor: la
  web consulta `GET /api/auth/me` con la sesión antes de mostrar la página.
