# Guía de la demo: Gestor de contenido (CMS headless)

> Ruta `/demo/gestor-contenido` · Modo de acceso: **Abierta** · Tipo: **datos de ejemplo** (todo el CMS corre en el navegador) con **IA real** en el asistente de redacción (llama al backend de KopTup) · Plan del producto: [CMS headless](Producto-cms-headless.md)

**Resumen.** Es un CMS headless completo para una empresa ficticia, la **Red de Clínicas Montaña Azul** (cinco sedes publicadas en cuatro ciudades de Colombia y una sexta, en Bucaramanga, recién creada y en revisión), con 21 entradas de ejemplo en cinco tipos de contenido (páginas, artículos del blog, sedes, servicios y preguntas frecuentes) y 12 imágenes. Muestra el ciclo completo: modelar el contenido, editarlo con vista previa web y app, mejorarlo con IA, enviarlo a revisión, aprobarlo, publicarlo o programarlo, avisar a los canales con webhooks y entregarlo por una API JSON que también alimenta al asistente del sitio. Tres personas de ejemplo con roles distintos (Redacción, Edición y Administración) permiten probar los permisos. El encabezado dice para quién es (equipos de mercadeo y comunicaciones con sitio web, app o asistente), por dónde empezar (el «Recorrido en 5 pasos») y ofrece **Volver al catálogo de demos**, **Solicitar demo guiada** y **Cotizar tu CMS**. Los cambios se guardan solo en el navegador de quien la usa.

