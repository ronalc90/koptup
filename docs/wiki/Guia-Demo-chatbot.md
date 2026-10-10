# Guía de la demo: Chatbot RAG con tus documentos

> Ruta `/demo/chatbot` · Modo de acceso: **Abierta** · Tipo: **IA real** (búsqueda y respuesta en el servidor; las empresas y sus documentos son de ejemplo) · Plan del producto: [Sistemas RAG (producto principal)](Producto-chatbot-rag-ia.md)

**Resumen.** Es la demo del producto principal de KopTup: un asistente que responde **solo con los documentos cargados**, cita la fuente de cada dato y dice «no encontré» cuando la respuesta no está. Tiene tres modos: **Prueba el asistente** (tres empresas ficticias, sin registro), **Prueba con tu documento** (tu PDF, DOCX o TXT, con email) y **Configura el tuyo** (tu propio bot con su widget y código para insertar). Sirve para que un gerente vea en 5 minutos qué es un sistema RAG y para que un desarrollador vea el pipeline real paso a paso.

**Contenido:** [Recorrido sugerido](#recorrido-sugerido-demo-comercial-de-5-minutos) · [Pantallas y funciones](#pantallas-y-funciones) · [Qué es real y qué es simulado](#qué-es-real-y-qué-es-simulado) · [Acceso](#acceso) · [Limitaciones conocidas](#limitaciones-conocidas)

![Vista general](images/doc/demos/chatbot/00-general.jpg)

*Modo «Prueba el asistente» con una respuesta: documentos a la izquierda, conversación con citas al centro y «Cómo se respondió» a la derecha, con las métricas de la sesión al pie.*

> **Sobre las capturas:** el texto de las respuestas lo produjo el modelo simulado del entorno de pruebas (por eso empieza con «Respuesta simulada…»). Con la clave real de OpenAI lo redacta el modelo elegido. La búsqueda, las citas, los fragmentos, los pasos y las métricas que ves sí son el comportamiento real del código.

---

## Recorrido sugerido (demo comercial de 5 minutos)

![Recorrido animado de la demo de chatbot](images/doc/demos/chatbot/recorrido.gif)

*Los ocho momentos del recorrido, en orden.*

### Paso 1 · Elige la empresa de ejemplo (≈ 30 s)

![Paso 1: barra superior y documentos de la empresa](images/doc/demos/chatbot/01-paso-elegir-empresa.jpg)

*Barra superior del modo «Prueba el asistente» y documentos de la empresa elegida, todavía sin indexar.*

1. **Estado de la IA**: lo consulta al servidor al abrir la página (`GET /api/chatbot/models`). «IA generativa activa» significa que hay clave de OpenAI; si no, dice «Modo extractivo (sin clave de IA)» o «Servidor no disponible».
2. **Empresa de ejemplo**: tres empresas ficticias, cada una con sus documentos: *Logística Ejemplo S.A.S.* (recursos humanos, Bogotá), *Hogar Ejemplo Tienda en Línea* (servicio al cliente, Medellín) e *IPS Ejemplo Salud* (salud, Cali). Elige la que se parezca al cliente.
3. **Modelo**: GPT-4o mini (recomendado), GPT-4o o GPT-4 Turbo. El servidor solo acepta esos tres.
4. **Pregunta de ejemplo**: envía la siguiente pregunta sugerida que aún no se ha hecho.
5. **Estado de los documentos**: abrir la página no crea nada en el servidor. Dice «3 documentos de ejemplo: se indexan en el servidor con tu primera pregunta». Si este navegador ya los indexó en una visita anterior, dice directamente «3 documentos indexados en el servidor». Clic en un documento para leerlo completo.
6. **Volver al catálogo**: regresa a `/demo`.

**Qué decir:** «Esto es lo único que consulta el asistente: tres documentos internos. Lo que no esté aquí, no lo va a inventar».

### Paso 2 · Haz una pregunta sugerida (≈ 1 min)

![Paso 2: respuesta con citas y pasos del servidor](images/doc/demos/chatbot/02-paso-respuesta-con-citas.jpg)

*Respuesta a «¿Cuántos días de vacaciones me corresponden?» con sus citas y los cinco pasos que ejecutó el servidor.*

Con la primera pregunta, la demo prepara el bot de la empresa en el servidor: lo crea, le sube los tres textos y el servidor los fragmenta e indexa (mientras tanto el chat dice «Indexando los documentos de la empresa…»). Después responde. Las preguntas siguientes, y las visitas siguientes desde el mismo navegador, reutilizan ese bot.

1. **Cita [1]** dentro del texto: al pasar el mouse muestra el fragmento; al hacer clic lo abre completo.
2. **Fuentes**: los fragmentos que el servidor encontró (hasta 5), con el nombre del documento.
3. **Quién la redactó**: «Redactada por gpt-4o-mini con 5 fragmentos» (o «Modo extractivo…» si no hubo modelo). Al lado están «Respuesta útil» (pulgar arriba), «Respuesta a mejorar» (pulgar abajo) y «Volver a preguntar».
4. **Cómo se respondió**: los pasos reales de la última respuesta: 1) fragmentación, 2) búsqueda BM25 (top 5) con el mejor puntaje, 3) instrucciones al modelo, 4) modelo y milisegundos en el servidor, 5) citas. Abajo: tiempo total medido en tu navegador, tokens y costo estimado en USD.
5. **Documentos**: ahora dice «3 documentos indexados en el servidor».

