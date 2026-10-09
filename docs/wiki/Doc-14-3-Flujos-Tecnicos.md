# Flujos técnicos

> **Resumen.** Estos diagramas muestran las reglas exactas que aplica el código de `main` cada vez que alguien abre una página privada o una demo, llama a la API, le pregunta algo al chatbot, sube un documento o genera contenido de LinkedIn. También muestran cómo el backend responde a los errores, cómo revisa sus variables al arrancar y qué pasa con los datos personales desde que entran hasta que se borran (o no se borran). Cada rombo es un `if` del código y cada caja roja, una respuesta de error o un bloqueo real.
>
> **Para quién:** sobre todo para quien desarrolla u opera el sitio. Si eres el dueño, empieza por los diagramas 1.2 (cómo se protege una demo), 3.2 (cómo responde el chatbot sin inventar), 4.1 (qué pasa con un documento subido) y 8 (datos personales). Los mismos recorridos vistos por el visitante y por el equipo están en [Flujos de negocio](Doc-14-1-Flujos-de-Negocio.md) y [Flujos de administración y operación](Doc-14-2-Flujos-de-Administracion-y-Operacion.md). Todos los diagramas están reunidos en [Diagramas de flujo](Doc-14-Diagramas-de-Flujo.md).

## Leyenda de colores

| Color | Qué representa | Ejemplos en esta página |
|---|---|---|
| Azul | Visitante, prospecto o cliente | Abrir una demo, hacer una pregunta, recibir la respuesta |
| Gris | Sistema: web, backend, base de datos o Redis | Middleware de Next, `requireRole`, guardar en MongoDB |
| Morado | Equipo de KopTup (admin o comercial) | Aprobar una solicitud, revisar `/health` |
| Verde | Aviso: email, WhatsApp o notificación | Aviso al equipo de un lead nuevo |
| Ámbar (rombo) | Decisión del código | ¿El token es válido? |
| Rojo | Error, bloqueo o camino degradado | 401, 403, 429, 503, pantalla de acceso |
| Fucsia | Servicio externo | OpenAI, Railway, Google |

## Índice de diagramas