**En esta página:** [Recorrido sugerido](#recorrido-sugerido-demo-comercial-de-5-minutos) · [Pantallas y funciones](#pantallas-y-funciones) · [Qué es real y qué es simulado](#qué-es-real-y-qué-es-simulado) · [Acceso](#acceso) · [Limitaciones conocidas](#limitaciones-conocidas)

> **Sobre las capturas.** Los datos de ejemplo se generan con la hora del navegador en el momento en que abres la demo, así que las fechas de las capturas (14 de octubre de 2026) cambian en cada visita. El texto de la propuesta del asistente de IA lo produjo el **modelo simulado** del entorno de pruebas (por eso empieza con «Respuesta simulada (mock de OpenAI)…»); con la clave real del proveedor lo redacta el modelo.

![Vista general](images/doc/demos/gestor-contenido/00-general.jpg)

*Inicio de la demo como Valentina Rojas (Redacción).*

1. **Volver al catálogo de demos**: regresa a `/demo`.
2. **Gestor de contenido (CMS headless)** con la insignia **Datos de ejemplo** (al pasar el mouse explica que empresa, personas, direcciones, teléfonos y dominios son ficticios y que los cambios se guardan solo en este navegador).
3. **Para quién**: equipos de mercadeo y comunicaciones que publican en su sitio web, su app y su asistente.
4. **Ver como** y **Restablecer datos**.
5. **Por dónde empezar**: el «Recorrido en 5 pasos» de Inicio.
6. **Solicitar demo guiada** (abre `/solicitar-demo` con esta demo ya elegida) y **Cotizar tu CMS** (abre `/contact` con el producto «CMS headless» prellenado).
7. **Recorrido en 5 pasos**, con «N de 5 hechos» y un botón **Ir** por paso.

---

## Recorrido sugerido (demo comercial de 5 minutos)

El guion sigue el **Recorrido en 5 pasos** que trae la propia demo en **Inicio**. Cada paso se marca en verde solo cuando haces la acción completa (no basta con una parecida) y el botón **Ir** de cada paso lleva a la pantalla correcta. Empieza con los datos limpios (si alguien ya usó la demo en ese navegador, pulsa **Restablecer datos** y confirma).

![Recorrido de la demo](images/doc/demos/gestor-contenido/recorrido.gif)

*Recorrido completo: vista general, modelo «Sede», edición con vista previa, asistente de IA, aprobación como Edición, avisos (webhooks simulados) al sitio web y a la app, JSON de la API, el asistente del sitio citando la pregunta frecuente y el cierre con las salidas comerciales.*

```mermaid
stateDiagram-v2
    state "Borrador" as BO
    state "En revisión" as RE
    state "Aprobada" as AP
    state "Programada" as PR
    state "Publicada" as PU
    [*] --> BO: Nueva entrada o Duplicar
    BO --> RE: Enviar a revisión (Redacción o más)
    RE --> AP: Aprobar (Edición o Administración)
    RE --> BO: Pedir cambios con nota
    AP --> PU: Publicar ahora
    AP --> PR: Programar fecha y hora
    PR --> PU: Llega la hora (revisa cada 5 s)
    PR --> AP: Cancelar programación
    PU --> BO: Editar (el sitio sigue con lo publicado)
    PU --> BO: Despublicar
```

*Estados de una entrada en la demo. Editar algo aprobado, programado o publicado lo devuelve a borrador.*

| Paso | Se marca cuando… |
|---|---|
| 1. Mira cómo se modela el contenido | Abres **Modelos** (con cualquier rol). |
| 2. Edita la sede Chapinero | Cambias cualquier campo de «Sede Chapinero». |
| 3. Mejora un texto con el asistente de IA | **Aplicas** una propuesta de la IA a un campo (no basta con pedirla). |
| 4. Envía a revisión, aprueba y publica | Publicas a mano una entrada que en esta visita se **envió a revisión y se aprobó** (publicar algo que ya venía aprobado en los datos de ejemplo no cuenta). |
| 5. Publica la pregunta frecuente y pregúntale al asistente | El asistente del sitio cita una pregunta frecuente **publicada en esta visita**. |

### Paso 1. Mira cómo se modela el contenido

Cambia **Ver como** a Natalia Ospina · Administración y abre **Modelos**.

![Paso 1: modelos de contenido](images/doc/demos/gestor-contenido/01-paso1-modelos.jpg)

*Modelo «Sede» visto como Administración.*

1. **Ver como**: cambia la persona y su rol; la demo avisa «Ahora ves la demo como…».
2. **Tipos de contenido**: Página (2 entradas), Artículo del blog (4), Sede (6), Servicio (5) y Pregunta frecuente (4).
3. **Campos**: nombre, ID de API, tipo (texto corto, texto largo, teléfono, imagen, referencias…), si es **Obligatorio** y si es **Traducible** (ES · EN). «Sede» tiene ID de API `location` y ruta `/sedes/{slug}`.
4. **Agregar campo**: solo para Administración; con otro rol queda desactivado y la demo dice «Solo Administración puede cambiar los modelos».

Qué decir: «El contenido es estructurado: la sede tiene horario, WhatsApp y servicios como datos, no como texto suelto. Así lo usan igual tu web, tu app y tu asistente».

### Paso 2. Edita la sede Chapinero y mira la vista previa

Vuelve a Valentina (Redacción) y en **Inicio** pulsa **Ir** en el paso 2. Al abrirla, la vista previa dice «Sin cambios pendientes: esto es lo que está publicado.». Cambia el **Horario** (en la prueba: sábados hasta las 2:00 p. m.).

![Paso 2: editor con vista previa](images/doc/demos/gestor-contenido/02-paso2-editor.jpg)

*Editor de «Sede Chapinero» después de cambiar el horario (captura en una pantalla de 1440 × 1200).*

1. **Hay una versión publicada**: la entrada volvió a **Borrador**; el aviso dice que el sitio y la API siguen mostrando la versión publicada hasta que se vuelva a publicar.
2. **Enviar a revisión**: aparece junto a **Guardar versión** y **Descartar cambios**.
3. **Horario**: el campo editado, con su contador de caracteres.
4. **Vista previa del borrador · no publicada**: la franja aparece en cuanto hay cambios sin publicar; el sitio de ejemplo se actualiza mientras escribes y arriba aparece el selector **Borrador / Publicada** para comparar.

Qué decir: «Quien redacta ve el resultado antes de publicar, en web y en celular, y no rompe lo que ya está en línea».

### Paso 3. Mejora un texto con el asistente de IA

En el panel derecho abre la pestaña **Asistente IA**, elige el campo **Descripción** y pulsa **Versión corta para la app**.

![Paso 3: asistente de IA](images/doc/demos/gestor-contenido/03-paso3-asistente-ia.jpg)

*Pestaña «Asistente IA» con la propuesta lista (texto del modelo simulado del entorno de pruebas).*

1. **IA real**: el texto elegido se envía al backend de KopTup, que lo procesa con un modelo de lenguaje; pide no incluir datos personales.
2. **Texto a trabajar (ES)**: el campo o párrafo a mejorar, con su texto y el número de palabras.
3. **Acciones**: Mejorar redacción, Versión corta para la app (pide la mitad de palabras; necesita 12 o más y lo dice si el texto es más corto), Tono formal, Tono técnico, Tono persuasivo y 3 versiones.
4. **Propuesta de la IA**: con **Aplicar al campo**, **Copiar** y **Descartar**. Debajo, «Usaste la IA N veces en esta visita» (se cuenta en toda la visita, aunque cambies de pestaña).

Pulsa **Aplicar al campo**: la descripción cambia en el formulario y en la vista previa, y el paso 3 queda marcado. Si la IA no responde, la demo dice por qué (ver [Acceso](#acceso)) y el resto sigue funcionando.

### Paso 4. Envía a revisión, aprueba y publica

Pulsa **Enviar a revisión**. Como Redacción la entrada queda en solo lectura y la demo dice «Con el rol Redacción no puedes aprobar. Cambia a Edición con «Ver como»…». Cambia **Ver como** a Andrés Cárdenas · Edición.

![Paso 4: aprobar como Edición](images/doc/demos/gestor-contenido/04-paso4-aprobar.jpg)

*La misma entrada vista por Edición.*

1. **Ver como** Andrés Cárdenas · Edición.
2. **En revisión**: el estado que dejó Redacción.
3. **Aprobar**: la entrada pasa a «Aprobada» y aparecen **Publicar ahora** y **Programar…**.
4. **Pedir cambios**: pide una nota («¿Qué debe cambiar?») y devuelve la entrada a borrador con el comentario.

Pulsa **Aprobar** y luego **Publicar ahora**: «Publicada. Se avisó a: Sitio web y App (webhooks simulados).». El aviso nombra solo los canales que de verdad reciben el webhook: la sede no avisa al asistente (ese webhook es solo para preguntas frecuentes) y, si Administración desactivó los webhooks, dice «No se avisó a ningún canal…». Abre **Publicación** en el menú:

![Paso 4: publicación y webhooks](images/doc/demos/gestor-contenido/05-paso4-publicacion.jpg)

*Vista «Publicación» después de publicar la sede, vista por Edición (captura de 1440 × 1400).*

1. **Cola editorial**: columnas En revisión, Aprobada y Programada, con quién la movió por última vez (lo aprobado de los datos de ejemplo lo aprobó Andrés Cárdenas) y acciones rápidas (**Aprobar**, **Publicar ahora**).
2. **Avisos a tus canales al publicar (webhooks)**: Sitio web (revalidación), App y Asistente, cada uno con su dirección `.example`. Solo Administración puede activarlos o desactivarlos.
3. **Entregas recientes**: hora, evento, destino, entrada, rutas revalidadas y resultado «200 · simulado». La sede no avisa al asistente: ese webhook es solo para preguntas frecuentes.
4. **Rutas** `/sedes/chapinero, /sedes` y, al final de cada fila, **Reenviar** (simulado; solo Administración).

Para cerrar el paso, vuelve a la entrada y abre la pestaña **API**:

![Paso 4: JSON de la API](images/doc/demos/gestor-contenido/06-paso4-api-json.jpg)

*Pestaña «API» de la sede publicada.*

1. **Publicada**: estado de la entrada.
2. **Publicada / Vista previa (borrador)**: qué versión pide la API.
3. **La petición**: `GET https://cms.montana-azul.example/api/v1/entries/location/chapinero?locale=es` y la respuesta **200 OK**. Si la entrada no está publicada responde **404 Not Found** y lo explica.
4. **El JSON**: lo que leería el sitio o la app; el campo `hours` ya trae el horario nuevo. **Copiar JSON** lo copia.

Qué decir: «Publicas una vez y el contenido llega a la web, a la app y al asistente por la misma API».

### Paso 5. Publica la pregunta frecuente y pregúntale al asistente del sitio

En **Inicio** pulsa **Ir** en el paso 5 (la pregunta «¿Qué preparación necesito para una ecografía abdominal?», que está **Aprobada**; su historial muestra que la envió Valentina y la aprobó Andrés). Si antes de publicarla pulsas **Pregúntale al asistente** y eliges «¿Cómo me preparo para una ecografía?», responde «No encontré esa información en el contenido publicado…». Como Edición pulsa **Publicar ahora** («Publicada. Se avisó a: Sitio web, App y Asistente (webhooks simulados).») y vuelve a preguntar.

![Paso 5: el asistente del sitio cita la pregunta](images/doc/demos/gestor-contenido/07-paso5-asistente-sitio.jpg)

*Asistente del sitio de ejemplo respondiendo con la pregunta frecuente recién publicada (captura de 1440 × 1200).*

1. **Disponible para el asistente del sitio**: interruptor de la pregunta frecuente; si está activo y la pregunta está publicada, el asistente puede citarla.
2. **La pregunta del visitante**.
3. **La respuesta y su fuente**: «Fuente: pregunta frecuente «¿Qué preparación necesito para una ecografía abdominal?» · publicada el 14 de octubre de 2026».

Qué decir: «Lo que publicas es lo que el asistente cita; si no está publicado, no lo inventa». Aclara que en la demo el asistente busca por palabras clave (el aviso de la ventana lo dice) y que en el proyecto real responde la IA sobre el mismo contenido, como en la demo [Chatbot RAG](Guia-Demo-chatbot.md).

### Al terminar: siguientes pasos

![Recorrido completo](images/doc/demos/gestor-contenido/14-recorrido-completo.jpg)

*Inicio con el recorrido completo.*

1. **5 de 5 hechos**.
2. **¡Completaste el recorrido!**: invita a verlo con el contenido, los canales y los permisos del cliente, con **Solicitar demo guiada** y **Cotizar tu CMS** (los mismos enlaces del encabezado).

---

## Pantallas y funciones

### Encabezado e Inicio

Ver la [vista general](#guía-de-la-demo-gestor-de-contenido-cms-headless).

| Elemento | Qué hace |
|---|---|
| **Volver al catálogo de demos** | Enlace a `/demo`. También aparece mientras cargan los datos. |
| **Datos de ejemplo** | Insignia con la explicación de qué es ficticio (también para lectores de pantalla). |
| **Para quién / Por dónde empezar** | Una frase con el público y otra que remite al «Recorrido en 5 pasos». |
| **Solicitar demo guiada** · **Cotizar tu CMS** | Salidas comerciales: `/solicitar-demo?demos=gestor-contenido` y `/contact?service=cms-headless` (producto «CMS headless» prellenado). |
| **Ver como** | Cambia entre Valentina Rojas (Redacción), Andrés Cárdenas (Edición) y Natalia Ospina (Administración). Los botones y la lógica respetan los permisos de cada rol. |
| **Restablecer datos** | Pide confirmación, borra lo que cambiaste en este navegador y carga de nuevo los datos de ejemplo. |
| **Tarjetas de estado** | Borrador (2), En revisión (1), Aprobada (1), Programada (1) y Publicada (16) al empezar. Cada una abre **Entradas** filtrada por ese estado. |
| **Recorrido en 5 pasos** | El guion de la demo, con «N de 5 hechos», un botón **Ir** por paso y, al completarlo, el cierre con las salidas comerciales. |
| **Qué es real en esta demo** | Lo que corre en el navegador, lo que usa IA real, lo simulado y lo que se haría en el proyecto. |
| **Próximas publicaciones programadas** | Al empezar, «Horarios especiales de fin de año» programada para dentro de 3 días a las 7:00 a. m. |
| **Actividad reciente** | Las 8 últimas acciones de la sesión (quién y qué hizo), con el título de cada entrada en el idioma del contenido. Lo automático (publicación programada) sale a nombre de quien lo programó. |
| **Avisos** | Confirman cada acción abajo a la derecha (abajo al centro en el celular). Como máximo dos a la vez; se van solos a los 4 segundos o con su botón **Cerrar aviso**. |

El menú de la izquierda tiene **Inicio**, **Entradas** (con el total), **Modelos**, **Medios**, **Publicación** (con lo pendiente de aprobar o publicar, si tu rol puede hacerlo), **API de entrega** y **Roles y permisos**. Pulsar la sección en la que ya estás lleva al contenido (útil en el celular, donde el menú queda arriba).

### Entradas

![Lista de entradas](images/doc/demos/gestor-contenido/08-entradas.jpg)

*Lista de las 21 entradas, ordenada por la última edición.*

1. **Buscar por título o slug**, y filtros por tipo, estado, idioma («Traducción al inglés completa» o «Falta traducir al inglés») y autor; **Ordenar por** última edición, título (A–Z) o tipo; **Limpiar filtros**.
2. **Idiomas**: `ES` y `EN`; «EN · 3» significa que faltan 3 campos por traducir al inglés.
3. **Exportar CSV**: descarga `entradas-cms-montana-azul.csv` con las filas filtradas: título, tipo, estado, ruta, campos sin traducir, autor, última edición y fecha de publicación.
4. **Nueva entrada**: tipo de contenido y título; muestra «Se publicará en /ruta» y **Crear y editar** abre el editor con la entrada en borrador.

En **Ordenar por › Tipo**, los tipos van en orden alfabético por su nombre.

En cada fila: **Editar**, **Duplicar** (crea una copia en borrador) y **Eliminar** (pide confirmación; si estaba publicada avisa a los canales con el webhook activado, de forma simulada). Al eliminar se quitan las referencias desde otras entradas, en el borrador y en la versión publicada: por ejemplo, si eliminas el servicio «Fisioterapia», la sede Usaquén deja de listarlo en el sitio y en la API sin quedar con «cambios sin publicar». Redacción solo puede eliminar sus propios borradores que nunca se publicaron.

### Editor de una entrada

Ver los pasos [2](#paso-2-edita-la-sede-chapinero-y-mira-la-vista-previa), [3](#paso-3-mejora-un-texto-con-el-asistente-de-ia) y [4](#paso-4-envía-a-revisión-aprueba-y-publica).

- **Encabezado**: tipo, estado, «Hay una versión publicada», quién la creó y quién la editó por última vez, y las acciones que permite el rol y el estado: Guardar versión, Enviar a revisión, Descartar cambios, Aprobar, Pedir cambios, Publicar ahora, **Programar…**, Cancelar programación, Despublicar y Eliminar.
- **ES / EN**: cambia el idioma del contenido. En inglés, los campos sin traducir muestran el texto en español como sugerencia y el botón **Copiar el texto en español**; el sitio en inglés muestra el español mientras tanto.
- **Formulario**: slug con **Desde el título** y la ruta pública; los campos del tipo con su contador; imágenes elegidas de la biblioteca (**Cambiar**, **Quitar**); referencias a servicios; y, en páginas y artículos, el **editor por bloques**: Título (H1 a H3), Párrafo con barra de formato (negrita, cursiva, viñetas, lista numerada, enlace y quitar formato), Imagen con pie de foto, Botón con enlace y Pregunta y respuesta, cada bloque con subir, bajar y quitar.
- **Bloqueos**: antes de enviar o publicar, la demo exige los campos obligatorios en español, un slug con minúsculas, números y guiones, y que no se repita en el mismo tipo.
- **Programar…**: fecha y hora de Colombia, con atajos «En ~1 minuto» (el siguiente minuto exacto, entre 45 segundos y 1 minuto y 45 segundos), «Mañana, 7:00 a. m.» y «En una semana, 7:00 a. m.». Mientras la demo está abierta revisa cada 5 segundos; si cierras la pestaña, la entrada se publica la próxima vez que abras la demo, con la fecha programada. La publicación sale a nombre de quien la programó (en la actividad y en el historial), aunque en ese momento estés viendo la demo como Redacción. Si al llegar la hora le falta un campo obligatorio (por ejemplo, porque Administración agregó uno después de programarla), no se publica: vuelve a «Aprobada» y la actividad lo dice; mientras tanto, el editor de la entrada programada muestra qué falta y el aviso «Si no lo corriges antes de la hora programada, no se publicará…».
- **Pestañas del panel derecho**: **Vista previa**, **SEO** (en los tipos con SEO), **API**, **Historial** y **Asistente IA**. Con el teclado se cambian con las flechas, Inicio y Fin.
- **Vista previa**: si la entrada publicada no tiene cambios pendientes, muestra la versión publicada («Sin cambios pendientes: esto es lo que está publicado.»); si hay cambios, muestra el borrador con la franja «Vista previa del borrador · no publicada» y deja comparar con la publicada. Además: Sitio web o App; Escritorio o Celular; botón **Pregúntale al asistente**. Los enlaces y el botón de WhatsApp del sitio de ejemplo no navegan: un aviso explica a dónde llevarían.
- **Historial**: cada versión guardada, enviada, aprobada, publicada o restaurada, con quién la hizo, cuántas partes difieren de la actual y **Restaurar**; debajo, la actividad de la entrada en la sesión. Las entradas aprobadas o programadas de los datos de ejemplo traen su aprobación (Andrés Cárdenas, Edición).
- **Asistente IA**: la propuesta queda atada al campo y al idioma de los que salió; si cambias el idioma del contenido (ES/EN) o el campo, la propuesta se oculta y no se puede aplicar en otro campo u otro idioma.

#### Pestaña SEO

![Chequeos SEO](images/doc/demos/gestor-contenido/09-seo.jpg)

*SEO del artículo «Abrimos nueva sede en Bucaramanga» (borrador).*

1. **Así se vería en un buscador**: dirección, título y meta descripción (o «Sin meta descripción: el buscador elegirá un fragmento del texto»).
2. **Chequeos**: título entre 30 y 60 caracteres, meta descripción entre 70 y 160, slug válido y único, un solo H1, imágenes con texto alternativo, al menos un enlace interno y, en artículos, 80 palabras o más. Se calculan con el contenido real de la entrada en el idioma elegido.

Arriba están los campos **Título para buscadores** y **Meta descripción** con sus contadores.

### Modelos

Ver el [paso 1](#paso-1-mira-cómo-se-modela-el-contenido). Como Administración, **Agregar campo** pide nombre en español (y en inglés, opcional), muestra el ID de API que se generará, y deja elegir tipo (Texto corto, Texto largo, Número, Sí / no o Fecha), **Obligatorio para publicar** y **Traducible**. El campo nuevo llega vacío a todas las entradas de ese tipo (al borrador y a la versión publicada, así que cambiar el modelo no deja cambios sin publicar) y aparece en el editor, en la vista previa («información adicional») y en el JSON de la API; si es obligatorio, las entradas de ese tipo no se pueden enviar ni publicar hasta completarlo (y una entrada ya programada de ese tipo no se publicará a su hora: vuelve a «Aprobada»). Los campos propios se pueden quitar; los de base, no.

### Medios

![Detalle de una imagen](images/doc/demos/gestor-contenido/10-medios.jpg)

*Detalle de `bucaramanga-cabecera.jpg`, la imagen de ejemplo que no tiene texto alternativo.*

- **Biblioteca**: 12 ilustraciones de ejemplo; cada tarjeta dice en cuántas entradas se usa y marca «Sin texto alternativo». Buscador por nombre y casilla **Solo sin texto alternativo**.
- **Subir imagen**: solo imágenes de hasta 8 MB; se reducen a 1280 px como máximo y se guardan en el navegador.
- **Detalle**: clic en la imagen (o, con el teclado, enfocarla y usar las flechas, de 5 en 5 %) para fijar el punto de interés y ver los recortes **Web 16:9**, **App 4:5** y **Redes 1:1**; texto alternativo en español e inglés; **Se usa en** con enlaces a las entradas; **Eliminar imagen**, desactivado si la imagen está en uso o si el rol no puede eliminar.

### Publicación

Ver el [paso 4](#paso-4-envía-a-revisión-aprueba-y-publica). Con el rol Redacción la cola se ve, pero aprobar y publicar es de Edición (la demo lo dice). Si se desactiva un webhook, ese canal deja de recibir entregas.

### API de entrega

![API de entrega](images/doc/demos/gestor-contenido/11-api-de-entrega.jpg)

*Vista «API de entrega» con el tipo «Sede» en español.*

1. **Filtros**: tipo de contenido (o todos), idioma e **Incluir borradores (vista previa)**, que agrega el encabezado con el token de vista previa.
2. **Respuesta**: la petición `GET`, «200 OK · N resultados» y el JSON, con **Copiar JSON** y **Descargar .json**.
3. **Cómo consumirla**: fragmentos de código para **Next.js** y **cURL** con **Copiar código**.

Tres reglas: sin vista previa solo salen las publicadas; si falta una traducción entrega el español y lo marca en `localeFallback`; las imágenes salen con texto alternativo, tamaño y punto de interés.

### Roles y permisos

![Roles y permisos](images/doc/demos/gestor-contenido/12-roles.jpg)

*Las tres personas de ejemplo y la matriz de 12 permisos.*

| Permiso | Redacción | Edición | Administración |
|---|---|---|---|
| Crear entradas, enviar a revisión, subir imágenes y editar su texto alternativo | Sí | Sí | Sí |
| Editar borradores y publicadas (crea un borrador) | Sí | Sí | Sí |
| Editar en cualquier estado, aprobar o pedir cambios, publicar y programar, despublicar, eliminar entradas, eliminar imágenes | No | Sí | Sí |
| Cambiar modelos de contenido y gestionar los avisos a tus canales (webhooks) | No | No | Sí |

Cada tarjeta tiene **Ver como esta persona**. La lógica de cada acción vuelve a verificar el permiso (no basta con ocultar botones). En la matriz, cada casilla dice «Permitido» o «No permitido» también a los lectores de pantalla.

### En el celular

![Vista móvil](images/doc/demos/gestor-contenido/13-movil.jpg)

*La demo en un teléfono (390 px): el encabezado completo con las salidas comerciales y, debajo, el menú de secciones como una fila de botones que se desplaza de lado.*

La página no se desborda a lo ancho en claro ni en oscuro. En el editor, el formulario y el panel de vista previa quedan uno debajo del otro, y las ventanas suben desde abajo.

### Teclado y accesibilidad

- Las ventanas (restablecer, nueva entrada, agregar campo, programar, pedir cambios, eliminar, elegir imagen y detalle de imagen) reciben el foco al abrirse, no dejan salir el foco con Tab, se cierran con **Escape** y devuelven el foco al botón que las abrió.
- Las pestañas del editor se recorren con las flechas, Inicio y Fin.
- El punto de interés de una imagen (en **Medios**) se mueve con las flechas cuando la imagen tiene el foco.
- Los avisos se anuncian a los lectores de pantalla y tienen botón para cerrarlos; los errores del asistente de IA se anuncian como alerta.
- Los controles tienen etiqueta (buscador, filtros, selectores, interruptores, botones de solo icono).

---

## Qué es real y qué es simulado

| Parte | Real o simulado | Detalle |
|---|---|---|
| Empresa, personas, direcciones, teléfonos y dominios | **Datos de ejemplo** | Red de Clínicas Montaña Azul es ficticia; teléfonos `+57 300 555 01xx` y dominios `.example`. Las fechas se calculan desde el momento en que abres la demo. |
| Modelos, entradas, editor, versiones, programación y roles | **Real (en el navegador)** | La lógica funciona de verdad y verifica permisos; se guarda en `localStorage` (clave `demo:cms:v1`). Lo guardado por la versión anterior de la demo se conserva al actualizarla. |
| Vista previa del sitio y de la app | **Simulada** | Se dibuja en el navegador con el contenido de la entrada; WhatsApp y los enlaces no navegan: al hacer clic, un aviso explica a dónde llevarían en el sitio real. |
| Chequeos SEO | **Real** | Calculados con el contenido de la entrada; no reemplazan una auditoría SEO completa. |
| JSON de la API de entrega | **Real (en el navegador)** | Sale de los datos de la demo; no hay un servidor de CMS detrás. |
| Webhooks y CDN de imágenes | **Simulados** | No se envía nada a internet; resultado «200 · simulado». |
| Asistente de redacción (Asistente IA) | **IA real** | Llama a `/api/content/*` del backend (con la sesión, si la hay), que usa un modelo de OpenAI con tope de gasto mensual y cupo por conexión. |
| Asistente del sitio | **Simulado** | Búsqueda por palabras clave en las preguntas frecuentes publicadas y marcadas para el asistente. |
| Imágenes subidas | **Real (en el navegador)** | Se reducen y se guardan en este navegador; no van a ningún servidor. |
| Exportar CSV y descargar JSON | **Real** | Se generan en el navegador. |

---

## Acceso

- **Cómo la ve un visitante:** la demo está en modo **Abierta** (`publico`): cualquiera entra a `/demo/gestor-contenido` sin cuenta y sin pantalla de acceso, y la usa completa. No necesita iniciar sesión: los «usuarios» son las tres personas de ejemplo de **Ver como**.
- **Cómo se solicita:** no hace falta solicitarla. Quien quiera verla con su propio contenido usa **Solicitar demo guiada** o **Cotizar tu CMS** (en el encabezado y al terminar el recorrido), el bloque azul al final de la página o **Solicitar demo** del menú.
- **Cómo la controla el admin:** el modo sale del catálogo del servidor y se cambia en **Admin › Catálogo de demos**. Si se pasa a «Con solicitud» o «Solo por invitación», los visitantes verán la pantalla de acceso y los accesos se conceden en **Admin › Solicitudes de demo** y **Admin › Accesos a demos**. El asistente de IA envía la sesión de quien la usa, así que sigue funcionando para quien tenga acceso aprobado y para el equipo de KopTup. Detalle en el [Manual del administrador](Doc-06-Manual-del-Administrador.md) y en [Flujos del visitante](Doc-04-Flujos-del-Visitante.md).
- **Topes del asistente de IA en el servidor:** el backend solo atiende la demo si su modo lo permite, rechaza textos de más de 10.000 caracteres (la demo envía como máximo 2.000), aplica a los visitantes un cupo por conexión de 20 solicitudes cada 10 minutos y 100 por día (el equipo de KopTup con sesión no tiene ese cupo) y un tope de gasto mensual. Cada caso tiene su mensaje en la demo: sin IA configurada, IA no disponible, cupo mensual agotado, límite de solicitudes, sesión necesaria, cuenta sin acceso, demo desactivada, texto no aceptado, sin conexión o tiempo agotado. El resto de la demo sigue funcionando.

```mermaid
flowchart LR
    V["Visitante abre /demo/gestor-contenido"] --> C{"¿Modo del catálogo?"}
    C -- "Abierta" --> D["CMS con datos de ejemplo en su navegador"]
    C -- "Con solicitud o invitación" --> P["Pantalla de acceso"]
    D --> IA["Asistente IA (con la sesión, si la hay)"]
    IA --> B["Backend /api/content"]
    B --> G{"¿Modo, cupo y presupuesto OK?"}
    G -- "Sí" --> O["Modelo de lenguaje"]
    G -- "No" --> M["Mensaje claro en la demo; lo demás sigue"]
```

*Camino de un visitante y de una solicitud de IA.*

---

## Limitaciones conocidas

1. **Todo vive en un navegador.** Los cambios se guardan solo en el `localStorage` de ese equipo y navegador: no llegan a un servidor ni los ve el vendedor. Las imágenes subidas también se guardan ahí; si el almacenamiento se llena o el navegador no lo permite, la demo avisa «Tu navegador no permite guardar datos: los cambios se perderán al recargar la página».
2. **Roles simulados.** «Ver como» cambia de persona sin iniciar sesión; los permisos los verifica la lógica de la demo en el navegador (en el proyecto los valida el servidor del CMS, como dice la propia demo).
3. **Alcance del asistente de IA.** Trabaja solo con campos de texto traducibles y párrafos; corta el texto a 2.000 caracteres; **Versión corta para la app** exige 12 palabras o más. Usa la plantilla de «texto de producto» del backend para todos los tipos de contenido.
4. **Cupo compartido sin sesión.** Los visitantes sin sesión comparten el cupo de IA por conexión (20 cada 10 minutos, 100 por día): en una oficina que sale a internet por la misma dirección, varias personas lo agotan antes.
5. **El asistente del sitio no es IA.** Busca palabras clave en las preguntas frecuentes publicadas (con raíces simples para plurales); si la pregunta no comparte palabras con ellas, responde «No encontré…». La ventana lo aclara.
6. **Fechas que cambian.** Las fechas de las entradas, versiones y la publicación programada se calculan cada vez desde el momento en que abres la demo; no son fijas como en las capturas.
7. **Webhooks, API y CDN simulados**: los dominios son `.example` y no se envía nada a internet.