### Paso 3 · Abre la fuente (≈ 1 min)

![Paso 3: fragmento citado](images/doc/demos/chatbot/03-paso-fragmento-citado.jpg)

*Panel «Fragmento citado» que se abre al hacer clic en una cita.*

1. **Puntaje BM25**: qué tanto coinciden las palabras de la pregunta con ese fragmento (más alto = más relevante).
2. **Ver documento completo**: abre el documento con el fragmento citado resaltado.

![Documento completo con el fragmento resaltado](images/doc/demos/chatbot/06-documento-completo.jpg)

*Visor del documento de ejemplo: el párrafo citado aparece resaltado y se aclara que el documento es ficticio.*

**Qué decir:** «Cada dato se puede auditar: el usuario ve de qué párrafo salió».

### Paso 4 · Pregunta algo que no esté (≈ 1 min)

![Paso 4: respuesta «no encontré»](images/doc/demos/chatbot/04-paso-no-encontre.jpg)

*La última pregunta sugerida está fuera de los documentos a propósito.*

1. **Pregunta fuera de los documentos**: va marcada con borde punteado y la nota «no está en los documentos» (por ejemplo «¿Cuánto gana el gerente general?»).
2. **No inventa**: debajo de la respuesta aparece «No está en los documentos: el asistente no inventa una respuesta».
3. **Paso 2 en ámbar**: «Ningún fragmento coincide con las palabras de la pregunta»; el paso 5 dice «Respuesta «no encontré»: sin citas».
4. **Métricas de esta sesión**: al pie de «Cómo se respondió». Cerradas muestran el número de preguntas y el % con fuente; al abrirlas, preguntas, con fuente, «no encontré», tiempo medio, tokens, costo (USD) y valoraciones. Se calculan en el navegador con las respuestas reales de la pestaña, no se envían al servidor y se reinician al recargar.

### Paso 5 · Llévalo a su caso (≈ 1 min 30 s)

![Paso 5: los tres modos de la demo](images/doc/demos/chatbot/05-paso-modos.jpg)

*Pestañas de modo debajo de la barra superior.*