1. **Filtro de la web (middleware de Next)**
   - [1.1 Áreas privadas: panel, portal y herramientas](#11-áreas-privadas-panel-portal-y-herramientas)
   - [1.2 Demos con acceso controlado](#12-demos-con-acceso-controlado)
   - [1.3 Caché del catálogo y respaldo estático](#13-caché-del-catálogo-y-respaldo-estático)
2. **Autorización en el backend**
   - [2.1 Sesión y rol con authenticate y requireRole](#21-sesión-y-rol-con-authenticate-y-requirerole)
   - [2.2 APIs de una demo con requireStaffOrDemoAccess](#22-apis-de-una-demo-con-requirestaffordemoaccess)
   - [2.3 La decisión con DemoGrant](#23-la-decisión-con-demogrant)
   - [2.4 Propiedad de los bots del chatbot](#24-propiedad-de-los-bots-del-chatbot)
3. **Chatbot RAG**
   - [3.1 Ingesta y fragmentación de documentos](#31-ingesta-y-fragmentación-de-documentos)
   - [3.2 Pipeline de una pregunta](#32-pipeline-de-una-pregunta)
   - [3.3 Secuencia de una pregunta](#33-secuencia-de-una-pregunta) (diagrama de secuencia)
4. **Prueba con tu documento**
   - [4.1 Subida del documento](#41-subida-del-documento)
   - [4.2 Preguntas sobre el documento](#42-preguntas-sobre-el-documento)
   - [4.3 Secuencia completa](#43-secuencia-completa) (diagrama de secuencia)
   - [4.4 Vida del documento en memoria](#44-vida-del-documento-en-memoria) (diagrama de estados)
5. **Generador de LinkedIn Ads**
   - [5.1 Proxy de la web](#51-proxy-de-la-web)
   - [5.2 Lo que decide el backend](#52-lo-que-decide-el-backend)
6. **Errores y salud del backend**
   - [6.1 Recorrido de una petición](#61-recorrido-de-una-petición)
   - [6.2 Manejo de errores](#62-manejo-de-errores)
   - [6.3 Health checks](#63-health-checks)
7. **Arranque del backend**
   - [7.1 Validación de variables de entorno](#71-validación-de-variables-de-entorno)
   - [7.2 Secuencia de arranque](#72-secuencia-de-arranque)
8. **Datos personales (Ley 1581 de 2012)**
   - [8.1 Solicitud de demo y cuenta](#81-solicitud-de-demo-y-cuenta)
   - [8.2 Demos con IA y navegador](#82-demos-con-ia-y-navegador)
   - [8.3 Qué se guarda, dónde y cuánto tiempo](#83-qué-se-guarda-dónde-y-cuánto-tiempo) (tabla)
9. [Hallazgos](#hallazgos)

---

## 1. Filtro de la web (middleware de Next)

El middleware de la web (`apps/web/src/middleware.ts`) corre en el servidor de Vercel antes de mostrar `/admin`, `/dashboard`, `/liquidacion`, `/test` y cualquier `/demo/<slug>`. Es una barrera extra: el backend vuelve a autorizar cada endpoint (sección 2).

### 1.1 Áreas privadas: panel, portal y herramientas

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    A["Petición a /admin, /dashboard,<br/>/liquidacion o /test"]:::visitante
    R["Roles que exige el área<br/>/admin: admin o manager<br/>/admin/solicitudes, /accesos y /catalogo-demos: también sales<br/>/liquidacion: admin, manager o sales<br/>/test: admin · /dashboard: cualquier rol"]:::sistema
    Q1{"¿Hay cookie<br/>accessToken?"}:::decision
    Q2{"¿Ese token está en la<br/>caché de 30 s de la instancia?"}:::decision
    ME["GET /api/auth/me con Bearer, máx. 5 s<br/>con X-Internal-Key y X-Client-IP si hay INTERNAL_API_KEY<br/>si responde 200, guarda la sesión 30 s"]:::sistema
    Q3{"¿Qué responde?"}:::decision
    Q4{"¿Hay cookie refreshToken<br/>y todavía no se renovó<br/>en esta petición?"}:::decision
    RF["POST /api/auth/refresh<br/>máx. 5 s"]:::sistema
    Q5{"¿Devolvió un<br/>token nuevo?"}:::decision
    E503["Página 503 «No pudimos verificar tu sesión»<br/>Retry-After 60, no se sirve la página"]:::error
    LOGIN["Redirige a /login?redirect=ruta<br/>y borra la cookie accessToken"]:::error
    Q6{"¿Su rol está en<br/>los del área?"}:::decision
    HOME["Redirige al inicio de su rol<br/>/admin, /admin/solicitudes, /dashboard/demos o /dashboard<br/>o a / si ya estaba en esa página"]:::error
    Q7{"¿Es prospect fuera de<br/>/dashboard/demos y /dashboard/profile?"}:::decision
    PD["Redirige a /dashboard/demos"]:::error
    OK["Sirve la página<br/>Cache-Control no-store y X-Robots-Tag noindex<br/>más la cookie renovada por 15 min si hubo"]:::visitante

    A --> R --> Q1
    Q1 -->|Sí| Q2
    Q1 -->|No| Q4
    Q2 -->|Sí| Q6
    Q2 -->|No| ME --> Q3
    Q3 -->|200 con id y rol| Q6
    Q3 -->|"401, 403, 404 o sin rol"| Q4
    Q3 -->|"Otro código, más de 5 s o sin red"| E503
    Q4 -->|Sí| RF --> Q5
    Q4 -->|No| LOGIN
    Q5 -->|Sí, consulta otra vez con el token nuevo| Q2
    Q5 -->|No| LOGIN
    Q6 -->|No| HOME
    Q6 -->|Sí| Q7
    Q7 -->|Sí| PD
    Q7 -->|No| OK
```

![Diagrama: Áreas privadas: panel, portal y herramientas](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-1.png)

Cada navegación (y cada prefetch de Next) a un área privada pregunta al backend quién es la sesión y con qué rol, salvo que esa misma instancia lo haya verificado hace menos de 30 s. La renovación con `refreshToken` se intenta una sola vez por petición. Un 404 del backend cuenta como «sin sesión»: con Railway caído eso manda al login en vez de mostrar la página 503 (hallazgo 1 de [Flujos de administración](Doc-14-2-Flujos-de-Administracion-y-Operacion.md#hallazgos)). El backend cuenta estas consultas en su propio cupo de 120 por minuto (diagrama 6.1); si lo agota responde 429 y aquí se ve la página 503.

Fuente en el código: `apps/web/src/middleware.ts` (`middleware`, `fetchMe`, `refreshAccessToken`), `apps/web/src/lib/auth-roles.ts`, `apps/backend/src/middleware/rateLimiter.ts` (`authMeRateLimiter`).

---

### 1.2 Demos con acceso controlado

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    A["Petición a /demo/slug<br/>o a una de sus subrutas"]:::visitante
    Q0{"¿El slug es una de las 28 demos?<br/>tabla demo-access-defaults"}:::decision
    NX["Next resuelve la ruta<br/>404 si no existe"]:::sistema
    CAT["Modo y estado de la demo<br/>caché del catálogo o tabla de respaldo<br/>diagrama 1.3"]:::sistema
    Q1{"¿Modo publico<br/>y activa?"}:::decision
    P1["Sirve la demo sin más consultas<br/>funciona aunque el backend esté caído"]:::visitante
    Q2{"¿Hay cookie accessToken<br/>o refreshToken?"}:::decision
    Q3{"¿El modo vino<br/>del backend?"}:::decision
    M1["motivo no_disponible"]:::error
    M2["motivo sin_sesion si está activa<br/>o desactivada si no"]:::error
    Q4{"¿Hay accessToken?"}:::decision
    ASK["GET /api/demo-access/slug con Bearer, máx. 5 s<br/>con ?registrar=0 si es un prefetch de Next"]:::sistema
    Q5{"¿Qué responde?"}:::decision
    Q6{"¿Hay refreshToken y todavía<br/>no se renovó en esta petición?"}:::decision
    RF["POST /api/auth/refresh"]:::sistema
    Q7{"¿Token nuevo?"}:::decision
    M3["motivo que dio el backend<br/>sin_acceso, expirado con su fecha,<br/>revocado o desactivada"]:::error
    NX2["Deja pasar la página a Next<br/>sin más chequeos, ver Hallazgos"]:::sistema
    REW["Reescribe a /demo-acceso/slug<br/>con motivo, modo, vence y ruta<br/>la URL no cambia · private, no-store y noindex"]:::error
    P2["Sirve la demo<br/>Cache-Control private, no-store, noindex<br/>y cookie renovada si hubo"]:::visitante

    A --> Q0
    Q0 -->|No| NX
    Q0 -->|Sí| CAT --> Q1
    Q1 -->|Sí| P1
    Q1 -->|No| Q2
    Q2 -->|No| Q3
    Q3 -->|No| M1
    Q3 -->|Sí| M2
    Q2 -->|Sí| Q4
    Q4 -->|Sí| ASK --> Q5
    Q4 -->|No, solo refreshToken| RF
    Q5 -->|200 y permitido| P2
    Q5 -->|200 y denegado| M3
    Q5 -->|401 token vencido| Q6
    Q5 -->|404| NX2
    Q5 -->|"Otro código, más de 5 s o sin red"| M1
    Q6 -->|Sí| RF --> Q7
    Q6 -->|No| M2
    Q7 -->|Sí, repite la consulta| ASK
    Q7 -->|No| M2
    M1 --> REW
    M2 --> REW
    M3 --> REW
```

![Diagrama: Demos con acceso controlado](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-2.png)

Las demos abiertas pasan sin tocar el backend; las de modo `solicitud` o `privado` (o cualquier demo desactivada) se consultan siempre con la sesión. Un motivo que no esté en la lista conocida (`sin_sesion`, `sin_acceso`, `expirado`, `revocado`, `desactivada`, `no_disponible`) se muestra como `sin_acceso`. La pantalla de acceso, con sus textos, está en el diagrama 7c de [Flujos de negocio](Doc-14-1-Flujos-de-Negocio.md#7c-entrar-a-una-demo-la-pantalla-de-acceso).

Fuente en el código: `apps/web/src/middleware.ts` (`demoGate`, `fetchDemoAccess`, `accessScreen`, `isPrefetch`), `apps/web/src/lib/demo-access-defaults.ts`, `apps/backend/src/routes/demo-public.routes.ts` (`GET /api/demo-access/:slug`).

---

### 1.3 Caché del catálogo y respaldo estático

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["catalogEntry del slug<br/>lo pide el filtro de demos"]:::sistema
    Q1{"¿Caché vacía o con<br/>más de 60 s?"}:::decision
    Q2{"¿Pasaron más de 10 s<br/>desde el último fallo?"}:::decision
    REQ["GET /api/demo-catalog, máx. 2,5 s<br/>una sola petición a la vez por instancia"]:::sistema
    BE["Backend: lee el catálogo de MongoDB<br/>si falla, responde 200 con la semilla<br/>fuente respaldo"]:::sistema
    Q3{"¿200 con una<br/>lista válida?"}:::decision
    SAVE["Guarda la caché<br/>slug: modo y activo"]:::sistema
    FAIL["Anota la hora del fallo<br/>se queda con la caché vieja si había"]:::error
    Q4{"¿El slug está<br/>en la caché?"}:::decision
    R1["Usa el modo del backend<br/>cuenta como respuesta del backend<br/>aunque la caché tenga más de 60 s"]:::sistema
    R2["Usa la tabla de respaldo demo-access-defaults<br/>modo de la semilla, privado si no aparece, activa<br/>no cuenta como respuesta del backend"]:::sistema

    IN --> Q1
    Q1 -->|No| Q4
    Q1 -->|Sí| Q2
    Q2 -->|No| Q4
    Q2 -->|Sí| REQ --> BE --> Q3
    Q3 -->|Sí| SAVE --> Q4
    Q3 -->|"No, error o más de 2,5 s"| FAIL --> Q4
    Q4 -->|Sí| R1
    Q4 -->|No| R2
```

![Diagrama: Caché del catálogo y respaldo estático](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-3.png)

Cada instancia del servidor de la web guarda el catálogo 60 s; si el backend falla, reintenta como mucho cada 10 s y mientras tanto usa la última copia que tenga, que es la última decisión conocida del administrador. Sin ninguna copia usa la tabla fija, igual a la semilla del backend (una prueba lo verifica). Por eso un cambio de modo en el panel tarda hasta un minuto en llegar al filtro ([diagrama 3.2 de administración](Doc-14-2-Flujos-de-Administracion-y-Operacion.md#32-cómo-se-propaga-el-cambio)).

Fuente en el código: `apps/web/src/middleware.ts` (`loadCatalog`, `catalogEntry`), `apps/web/src/lib/demo-access-defaults.ts`, `apps/backend/src/routes/demo-public.routes.ts` (`GET /api/demo-catalog`).

---

## 2. Autorización en el backend

Cada router aplica una política (inventario completo en `apps/backend/src/routes/POLICIES.md` y en [Roles y permisos](Doc-10-Roles-y-Permisos.md)). Los roles de staff y admin se leen de MongoDB en cada petición, no del token.

### 2.1 Sesión y rol con authenticate y requireRole

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["Petición a una ruta protegida"]:::visitante
    Q0{"¿Es una ruta solo de desarrollo<br/>devOnlyAdmin y NODE_ENV production?"}:::decision
    E404["404 Endpoint not found"]:::error
    Q1{"¿Cabecera Authorization<br/>con Bearer?"}:::decision
    E401a["401 No token provided"]:::error
    Q2{"¿JWT_SECRET<br/>configurada?"}:::decision
    E500["500 Server configuration error"]:::error
    Q3{"¿jwt.verify acepta<br/>el token?"}:::decision
    E401b["401 Token expired<br/>code TOKEN_EXPIRED"]:::error
    E401c["401 Invalid token"]:::error
    U["req.user con id, email y rol del token<br/>aquí termina authenticate"]:::sistema
    Q4{"¿La ruta exige rol?<br/>requireRole, requireStaff o requireAdmin"}:::decision
    C1["Controlador<br/>si el recurso tiene dueño, lo verifica adentro<br/>p. ej. pedidos, documentos, mensajes"]:::sistema
    DB["Lee la cuenta en MongoDB<br/>email, rol y nombre vigentes"]:::sistema
    Q5{"¿MongoDB conectado<br/>y respondió?"}:::decision
    E503["503 service_unavailable<br/>falla cerrada"]:::error
    Q6{"¿La cuenta existe?"}:::decision
    E401d["401 Tu sesión ya no es válida"]:::error
    Q7{"¿Su rol vigente está<br/>en la lista de la ruta?"}:::decision
    E403["403 Forbidden<br/>Insufficient permissions"]:::error
    C2["Controlador con req.user<br/>actualizado con el rol de la BD"]:::sistema

    IN --> Q0
    Q0 -->|Sí| E404
    Q0 -->|No| Q1
    Q1 -->|No| E401a
    Q1 -->|Sí| Q2
    Q2 -->|No| E500
    Q2 -->|Sí| Q3
    Q3 -->|Vencido| E401b
    Q3 -->|Firma inválida| E401c
    Q3 -->|Sí| U --> Q4
    Q4 -->|No| C1
    Q4 -->|Sí| DB --> Q5
    Q5 -->|No| E503
    Q5 -->|Sí| Q6
    Q6 -->|No| E401d
    Q6 -->|Sí| Q7
    Q7 -->|No| E403
    Q7 -->|Sí| C2
```

![Diagrama: Sesión y rol con authenticate y requireRole](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-4.png)

`requireRole(...roles)` siempre corre `authenticate` primero y luego lee la cuenta de la base: si a alguien le quitan el rol o le borran la cuenta, pierde el acceso de inmediato aunque su token siga vigente. `requireStaff` es `admin`, `manager` o `sales`; `requireAdmin`, solo `admin`. Existe además `authorize(...roles)` en `middleware/auth.ts`, que confía en el rol escrito dentro del token, pero ninguna ruta lo usa (ver Hallazgos).

Fuente en el código: `apps/backend/src/middleware/auth.ts` (`authenticate`, `authorize`), `apps/backend/src/middleware/access.ts` (`requireRole`, `loadFreshUser`, `devOnlyAdmin`), `apps/backend/src/routes/POLICIES.md`.

---

### 2.2 APIs de una demo con requireStaffOrDemoAccess

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["Petición a una API de demo con backend real<br/>cuentas-medicas, sistema-experto,<br/>gestor-contenido o linkedin-ads"]:::visitante
    Q1{"¿Trae un Bearer válido?<br/>readBearer, sin responder"}:::decision
    AN["Sigue como anónimo<br/>recuerda si el token venció"]:::sistema
    DB["Lee la cuenta en MongoDB"]:::sistema
    Q2{"¿MongoDB respondió?"}:::decision
    DOWN["Anota BD caída<br/>sigue como anónimo"]:::error
    Q3{"¿Cuenta con rol admin,<br/>manager o sales?"}:::decision
    ST["Pasa: demoAccess staff"]:::visitante
    RES["Resolvedor demoGrantResolver<br/>evaluateDemoAccess, diagrama 2.3"]:::sistema
    Q4{"¿El resolvedor falló o<br/>respondió no_disponible?"}:::decision
    Q5{"¿Permitido?<br/>publico, grant o developer"}:::decision
    OK["Pasa: demoAccess con el motivo<br/>y el grantId si hay acceso"]:::visitante
    Q6{"¿BD caída?"}:::decision
    E503["503 service_unavailable"]:::error
    Q7{"¿Demo desactivada<br/>o inexistente?"}:::decision
    E403a["403 demo_disabled"]:::error
    Q8{"¿Hay cuenta?"}:::decision
    Q9{"¿El token venció?"}:::decision
    E401a["401 TOKEN_EXPIRED<br/>Tu sesión expiró"]:::error
    E401b["401 login_required<br/>motivo sin_sesion"]:::error
    E403b["403 demo_access_required<br/>motivo expirado, revocado o sin_acceso<br/>con su mensaje"]:::error

    IN --> Q1
    Q1 -->|No| AN --> RES
    Q1 -->|Sí| DB --> Q2
    Q2 -->|No| DOWN --> RES
    Q2 -->|Sí| Q3
    Q3 -->|Sí| ST
    Q3 -->|"No, o la cuenta ya no existe"| RES
    RES --> Q4
    Q4 -->|Sí, cuenta como BD caída| Q6
    Q4 -->|No| Q5
    Q5 -->|Sí| OK
    Q5 -->|No| Q6
    Q6 -->|Sí| E503
    Q6 -->|No| Q7
    Q7 -->|Sí| E403a
    Q7 -->|No| Q8
    Q8 -->|No| Q9
    Q9 -->|Sí| E401a
    Q9 -->|No| E401b
    Q8 -->|Sí| E403b
```

![Diagrama: APIs de una demo con requireStaffOrDemoAccess](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-5.png)

Este middleware protege las APIs de las demos que tienen backend propio. Con la base caída, una demo en modo `publico` sigue abierta (el resolvedor usa la semilla) y las demás fallan cerradas con 503. El rol `developer` no está en la lista de staff de este middleware, pero el resolvedor lo deja pasar como staff.

Fuente en el código: `apps/backend/src/middleware/access.ts` (`requireStaffOrDemoAccess`, `readBearer`), `apps/backend/src/services/demo-access.service.ts` (`demoGrantResolver`), `apps/backend/src/routes/auditoria.routes.ts`, `expert-system.routes.ts`, `cups.routes.ts`, `content-manager.routes.ts`, `documentoConocimientoConfig.routes.ts`, `linkedin-ads.routes.ts`.

---

### 2.3 La decisión con DemoGrant

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["evaluateDemoAccess<br/>slug y cuenta vigente o ninguna"]:::sistema
    Q1{"¿MongoDB conectado y<br/>el catálogo responde?"}:::decision
    SEED["Usa la semilla del catálogo<br/>y anota BD caída"]:::error
    CAT["Entrada del catálogo en MongoDB<br/>o de la semilla si no está guardada"]:::sistema
    Q2{"¿La demo existe?"}:::decision
    NE["no_existe<br/>GET /api/demo-access responde 404"]:::error
    Q3{"¿Rol admin, sales,<br/>manager o developer?"}:::decision
    STAFF["Permitido: staff<br/>aunque esté desactivada, sin registrar uso"]:::visitante
    Q4{"¿Activa?"}:::decision
    DES["desactivada"]:::error
    Q5{"¿Modo publico?"}:::decision
    PUB["Permitido: publico<br/>si tiene un acceso vigente, informa<br/>el vencimiento y registra el uso"]:::visitante
    Q6{"¿BD caída?"}:::decision
    ND["no_disponible<br/>falla cerrada"]:::error
    Q7{"¿Hay cuenta con<br/>id válido?"}:::decision
    SS["sin_sesion"]:::error
    FIND["Busca sus DemoGrant de esa demo<br/>los 20 cambiados más recientemente"]:::sistema
    Q8{"¿Alguno con estado activo<br/>y expiresAt en el futuro?"}:::decision
    USE["Registra el uso<br/>+1 visita si pasaron 30 min o es el primero<br/>si no, solo actualiza ultimoAcceso"]:::sistema
    G["Permitido: grant<br/>con vencimiento y días restantes"]:::visitante
    Q9{"¿Tiene alguno?"}:::decision
    SA["sin_acceso"]:::error
    Q10{"¿El más reciente<br/>está revocado?"}:::decision
    REV["revocado"]:::error
    EXP["expirado con su fecha<br/>aunque el job no lo haya marcado"]:::error

    IN --> Q1
    Q1 -->|No| SEED --> Q2
    Q1 -->|Sí| CAT --> Q2
    Q2 -->|No| NE
    Q2 -->|Sí| Q3
    Q3 -->|Sí| STAFF
    Q3 -->|No| Q4
    Q4 -->|No| DES
    Q4 -->|Sí| Q5
    Q5 -->|Sí| PUB
    Q5 -->|No| Q6
    Q6 -->|Sí| ND
    Q6 -->|No| Q7
    Q7 -->|No| SS
    Q7 -->|Sí| FIND --> Q8
    FIND -->|Error de lectura| ND
    Q8 -->|Sí| USE --> G
    Q8 -->|No| Q9
    Q9 -->|No| SA
    Q9 -->|Sí| Q10
    Q10 -->|Sí| REV
    Q10 -->|No| EXP
```

![Diagrama: La decisión con DemoGrant](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-6.png)

Es la única fuente de verdad del acceso a demos: la usan la web (vía `GET /api/demo-access`) y las APIs (vía el middleware 2.2). La vigencia se compara con la hora en cada consulta, así que un acceso vence a tiempo aunque el job de vencimiento no haya corrido. El registro de uso depende de quién pregunta: la web lo actualiza en cada visita real, un prefetch (`?registrar=0`) no registra nada y las APIs actualizan `ultimoAcceso` como mucho cada 5 min.

Fuente en el código: `apps/backend/src/services/demo-access.service.ts` (`evaluateDemoAccess`, `effectiveGrantState`, `recordUse`), `apps/backend/src/services/demo-catalog.service.ts` (`getCatalogEntry`, `seedEntry`), `apps/backend/src/config/demos.ts` (`DEMO_STAFF_ROLES`), `apps/backend/src/models/DemoGrant.ts`.

---

### 2.4 Propiedad de los bots del chatbot

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    C["POST /api/chatbot/bots<br/>máx. 30 por IP por hora"]:::visitante
    Q1{"¿Campos de configuración<br/>válidos?"}:::decision
    E400["400 invalid_field<br/>o field_too_long"]:::error
    Q2{"¿Trae el botId de<br/>un bot existente?"}:::decision
    Q3{"¿Hay menos de<br/>5.000 bots?"}:::decision
    E503["503 capacity"]:::error
    Q4{"¿Trae exactamente un<br/>token válido en la cabecera?"}:::decision
    REUSE["Reutiliza ese token<br/>una llave para todos los bots del navegador"]:::sistema
    NEW["Genera un token nuevo<br/>32 bytes aleatorios en base64url"]:::sistema
    SAVE["Guarda solo el SHA-256 del token<br/>201 con ownerToken, que no se vuelve a mostrar"]:::sistema
    LS["El navegador guarda el token en localStorage<br/>koptup.chatbot.myBots"]:::visitante
    R["Ruta de dueño con X-Bot-Owner-Token<br/>PATCH o DELETE del bot, docs, urls,<br/>ver o borrar conversaciones"]:::visitante
    Q5{"¿Existe el bot?"}:::decision
    E404["404 bot_not_found"]:::error
    TOK["Lee la cabecera: hasta 50 tokens separados por comas<br/>cada uno de 32 a 128 caracteres A-Z a-z 0-9 _ -"]:::sistema
    Q6{"¿Quedó algún<br/>token válido?"}:::decision
    E401["401 owner_token_required"]:::error
    Q7{"¿El bot tiene hash<br/>de dueño guardado?"}:::decision
    MIG["Migración: el bot queda a nombre<br/>del primer token y se guarda"]:::sistema
    Q8{"¿El SHA-256 de algún token<br/>coincide? comparación de tiempo constante"}:::decision
    E403["403 forbidden_not_owner"]:::error
    OK["Ejecuta la acción y guarda el estado<br/>data/chatbots/state.json"]:::sistema

    C --> Q1
    Q1 -->|No| E400
    Q1 -->|Sí| Q2
    Q2 -->|Sí, se trata como actualización| Q5
    Q2 -->|No| Q3
    Q3 -->|No| E503
    Q3 -->|Sí| Q4
    Q4 -->|Sí| REUSE --> SAVE
    Q4 -->|No| NEW --> SAVE
    SAVE --> LS
    LS -.->|Lo envía en cada ruta de dueño| R
    R --> Q5
    Q5 -->|No| E404
    Q5 -->|Sí| TOK --> Q6
    Q6 -->|No| E401
    Q6 -->|Sí| Q7
    Q7 -->|No| MIG --> OK
    Q7 -->|Sí| Q8
    Q8 -->|No| E403
    Q8 -->|Sí| OK
```

![Diagrama: Propiedad de los bots del chatbot](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-7.png)

Los bots del chatbot no usan cuentas: la propiedad es un token aleatorio que solo conoce el navegador que creó el bot. Sin ese token, `GET /api/chatbot/bots/:id` da la vista pública (sin el prompt del sistema ni los nombres de los documentos) y `POST /api/chatbot/bots/:id/chat` responde a cualquiera, para que funcione el widget insertado en otro sitio. `GET /api/chatbot/bots` sin token solo lista los bots de ejemplo de `CHATBOT_EXAMPLE_BOT_IDS`.

Fuente en el código: `apps/backend/src/routes/chatbot.routes.ts` (`requireOwner`, `readOwnerTokens`, `isOwner`, `POST /bots`), `apps/backend/src/app.ts` (`BOT_OWNER_TOKEN_HEADER` en CORS), `apps/web/src/app/demo/chatbot/components/builder/api.ts`.

---

## 3. Chatbot RAG

Es la demo `/demo/chatbot` en sus modos «Prueba el asistente» (empresas ficticias con sus documentos) y «Configura el tuyo» (bot propio y widget). Al elegir una empresa de ejemplo, el navegador crea un bot real en el backend y le sube los textos; desde ahí todo es el mismo pipeline. La guía de uso está en [Guía de la demo del chatbot](Guia-Demo-chatbot.md).

### 3.1 Ingesta y fragmentación de documentos

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["Configura el tuyo o empresa de ejemplo<br/>POST /bots/id/docs con archivos en base64<br/>cuerpo JSON de hasta 15 MB"]:::visitante
    OWN["Verifica el dueño, diagrama 2.4"]:::sistema
    Q1{"¿Entre 1 y 5 archivos y el bot<br/>queda con 50 o menos?"}:::decision
    E400["400 no_files, too_many_files<br/>o too_many_docs"]:::error
    Q2{"Por cada archivo: ¿tiene<br/>contenido y pesa 5 MB o menos?"}:::decision
    EX["Extrae el texto<br/>PDF con pdf-parse, DOCX con mammoth o texto plano<br/>máx. 500.000 caracteres"]:::sistema
    Q3{"¿Se pudo leer<br/>y tiene texto?"}:::decision
    ERRF["Error de ese archivo<br/>missing_content, file_too_large, unreadable,<br/>empty_content o bot_capacity"]:::error
    P["Parte en párrafos separados por una línea en blanco<br/>descarta los de 20 caracteres o menos"]:::sistema
    Q4{"¿El párrafo tiene más<br/>de 800 caracteres?"}:::decision
    S1["Un fragmento por párrafo"]:::sistema
    S2["Lo parte por oraciones y las agrupa<br/>en bloques de unos 500 caracteres"]:::sistema
    Q5{"¿Salió algún<br/>fragmento?"}:::decision
    S3["Bloques fijos de 500 caracteres"]:::sistema
    TK["Tokeniza cada fragmento para BM25<br/>minúsculas, palabras de 3 o más letras o dígitos"]:::sistema
    Q6{"¿El bot pasaría de<br/>5.000 fragmentos?"}:::decision
    SAVE["Guarda metadatos y fragmentos<br/>en memoria y en data/chatbots/state.json"]:::sistema
    Q7{"¿Se agregó al menos<br/>un archivo?"}:::decision
    R201["201 con docs, added y errors"]:::visitante
    R422["422 no_valid_files"]:::error
    URL["Variante POST /bots/id/urls<br/>hasta 5 URLs de 2 MB y 8 s cada una<br/>bloquea IP privadas y quita el HTML"]:::sistema

    IN --> OWN --> Q1
    Q1 -->|No| E400
    Q1 -->|Sí| Q2
    Q2 -->|No| ERRF
    Q2 -->|Sí| EX --> Q3
    Q3 -->|No| ERRF
    Q3 -->|Sí| P --> Q4
    URL -.->|Texto de la página| P
    Q4 -->|No| S1 --> Q5
    Q4 -->|Sí| S2 --> Q5
    Q5 -->|No| S3 --> TK
    Q5 -->|Sí| TK
    TK --> Q6
    Q6 -->|Sí| ERRF
    Q6 -->|No| SAVE --> Q7
    ERRF --> Q7
    Q7 -->|Sí| R201
    Q7 -->|No| R422
```

![Diagrama: Ingesta y fragmentación de documentos](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-8.png)

No hay embeddings: el «índice» de cada documento son las palabras normalizadas de sus fragmentos. Un archivo con error no frena a los demás de la misma petición; la respuesta dice cuáles entraron y por qué fallaron los otros. Las URLs responden siempre 200 con su propia lista de errores (`invalid_url`, `empty_content` si la página tiene menos de 40 caracteres de texto, o el motivo del bloqueo de red).

Fuente en el código: `apps/backend/src/routes/chatbot.routes.ts` (`POST /bots/:botId/docs`, `POST /bots/:botId/urls`, `BOT_LIMITS`), `apps/backend/src/services/rag-pipeline.ts` (`chunkText`, `tokenize`), `apps/backend/src/services/document-text.service.ts`, `apps/backend/src/services/safe-fetch.service.ts`, `apps/backend/src/app.ts` (límite de 15 MB).

---

### 3.2 Pipeline de una pregunta

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    Q["Pregunta en Prueba el asistente,<br/>la vista previa o el widget<br/>POST /api/chatbot/bots/id/chat"]:::visitante
    RL{"¿Dentro de 60 peticiones<br/>por minuto por IP?"}:::decision
    E429["429 Too many chatbot requests"]:::error
    Q1{"¿Existe el bot?"}:::decision
    E404["404 bot_not_found"]:::error
    Q2{"¿Mensaje de 1 a 2.000 caracteres<br/>e historial de 50 turnos o menos?"}:::decision
    E400["400 empty_message, message_too_long<br/>o history_too_long"]:::error
    H["Historial: últimos 10 turnos de 2.000 caracteres<br/>modelo de la lista blanca, gpt-4o-mini por defecto"]:::sistema
    BM["Búsqueda BM25-lite en los fragmentos del bot<br/>puntaje: IDF por tf dividido entre tf más 1<br/>top 5 con puntaje mayor que 0"]:::sistema
    K{"¿Hay<br/>OPENAI_API_KEY?"}:::decision
    B{"¿Queda presupuesto del mes?<br/>CHATBOT_MONTHLY_BUDGET_USD, 50 por defecto<br/>gasto medido en Redis"}:::decision
    PR["Prompt del sistema: rol y tono del bot<br/>más las reglas obligatorias: solo los fragmentos,<br/>citar cada dato con [n] y, si no está, decir<br/>«No encontré esa información en los documentos cargados.»"]:::sistema
    CX["Contexto: fragmentos numerados [1] a [5]<br/>con el nombre de su documento<br/>o un aviso de que no hay ninguno"]:::sistema
    AI["OpenAI Chat Completions<br/>temperatura 0,3, máx. 800 tokens, 30 s"]:::externo
    OK{"¿Respondió bien?"}:::decision
    SP["Suma el costo al gasto del mes<br/>tokens por el precio del modelo"]:::sistema
    EX["Modo extractivo<br/>cita los fragmentos [1] a [n] recortados a 280 caracteres<br/>o «No encontré esa información»"]:::sistema
    FB["Modo extractivo con aviso<br/>cupo del mes agotado, IA no disponible<br/>o error del proveedor"]:::error
    LOG["Guarda pregunta y respuesta en el historial del bot<br/>últimos 200 turnos, en disco"]:::sistema
    OUT["Respuesta con fuentes: documento, puntaje y texto<br/>confianza, modelo, latencia, tokens y costo"]:::visitante

    Q --> RL
    RL -->|No| E429
    RL -->|Sí| Q1
    Q1 -->|No| E404
    Q1 -->|Sí| Q2
    Q2 -->|No| E400
    Q2 -->|Sí| H --> BM --> K
    K -->|No| EX
    K -->|Sí| B
    B -->|"No, o Redis no responde"| FB
    B -->|Sí| PR --> CX --> AI --> OK
    OK -->|Sí| SP --> LOG
    OK -->|"Error o más de 30 s"| FB
    EX --> LOG
    FB --> LOG
    LOG --> OUT
```

![Diagrama: Pipeline de una pregunta](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-9.png)

Así el chatbot evita inventar: el modelo solo ve los cinco fragmentos más parecidos a la pregunta y las reglas le obligan a citarlos o a decir que no encontró la información. Sin clave de OpenAI, sin presupuesto o si el proveedor falla, la demo no se cae: responde en modo extractivo con los fragmentos y su cita. La confianza que muestra es fija según el camino (0,85 con modelo y fragmentos, 0,5 con modelo sin fragmentos, 0,3 extractivo con fragmentos y 0 sin ellos), no una medida del modelo.

Fuente en el código: `apps/backend/src/routes/chatbot.routes.ts` (`POST /bots/:botId/chat`, `GROUNDING_RULES`, `composeExtractiveReply`, `sanitizeHistory`), `apps/backend/src/services/rag-pipeline.ts` (`retrieve`, `callOpenAI`, `estimateCostUSD`, `OPENAI_MODELS`), `apps/backend/src/services/ai-budget.service.ts`, `apps/backend/src/middleware/rateLimiter.ts` (`chatbotRateLimiter`).

---

### 3.3 Secuencia de una pregunta

```mermaid
sequenceDiagram
    box rgb(219,234,254) Visitante
        participant N as Navegador
    end
    box rgb(241,245,249) Sistema
        participant B as Backend
        participant R as Redis
        participant D as Disco state.json
    end
    box rgb(253,244,255) Externo
        participant O as OpenAI
    end
    N->>B: POST /api/chatbot/bots/id/chat con message, history y model
    B->>B: Límite de 60 por minuto, valida bot, mensaje e historial
    B->>B: BM25-lite sobre los fragmentos del bot, top 5
    alt Sin OPENAI_API_KEY
        B->>B: Respuesta extractiva con los fragmentos citados
    else Con clave
        B->>R: GET chatbot:spend:AAAA-MM
        R-->>B: Gasto acumulado del mes
        alt Gasto igual o mayor al tope, o Redis no responde
            B->>B: Extractiva con aviso budget_exhausted o budget_unavailable
        else Hay presupuesto
            B->>O: Chat Completions con reglas, fragmentos numerados, 10 turnos y la pregunta
            alt OpenAI responde
                O-->>B: Respuesta y tokens usados
                B->>R: INCRBYFLOAT del costo y EXPIRE de 62 días
            else Error o 30 s sin respuesta
                B->>B: Extractiva con error llm_provider_error
            end
        end
    end
    B->>D: Guarda pregunta y respuesta, últimos 200 turnos del bot
    B-->>N: reply, sources, confidence, model, latencyMs, tokens y costUSD
    N->>N: Muestra la respuesta, sus fuentes y los pasos del pipeline
```

![Diagrama: Secuencia de una pregunta](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-10.png)

La misma pregunta vista en el tiempo. El navegador llama directo al backend (no pasa por un proxy de Next). El gasto del mes se guarda en Redis con la clave del mes en UTC, igual que factura OpenAI, y nunca se le muestra al visitante.

Fuente en el código: `apps/web/src/app/demo/chatbot/page.tsx`, `apps/web/src/app/demo/chatbot/components/builder/api.ts` (`chatWithBot`), `apps/backend/src/routes/chatbot.routes.ts`, `apps/backend/src/services/ai-budget.service.ts` (`getBudgetStatus`, `recordSpend`), `apps/backend/src/data/chatbot-store.ts`.

---

## 4. Prueba con tu documento

Es la pestaña de `/demo/chatbot` donde el visitante sube su propio PDF, DOCX o TXT. Usa el mismo pipeline del chatbot, pero sin modo extractivo: si falta algo (interruptor, OpenAI, Redis o presupuesto) la función se apaga entera.

### 4.1 Subida del documento

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    ST["Pestaña Prueba con tu documento<br/>GET /api/demo-rag/status"]:::visitante
    Q0{"¿Encendida?<br/>interruptor, OpenAI,<br/>Redis y presupuesto"}:::decision
    UN["Aviso: no disponible o cupo del mes agotado<br/>botón Agenda una demo<br/>interruptor DEMO_UPLOAD_ENABLED=true y OPENAI_API_KEY"]:::error
    F["Formulario: archivo, email y autorización Ley 1581<br/>el navegador revisa extensión, tamaño, email y casilla"]:::visitante
    UP["POST /api/demo-rag/documents<br/>multipart"]:::visitante
    RL{"¿Dentro de 10 intentos<br/>por IP cada 10 min?"}:::decision
    E1["429 rate_limited"]:::error
    Q1{"¿Sigue encendida?<br/>se revisa antes de leer el archivo"}:::decision
    E2["503 demo_disabled<br/>o budget_exhausted"]:::error
    Q2{"¿Archivo aceptado?<br/>extensión y tipo PDF, DOCX o TXT, 5 MB<br/>se lee solo en memoria"}:::decision
    E3["415 invalid_format, 413 file_too_large<br/>o 400 missing_file o invalid_request"]:::error
    Q3{"¿Email válido y<br/>autorización marcada?"}:::decision
    E4["400 invalid_email<br/>o consent_required"]:::error
    Q4{"¿Queda cupo diario de la IP?<br/>3 documentos al día en Redis<br/>con hash de la IP y día de Colombia"}:::decision
    E5["429 daily_limit<br/>o 503 demo_disabled si Redis no responde"]:::error
    EXT["Revisa la firma: %PDF-, ZIP o texto sin bytes nulos<br/>extrae el texto en máx. 20 s: PDF por página,<br/>DOCX y TXT a 3.000 caracteres por página<br/>límites: 30 páginas, 400.000 caracteres, algo de texto<br/>y menos de 200 documentos en memoria"]:::sistema
    Q5{"¿Pasa la firma<br/>y los límites?"}:::decision
    REL["Devuelve el cupo diario<br/>DECR en Redis"]:::sistema
    E6["415 invalid_format, 422 too_many_pages,<br/>empty_document o unreadable_document<br/>o 503 capacity"]:::error
    MEM["Guarda en memoria fragmentos e índice BM25<br/>vence en 1 hora, 0 de 10 preguntas"]:::sistema
    LEAD["Registra el lead con origen demo-rag<br/>email y fecha de la autorización<br/>sin esperar: si falla, solo queda en el log"]:::sistema
    AV["Aviso al equipo por email y WhatsApp<br/>si están configurados"]:::aviso
    OK["201: documento listo<br/>el navegador guarda el docId en sessionStorage<br/>y registra el evento demo_upload"]:::visitante

    ST --> Q0
    Q0 -->|No| UN
    Q0 -->|Sí| F --> UP --> RL
    RL -->|No| E1
    RL -->|Sí| Q1
    Q1 -->|No| E2
    Q1 -->|Sí| Q2
    Q2 -->|No| E3
    Q2 -->|Sí| Q3
    Q3 -->|No| E4
    Q3 -->|Sí| Q4
    Q4 -->|"No, o Redis no responde"| E5
    Q4 -->|Sí| EXT --> Q5
    Q5 -->|No| REL --> E6
    Q5 -->|Sí| MEM
    MEM --> LEAD --> AV
    MEM --> OK
```

![Diagrama: Subida del documento](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-11.png)

El cupo diario se reserva antes de procesar el archivo y se devuelve si el documento termina rechazado, así que un PDF dañado no le gasta un intento a la persona. El archivo original nunca se escribe en disco: se procesa desde la memoria y solo se conservan el texto partido y sus palabras. Esta ruta también cuenta en el límite general de la API (100 peticiones cada 15 min, diagrama 6.1).

Fuente en el código: `apps/backend/src/routes/demo-rag.routes.ts` (`POST /documents`, `parseMultipart`, `registerDemoLead`), `apps/backend/src/services/demo-rag.service.ts` (`getDemoStatus`, `assertDemoEnabled`, `detectKind`, `hasValidSignature`, `reserveDailyUpload`, `ingestDocument`, `DEMO_LIMITS`), `apps/backend/src/services/lead.service.ts`, `apps/web/src/app/demo/chatbot/components/upload/UploadForm.tsx`, `UploadDemo.tsx`.

---

### 4.2 Preguntas sobre el documento

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    Q["Pregunta sobre el documento<br/>POST /api/demo-rag/documents/docId/questions"]:::visitante
    RL{"¿Dentro de 30 preguntas<br/>por IP cada 10 min?"}:::decision
    E1["429 rate_limited"]:::error
    V{"¿docId de 32 caracteres<br/>y pregunta de 1 a 500?"}:::decision
    E2["404 document_not_found<br/>o 400 invalid_question"]:::error
    L{"¿El documento sigue en<br/>memoria y no pasó su hora?"}:::decision
    E3["404 document_not_found<br/>el chat avisa que el documento venció"]:::error
    C{"¿Lleva menos de<br/>10 preguntas?"}:::decision
    E4["429 question_limit<br/>el contador queda en 10 de 10"]:::error
    H{"¿Sigue encendida y<br/>con presupuesto del mes?"}:::decision
    E5["503 demo_disabled<br/>o budget_exhausted"]:::error
    RES["Revisa otra vez documento y límite<br/>y reserva la pregunta en el contador"]:::sistema
    BM["BM25-lite top 5<br/>si nada coincide, los 3 primeros fragmentos"]:::sistema
    CX["Extractos etiquetados [p. N] o [fragmento N]<br/>y prompt fijo: solo el documento, citar la etiqueta,<br/>ignorar órdenes escritas dentro del documento"]:::sistema
    AI["OpenAI gpt-4o-mini<br/>con los 4 mensajes anteriores, 30 s"]:::externo
    OK{"¿Respondió?"}:::decision
    DEV["Devuelve la pregunta al contador"]:::sistema
    E6["502 llm_error<br/>la pregunta no se descontó"]:::error
    SP["Suma el costo a<br/>demo-rag:spend:AAAA-MM"]:::sistema
    NF{"¿Dice «No encontré esa<br/>información en el documento»?"}:::decision
    R1["Respuesta sin citas<br/>notFound"]:::visitante
    R2["Respuesta con citas: las páginas o fragmentos que nombró<br/>o, si no nombró ninguno, hasta 3 extractos usados<br/>de 600 caracteres, y el contador x de 10"]:::visitante

    Q --> RL
    RL -->|No| E1
    RL -->|Sí| V
    V -->|No| E2
    V -->|Sí| L
    L -->|No| E3
    L -->|Sí| C
    C -->|No| E4
    C -->|Sí| H
    H -->|No| E5
    H -->|Sí| RES --> BM --> CX --> AI --> OK
    OK -->|"Error o más de 30 s"| DEV --> E6
    OK -->|Sí| SP --> NF
    NF -->|Sí| R1
    NF -->|No| R2
```

![Diagrama: Preguntas sobre el documento](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-12.png)

El límite de 10 preguntas se revisa dos veces y la pregunta se reserva en el mismo paso, para que dos preguntas enviadas a la vez no pasen de 10. El prompt de esta demo tiene una regla extra que el chatbot general no tiene: tratar el texto del documento como contenido y no como instrucciones. Las citas se reconstruyen a partir de lo que el modelo escribió (`[p. 3]`, `[fragmento 2]`), no se inventan.

Fuente en el código: `apps/backend/src/routes/demo-rag.routes.ts` (`POST /documents/:docId/questions`, `questionRateLimiter`), `apps/backend/src/services/demo-rag.service.ts` (`askDocument`, `DEMO_SYSTEM_PROMPT`, `buildCitations`, `isNotFoundReply`), `apps/web/src/app/demo/chatbot/components/upload/DocumentChat.tsx`.

---

### 4.3 Secuencia completa

```mermaid
sequenceDiagram
    box rgb(219,234,254) Visitante
        participant N as Navegador
    end
    box rgb(241,245,249) Sistema
        participant B as Backend
        participant R as Redis
        participant M as MongoDB
    end
    box rgb(220,252,231) Avisos
        participant A as Email y WhatsApp
    end
    box rgb(253,244,255) Externo
        participant O as OpenAI
    end
    N->>B: GET /api/demo-rag/status
    B->>R: GET demo-rag:spend:AAAA-MM
    R-->>B: Gasto del mes
    B-->>N: enabled, reason y límites, sin montos
    N->>B: POST /documents con file, email y consent=true
    B->>B: Encendido, formato, 5 MB, email y autorización
    B->>R: INCR y EXPIRE 24 h de demo-rag:docs, día y hash de la IP
    R-->>B: Documentos de hoy, máximo 3
    B->>B: Firma, texto, páginas y fragmentos
    alt Documento válido
        B->>B: Fragmentos e índice en memoria por 1 hora
        B-)M: Contact con origen demo-rag, sin esperar
        B-)A: Aviso al equipo con el email del lead
        B-->>N: 201 con docId, páginas, 10 preguntas y expiresAt
    else Rechazado
        B->>R: DECR del cupo diario
        B-->>N: 415, 422 o 503 con su código
    end
    loop Hasta 10 preguntas o 1 hora
        N->>B: POST /documents/docId/questions con question
        B->>R: GET del gasto del mes
        B->>B: Reserva la pregunta y busca el top 5 con BM25-lite
        B->>O: Prompt de la demo, extractos etiquetados y 4 mensajes previos
        alt OpenAI responde
            O-->>B: Respuesta y tokens
            B->>R: INCRBYFLOAT del costo
            B-->>N: answer, citations, notFound y preguntas restantes
        else Error o 30 s
            B->>B: Devuelve la pregunta al contador
            B-->>N: 502 llm_error
        end
    end
    alt Subir otro documento
        N->>B: DELETE /documents/docId
        B->>B: Borra fragmentos, índice e historial
    else Pasa 1 hora
        B->>B: El barrido de cada 60 s lo borra
    end
```

![Diagrama: Secuencia completa](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-13.png)

Todo el recorrido en el tiempo, con quién habla con quién. El lead y el aviso al equipo salen en paralelo y no frenan la respuesta. Si la persona recarga la pestaña, el navegador recupera el documento con `GET /documents/docId` usando el `docId` de `sessionStorage`, mientras siga en memoria.

Fuente en el código: `apps/backend/src/routes/demo-rag.routes.ts`, `apps/backend/src/services/demo-rag.service.ts`, `apps/backend/src/services/ai-budget.service.ts`, `apps/backend/src/services/lead.service.ts`, `apps/web/src/app/demo/chatbot/components/upload/api.ts`, `UploadDemo.tsx` (`handleReset`).

---

### 4.4 Vida del documento en memoria

```mermaid
stateDiagram-v2
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    state "Validando, cupo diario reservado" as Validando
    state "Rechazado, se devuelve el cupo" as Rechazado
    state "En memoria, de 0 a 9 preguntas" as Activo
    state "Sin preguntas, 10 de 10" as Agotado
    state "Borrado de la memoria" as Borrado
    [*] --> Validando : POST /documents
    Validando --> Rechazado : formato, firma, páginas, sin texto o capacidad
    Rechazado --> [*]
    Validando --> Activo : 201, vence en 1 hora
    Activo --> Activo : pregunta respondida, o 502 que la devuelve
    Activo --> Agotado : décima pregunta
    Activo --> Borrado : Subir otro documento, DELETE
    Agotado --> Borrado : Subir otro documento, DELETE
    Activo --> Borrado : pasa 1 hora, barrido de 60 s o al consultarlo
    Agotado --> Borrado : pasa 1 hora
    Activo --> Borrado : reinicio o nuevo despliegue del backend
    Borrado --> [*]
    class Validando sistema
    class Activo visitante
    class Agotado visitante
    class Rechazado error
    class Borrado sistema
```

![Diagrama: Vida del documento en memoria](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-14.png)

Los estados por los que pasa un documento subido. El documento vive en la memoria de un solo proceso: un reinicio lo borra antes de la hora y, si algún día hubiera varias instancias del backend, una pregunta que llegue a otra instancia respondería «documento no encontrado». Fuera de producción, `DEMO_RAG_TTL_SECONDS` puede acortar la hora para pruebas; nunca alargarla.

Fuente en el código: `apps/backend/src/services/demo-rag.service.ts` (`documents`, `documentTtlMs`, `sweepExpiredDocuments`, `getLiveDocument`, `deleteFromMemory`), `apps/backend/src/routes/demo-rag.routes.ts` (`DELETE /documents/:docId`).

---

## 5. Generador de LinkedIn Ads

La demo `/demo/linkedin-ads` (modo `solicitud`) tiene un generador local con plantillas y un botón «Generar con IA». El botón llama a una ruta de la propia web, que reenvía al backend; el backend es el que habla con OpenAI.

### 5.1 Proxy de la web

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    B["Botón Generar con IA<br/>demo, ángulo y tono elegidos"]:::visitante
    P["POST /api/linkedin-ads/generate<br/>ruta de Next en la web, runtime Node"]:::sistema
    Q1{"¿Cuerpo de<br/>64 KB o menos?"}:::decision
    E413["413 La solicitud es demasiado grande"]:::error
    IP["Agrega la IP del visitante en X-Forwarded-For<br/>y X-Internal-Key con X-Client-IP si hay INTERNAL_API_KEY"]:::sistema
    Q2{"¿Hay cookie<br/>accessToken?"}:::decision
    Q3{"¿Hay cookie<br/>refreshToken?"}:::decision
    RF["POST /api/auth/refresh<br/>máx. 5 s"]:::sistema
    FW["Reenvía al backend con Bearer si hay sesión<br/>máx. 60 s, diagrama 5.2"]:::sistema
    Q4{"¿El backend<br/>respondió?"}:::decision
    E503["503 El servicio de generación con IA<br/>no está disponible"]:::error
    Q5{"¿La respuesta<br/>es JSON?"}:::decision
    E502["502 si era 2xx, 503 si era 5xx<br/>o el mismo 4xx: respuesta inesperada"]:::error
    Q6{"¿Código 2xx?"}:::decision
    OK["Devuelve el paquete: post, anuncio y carrusel<br/>con la cookie renovada por 15 min si hubo"]:::sistema
    ERR["Devuelve el mismo código con el mensaje en error<br/>sin punto final, y Retry-After si vino"]:::sistema
    UI1["La demo muestra la versión con IA"]:::visitante
    UI2["La demo muestra el motivo: límite, acceso, no configurada,<br/>incompleta, sin conexión o genérico<br/>y sigue con las plantillas locales"]:::error

    B --> P --> Q1
    Q1 -->|No| E413
    Q1 -->|Sí| IP --> Q2
    Q2 -->|Sí| FW
    Q2 -->|No| Q3
    Q3 -->|Sí| RF
    RF -->|"Con el token nuevo, o sin sesión si falló"| FW
    Q3 -->|No, sin sesión| FW
    FW --> Q4
    Q4 -->|"No, o más de 60 s"| E503
    Q4 -->|Sí| Q5
    Q5 -->|No| E502
    Q5 -->|Sí| Q6
    Q6 -->|Sí| OK --> UI1
    Q6 -->|No| ERR --> UI2
    E413 --> UI2
    E503 --> UI2
    E502 --> UI2
```

![Diagrama: Proxy de la web](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-15.png)

La ruta de Next no llama a OpenAI ni decide permisos: solo pasa la sesión, la IP y el cuerpo. La demo traduce el código HTTP a un motivo: 429 o 402 es «límite», 401 o 403 es «acceso», 503 con la palabra «configur» en el mensaje es «no configurada» y el resto es «genérico». En cualquier caso de error sigue mostrando el texto de las plantillas locales.

Fuente en el código: `apps/web/src/app/api/linkedin-ads/generate/route.ts`, `apps/web/src/app/demo/linkedin-ads/components/PostGenerator.tsx` (`generarConIA`), `apps/web/messages/demos/linkedin-ads.es.json` (`generator.ai.reasons`).

---

### 5.2 Lo que decide el backend

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["Backend: POST /api/linkedin-ads/generate"]:::sistema
    G{"¿Dentro del límite general?<br/>100 peticiones cada 15 min<br/>por cuenta o por IP"}:::decision
    E429a["429 Too many requests"]:::error
    A{"¿Pasa requireStaffOrDemoAccess<br/>de linkedin-ads? diagrama 2.2"}:::decision
    EA["401 login_required o TOKEN_EXPIRED<br/>403 demo_access_required o demo_disabled<br/>503 si la BD no responde"]:::error
    V{"¿Cuerpo válido?<br/>zod: demo, ángulo y tono"}:::decision
    EV["400 invalid_request<br/>con los campos que fallaron"]:::error
    K{"¿Hay<br/>OPENAI_API_KEY?"}:::decision
    EK["503 ai_unavailable<br/>la IA no está configurada"]:::error
    BU{"¿Queda presupuesto del mes?<br/>LINKEDIN_ADS_MONTHLY_BUDGET_USD<br/>20 por defecto"}:::decision
    EB["503 budget_exhausted"]:::error
    ER["503 ai_unavailable<br/>Redis no responde"]:::error
    KEY["Clave del cupo<br/>user:id con sesión, IP sin sesión"]:::sistema
    RL{"¿Queda cupo en Redis?<br/>5 cada 10 min y 30 al día"}:::decision
    E429["429 rate_limited<br/>con Retry-After"]:::error
    AI["OpenAI gpt-4o-mini con salida json_schema estricta<br/>si no la soporta, reintenta con json_object<br/>temperatura 0,85, máx. 2.500 tokens, 45 s"]:::externo
    OK{"¿Respuesta completa y<br/>con el formato pedido?"}:::decision
    SPF["Suma el costo<br/>si OpenAI cobró tokens"]:::sistema
    E502["502 llm_error<br/>o invalid_output"]:::error
    SP["Suma el costo a<br/>linkedin-ads:spend:AAAA-MM"]:::sistema
    R200["200 con data, model y usage"]:::sistema

    IN --> G
    G -->|No| E429a
    G -->|Sí| A
    A -->|No| EA
    A -->|Sí| V
    V -->|No| EV
    V -->|Sí| K
    K -->|No| EK
    K -->|Sí| BU
    BU -->|Agotado| EB
    BU -->|Redis no responde| ER
    BU -->|Sí| KEY --> RL
    RL -->|Excedido| E429
    RL -->|Redis no responde| ER
    RL -->|Sí| AI --> OK
    OK -->|Sí| SP --> R200
    OK -->|No| SPF --> E502
```

![Diagrama: Lo que decide el backend](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-16.png)

Antes de gastar un centavo se revisan, en este orden, el acceso a la demo, el formato, la clave, el presupuesto y el cupo. Todo falla cerrado: sin Redis no se puede medir el gasto ni el cupo, así que no se llama al modelo. El cupo es por cuenta porque, sin `INTERNAL_API_KEY`, la IP que ve el backend sería la de salida de Vercel, compartida por todos los visitantes.

Fuente en el código: `apps/backend/src/routes/linkedin-ads.routes.ts` (`LINKEDIN_LIMITS`), `apps/backend/src/services/linkedin-ads.service.ts` (`GenerateRequestSchema`, `generateLinkedInPack`), `apps/backend/src/services/ai-budget.service.ts` (`consumeRateLimit`, `getBudgetStatus`, `recordSpend`), `apps/backend/src/middleware/client-ip.ts`.

---

## 6. Errores y salud del backend

### 6.1 Recorrido de una petición

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["Petición HTTP al backend"]:::visitante
    TP["trust proxy con TRUST_PROXY_HOPS, 1 por defecto<br/>req.ip es la IP real del visitante"]:::sistema
    HE["helmet: cabeceras de seguridad"]:::sistema
    O1{"¿Trae cabecera<br/>Origin?"}:::decision
    O2{"¿Origin permitido?<br/>koptup.com, www.koptup.com, CORS_ORIGIN<br/>y localhost 3000 y 3001 fuera de producción"}:::decision
    E403["403 cors_forbidden<br/>vía errorHandler"]:::error
    CP["compression"]:::sistema
    J{"¿Cuerpo JSON correcto?<br/>hasta 2 MB, o 15 MB en<br/>/api/chatbot/bots/id/docs"}:::decision
    E400["400 invalid_json<br/>vía errorHandler"]:::error
    E413["413 payload_too_large<br/>vía errorHandler"]:::error
    MG["morgan: una línea de log por petición<br/>fuera de pruebas"]:::sistema
    RT{"¿Qué ruta es?"}:::decision
    L1["/api/chatbot<br/>60 por minuto por IP"]:::sistema
    L2["/api/auth/me y /api/demo-access<br/>120 por minuto por cuenta, sesión o IP"]:::sistema
    L3["Resto de /api<br/>100 cada 15 min por cuenta, sesión o IP"]:::sistema
    HC["/health y /health/live<br/>diagrama 6.3"]:::sistema
    RQ{"¿Dentro del límite?"}:::decision
    E429["429 Too many requests"]:::error
    R{"¿Existe la ruta?"}:::decision
    E404["404 Endpoint not found"]:::error
    PO["Política de la ruta, sección 2<br/>validación y controlador"]:::sistema
    EH{"¿El controlador lanzó<br/>o pasó un error?"}:::decision
    ERR["errorHandler, diagrama 6.2"]:::error
    OK["Respuesta JSON del controlador"]:::visitante

    IN --> TP --> HE --> O1
    O1 -->|"No, servidor a servidor o curl"| CP
    O1 -->|Sí| O2
    O2 -->|No| E403
    O2 -->|Sí| CP
    CP --> J
    J -->|Mal formado| E400
    J -->|Demasiado grande| E413
    J -->|Sí| MG --> RT
    RT -->|"/api/chatbot"| L1
    RT -->|"/api/auth/me o /api/demo-access"| L2
    RT -->|"Otra de /api"| L3
    RT -->|"/health"| HC
    RT -->|"Otra fuera de /api"| R
    L1 --> RQ
    L2 --> RQ
    L3 --> RQ
    RQ -->|No| E429
    RQ -->|Sí| R
    R -->|No| E404
    R -->|Sí| PO --> EH
    EH -->|Sí| ERR
    EH -->|No| OK
```

![Diagrama: Recorrido de una petición](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-17.png)

El orden de los middleware en `createApp`. Los límites se cuentan en la memoria de cada proceso (express-rate-limit), además de los cupos en Redis que tienen algunas rutas (solicitar demo, documentos de la demo RAG, LinkedIn). Muchas rutas responden sus propios errores sin pasar por `errorHandler` (`authenticate`, el chatbot, la demo RAG, LinkedIn), cada una con su formato (ver Hallazgos). La documentación Swagger en `/api-docs` solo existe fuera de producción o con `API_DOCS_ENABLED=true`.

Fuente en el código: `apps/backend/src/app.ts` (`createApp`, `getAllowedOrigins`), `apps/backend/src/middleware/rateLimiter.ts`, `apps/backend/src/middleware/client-ip.ts` (`generalRateLimitKey`).

---

### 6.2 Manejo de errores

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    IN["Error que llega a errorHandler<br/>next con error o asyncHandler"]:::error
    A{"¿Es AppError?"}:::decision
    C{"¿Es CorsError?"}:::decision
    R1["403 cors_forbidden<br/>Origen no permitido"]:::error
    R2["Su código y su mensaje<br/>code propio, o bad_request si es menor que 500<br/>o internal_error, más sus detalles"]:::error
    M{"¿Es error de multer?"}:::decision
    R3["400 upload_limit_file_size y similares<br/>mensaje en español"]:::error
    V{"¿ValidationError o<br/>CastError de Mongoose?"}:::decision
    R4["400 invalid_data<br/>Datos inválidos"]:::error
    J{"¿JSON mal formado?"}:::decision
    R5["400 invalid_json"]:::error
    T{"¿Cuerpo demasiado<br/>grande?"}:::decision
    R6["413 payload_too_large"]:::error
    O{"¿Otro 4xx del parser?"}:::decision
    R7["El mismo 4xx<br/>bad_request, Solicitud inválida"]:::error
    R8["500 internal_error<br/>Internal server error"]:::error
    LG{"¿Qué se registra?"}:::decision
    L1["logger.error con mensaje, stack,<br/>URL y método, solo en el log"]:::sistema
    L2["logger.warn: origen rechazado"]:::sistema
    HS{"¿Ya se enviaron<br/>las cabeceras?"}:::decision
    STOP["No responde de nuevo"]:::sistema
    DV{"¿NODE_ENV es<br/>development?"}:::decision
    RD["JSON success false, code, message<br/>más error y stack"]:::sistema
    RP["JSON success false, code y message<br/>sin stack, en producción y en pruebas"]:::sistema

    IN --> A
    A -->|Sí| C
    C -->|Sí| R1
    C -->|No| R2
    A -->|No| M
    M -->|Sí| R3
    M -->|No| V
    V -->|Sí| R4
    V -->|No| J
    J -->|Sí| R5
    J -->|No| T
    T -->|Sí| R6
    T -->|No| O
    O -->|Sí| R7
    O -->|No| R8
    R1 --> LG
    R2 --> LG
    R3 --> LG
    R4 --> LG
    R5 --> LG
    R6 --> LG
    R7 --> LG
    R8 --> LG
    LG -->|"Código 500 o error no previsto"| L1 --> HS
    LG -->|CORS| L2 --> HS
    LG -->|Otro| HS
    HS -->|Sí| STOP
    HS -->|No| DV
    DV -->|Sí| RD
    DV -->|No| RP
```

![Diagrama: Manejo de errores](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-18.png)

`classifyError` traduce cualquier error a un código HTTP, un `code` estable y un mensaje sin datos internos. El stack solo viaja en la respuesta cuando `NODE_ENV` es exactamente `development`; en producción y en pruebas se queda en el log. Los errores de validación de los formularios del sistema de demos llegan como `AppError` 400 `invalid_request` con `fields` y `errores` por campo (`zodToAppError`).

Fuente en el código: `apps/backend/src/middleware/errorHandler.ts` (`AppError`, `CorsError`, `classifyError`, `errorHandler`, `asyncHandler`), `apps/backend/src/routes/demo-public.routes.ts` (`zodToAppError`).

---

### 6.3 Health checks

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    RW["Railway al desplegar<br/>healthcheckPath /health/live, hasta 120 s"]:::externo
    LV["GET /health/live<br/>200 con status alive y la hora<br/>siempre que el proceso responda"]:::sistema
    Q1{"¿Respondió 200<br/>a tiempo?"}:::decision
    OK1["El despliegue nuevo entra en servicio"]:::externo
    F1["El despliegue nuevo falla<br/>Railway no lo pone en servicio"]:::error
    MON["Equipo o monitoreo<br/>GET /health"]:::admin
    Q2{"¿MongoDB conectado?<br/>readyState 1"}:::decision
    H1["200 healthy, mongo connected<br/>hora y uptime"]:::sistema
    H2["503 unavailable<br/>mongo disconnected"]:::error
    CR["El proceso se cae<br/>uncaughtException, unhandledRejection<br/>o error al arrancar: exit 1"]:::error
    RS["Railway lo reinicia<br/>ON_FAILURE, hasta 10 veces"]:::externo
    NT["Ninguno revisa Redis ni OpenAI<br/>ni pasa por los límites de /api"]:::sistema

    RW --> LV --> Q1
    Q1 -->|Sí| OK1
    Q1 -->|No| F1
    MON --> Q2
    Q2 -->|Sí| H1
    Q2 -->|No| H2
    CR --> RS
    RS -.->|Al volver a arrancar| LV
    LV -.- NT
```

![Diagrama: Health checks](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-19.png)

Hay dos chequeos: `/health/live` dice «el proceso está vivo» y `/health` dice «está listo para atender» (base conectada). Railway usa el primero, así que un despliegue sin base queda en servicio (hallazgo 14 de [Flujos de administración](Doc-14-2-Flujos-de-Administracion-y-Operacion.md#hallazgos)). Como pasan por CORS, un navegador desde un origen no permitido recibe 403; Railway y `curl` no envían `Origin` y pasan. El procedimiento ante una caída está en el [runbook 9.1](Doc-14-2-Flujos-de-Administracion-y-Operacion.md#91-el-backend-está-caído).

Fuente en el código: `apps/backend/src/app.ts` (`/health/live`, `/health`), `apps/backend/railway.json`, `apps/backend/src/index.ts` (`uncaughtException`, `unhandledRejection`).

---

## 7. Arranque del backend

### 7.1 Validación de variables de entorno

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    V["Cada variable de entorno al arrancar<br/>validateEnv en config/env.ts<br/>NODE_ENV distinto de production o test cuenta como development"]:::sistema
    T{"¿Qué variable es?"}:::decision
    C1["Imprescindibles<br/>MONGODB_URI y JWT_SECRET"]:::sistema
    C2["De sesión<br/>JWT_REFRESH_SECRET"]:::sistema
    C3["Opcionales con efecto<br/>REDIS_URL, OPENAI_API_KEY, CORS_ORIGIN,<br/>FRONTEND_URL, ADMIN_EMAIL y SMTP_HOST"]:::sistema
    C4["Otras del esquema<br/>PORT, TRUST_PROXY_HOPS, límites de peticiones,<br/>topes de gasto, OPENAI_BASE_URL y más"]:::sistema
    NV["No se revisa: si falta, no hay aviso<br/>p. ej. DEMO_UPLOAD_ENABLED, INTERNAL_API_KEY,<br/>SMTP_USER, GOOGLE_CLIENT_ID"]:::error
    R1{"¿Falta o tiene<br/>formato inválido?"}:::decision
    P{"¿NODE_ENV es<br/>production?"}:::decision
    ERR["Error: Configuración incompleta<br/>el backend no abre el puerto"]:::error
    W0["Aviso: no está definida<br/>o formato inválido"]:::sistema
    S{"¿JWT_SECRET corta?<br/>menos de 32 caracteres<br/>en producción"}:::decision
    W1["Aviso: usa un valor<br/>largo y aleatorio"]:::sistema
    R2{"¿Falta?"}:::decision
    W2["Aviso: el inicio de sesión fallará<br/>no bloquea el arranque"]:::sistema
    EQ{"¿Es igual a<br/>JWT_SECRET?"}:::decision
    W3["Aviso: usa valores distintos"]:::sistema
    R3{"¿Falta?"}:::decision
    W4["Aviso con la función que se apaga<br/>p. ej. sin REDIS_URL se apagan<br/>las funciones de IA públicas"]:::sistema
    F{"¿Formato válido?<br/>número, URL o email"}:::decision
    W5["Aviso: formato inválido<br/>la función usa su valor por defecto"]:::sistema
    OK["Sin mensaje"]:::sistema
    LOG["Cada aviso va al log como<br/>[env] NOMBRE: motivo, nunca el valor"]:::sistema

    V --> T
    T -->|Imprescindible| C1 --> R1
    R1 -->|Sí| P
    P -->|Sí| ERR
    P -->|No| W0
    R1 -->|No| S
    S -->|Sí| W1
    S -->|No| OK
    T -->|De sesión| C2 --> R2
    R2 -->|Sí| W2
    R2 -->|No| EQ
    EQ -->|Sí| W3
    EQ -->|No| OK
    T -->|Opcional con efecto| C3 --> R3
    R3 -->|Sí| W4
    R3 -->|No| F
    T -->|Otra del esquema| C4 --> F
    F -->|No| W5
    F -->|Sí| OK
    T -->|Fuera del esquema| NV
    W0 --> LOG
    W1 --> LOG
    W2 --> LOG
    W3 --> LOG
    W4 --> LOG
    W5 --> LOG
```

![Diagrama: Validación de variables de entorno](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-20.png)

Solo dos variables pueden impedir el arranque, y solo en producción: `MONGODB_URI` y `JWT_SECRET`. Todo lo demás genera un aviso en el log y la función afectada se apaga o usa su valor por defecto. Un tope de gasto inválido o negativo deja esa función sin presupuesto (0), lo que equivale a apagarla. La lista completa de variables está en [Operación y despliegue](Doc-11-Operacion-y-Despliegue.md).

Fuente en el código: `apps/backend/src/config/env.ts` (`EnvSchema`, `REQUIRED_IN_PRODUCTION`, `RECOMMENDED_IN_PRODUCTION`, `OPTIONAL_WITH_EFFECT`, `validateEnv`, `assertValidEnv`), `apps/backend/src/services/ai-budget.service.ts` (`getMonthlyBudgetUSD`).

---

### 7.2 Secuencia de arranque

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    S["Railway: npm run start<br/>node dist/index.js, carga .env"]:::externo
    E["1. Valida las variables, diagrama 7.1"]:::sistema
    Q1{"¿Hay errores?"}:::decision
    X["Log de errores y exit 1<br/>no abre el puerto"]:::error
    RR["Railway reinicia el proceso<br/>ON_FAILURE, hasta 10 veces"]:::externo
    D["2. Crea las carpetas de archivos<br/>uploads y data/imports, en disco efímero"]:::sistema
    M["3. Conecta a MongoDB<br/>espera hasta 30 s para elegir servidor"]:::sistema
    Q2{"¿Conectó?"}:::decision
    MW["Aviso y sigue sin base<br/>/health responde 503 y las rutas<br/>que usan la base fallan o dan 503"]:::error
    A["4. ADMIN_EMAIL: asegura el rol admin<br/>de esa cuenta si existe<br/>si falla, aviso y sigue"]:::sistema
    C["5. Siembra las demos que falten en el catálogo<br/>no pisa los cambios del panel<br/>si falla, aviso y sigue"]:::sistema
    P["6. Passport: Google OAuth solo con<br/>GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET<br/>si falla, aviso y sigue"]:::sistema
    AP["7. createApp: middleware y rutas<br/>diagrama 6.1"]:::sistema
    L["8. Abre el puerto PORT, 3001 por defecto<br/>tiempos de espera de 15 min para PDF grandes"]:::sistema
    J{"¿NODE_ENV test o<br/>DEMO_GRANTS_JOB_ENABLED=false?"}:::decision
    J1["9. Inicia el job de vencimiento<br/>de accesos y recordatorios"]:::sistema
    J0["Sin job en esta instancia"]:::sistema
    RD["Redis no se conecta al arrancar<br/>se conecta en la primera consulta"]:::sistema
    SG["SIGTERM o SIGINT: detiene el job,<br/>cierra el servidor y exit 0"]:::sistema
    CR["uncaughtException o unhandledRejection<br/>log y exit 1"]:::error

    S --> E --> Q1
    Q1 -->|Sí| X --> RR
    RR -.->|Nuevo intento| S
    Q1 -->|No| D --> M --> Q2
    Q2 -->|No| MW --> A
    Q2 -->|Sí| A
    A --> C --> P --> AP --> L --> J
    J -->|Sí| J0
    J -->|No| J1
    L -.- RD
    L -.->|En cualquier momento| SG
    L -.->|En cualquier momento| CR
    CR --> RR
```

![Diagrama: Secuencia de arranque](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-21.png)

El backend prefiere arrancar degradado a no arrancar: sin base de datos abre el puerto igual (y lo dice `/health`), sin Google OAuth solo se apaga ese botón y sin Redis se apagan las funciones de IA públicas. Lo único que lo detiene es una variable imprescindible ausente en producción o un error no controlado.

Fuente en el código: `apps/backend/src/index.ts` (`startServer`, `ensureAdminFromEnv`, `shutdown`), `apps/backend/src/config/mongodb.ts`, `apps/backend/src/config/redis.ts`, `apps/backend/src/config/passport.ts`, `apps/backend/src/services/demo-catalog.service.ts` (`ensureCatalogSeeded`), `apps/backend/src/jobs/demo-grants.job.ts` (`startDemoGrantsJob`), `apps/backend/railway.json`.

---

## 8. Datos personales (Ley 1581 de 2012)

Qué datos personales entran al sistema, con qué autorización, dónde quedan y cuándo se borran. Lo legal (textos de la política y del banner) está en [SEO, analítica y legal](Doc-12-SEO-Analitica-y-Legal.md); aquí solo lo que hace el código.

### 8.1 Solicitud de demo y cuenta

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    F["Formulario Solicitar demo<br/>nombre, empresa, cargo, email, teléfono, país, tamaño,<br/>demos, caso de uso, página de origen y UTM"]:::visitante
    HP{"¿Campo trampa<br/>website lleno?"}:::decision
    BOT["Responde 201 como si nada<br/>no guarda ningún dato"]:::error
    CS{"¿Marcó la autorización Ley 1581<br/>y los datos son válidos?"}:::decision
    NO["400 consent_required o invalid_request<br/>no guarda ningún dato"]:::error
    RL["Cupos en Redis: hash de la IP por 1 h<br/>y hash del email por 24 h, o en memoria"]:::sistema
    DR["MongoDB DemoRequest<br/>datos del formulario y la prueba de autorización:<br/>aceptado, fecha, versión de la política,<br/>hash de la IP y navegador"]:::sistema
    CT["MongoDB Contact con origen demo-request<br/>nombre, email, teléfono, empresa, servicio<br/>y mensaje con la fecha de autorización"]:::sistema
    NT["Email y WhatsApp al equipo con los datos del lead<br/>vía SMTP y Twilio, WhatsApp Business o UltraMsg"]:::aviso
    AK["Acuse al solicitante por email<br/>si hay SMTP"]:::aviso
    AP{"¿El equipo la aprueba?"}:::decision
    US["MongoDB User con rol prospect<br/>email, nombre, empresa y teléfono<br/>contraseña con hash al activar"]:::sistema
    GR["MongoDB DemoGrant por demo<br/>vencimiento, visitas y último acceso"]:::sistema
    ML["MongoDB MagicLinkToken<br/>solo el hash del enlace, vigente 72 h"]:::sistema
    TTL["MongoDB lo borra solo<br/>7 días después de vencer, índice TTL"]:::sistema
    RJ["Rechazada con motivo<br/>la solicitud se conserva"]:::error
    AU["MongoDB AuditLog<br/>acciones del equipo con hash de la IP"]:::sistema
    SES["Sesión: refresh token en Redis por 7 días<br/>cookies accessToken 15 min y refreshToken 7 días"]:::sistema
    RET["Sin plazo de borrado: DemoRequest, Contact,<br/>User, DemoGrant y AuditLog se conservan<br/>no hay botón ni API para suprimirlos"]:::error
    LG["Logs del servidor con morgan<br/>IP, ruta y navegador de cada petición<br/>retención según Railway"]:::externo

    F --> HP
    HP -->|Sí| BOT
    HP -->|No| CS
    CS -->|No| NO
    CS -->|Sí| RL --> DR
    DR --> CT --> NT
    DR --> AK
    DR --> AP
    AP -->|Sí| US --> GR
    US --> ML --> TTL
    AP -->|No| RJ
    RJ -->|Se audita el rechazo| AU
    US -->|Se audita la aprobación| AU
    US -.->|Al iniciar sesión| SES
    DR -.-> RET
    CT -.-> RET
    GR -.-> RET
    AU -.-> RET
    F -.->|Toda petición| LG
```

![Diagrama: Solicitud de demo y cuenta](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-22.png)

Este es el recorrido con la prueba de autorización más completa: la solicitud guarda fecha, versión de la política, hash de la IP y navegador. Si el mismo email vuelve a enviar el formulario con una solicitud abierta de menos de 30 días, se suman las demos a esa solicitud y la prueba de autorización se reemplaza por la nueva. La IP nunca se guarda en claro en MongoDB ni en Redis: solo su hash SHA-256 recortado. El formulario de `/contact` guarda un `Contact` parecido pero sin casilla de autorización (hallazgo 2 de [Flujos de negocio](Doc-14-1-Flujos-de-Negocio.md#hallazgos)).

Fuente en el código: `apps/backend/src/routes/demo-public.routes.ts` (`POST /api/demo-requests`), `apps/backend/src/services/demo-requests.service.ts` (`createDemoRequest`), `apps/backend/src/models/DemoRequest.ts`, `Contact.ts`, `User.ts`, `DemoGrant.ts`, `MagicLinkToken.ts`, `AuditLog.ts`, `apps/backend/src/services/audit.service.ts` (`hashIp`), `apps/backend/src/services/lead.service.ts`, `apps/backend/src/controllers/auth.controller.ts` (`issueSession`).

---

### 8.2 Demos con IA y navegador

```mermaid
flowchart TD
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#0f172a
    classDef sistema fill:#f1f5f9,stroke:#475569,color:#0f172a
    classDef admin fill:#f3e8ff,stroke:#9333ea,color:#0f172a
    classDef aviso fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef decision fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef error fill:#fee2e2,stroke:#dc2626,color:#0f172a
    classDef externo fill:#fdf4ff,stroke:#c026d3,color:#0f172a

    U["Prueba con tu documento<br/>archivo, email y autorización"]:::visitante
    MEM["Memoria del backend: texto en fragmentos,<br/>índice BM25 e historial de 4 mensajes<br/>el archivo original no se guarda"]:::sistema
    B1["Se borra con lo primero que pase:<br/>1 hora, Subir otro documento<br/>o reinicio del backend"]:::sistema
    LD["MongoDB Contact con origen demo-rag<br/>email y una línea con la fecha de autorización<br/>sin versión de la política ni hash de la IP"]:::sistema
    RC["Redis: documentos del día por hash de la IP, 24 h<br/>y contadores de límite con hash de la IP"]:::sistema
    RET["Sin plazo de borrado del lead<br/>igual que en 8.1"]:::error
    CB["Prueba el asistente y Configura el tuyo<br/>documentos del bot y preguntas"]:::visitante
    ST["Disco del backend: data/chatbots/state.json<br/>bots, fragmentos y últimas 200 preguntas<br/>y respuestas por bot, sin vencimiento"]:::sistema
    B2["Se borra cuando el dueño borra el bot o el historial<br/>o con un despliegue nuevo, disco efímero"]:::sistema
    LI["Generador de LinkedIn<br/>datos de la demo elegida, sin datos personales"]:::visitante
    OA["OpenAI recibe extractos, historial reciente<br/>y la pregunta o los datos de la demo"]:::externo
    BR["Navegador: cookie_preferences y koptup.chatbot.myBots<br/>en localStorage, docId en sessionStorage<br/>y cookies de sesión"]:::visitante
    CK{"¿Aceptó analítica o<br/>marketing en el banner?"}:::decision
    GA["GA4 y Google Ads con consentimiento<br/>nunca en /auth ni /reset-password"]:::externo
    NG["No se cargan las etiquetas de Google<br/>modo de consentimiento en denied"]:::sistema

    U --> MEM --> B1
    U --> LD -.-> RET
    U --> RC
    MEM --> OA
    CB --> ST --> B2
    ST --> OA
    LI --> OA
    BR --> CK
    CK -->|Sí| GA
    CK -->|No| NG
```

![Diagrama: Demos con IA y navegador](images/doc/flujos/Doc-14-3-Flujos-Tecnicos-23.png)

El documento subido es lo único que tiene un vencimiento corto y garantizado. Las preguntas del chatbot, en cambio, quedan en el disco del backend sin vencimiento hasta que el dueño del bot las borra o hay un despliegue nuevo (ver Hallazgos). OpenAI recibe en cada llamada los extractos, el historial reciente y la pregunta (o los datos de la demo, en LinkedIn); el email y los datos de los formularios no se le envían.

Fuente en el código: `apps/backend/src/services/demo-rag.service.ts`, `apps/backend/src/routes/demo-rag.routes.ts` (`registerDemoLead`), `apps/backend/src/data/chatbot-store.ts`, `apps/backend/src/routes/chatbot.routes.ts` (`appendConversation`), `apps/backend/src/services/linkedin-ads.service.ts`, `apps/web/src/lib/cookie-consent.ts`, `apps/web/src/components/analytics/Analytics.tsx`, `apps/web/src/app/demo/chatbot/components/builder/api.ts`, `apps/web/src/app/demo/chatbot/components/upload/UploadDemo.tsx`.

---

### 8.3 Qué se guarda, dónde y cuánto tiempo

| Dato | Dónde | Cuánto tiempo | Cómo se borra |
|---|---|---|---|
| Solicitud de demo con la prueba de autorización (fecha, versión de la política, hash de la IP, navegador) | MongoDB `DemoRequest` | Sin plazo | No hay función en el panel ni en la API |
| Lead de solicitar demo, contacto y demo RAG (nombre, email, teléfono, empresa, mensaje) | MongoDB `Contact` | Sin plazo | No hay función; solo se cambia su estado |
| Cuenta del prospecto (email, nombre, empresa, teléfono, hash de la contraseña) | MongoDB `User` | Sin plazo | No hay función; solo se borra sola una cuenta invitada recién creada si la aprobación o la invitación fallan a medias |
| Accesos a demos (vencimiento, visitas, último acceso) | MongoDB `DemoGrant` | Sin plazo: al vencer o revocarse cambian de estado | No hay función |
| Enlace de activación o de restablecer contraseña | MongoDB `MagicLinkToken` (solo el hash) | 72 h o 1 h de vigencia | Automático, 7 días después de vencer (índice TTL) |
| Bitácora de acciones del equipo | MongoDB `AuditLog` (hash de la IP) | Sin plazo | No hay función |
| Sesión | Redis `refresh_token:<id>` y cookies | 7 días (Redis y `refreshToken`), 15 min (`accessToken`) | Automático, o al cerrar sesión |
| Cupos por IP o email | Redis (hash) o memoria del proceso | De 10 min a 24 h | Automático |
| Documento de «Prueba con tu documento» | Memoria del backend | 1 hora como máximo | Automático, botón «Subir otro documento» o reinicio |
| Preguntas y respuestas del chatbot, bots y sus documentos | Disco del backend, `data/chatbots/state.json` | Sin vencimiento (últimas 200 por bot) | El dueño borra el bot o el historial, o un despliegue nuevo |
| Avisos al equipo con los datos del lead | Correo (SMTP) y WhatsApp del equipo | Según esos servicios | Fuera del sistema |
| Registros de peticiones (IP, ruta, navegador) | Logs del backend en Railway | Según Railway | Fuera del código |
| Preferencias de cookies, tokens de dueño de los bots, `docId` | Navegador (`localStorage` y `sessionStorage`) | Hasta que la persona los borre; `sessionStorage` hasta cerrar la pestaña | En el navegador |

---

## Hallazgos

Cosas del código que no cuadran, dibujadas tal como son. No repiten las de [Flujos de negocio](Doc-14-1-Flujos-de-Negocio.md#hallazgos) ni las de [Flujos de administración](Doc-14-2-Flujos-de-Administracion-y-Operacion.md#hallazgos).

1. **No hay plazo ni forma de suprimir datos personales.** `DemoRequest`, `Contact`, `User`, `DemoGrant` y `AuditLog` no tienen vencimiento y ni el panel ni la API permiten borrarlos (solo `MagicLinkToken` y los contadores de Redis expiran solos). La política de privacidad dice que los datos se eliminan «cuando ya no necesitemos» la información, sin un plazo. Hoy una solicitud de supresión (derecho del titular en la Ley 1581) exige editar la base a mano. (diagrama 8.1, `apps/backend/src/models/`, `apps/web/messages/es.json` › `privacyPage.s5`).
2. **El chatbot guarda las preguntas en disco sin vencimiento y sin aviso.** Cada pregunta y respuesta de «Prueba el asistente», de la vista previa y del widget insertado queda en `data/chatbots/state.json` (últimas 200 por bot). Solo «Configura el tuyo» explica que hay historial; «Prueba el asistente» no avisa nada. Contrasta con «Prueba con tu documento», que promete y cumple el borrado en 1 hora. (diagramas 3.2 y 8.2, `appendConversation` en `apps/backend/src/routes/chatbot.routes.ts`, `apps/backend/src/data/chatbot-store.ts`).
3. **La autorización de «Prueba con tu documento» queda solo como texto.** La prueba es una línea dentro del mensaje del `Contact` con la fecha; no guarda la versión de la política ni el hash de la IP, como sí hace `DemoRequest`. Además, si guardar el lead falla, el documento se procesa igual y la prueba solo queda en el log. Por otro lado, `POST /api/demo-requests` acepta un `versionPolitica` enviado por el cliente (la web no lo envía, así que hoy se guarda la del servidor). (diagramas 4.1 y 8.2, `registerDemoLead` en `apps/backend/src/routes/demo-rag.routes.ts`, `createDemoRequest` en `apps/backend/src/services/demo-requests.service.ts`).
4. **El filtro de la web deja pasar una demo si el backend dice que no existe.** Si `GET /api/demo-access/<slug>` responde 404, el middleware entrega la página sin cabeceras `no-store` ni `noindex`, al revés que con cualquier otro error, que muestra la pantalla de acceso. Solo pasa si la tabla de 28 demos de la web y la semilla del backend se desalinean (por ejemplo, una demo nueva desplegada en la web antes que en el backend); las APIs de esa demo siguen protegidas por el backend. (diagrama 1.2, `demoGate` en `apps/web/src/middleware.ts`).
5. **`authorize()` existe pero no se usa.** `apps/backend/src/middleware/auth.ts` exporta `authorize(...roles)`, que confía en el rol escrito dentro del token (puede tener hasta 15 min de atraso). Ninguna ruta lo usa: todas usan `requireRole`, que lee el rol de la base. Dejarlo invita a usarlo por error; conviene borrarlo o convertirlo en un alias de `requireRole`. (diagrama 2.1).
6. **Las rutas que solo usan `authenticate` no miran la base.** Documentos, pedidos, mensajes, notificaciones, proyectos, facturas y entregables aceptan el token tal cual, y en facturas, entregables y notificaciones la excepción «dueño o staff» se decide con el rol escrito en el token. Un cambio de rol o una cuenta borrada tarda hasta 15 min (la vida del token de acceso) en aplicarse en esas rutas, mientras que las rutas con `requireRole` lo aplican de inmediato. (diagrama 2.1, `apps/backend/src/routes/POLICIES.md`, `isStaffRole(req.user?.role)` en `controllers/invoices.controller.ts`, `deliverables.controller.ts` y `notifications.controller.ts`).
7. **Cuatro formatos de error distintos.** `errorHandler` y la demo RAG responden `{ success, code, message }`; `authenticate` y `requireRole`, `{ success, message }` casi siempre sin `code`; los bots del chatbot, `{ error, message }`; LinkedIn, `{ success, code, error }`; y el límite general responde en inglés («Too many requests from this IP»). La misma situación da códigos distintos: un archivo demasiado grande es 400 `upload_limit_file_size` en las rutas con `upload.ts`, 413 `file_too_large` en la demo RAG y un error por archivo dentro de un 201 o 422 en el chatbot. Cada pantalla tiene que traducir el suyo. (diagramas 6.1 y 6.2).
8. **LinkedIn muestra el cupo mensual agotado como un error genérico.** El backend responde 503 `budget_exhausted` con un mensaje claro, pero la demo solo distingue un 503 cuando el mensaje contiene «configur»; el visitante lee «el servidor no pudo completar la solicitud». Lo mismo pasa con el 503 por Redis caído. (diagrama 5.1, `generarConIA` en `apps/web/src/app/demo/linkedin-ads/components/PostGenerator.tsx`).
9. **Variables que el arranque no revisa.** `DEMO_UPLOAD_ENABLED` e `INTERNAL_API_KEY` no están en `config/env.ts`: si faltan, el log no dice nada. Sin la primera, «Prueba con tu documento» queda apagada en silencio; sin la segunda (en la web y en el backend), las peticiones que hace el servidor de la web sin sesión, como LinkedIn sin cuenta, se cuentan con la IP de salida de Vercel, compartida por todos. Además, el comentario de `config/env.ts` dice que si falta `JWT_REFRESH_SECRET` en producción se registra un error, pero el código lo registra como aviso. (diagrama 7.1).
10. **Un documento corto pero denso se rechaza como «demasiadas páginas».** «Prueba con tu documento» también corta en 400.000 caracteres de texto, pero ese corte reutiliza el código `too_many_pages`: un PDF de 30 páginas o menos con mucho texto recibe «El documento supera 30 páginas», que la persona no puede entender ni corregir. (diagrama 4.1, `ingestDocument` en `apps/backend/src/services/demo-rag.service.ts`).

## Páginas relacionadas

- [Diagramas de flujo](Doc-14-Diagramas-de-Flujo.md) · [Flujos de negocio](Doc-14-1-Flujos-de-Negocio.md) · [Flujos de administración y operación](Doc-14-2-Flujos-de-Administracion-y-Operacion.md)
- [Arquitectura](Doc-01-Arquitectura.md) · [API](Doc-08-API.md) · [Modelos de datos](Doc-09-Modelos-de-Datos.md)
- [Roles y permisos](Doc-10-Roles-y-Permisos.md) · [Operación y despliegue](Doc-11-Operacion-y-Despliegue.md) · [SEO, analítica y legal](Doc-12-SEO-Analitica-y-Legal.md)
- [Guía de la demo del chatbot](Guia-Demo-chatbot.md) · [Guía de la demo de LinkedIn Ads](Guia-Demo-linkedin-ads.md)
