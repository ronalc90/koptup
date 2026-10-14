# Guía de despliegue - KopTup

Esta guía se reemplazó por la página de la wiki **[Operación y despliegue](../wiki/Doc-11-Operacion-y-Despliegue.md)**, que se mantiene al día con el código:

- Dónde corre cada pieza (Vercel para la web, Railway con Nixpacks para la API) y cómo se despliega.
- Todas las variables de entorno de cada servicio y qué se apaga si falta cada una.
- El chequeo de salud (`GET /health`), el monitoreo con GitHub Actions y los registros.
- Runbooks: backend caído, rotar secretos, crear el primer admin, revertir un despliegue, entre otros.
- Las acciones que el dueño debe hacer en GitHub, Vercel y Railway.

No uses instrucciones de versiones anteriores de este archivo: hablaban de Dockerfiles y de una base PostgreSQL que el proyecto ya no usa.
