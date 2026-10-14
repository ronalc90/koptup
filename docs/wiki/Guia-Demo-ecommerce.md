# Guía de la demo: Tienda en línea

> Ruta `/demo/ecommerce` · Modo de acceso: **Abierta** · Tipo: **datos de ejemplo** (todo corre en el navegador; pagos, factura y guías simulados; sin backend ni IA) · Plan del producto: [Tienda en línea (e-commerce)](Producto-ecommerce.md)

**Resumen.** Es una tienda en línea de ejemplo para Colombia vista de punta a punta: el cliente compra en la tienda (catálogo de 24 productos, carrito con reglas de precio y cupón, pago simulado con tarjeta, PSE, Nequi, Daviplata, contraentrega o a cuotas) y el mismo pedido aparece en el panel de la tienda, en logística (guía y seguimiento simulados con transportadoras ficticias, devoluciones) y en los reportes de ventas exportables a CSV. Está pensada para marcas, comercios y distribuidoras que quieren vender en línea con su catálogo, su inventario, sus pagos y sus envíos conectados. Cualquier visitante la abre sin registrarse.

**En esta página:** [Recorrido sugerido](#recorrido-sugerido-demo-comercial-de-5-minutos) · [Pantallas y funciones](#pantallas-y-funciones) · [Qué es real y qué es simulado](#qué-es-real-y-qué-es-simulado) · [Acceso](#acceso) · [Limitaciones conocidas](#limitaciones-conocidas)

![Vista general](images/doc/demos/ecommerce/00-general.jpg)

*Vista inicial a 1440 px. (1) **Volver al catálogo de demos**. (2) Salidas comerciales: **Solicitar demo guiada** y **Cotizar tu tienda**. (3) Rótulo **Datos de ejemplo** (al pasar el mouse explica qué es ficticio) y, al lado, **Restablecer**. (4) «Por dónde empezar» con **Empezar el recorrido**; a su izquierda, «Para quién». (5) Barra de las cinco vistas. (6) Panel **Recorrido sugerido (0/5)** con el siguiente paso resaltado.*

---

## Recorrido sugerido (demo comercial de 5 minutos)

Este guion sigue el panel **Recorrido sugerido** de la propia demo. **Empezar el recorrido** (en el encabezado) abre el panel, lleva a la vista del primer paso pendiente, lo dice en un aviso («Paso 1 de 5: …») y pone el foco en ese paso. Cada paso se marca en verde cuando lo haces de verdad, el siguiente queda resaltado con «Siguiente paso» y el contador sube hasta (5/5). Un clic en un paso lleva a su vista (si ya estás en ella, un aviso te dice dónde se hace). Empieza con los datos limpios: si alguien ya usó la demo en ese navegador, pulsa **Restablecer** y confirma.

![Recorrido de la demo](images/doc/demos/ecommerce/recorrido.gif)

*Recorrido completo: encabezado, carrito, cupón, pago simulado, confirmación, panel, guía y reportes con el recorrido en 5/5.*

```mermaid
flowchart LR
    T["Tienda: agregar al carrito"] --> C["Carrito: reglas y cupón"]
    C --> D["Datos y envío"]
    D --> P["Pago simulado"]
    P --> O["Pedido TDA nuevo"]
    O --> INV["Descuenta existencias de la bodega"]
    O --> PAN["Panel: pasar a preparación"]
    PAN --> LOG["Logística: generar guía"]
    LOG --> SEG["Seguimiento simulado hasta Entregado"]
    O --> REP["Reportes: suma a ventas y gráficos"]
```

*Cómo viaja un pedido entre las vistas: todas leen y escriben los mismos datos del navegador.*

### Paso 1. Tienda: agrega productos al carrito

En **Tienda**, agrega dos productos (en la prueba, Tenis de lona rojos y Café de origen en grano 500 g, desde la fila «Más vendidos»).

![Paso 1: tienda](images/doc/demos/ecommerce/01-paso1-tienda.jpg)

*La tienda después de agregar dos productos: el contador del carrito marca 2 y los avisos ofrecen «Ir a pagar».*

1. **Buscar**: por nombre o SKU, con sugerencias mientras escribes. Escape cierra las sugerencias y, si ya están cerradas, borra la búsqueda.
2. **Categorías**: Todas, Tecnología, Moda, Hogar, Café (el café en grano y la prensa francesa), Deportes, Belleza, Vinos y Favoritos (los que marcas con el corazón).
3. **Ordenar**: Destacados, precio menor o mayor y mejor calificados.
4. **Carrito y pago**: la pestaña muestra cuántas unidades llevas. Abajo a la derecha aparece además el botón flotante **Ir a pagar**.
5. **Avisos**: «… quedó en tu carrito» con **Ir a pagar**. Se ven como máximo dos a la vez, abajo a la izquierda en el computador (abajo al centro en el celular), duran 5 segundos y se cierran con la X.

**+ / Agregar** suma una unidad y no deja pasar de las existencias («No hay más unidades disponibles…»).

Qué decir: «El cliente encuentra rápido lo que busca y ve en todo momento cuánto lleva».

### Paso 2. Carrito, datos de envío y pago simulado

Abre **Carrito y pago**. Escribe el cupón `BIENVENIDA10` y pulsa **Aplicar**.

![Paso 2: carrito](images/doc/demos/ecommerce/03-paso2-carrito.jpg)

*(1) Los cuatro pasos de la compra. (2) Cupón aplicado. (3) Resumen: subtotal $ 228.800, cupón −$ 22.880, envío gratis y total $ 205.920 con IVA incluido.*

El resumen se recalcula al instante con las reglas de precio activas en el panel (envío gratis desde $ 150.000, 10 % si el carrito supera $ 300.000, etc.). Pulsa **Continuar**, luego **Usar datos de ejemplo** en «Datos y dirección de envío» y otra vez **Continuar**. En el pago, deja **Tarjeta** y pulsa **Usar tarjeta de prueba aprobada**.

![Paso 2: pago](images/doc/demos/ecommerce/04-paso2-pago.jpg)

*Paso «Pago» con la tarjeta de prueba aprobada cargada y el resumen a la derecha.*

1. **Medio de pago**: Tarjeta, PSE, Nequi, Daviplata, Contraentrega y **A cuotas** («desde $ 150.000»). Cada uno explica qué pasaría en una tienda real; Nequi y Daviplata piden el celular. Con el teclado, las flechas, Inicio y Fin cambian la opción.
2. **Número de tarjeta**: se valida (algoritmo de Luhn) y la demo reconoce la marca (Visa, Mastercard o American Express). También valida nombre, vencimiento y CVV. «No escribas datos reales de tarjeta: aquí no se envían ni se guardan».
3. **Usar tarjeta de prueba aprobada** (`4242 4242 4242 4242`) o **rechazada** (`4000 0000 0000 0002`, que al pagar muestra «Pago rechazado por la pasarela simulada…» para enseñar el manejo del rechazo).
4. **Pagar $ 205.920**: «Procesando pago simulado…» durante un segundo y medio y luego la confirmación.

**A cuotas por debajo del mínimo**: si la compra es menor a $ 150.000, al elegir **A cuotas** aparece el aviso «Tu compra es de $ … y el pago a cuotas aplica desde $ 150.000. Agrega productos o elige otro medio de pago.»; si igual pulsas **Pagar**, el aviso pasa a error (rojo, anunciado a los lectores de pantalla) y el pedido no se crea.

### Paso 2 (cont.). Confirmación y factura de ejemplo

![Paso 2: confirmación](images/doc/demos/ecommerce/05-paso2-confirmacion.jpg)

*«¡Pedido de ejemplo confirmado!» con el pedido `TDA-1458`; la confirmación avisa que el pago es simulado y que no se transmitió nada a la DIAN.*

1. **Datos del pedido**: número, medio de pago («aprobado (simulado)»; en contraentrega «pendiente hasta la entrega»), correo y total.
2. **CUFE de ejemplo**, calculado en tu navegador con SHA-384 y una clave técnica ficticia.
3. **Vista previa del mensaje de confirmación por WhatsApp** con **Copiar mensaje**. No se envía nada.
4. **Descargar factura de ejemplo (PDF)**: descarga `factura-ejemplo-TDA-1458.pdf`. Debajo, **Ver el pedido en el panel** y **Seguir comprando**.

![Factura de ejemplo en PDF](images/doc/demos/ecommerce/06-factura-pdf.jpg)

*Primera parte del PDF descargado: vendedor ficticio, comprador, fecha y hora de Colombia, líneas, totales con IVA incluido y el CUFE de ejemplo. Arriba, en rojo, dice que no es una factura electrónica válida.*

Qué decir: «Pago, factura y aviso al cliente en un solo paso; en tu proyecto se conectan tu pasarela, tu proveedor de facturación y WhatsApp».

### Paso 3. Panel de la tienda: pasa tu pedido a preparación

![Paso 3: panel de la tienda](images/doc/demos/ecommerce/07-paso3-panel.jpg)

*Panel de la tienda con tu pedido ya en preparación; va primero con la marca «Tuyo».*

1. **Últimas 24 horas**: ventas sin envío, pedidos, pedido promedio y unidades vendidas, con la variación frente al promedio diario de los 7 días anteriores. Incluyen los pedidos de ejemplo y los tuyos.
2. **Filtros por estado**: Todos, Nuevo, Preparando, Enviado, Entregado y Cancelado, con el conteo. A la derecha, el período (24 h, 7 o 30 días) y el buscador por pedido, cliente o ciudad.
3. **Tu pedido** (`TDA-1458` · **Tuyo**). Un clic en el número abre el detalle (cliente, ciudad, dirección, documento, pago, bodega, guía, líneas y totales).
4. **Siguiente paso**: **Pasar a preparación** en los nuevos, **Generar guía** en los que se están preparando y **Simular siguiente evento** en los enviados.
5. **Exportar CSV**: descarga los pedidos filtrados (`pedidos-tienda-ejemplo-1d.csv` para 24 horas), con la fecha y hora de Colombia.

Pulsa **Pasar a preparación** en tu pedido: aparece «TDA-1458 pasó a preparación».

### Paso 4. Logística: genera la guía de envío

Abre **Logística**. Tu pedido aparece **primero** en **Por despachar** (los tuyos van primero y después los de ejemplo, del más antiguo al más nuevo). Pulsa **Generar guía**. (El mismo **Generar guía** está en la fila de tu pedido en el panel).

![Paso 4: generar guía](images/doc/demos/ecommerce/08-paso4-guia.jpg)

*Ventana «Generar guía para TDA-1458» con las cuatro transportadoras de ejemplo habilitadas.*

1. **Destino** (ciudad y departamento) y **bodega** de salida.
2. **Transportadora**: Rápido Andino, Envíos Cóndor, Mensajería Ceiba o Carga Macondo, **empresas ficticias** con tarifa y tiempo de ejemplo para ese destino. Solo aparecen las que están habilitadas en la tabla de transportadoras.
3. **Generar guía (simulada)**: el pedido pasa a **Enviado** con una guía tipo `RAN-SIM-000001` y aparece de primero en **Envíos en camino** (aviso con **Ver seguimiento**).

En **Envíos en camino**, **Simular siguiente evento** avanza el seguimiento: Guía generada → Recogido en bodega → En tránsito → En reparto → Entregado (al entregarse, un pedido contraentrega queda pagado).

Qué decir: «Despacho sin digitar guías: elige la transportadora con su tarifa y el cliente sigue el envío. En tu proyecto conectamos las transportadoras que uses».

### Paso 5. Reportes: tu pedido sumado

Abre **Reportes**. Con esto el panel del recorrido queda en **(5/5)** y muestra «¡Recorrido completo!» con **Solicitar demo guiada** y **Cotizar tu tienda**.

![Paso 5: reportes](images/doc/demos/ecommerce/09-paso5-reportes.jpg)

*(1) Recorrido completo (5/5) con las salidas comerciales. (2) «Incluye 1 pedido tuyo por $ 205.920 en ventas». (3) Período. (4) Exportar a CSV.*

1. **Incluye N pedidos tuyos**: confirma que tus compras ya están en las cifras (valor de los productos después de descuentos, sin envío).
2. **Período**: últimos 7 o 30 días.
3. **Exportar**: **Ventas por producto (CSV)** y **Ventas por día (CSV)** (`ventas-por-producto-30d.csv`, `ventas-por-dia-30d.csv`; la última fila es hoy en Colombia).
4. **Indicadores**: ventas netas, pedidos, pedido promedio, clientes únicos, recompra (clientes con 2 o más pedidos) y unidades. Excluyen los pedidos cancelados.
5. **Ventas por día**: barras con el detalle al pasar el cursor; al lado, ventas por categoría, y más abajo por ciudad, por medio de pago y productos más vendidos.

Qué decir: «Cada venta, de la tienda o del panel, llega sola a los reportes; no hay que consolidar hojas de cálculo».

---

## Pantallas y funciones

```mermaid
stateDiagram-v2
    state "Nuevo" as N
    state "Preparando" as P
    state "Enviado" as E
    state "Entregado" as D
    state "Cancelado" as C
    [*] --> N: Pagar en la tienda
    N --> P: Pasar a preparación
    P --> E: Generar guía (simulada)
    E --> E: Simular siguiente evento
    E --> D: Último evento de seguimiento
    N --> C: Revisión de riesgo, cancelar
    P --> C: Revisión de riesgo, cancelar
    D --> [*]
    C --> [*]
```

*Estados de un pedido en la demo.*

### Encabezado, barra de vistas y recorrido

| Elemento | Qué hace |
|---|---|
| **Volver al catálogo de demos** | Lleva a `/demo`. |
| **Solicitar demo guiada** / **Cotizar tu tienda** | Abren `/solicitar-demo?demos=ecommerce` y `/contact?service=ecommerce` (el formulario llega con «Tienda en línea» elegida). |
| **Datos de ejemplo** | Rótulo; al pasar el mouse explica que productos, clientes, pedidos, transportadoras y cifras son ficticios y que pagos, factura y guías son simulados. |
| **Restablecer** | Abre «Restablecer la demo», que dice cuántos pedidos tuyos se borrarán (más productos creados, existencias, reglas y favoritos), y vuelve a la tienda con los datos iniciales. |
| **Para quién / Por dónde empezar** | Explican a quién sirve la demo y el recorrido; **Empezar el recorrido** abre el panel y lleva al primer paso pendiente. |
| **Tienda, Carrito y pago, Panel de la tienda, Logística, Reportes** | Cambian de vista y la guardan en la dirección (`?view=checkout`, `?view=vendor`, `?view=operations`, `?view=admin`). Un clic en la vista activa baja al inicio de su contenido. En el celular la barra se desplaza de lado y deja a la vista la vista activa. La ruta antigua `/demo/ecommerce/admin` redirige a `?view=admin`. |
| **Recorrido sugerido (N/5)** | Los cinco pasos del guion; se marcan solos y el siguiente queda resaltado. **Ocultar** lo pliega en el enlace «Ver recorrido sugerido (N/5)». |

### Tienda

Ver el [paso 1](#paso-1-tienda-agrega-productos-al-carrito).

- **Portada de la tienda de ejemplo**: «Tecnología, moda, hogar, café y más», envíos a 11 ciudades desde Bogotá, Medellín y Cali, medios de pago (con la nota de que el pago es simulado), «Envío gratis desde $ 150.000» (o «Envío con tarifa fija» si la regla está apagada) y «Precios en COP con IVA incluido».
- **Más vendidos**: calculados con los pedidos de ejemplo de los últimos 30 días.
- **Todos los productos (24)**: foto, insignias (descuento, Nuevo, Más vendido, Eco, Agotado; con sus colores también en modo oscuro), calificación, precio con precio anterior tachado, **Agregar**, corazón de favoritos y ojo de vista rápida.
- **Vistos recientemente**: aparece después de abrir productos.
- **Fotos**: si el servicio de fotos no responde, cada producto muestra un marcador con su nombre en lugar de un espacio vacío.

![Detalle del producto](images/doc/demos/ecommerce/02-detalle-producto.jpg)

*Vista rápida de «Audífonos inalámbricos de diadema»: galería (foto completa y dos acercamientos), precio, existencias por bodega, cantidad, **Comprar ahora** y **Agregar**. La ventana retiene el foco con Tab, se cierra con Escape y devuelve el foco al botón que la abrió.*

### Carrito y pago

Cuatro pasos: Carrito → Datos y envío → Pago → Confirmación (ver el [paso 2](#paso-2-carrito-datos-de-envío-y-pago-simulado)).

- **Carrito**: cantidades con − y + (hasta las existencias), papelera, cupón (`BIENVENIDA10`, 10 %; un código inválido dice «Ese cupón no existe en la tienda de ejemplo») y resumen con «Te faltan $ … para el envío gratis».
- **Datos y envío**: nombre, documento (CC, CE o pasaporte), correo, celular colombiano (10 dígitos que empiezan por 3), ciudad (11 ciudades, cada una con su bodega y días de entrega), dirección y autorización de datos (Ley 1581 de 2012). La opción «Necesito la factura electrónica a nombre de una empresa» pide razón social y NIT de 9 dígitos y calcula el dígito de verificación. Los errores se marcan en rojo con «Revisa los campos marcados en rojo».
- **Pago**: ver el paso 2. Si las existencias cambiaron mientras pagabas, la demo avisa y vuelve al carrito.

### Panel de la tienda

Ver el [paso 3](#paso-3-panel-de-la-tienda-pasa-tu-pedido-a-preparación). Debajo de los pedidos están el catálogo y las reglas de precio:

![Catálogo, inventario y reglas de precio](images/doc/demos/ecommerce/10-catalogo-inventario.jpg)

*(1) Crear producto. (2) Filtro de existencias bajas. (3) Existencias por bodega. (4) Editar, reponer y ocultar. (5) Reglas de precio. Primero va lo que tiene existencias bajas (la prensa francesa, con 8 unidades, alcanza para 3 días).*

- **Catálogo e inventario**: precio, existencias por bodega (BOG, MDE, CLO), vendidas en 30 días, días de inventario al ritmo actual y estado (Publicado u Oculto). Buscador, filtro **Solo existencias bajas** y **Ver N más**.
- **Acciones por producto**: **Editar** (en los de ejemplo solo precio y descripción), **Reponer existencias** (unidades y bodega), **Ocultar de la tienda / Publicar en la tienda** y, solo en los productos que tú creaste, **Eliminar**.
- **Crear producto**: nombre, SKU (4 a 20 letras, números o guiones, sin repetir), categoría, precio con IVA ($ 1.000 a $ 50.000.000), existencias iniciales en Bogotá (0 a 5.000), descripción y foto opcional (hasta 8 MB; se reduce y se guarda en este navegador). El aviso **Ver en la tienda** lleva a la tienda, donde aparece con la insignia «Nuevo».
- **Reglas de precio** (interruptores que se aplican al instante en el carrito): 10 % si el carrito supera $ 300.000 (activa), envío gratis desde $ 150.000 y si no $ 9.900 (activa), café de origen 3x2 (inactiva) y 15 % en vinos (inactiva).

### Logística

Ver el [paso 4](#paso-4-logística-genera-la-guía-de-envío).

![Logística](images/doc/demos/ecommerce/11-logistica.jpg)

*(1) Tu envío primero en «Envíos en camino» («Recogido en bodega» después de un evento simulado). (2) Transportadoras de ejemplo (ficticias). Debajo, las devoluciones.*

- **Bodegas**: Bogotá (capacidad 1.200 unidades), Medellín (900) y Cali (600), con ocupación, pedidos por despachar y envíos en camino.
- **Por despachar**: pedidos en preparación con **Generar guía**; tus pedidos van primero. Arriba dice cuántos pedidos nuevos esperan confirmación en el panel.
- **Envíos en camino**: transportadora, guía, barra de avance y **Simular siguiente evento**; tus envíos van primero.
- **Transportadoras de ejemplo**: Rápido Andino, Envíos Cóndor, Mensajería Ceiba y Carga Macondo (nombres ficticios, los mismos de la demo de WMS), con tiempo de entrega, tarifa de ejemplo a Bogotá, calificación de ejemplo y el interruptor **Disponible** (siempre queda al menos una).
- **Devoluciones**: lista con motivo, valor a reembolsar y estado (de ejemplo: cambio de talla de unos tenis, garantía de un reloj, retracto de una lámpara y «no corresponde a lo descrito» de un tapete); **Aprobar** devuelve la unidad al inventario (salvo garantía, que va a revisión técnica) y **Rechazar**. **Registrar devolución** se hace sobre un pedido entregado: pedido, producto y motivo (derecho de retracto con la explicación de la Ley 1480, garantía, cambio de talla o no corresponde a lo descrito).

### Reportes

Ver el [paso 5](#paso-5-reportes-tu-pedido-sumado). Más abajo:

![Recomendaciones, marketing, riesgo y requisitos](images/doc/demos/ecommerce/12-reportes-recomendaciones.jpg)

*Recomendaciones calculadas con reglas, automatizaciones de marketing, revisión de riesgo y requisitos normativos.*

- **Recomendaciones** («Calculadas con reglas simples sobre los datos (no es IA)»): inventario (con **Reponer 30 unidades**), compra conjunta, tendencia semanal por categoría y uso de Nequi y Daviplata.
- **Automatizaciones de marketing**: Después de la compra, Reactivación (pausada al inicio) y Reposición de café, cada una con su audiencia de hoy, interruptor y **Ver mensaje** (vista previa del correo; no se envía nada).
- **Revisión de riesgo**: pedidos sin despachar que cumplen reglas de ejemplo (contraentrega desde $ 1.500.000, primer pedido desde $ 4.000.000 o 3 o más unidades de un producto de tecnología). **Aprobar** o **Cancelar pedido** (lo cancela y devuelve las unidades al inventario).
- **Requisitos normativos**: tarjetas informativas sobre factura electrónica DIAN, Ley 1581, derecho de retracto (Ley 1480) y PCI DSS.

### En el celular

![Vista móvil](images/doc/demos/ecommerce/13-movil.jpg)

*A 390 px: a la izquierda, el encabezado con las salidas, el rótulo, «Para quién», «Por dónde empezar» y el recorrido; a la derecha, la tienda con el botón flotante «Ir a pagar».*

La página no se desborda a lo ancho (comprobado a 390 px en claro y oscuro); las tablas del panel y de logística se desplazan horizontalmente.

---

## Qué es real y qué es simulado

| Parte | Real o simulado | Detalle |
|---|---|---|
| Productos, clientes, pedidos de ejemplo y cifras | **Datos de ejemplo** | Generados siempre iguales; las fechas de los pedidos de ejemplo se cuentan hacia atrás desde el momento en que abres la página, así que siempre son recientes. Nombres de productos genéricos, sin marcas. |
| Transportadoras | **Ficticias** | Rápido Andino, Envíos Cóndor, Mensajería Ceiba y Carga Macondo no son empresas reales; tarifas, tiempos y calificaciones son de ejemplo. |
| Carrito, reglas de precio, cupón, IVA incluido y envío | **Real (en el navegador)** | Los interruptores del panel cambian de verdad el cálculo del carrito. |
| Existencias por bodega | **Real (en el navegador)** | Bajan al pagar, suben al reponer, al cancelar por riesgo o al aprobar una devolución. |
| Pagos (tarjeta, PSE, Nequi, Daviplata, contraentrega, a cuotas) | **Simulados** | No se contacta ninguna pasarela ni financiera; la tarjeta solo se valida en forma. |
| Factura y CUFE | **Simulados** | PDF de ejemplo generado en el navegador; CUFE con SHA-384 y clave ficticia; nada va a la DIAN. |
| Guías, tarifas y seguimiento | **Simulados** | Tarifas ilustrativas; los eventos se avanzan a mano. |
| WhatsApp y correos de marketing | **Simulados** | Solo vista previa y **Copiar mensaje**. |
| Recomendaciones y riesgo | **Reglas, no IA** | Lo dicen las propias pantallas. |
| Exportaciones CSV y PDF | **Real** | Se generan en el navegador con lo que ves; las fechas van en hora de Colombia sin importar la zona del equipo. |
| Fotos de productos | **Real (servicio externo)** | Se cargan desde Unsplash a través del optimizador de imágenes del sitio; si no responden, se muestra un marcador. Las fotos que subes al crear un producto se guardan en el navegador. |
| Dónde se guardan tus cambios | **Solo en este navegador** | `localStorage` del equipo; no llegan a un servidor ni los ven otras personas. La demo no llama al backend. Lo guardado por la versión anterior de la demo se actualiza solo (transportadoras ficticias y categoría Café) sin perder tus pedidos. |

---

## Acceso

**Cómo lo ve un visitante.** La demo es **Abierta**: en `/demo` su tarjeta («Tienda en Línea», insignias «Abierta» y «Completo») tiene **Probar Demo** (abre `/demo/ecommerce` directamente) y **Solicitar demo guiada** (`/solicitar-demo?demos=ecommerce`). No hay pantalla de acceso ni hace falta cuenta. Dentro de la demo, el encabezado trae **Solicitar demo guiada** y **Cotizar tu tienda** (`/contact?service=ecommerce`), que se repiten al completar el recorrido. Al final de la página está el bloque común de las demos «¿Te gustaría algo así para tu negocio?» con **Solicitar demo guiada**, **Solicitar Cotización** (`/contact`) y **Ver Planes y Precios** (`/services#planes-rag`).

**Cómo se solicita una demo guiada y cómo la gestiona el admin.** La solicitud del formulario llega a **Admin › Solicitudes de demo** como cualquier otra. Como la demo es abierta, no hace falta conceder acceso para usarla; la solicitud sirve para agendar la demo guiada. Un admin puede cambiar el modo de acceso en **Admin › Catálogo de demos** (por ejemplo, a «Con solicitud»); entonces empezaría a mostrarse la pantalla de acceso. Detalle en el [Manual del administrador](Doc-06-Manual-del-Administrador.md) y en [Flujos del visitante](Doc-04-Flujos-del-Visitante.md).

```mermaid
flowchart LR
    H["Hub /demo: tarjeta Abierta"] --> P["Probar Demo"]
    P --> D["/demo/ecommerce sin registro"]
    H --> G["Solicitar demo guiada"]
    D --> G
    D --> Q["Cotizar tu tienda"]
    G --> F["/solicitar-demo?demos=ecommerce"]
    Q --> C["/contact?service=ecommerce"]
    F --> AD["Admin: Solicitudes de demo"]
```

*Tres caminos: probarla de una vez, pedir una demo guiada o pedir una cotización con el producto ya elegido.*

---

## Limitaciones conocidas

1. **Los cambios viven solo en el navegador.** Otro equipo o navegador ve los datos de ejemplo; el vendedor no ve los pedidos que hizo el prospecto. Si el navegador no deja guardar (modo privado o almacenamiento lleno, por ejemplo con fotos grandes de productos creados), la demo sigue funcionando pero se pierde todo al recargar.
2. **Pagos, factura, guías y mensajes son simulados**, como lo dice la propia demo: no hay pasarela, ni financiera para el pago a cuotas, ni transmisión a la DIAN, ni transportadoras, ni WhatsApp o correo reales.
3. **«Ver Planes y Precios» del bloque final** (común a todas las demos) lleva a los planes RAG, no a los de la tienda en línea. Para cotizar la tienda usa **Cotizar tu tienda** del encabezado.
4. **«Últimas 24 horas» y «Ventas por día» usan ventanas móviles de 24 horas** contadas desde ahora, no días calendario: la fila de hoy en el CSV es «las últimas 24 horas».
5. **La tarjeta del catálogo de demos** describe la demo con «checkout» y «analytics» y no dice que pagos y envíos son simulados (el cambio de texto está propuesto en la pista del catálogo).