1. **Prueba el asistente**: lo que acabas de mostrar.
2. **Prueba con tu documento**: el prospecto sube su propio PDF, DOCX o TXT (ver [más abajo](#prueba-con-tu-documento)).
3. **Configura el tuyo**: crea su bot, le sube textos, lo prueba en un sitio de ejemplo y copia el código para su web (ver [más abajo](#configura-el-tuyo)).
4. **Sistemas RAG para empresas**: lleva a la landing `/rag`. Para cerrar, invita a «Solicitar demo» (menú superior) o a los [planes RAG](Producto-chatbot-rag-ia.md).

---

## Pantallas y funciones

### Barra superior y recorrido de bienvenida

![Recorrido de bienvenida](images/doc/demos/chatbot/13-recorrido-bienvenida.jpg)

*La primera visita muestra un recorrido de 5 pasos sobre la demo.*

- **Recorrido**: cinco tarjetas («Elige una empresa de ejemplo», «Haz una pregunta sugerida», «Abre la fuente», «Pregunta algo que no esté», «Prueba con tu documento o configura el tuyo»). «Saltar recorrido», «Empezar» o la tecla Escape lo cierran, y queda guardado en el navegador para no repetirlo.
- **Volver al catálogo** y **título con el rótulo «Datos de ejemplo»**: el tooltip aclara que las empresas y documentos son ficticios, pero las respuestas las genera el servidor real.
- **Escritorio / Celular**: cambia el marco de la conversación para ver cómo se vería en un teléfono (solo en pantallas medianas o grandes). En el marco de celular, «Documentos de la empresa» y «Cómo se respondió» se abren como paneles laterales.
- **Enlace de la URL**: el modo queda en la dirección (`?mode=upload` o `?mode=builder`), así puedes compartir el enlace directo a un modo.

### Prueba el asistente

| Zona | Qué puedes hacer | Qué pasa |
|---|---|---|
| Documentos de la empresa | Clic en un documento | Se abre el visor con el texto completo (ficticio). |
| Qué incluye hoy | Clic en una capacidad | Se abre un panel con el detalle de lo que existe en el código (ver captura abajo). |
| Conversación | Escribir y pulsar Enter, o elegir una pregunta sugerida | La pregunta va al servidor; la respuesta trae citas y fuentes. La primera indexa los documentos («Indexando los documentos de la empresa…»). |
| Respuesta | «Respuesta útil» / «Respuesta a mejorar» | Marca la respuesta y suma a las métricas de la sesión. El aviso dice «Anotado en las métricas de esta sesión. Tu valoración no se envía al servidor»; un segundo clic la quita. |
| Respuesta | «Volver a preguntar» | Reenvía la misma pregunta y reemplaza la respuesta. |
| Cita o fuente | Clic | Abre «Fragmento citado» con documento, posición, puntaje BM25 y texto exacto. |
| «Documentos de la empresa» / «Cómo se respondió» (barra de la conversación) | Clic | En escritorio ocultan o muestran las columnas laterales; en celulares y tabletas abren paneles laterales. |
| Métricas de esta sesión | Clic | Abre o cierra el detalle, al pie de «Cómo se respondió». |

Todos los paneles (fragmento, documento, «Qué incluye hoy», paneles laterales y confirmaciones) se cierran con Escape o con la X, y el foco vuelve al botón que los abrió.

![Qué incluye hoy: búsqueda BM25](images/doc/demos/chatbot/07-que-incluye-hoy.jpg)

*Detalle de «Búsqueda por palabras (BM25)» en «Qué incluye hoy». Las siete capacidades: carga de documentos, fragmentación, búsqueda BM25, respuesta con citas, modelos de OpenAI, widget para tu sitio e historial de conversaciones.*

Debajo de la lista, la demo aclara que en un proyecto se construyen además conectores (Google Drive, SharePoint), WhatsApp, permisos por rol y panel de métricas, con enlace a «Ver planes RAG» (`/services#planes-rag`). Esas piezas **no** están en la demo.

### Cuando el servidor pone un límite

![Mensaje cuando se alcanza el límite de bots por hora](images/doc/demos/chatbot/15-limite-de-bots.jpg)

*Si el servidor rechaza la creación del bot de ejemplo por el límite por hora, la demo lo dice en la columna de documentos y en el chat, con «Reintentar» y «Probar con tu documento».*

La demo dice la causa real de cada error:

| Qué pasó en el servidor | Qué dice la demo |
|---|---|
| Límite de bots de ejemplo creados por hora desde la misma red (429 al crear) | «El servidor limita cuántos asistentes de ejemplo se pueden crear por hora desde una misma red, y ese límite ya se alcanzó…», con «Probar con tu documento» |
| Muchas preguntas seguidas desde la misma red (429 al preguntar) | «Llegaron muchas preguntas seguidas desde tu red y el servidor pidió una pausa. Espera un minuto…» |
| La demo llegó a su tope de bots (503 `capacity`) | «La demo llegó a su capacidad de asistentes en este momento…», con «Probar con tu documento» |
| El servidor no puede guardar bots (503) | «El chatbot no está disponible en este momento…» |
| No hubo respuesta del servidor | «No pudimos conectar con el servidor de la demo. Revisa tu conexión…» (solo en este caso se menciona la conexión) |

### Prueba con tu documento

![Formulario de «Prueba con tu documento»](images/doc/demos/chatbot/08-subir-documento.jpg)

*Formulario con un archivo de prueba de una empresa ficticia, el email y la autorización de datos.*

- Pide **solo** el archivo (PDF, DOCX o TXT, hasta 5 MB y 30 páginas), el **email** y la casilla de **autorización de datos (Ley 1581 de 2012)** con enlace a la política de privacidad.
- Muestra el aviso «No subas información confidencial en la demo» y los límites: 10 preguntas por documento y 3 documentos al día.
- Al subir, el servidor registra primero el email como contacto con origen `demo-rag` (el mismo canal del formulario de contacto) junto con la prueba de la autorización, y solo entonces procesa el documento **en memoria**; lo borra a la hora. Si no puede registrar la prueba, no procesa el documento y lo dice («No pudimos registrar tu prueba en este momento…»).
- Si la función está apagada o se acabó el cupo del mes, muestra «La prueba con tu documento no está disponible en este momento» (o «Alcanzamos el cupo de pruebas de este mes») con «Agenda una demo con nosotros» y «Usar la demo con el documento de ejemplo».

![Chat sobre el documento propio](images/doc/demos/chatbot/09-chat-con-tu-documento.jpg)

*Chat sobre el documento subido: contador, aviso de borrado, botón para subir otro y fuentes por fragmento.*

1. **Contador** «Preguntas: 1/10».
2. **Aviso de borrado**: «Tu documento se borra automáticamente en 1 hora (a las …)».
3. **Subir otro documento**: borra el actual y vuelve al formulario.
4. **Fuentes**: en PDF cita la página (`p. 3`); en DOCX y TXT, el fragmento (`fragmento 4`), con el extracto.

Trae tres preguntas sugeridas («¿De qué trata el documento?», «¿Qué fechas o plazos menciona?», «¿Qué requisitos u obligaciones establece?»). Al llegar a 10 preguntas invita a agendar una demo.

### Configura el tuyo

![Configura el tuyo: bot guardado y widget real](images/doc/demos/chatbot/10-configura-el-tuyo.jpg)

*Bot «Asistente de Distribuidora Ejemplo» (empresa ficticia) guardado, con el widget real abierto en el sitio de ejemplo y una respuesta con fuentes.*

1. **Mis bots**: los bots creados desde este navegador; permite cargar uno, crear uno nuevo o eliminarlo del servidor (pide confirmación dentro de la página).
2. **Guardar bot**: crea o actualiza el bot en el servidor. Al lado aparecen el ID, «Copiar enlace del chat» y «Abrir chat» (página pública `/embed/chatbot/<id>`).
3. **Configuración**: nombre, bienvenida, color, posición del botón (4 esquinas), ícono, instrucciones y tono (Profesional, Amigable, Técnico, Cercano).
4. **Vista previa**: el **widget real** (el mismo `widget.js` que se pega en otro sitio) conversando con el servidor. Tiene tres vistas: «Sitio web», «Celular» y «Enlace directo». Sin guardar, solo muestra la apariencia y pide guardar para conversar.
5. **Código para tu sitio**: dos pestañas, «Botón flotante (script)» e «Iframe», con «Copiar» y la nota de CSP.

![Documentos y conversaciones del bot](images/doc/demos/chatbot/11-documentos-y-conversaciones.jpg)

*Parte baja de «Configura el tuyo»: documentos del bot y su historial de conversaciones.*

1. **Documentos**: archivos TXT, MD o CSV de hasta 2 MB (arrastrar o elegir); cada uno se puede quitar. Si el bot aún no existe, subir un archivo lo guarda primero. Al recargar la página, el bot vuelve con su lista de documentos.
2. **Cargar documentos de ejemplo**: sube los documentos de una de las tres empresas ficticias.
3. **Conversaciones**: lo que le preguntan al bot por el enlace directo («Abrir chat») o por el widget en otro sitio, con preguntas, «con fuente» y «no encontré»; «Actualizar», «Exportar CSV» y «Borrar historial» (pide confirmación dentro de la página). Las preguntas de la vista previa no se guardan, y cada pregunta guardada se borra sola a los 30 días.

### En el celular

![Demo de chatbot en un celular](images/doc/demos/chatbot/12-movil.jpg)

*Vista en un teléfono de 390 px: la barra se apila; debajo de cada respuesta aparece «Cómo se respondió».*

![«Cómo se respondió» en el celular](images/doc/demos/chatbot/14-movil-como-se-respondio.jpg)

*Panel «Cómo se respondió» en el celular, con los pasos de la última respuesta y las métricas de la sesión.*

En pantallas pequeñas, «Documentos de la empresa» y «Cómo se respondió» están en la barra de la conversación y se abren como paneles laterales (se cierran con la X, tocando fuera o con Escape). «Cómo se respondió» incluye las métricas de la sesión. También se abre desde el enlace que aparece debajo de cada respuesta.

---

## Qué es real y qué es simulado

| Elemento | Real o simulado | Detalle |
|---|---|---|
| Empresas y documentos del modo «Prueba el asistente» | **Datos de ejemplo** | Tres empresas ficticias con textos en español e inglés, definidos en el código de la demo. |
| Indexación | **Real** | Con la primera pregunta, el navegador crea un bot de ejemplo en el servidor (`POST /api/chatbot/bots` con `kind: "sample"`) y sube los textos (`POST /api/chatbot/bots/:id/docs`). Las preguntas y visitas siguientes desde ese navegador lo reutilizan. Si el servidor ofrece bots de ejemplo compartidos (lo anuncia en `GET /api/chatbot/models`), la demo usa esos y no crea uno propio. |
| Búsqueda | **Real** | BM25 en el servidor; se envían los 5 mejores fragmentos. |
| Redacción de la respuesta | **Real** | Modelo de OpenAI (GPT-4o mini, GPT-4o o GPT-4 Turbo) con reglas de citar y no inventar. Sin clave de IA o sin presupuesto del mes, pasa a **modo extractivo** (muestra los fragmentos tal cual). |
| Citas, fuentes y puntajes | **Real** | Salen de la respuesta del servidor. |
| «Cómo se respondió», tokens y costo | **Real** | Datos de la respuesta; el tiempo total se mide en el navegador y el costo es una estimación del servidor. |
| Métricas de esta sesión | **Real, solo local** | Se calculan en la pestaña con las respuestas reales; no se envían al servidor y se borran al recargar. |
| Valoración útil / a mejorar | **Solo local** | Se suman a las métricas de la sesión; no se envían al servidor, y el aviso lo dice. |
| Preguntas de «Prueba el asistente» | **No se guardan** | El servidor no guarda las conversaciones de los bots de ejemplo. |
| Vista «Celular» del modo de ejemplo | **Simulado** | Es un marco visual del tamaño de un teléfono. |
| Prueba con tu documento | **Real** | API `/api/demo-rag`: el email se registra como contacto con la prueba de la autorización; el documento vive en memoria 1 hora. |
| Configura el tuyo | **Real** | Bot propio en el servidor, widget real (`/widget.js` + `/embed/chatbot/<id>`), historial real del widget y del enlace directo, y exportación CSV. |

```mermaid
sequenceDiagram
    participant V as Visitante
    participant W as Página de la demo
    participant B as Backend
    participant O as OpenAI
    V->>W: Abre la demo y elige una empresa
    W->>B: ¿Sigue el bot que indexó este navegador? (solo consulta)
    V->>W: Hace la primera pregunta
    alt El navegador no tiene bot de esa empresa
        W->>B: Crea el bot de ejemplo y sube los documentos
        B-->>W: Documentos indexados
    end
    W->>B: POST /bots/:id/chat
    B->>B: Búsqueda BM25 (top 5)
    alt Hay clave y presupuesto
        B->>O: Fragmentos numerados + reglas
        O-->>B: Respuesta con citas
    else Sin clave o sin presupuesto
        B->>B: Modo extractivo
    end
    B-->>W: Respuesta, fuentes, modelo, tokens y costo
    W-->>V: Respuesta con citas y pasos
```

*Cómo viaja una pregunta del modo «Prueba el asistente».*

---

## Acceso

- **Cómo la ve un visitante:** la demo está en modo **Abierta** (`publico`): cualquiera entra a `/demo/chatbot` sin cuenta y sin pasar por la pantalla de acceso. El modo «Prueba con tu documento» es lo único que pide un dato (email + autorización).
- **Cómo se solicita:** no hace falta solicitarla. Si alguien quiere verla con su caso, usa «Agenda una demo con nosotros» (dentro de la demo) o «Solicitar demo» del menú.
- **Cómo la controla el admin:** el modo de acceso sale del catálogo del servidor y se cambia en **Admin › Catálogo de demos** (`/admin/catalogo-demos`). Si un día se pasa a «Con solicitud» o «Solo por invitación», los visitantes verán la pantalla de acceso y los accesos se conceden en **Admin › Solicitudes de demo** y **Admin › Accesos a demos**. Los emails de «Prueba con tu documento» llegan a **Admin › Contactos**. Detalle en el [Manual del administrador](Doc-06-Manual-del-Administrador.md) y en [Flujos del visitante](Doc-04-Flujos-del-Visitante.md).

---

## Limitaciones conocidas

- **La búsqueda es por palabras (BM25), no por significado.** Si la pregunta usa sinónimos que no están en el documento, puede responder «no encontré». La demo lo advierte en «Qué incluye hoy», y las preguntas sugeridas usan palabras de los documentos.
- **Cada navegador nuevo crea su propio bot de ejemplo** (uno por empresa e idioma, con la primera pregunta). El servidor limita la creación a 30 bots por hora por red (configurable); si se alcanza, la demo lo dice y ofrece «Probar con tu documento». Para que todos los visitantes compartan los mismos bots de ejemplo hace falta que el backend ofrezca bots de ejemplo compartidos; la demo ya los usa en cuanto el servidor los anuncie.
- **La valoración útil / a mejorar no se guarda en el servidor.** Es parte de las métricas de la sesión, y el aviso lo dice.
- **Vencimiento de los bots.** Los bots se guardan en la base de datos del servidor. Uno sin uso se borra a los 12 meses con sus documentos y su historial; los de ejemplo, a los 30 días. Un bot de ejemplo borrado se vuelve a crear solo con la siguiente pregunta; uno de «Configura el tuyo» desaparece de «Mis bots» con el aviso «ya no existe en el servidor».
- **«Mis bots» depende del navegador.** La propiedad del bot va en un token guardado en este navegador; desde otro equipo no se puede editar el bot ni ver sus conversaciones («Solo el dueño del bot puede ver sus conversaciones»).
- **«Configura el tuyo» solo acepta TXT, MD o CSV (máx. 2 MB).** PDF y DOCX solo funcionan en «Prueba con tu documento», que tiene sus propios límites: 3 documentos al día por red, 10 preguntas por documento, borrado a la hora, y un PDF escaneado sin texto seleccionable no sirve.
- **El historial solo guarda lo que llega por el enlace directo o por el widget en otro sitio.** Para mostrar «Conversaciones» en una reunión, abre el bot con «Abrir chat» y pregúntale algo; lo que se pregunta en la vista previa no queda guardado.
- **En el celular la barra superior ocupa buena parte de la pantalla**; la conversación tiene su propio desplazamiento.
- **Depende del servidor.** Si el backend no responde, la barra muestra «Servidor no disponible» y no se puede indexar ni preguntar.
- **Botones:** SONDA_PENDIENTE
