# Guía de la demo: App de domicilios

> Ruta `/demo/delivery` · Modo de acceso: **Con solicitud** · Tipo: **datos de ejemplo** (todo corre en el navegador; no llama al servidor ni a un modelo de IA) · Plan del producto: [App de delivery](Producto-app-delivery.md)

**Resumen.** Es el canal propio de domicilios de un restaurante ficticio (Fogón Demo, con 3 sedes en Bogotá) contado en **4 apps conectadas**: el **Cliente** pide y paga, el **Comercio** (la sede) acepta y prepara, **Operaciones** asigna repartidores y vigila tiempos, y el **Repartidor** recoge y entrega con un código. Un pedido que haces en una app aparece al instante en las otras, y un panel de actividad lo va contando. Está pensada para dueños de restaurantes, cadenas y comercios con domicilio propio que hoy dependen de los agregadores; el encabezado lo dice, explica qué es real y qué es simulado, y ofrece **Solicitar demo guiada** y **Cotizar tu app de domicilios**. Un **recorrido sugerido de 5 pasos** dice por dónde empezar y se marca solo. La jornada de ejemplo es la de **hoy** (fecha de Colombia) y su reloj se adelanta cuando la cocina termina, el repartidor llega o entrega, así que los tiempos son realistas. Se abre solo con un acceso aprobado y lo que haces se guarda solo en tu navegador.

**En esta página:** [Recorrido sugerido](#recorrido-sugerido-demo-comercial-de-5-minutos) · [Pantallas y funciones](#pantallas-y-funciones) · [Qué es real y qué es simulado](#qué-es-real-y-qué-es-simulado) · [Acceso](#acceso) · [Limitaciones conocidas](#limitaciones-conocidas)

![Vista general](images/doc/demos/delivery/00-general.jpg)

*Lo primero que ve quien entra: qué es, para quién, las salidas comerciales, las cuatro apps y el recorrido sugerido.*

1. **Volver al catálogo de demos** (`/demo`).
2. **Solicitar demo guiada** (`/solicitar-demo?demos=delivery`, con esta demo ya elegida) y **Cotizar tu app de domicilios** (`/contact?service=app-delivery`, con «App de delivery» prellenado). Arriba, las insignias «Demo interactiva» y «Datos de ejemplo»; debajo del título, para quién es y por dónde empezar.
3. **Pestañas** de las cuatro apps (con flechas, Inicio y Fin del teclado también se cambia de app). El número en rojo es lo pendiente en cada una.
4. **Avance automático** y **Reiniciar demo**.
5. **Recorrido sugerido (0/5)**.
6. **Actividad entre apps**, con el reloj de la demo.

Entre el encabezado y las pestañas está el desplegable **Qué es real y qué es simulado**. Al final de la página está el cierre común de las demos (demo guiada, cotización y planes).

> **Sobre las fechas y las horas de las capturas.** La jornada de ejemplo es la de **hoy en Colombia** y empieza a las 7:05 p. m. (es el reloj de la demo, no la hora real). Las capturas son del 14 de octubre de 2026; otro día cambian la fecha de Operaciones, el nombre del CSV y las fechas de vencimiento de los documentos (los días que faltan son los mismos).

---

## Recorrido sugerido (demo comercial de 5 minutos)

El guion sigue la barra **Recorrido sugerido: un pedido de punta a punta** de la propia demo: cada paso se marca en verde solo cuando lo haces de verdad, y al pulsar un paso la demo te lleva a la app que corresponde. Empieza con los datos limpios: si alguien ya usó la demo en ese navegador, pulsa **Reiniciar demo** y confirma.

> **Cómo corre el tiempo.** El reloj de la demo avanza en tiempo real y **se adelanta** cuando algo tomaría minutos: al marcar «Listo para recoger» salta al final de la preparación elegida, al recoger salta hasta que el repartidor llega a la sede (si aún no ha llegado) y al confirmar la entrega salta lo que dura el trayecto. Cada salto queda escrito en la actividad («Reloj de la demo adelantado 20 min: terminó la preparación de P-1036») y el botón avisa antes cuántos minutos se adelantará. Mientras tanto, los pedidos de ejemplo que ya estaban en curso siguen su camino solos; si tocas uno de ellos (por ejemplo, lo marcas listo en Comercio o lo entregas como su repartidor), desde ahí lo sigues tú y ya no avanza solo. La sede tiene **45 segundos reales** para aceptar; si se pasan, el pedido queda «Sin respuesta · escalado a Operaciones», pero la sede todavía puede aceptarlo (y Operaciones también, en su nombre). Si prefieres no correr, activa **Avance automático**: tu pedido avanza un paso cada 4 segundos.

![Recorrido de la demo](images/doc/demos/delivery/recorrido.gif)

*Recorrido completo: pedido con un pago rechazado de prueba y luego aprobado, aceptación en la sede, asignación del repartidor, seguimiento con código, entrega y calificación.*

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Comercio (sede)
    participant O as Operaciones
    participant R as Repartidor
    C->>S: Pedido y pago simulado
    S->>S: Acepta (45 s) y fija el tiempo de preparación
    O->>R: Asigna al repartidor sugerido (oferta)
    R->>O: Acepta la oferta
    S->>R: Listo para recoger (el reloj salta al fin de la preparación)
    R->>C: Recogido: va en camino
    C->>R: Código de entrega de 4 dígitos
    R->>C: Entrega confirmada (el reloj suma el trayecto)
    C->>S: Calificación (llega a la sede y al repartidor)
```

*El mismo pedido pasa por las cuatro apps; cada flecha queda escrita en el panel «Actividad entre apps».*

### Paso 1. Cliente: pide y paga (simulado)

En **Cliente**, busca «ajiaco» y pulsa **+** en Ajiaco santafereño: se abre una ventana para personalizarlo (sin crema, sin alcaparras, con arroz blanco +$3.500). Agrega también dos Limonadas de coco desde la categoría **Bebidas** y pulsa **Ver carrito**. En el carrito elige una propina y el medio de pago.

![Paso 1: carrito](images/doc/demos/delivery/02-paso1-carrito.jpg)

*Carrito con Ajiaco (con arroz blanco) y dos limonadas: medios de pago y la casilla para probar un pago rechazado.*

1. **Medio de pago**: Nequi, Daviplata, PSE, tarjeta guardada, efectivo contraentrega (con «¿Con cuánto vas a pagar?» y el cambio que llevará el repartidor) o datáfono contraentrega. Todos los pagos son simulados.
2. **Probar un pago rechazado**: con un medio en línea, el banco «rechaza» el próximo pago (simulado).

Más abajo están **Usar 500 puntos (−$5.000)** (Mariana, la clienta de ejemplo, tiene 1.240), **Dividir la cuenta** entre 2, 3 o 4 personas y los totales: subtotal $56.200, domicilio $4.700 (según la distancia a la sede), propina $2.000 y total $62.900. Más arriba quedan la **Nota para la sede** y la **Propina** (sin propina, $2.000, $3.000 o $5.000; «el 100 % es para quien te lleva el pedido»).

Con la casilla marcada, **Pagar $62.900 (simulado)** muestra el rechazo y no crea el pedido:

![Paso 1: pago rechazado de prueba](images/doc/demos/delivery/02b-pago-rechazado.jpg)

*«El banco rechazó el pago con Nequi (simulado): fondos insuficientes. No se creó el pedido ni se cobró nada; vuelve a intentarlo o elige otro medio de pago.»*

1. El mensaje del rechazo. La casilla se desmarca sola: al pulsar **Pagar** otra vez, el pago se aprueba («Pago aprobado con Nequi (simulado) · pedido P-1036 enviado a la sede»). Con pago contraentrega el botón dice «Hacer pedido · pagas $… al recibir» y la casilla no aparece.

El seguimiento queda en «Esperando que la sede confirme», con la cuenta regresiva de la sede, **Ir a Comercio** y **Cancelar pedido**.

Qué decir: «El cliente pide en tu propio canal, con tus medios de pago, y la venta es tuya. Si el banco rechaza el pago, no hay pedido ni cobro».

### Paso 2. Comercio: acepta el pedido

Pulsa **Comercio** (o el paso 2 de la barra). La sede que atiende el pedido ya queda seleccionada.

![Paso 2: comercio](images/doc/demos/delivery/03-paso2-comercio.jpg)

*App de la Sede Chapinero con el pedido P-1036 por aceptar.*

1. **Tiempo de preparación**: 15, 20 o 30 minutos.

En la tarjeta están el número del pedido, la marca «Tuyo», los productos con sus opciones, la clienta, el total y el medio de pago, con **Responde en N s**. **Rechazar** pide el motivo (se agotó un producto, la cocina está llena, dirección fuera de cobertura o la sede está por cerrar); el cliente ve el motivo y «No se hizo ningún cobro (simulado)». **Aceptar** pasa el pedido a **En preparación** con su avance («0 de 20 min»).

Qué decir: «La sede tiene un tiempo límite; si no responde, Operaciones se entera de inmediato».

### Paso 3. Operaciones: asigna al repartidor más cercano

En **Operaciones**, busca tu pedido en la tabla **Despacho** (o en **Alertas**, donde sale como «sin repartidor») y pulsa **Asignar**.

![Paso 3: asignar repartidor](images/doc/demos/delivery/04-paso3-asignar.jpg)

*Ventana «Asignar P-1036 · Sede Chapinero» con los repartidores conectados ordenados por carga y distancia.*

- **Sugerido**: Camilo Rojas, en moto, a 1,1 km y ~6 minutos de la sede, libre («regla simple, no IA»). Primero van los libres y, entre ellos, el más cercano.
- **Asignar** envía la oferta: «Oferta de P-1036 enviada a Camilo Rojas. Mírala en la pestaña Repartidor». En Despacho el pedido queda «Oferta enviada».
- **Desconectados o suspendidos (no aparecen)**: cuántos repartidores no están disponibles.
- **Escape** o la **X** cierran la ventana; el foco vuelve al botón que la abrió.

### Paso 4. Repartidor: recoge y entrega con el código

En **Repartidor** aparece la oferta (sede de recogida, zona de entrega y lo que gana con el pedido). Pulsa **Aceptar**. Mientras la sede prepara, la tarea dice «La sede aún lo prepara»: vuelve a **Comercio** y pulsa **Listo para recoger**. Debajo del botón la demo avisa «al marcarlo listo el reloj se adelanta 20 min hasta el fin de la preparación elegida», y el aviso lo confirma («P-1036 listo para recoger · el reloj de la demo se adelantó 20 min»). Regresa a **Repartidor** y pulsa **Recogí el pedido** (si el repartidor aún no hubiera llegado a la sede, el reloj saltaría también esos minutos).

![Paso 4: tarea del repartidor](images/doc/demos/delivery/05-paso4-repartidor.jpg)

*Tarea actual de Camilo con el pedido en camino; a la derecha, la actividad con el salto del reloj y los pedidos de ejemplo que avanzaron solos en esos minutos.*

En la tarea están **Entrega a** (nombre y dirección), el **cobro** («Ya pagado con Nequi: no cobres nada»; en contraentrega dice cuánto cobrar, con cuánto paga y cuánto cambio llevar, o que se cobra con datáfono), **Chat** con el cliente, **Llamar** (llamada enmascarada simulada: explica el número puente y no llama) y **Confirmar entrega**, con el aviso «El trayecto toma ~11 min: al confirmar la entrega, el reloj de la demo se adelanta». Debajo están las **Indicaciones** por cuadras (con **Siguiente indicación**) y la **Ruta con varias paradas**.

Mientras tanto, el cliente ve su pedido en camino. Ábrelo en **Cliente** para mostrar el código:

![Paso 4: el cliente ve el pedido en camino](images/doc/demos/delivery/06-paso4-cliente-en-camino.jpg)

*Seguimiento del cliente: llegada estimada, código de entrega, mapa ilustrativo y la vista previa del WhatsApp con la misma hora.*

- **Llegada estimada** 7:36 p. m. (la salida de la sede más el trayecto) y «Prometido: antes de las 7:42 p. m.». La vista previa del WhatsApp dice la misma hora («llega aprox. a las 7:36 p. m.»).
- **Código de entrega** (`1905` en la prueba): el cliente se lo da al repartidor.
- **Chatear con el repartidor** y el botón verde para llamarlo. El chat se habilita cuando un repartidor acepta y se cierra al entregar.
- **Vista previa del WhatsApp que recibes**, con un enlace de seguimiento de ejemplo (`tu-dominio.com/seguimiento/P-1036`; en inglés, `your-domain.com/track/…`) y el código. Es simulado; **Copiar** copia el texto.

Vuelve a **Repartidor**, pulsa **Confirmar entrega** y escribe el código:

![Paso 4: confirmar entrega con el código](images/doc/demos/delivery/07-paso4-codigo.jpg)

*Ventana «Confirmar entrega de P-1036» con el código que dio el cliente.*

- **Código del cliente** o **Foto y firma** (la alternativa pide una foto y una firma con el dedo o el mouse; las dos quedan solo en el navegador).
- Si el código no coincide: «El código no coincide. Pídeselo de nuevo al cliente».
- La pista de la demo dice dónde encontrar el código (en los pedidos de ejemplo lo muestra directamente).
- **Confirmar entrega**: «Pedido P-1036 entregado · el reloj de la demo se adelantó 11 min (trayecto)».

Qué decir: «Sin código no hay entrega: se acaban los "yo no recibí nada"».

### Paso 5. Cliente: califica la entrega

En **Cliente** el pedido dice «¡Pedido entregado!» y «Entregado a las 7:36 p. m. · 31 min desde que lo pediste». Elige las estrellas, escribe un comentario opcional y pulsa **Enviar calificación**.

![Paso 5: recorrido completo](images/doc/demos/delivery/08-paso5-calificar.jpg)

*Recorrido completo (5/5) con la salida comercial y el pedido entregado.*

- **Recorrido sugerido (5/5)**: «¡Listo! Recorriste el pedido en las 4 apps. En Operaciones mira los tiempos por etapa y la comisión que no pagaste», con **Solicitar demo guiada** y **Cotizar tu app de domicilios**.
- **Gracias por calificar**: las estrellas y los puntos ganados («Ganaste 56 puntos con este pedido · ahora tienes 1.296»: 1 punto por cada $1.000 del subtotal).

Cierra en **Operaciones** con [Tiempos y zonas y la comisión que no pagaste](#operaciones).

---

## Pantallas y funciones

### Controles de la página

| Elemento | Qué hace |
|---|---|
| **Volver al catálogo de demos** | Vuelve a `/demo`. |
| **Solicitar demo guiada** / **Cotizar tu app de domicilios** | Abren `/solicitar-demo?demos=delivery` y `/contact?service=app-delivery`. También aparecen al terminar el recorrido. |
| **Qué es real y qué es simulado** | Desplegable: lo que se calcula de verdad, lo que sale de reglas (no IA), cómo corre el reloj, lo simulado y dónde se guarda lo que haces. |
| **Pestañas** Cliente, Comercio, Operaciones y Repartidor | Cambian de app (también con las flechas, Inicio y Fin). El número en rojo es lo pendiente en cada una: productos en el carrito, pedidos por aceptar, alertas y ofertas de pedido. Pulsar la pestaña activa lleva a la app (útil en el celular). |
| **Avance automático** | Simula a la sede, a operaciones y al repartidor: tu pedido más reciente avanza un paso cada 4 segundos (acepta con 15 min, asigna al sugerido, el repartidor acepta, queda listo, se recoge y se entrega con el código), con los mismos saltos del reloj. |
| **Reiniciar demo** | Pide confirmación y borra tus pedidos y cambios; vuelve la jornada de ejemplo de las 7:05 p. m. |
| **Recorrido sugerido** | Los 5 pasos, marcados según lo que hiciste; se oculta con **Ocultar** y se vuelve a abrir con **Ver recorrido sugerido (N/5)**. Si tu pedido se rechaza o se cancela, lo dice y te pide hacer otro. |
| **Actividad entre apps** | Lo que va pasando, en orden y con la hora del reloj de la demo, incluidos los saltos del reloj y lo que hacen solos los pedidos de ejemplo. |
| **Datos de ejemplo** | Insignia; al pasar el mouse dice que la marca, las sedes, los clientes, los repartidores y las cifras son ficticios, y que pagos, WhatsApp, llamadas, GPS y mapa son simulados. |

Las ventanas se cierran con **Escape**, mantienen el foco adentro mientras están abiertas y lo devuelven al control que las abrió. Cada acción muestra un aviso corto (abajo a la derecha; en el celular, arriba, para no tapar las ventanas ni «Ver carrito»). Si cambias de app con un botón de otra app (por ejemplo, **Ver su app** al final de Operaciones o **Ir a Comercio** en el seguimiento), la página sube hasta la app nueva.

### Cliente

Ver los pasos [1](#paso-1-cliente-pide-y-paga-simulado), [4](#paso-4-repartidor-recoge-y-entrega-con-el-código) y [5](#paso-5-cliente-califica-la-entrega). Además:

- **Entregar en**: direcciones guardadas (Casa y Oficina) y **Agregar una dirección** con la nomenclatura colombiana (tipo de vía, número, cruce, placa y complemento). La demo calcula qué sede la cubre (cobertura de 8 km) y el valor del domicilio; si ninguna sede abierta la cubre, lo dice y deja guardarla igual.
- **Te atiende la Sede…** con distancia, valor del domicilio y tiempo estimado; **Cambiar** muestra las tres sedes (cerrada, fuera de cobertura, disponible) y **Usar la más cercana**.
- **Club Fogón Demo**: **Activar** una prueba de 30 días (simulada) con domicilio gratis en pedidos desde $40.000; el carrito avisa cuánto falta para lograrlo.
- **Menú** con buscador y categorías (Platos fuertes, Sopas, Antojos, Bebidas, Postres), marcas «Popular» y «Agotado en esta sede».
- **Recargo por lluvia**: si Operaciones lo activa, el carrito suma $2.000 a los pedidos nuevos.
- **Mis pedidos**: los pedidos que hiciste en la demo con su estado.
- Si Operaciones bloquea la cuenta del cliente (revisión por reglas), el cliente no puede pedir hasta que la desbloqueen o se reinicie la demo.

### Comercio

![Menú de la sede](images/doc/demos/delivery/11-comercio-menu.jpg)

*Menú de la Sede Chapinero: cada plato se puede agotar desde la sede.*

- **Sede**: Chapinero, Usaquén o Cedritos (con el número de pedidos por aceptar), e interruptor **Abierta/Cerrada**. Una sede cerrada no recibe pedidos y al cliente se le ofrece otra.
- **Indicadores del día**: ventas, pedidos (y cuántos rechazados o cancelados), ticket promedio y hora pico, calculados con los pedidos de ejemplo y los tuyos (sin domicilio ni propina).
- **Pedidos por aceptar**, **En preparación** (con el repartidor que viene o «Sin repartidor: lo asigna Operaciones», y el aviso de cuántos minutos se adelantará el reloj al marcarlo listo) y **Listos para recoger**.
- **Menú de la sede**: **Agotar** y **Reactivar** cada plato; lo agotado aparece así en la app del Cliente para esa sede.
- **Ventas de hoy**: más vendidos, ventas por hora y calificación promedio con el número de opiniones.

### Operaciones

![Centro de operaciones](images/doc/demos/delivery/09-operaciones.jpg)

*Centro de operaciones después del recorrido: indicadores, mapa de la operación y alertas.*

- **Indicadores**: pedidos hoy, en curso, repartidores conectados (5/6), tiempo promedio de entrega, entregados a tiempo y ticket promedio, con la fecha de la jornada («Jornada de ejemplo de hoy (14 oct. 2026)»). «Todo se calcula con los pedidos de ejemplo de hoy y los que hagas en la demo».
- **Exportar pedidos (CSV)**: descarga `pedidos-fogon-demo-<fecha de hoy>.csv` (en inglés, `orders-fogon-demo-<fecha>.csv`, con los encabezados en inglés) con pedido, sede, zona, estado, horas, minutos, a tiempo, valores, medio de pago, repartidor y calificación.
- **Mapa de la operación**: sedes, repartidores conectados y destinos de los pedidos en curso, en un mapa ilustrativo de Bogotá (no a escala; posiciones simuladas, como dice la leyenda debajo del mapa).
- **Alertas**: la sede no respondió en 45 s (**Aceptar por la sede** o **Cancelar pedido**), pedido sin repartidor (**Asignar**), pedido tarde frente a lo prometido (**Avisar al cliente**, que escribe en el chat del pedido) y repartidor que rechazó (**Reasignar**). Cada una tiene **Detalle** con la línea de tiempo del pedido. Después del recorrido, el reloj adelantado deja ver alertas reales: el pedido de ejemplo que nadie asignó va tarde y el que nadie aceptó quedó escalado.
- **Despacho**: pedidos en curso con sede, estado, repartidor, entrega prometida y minutos de retraso; **Asignar**, **Reasignar** y el ojo para ver el detalle.
- **Lluvia en la ciudad**: **Recargo al cliente de $2.000** y **Bono al repartidor de $1.500**, para pedidos y ofertas nuevos.

![Tiempos, comisión y revisión por reglas](images/doc/demos/delivery/10-operaciones-reportes.jpg)

*Despacho, tiempos por etapa, pedidos por zona y comisión que no pagaste, después del recorrido.*

- **Tiempos y zonas**: minutos promedio por etapa (aceptación, preparación, espera del repartidor y trayecto) y pedidos por zona. Con el reloj que se adelanta, tu pedido suma tiempos reales (20 min de preparación, 11 de trayecto) y no baja los promedios.
- **Comisión que no pagaste hoy**: con una comisión de agregador del 25 % y $6.000 de costo por domicilio propio (los dos se pueden cambiar), compara la comisión evitada con el costo de tus domicilios y lo cobrado a los clientes. En la prueba: ahorro neto estimado de $393.625 sobre 31 pedidos entregados.
- **Revisión por reglas** («reglas configurables, no IA»): entrega confirmada a más de 300 m de la dirección, un mismo celular en 3 cuentas o más, y primer pedido contraentrega por más de $200.000. **Revisar** explica el riesgo y permite **Descartar (falsa alarma)**, **Bloquear cuenta** o, en la de GPS, **Suspender al repartidor**. Las cuentas bloqueadas se listan con **Desbloquear**.
- **Repartidores**: estado (libre, pedidos en curso, desconectado o suspendido) y entregas del día; **Ver su app** abre la app del Repartidor como esa persona.

### Repartidor

![Documentos del repartidor](images/doc/demos/delivery/12-repartidor-documentos.jpg)

*Calificaciones recientes y documentos de Camilo, con el SOAT por vencer en 12 días.*

- **Ver la app como**: cualquiera de los seis repartidores de ejemplo; interruptor **Conectado/Desconectado** (no deja desconectarse con pedidos u ofertas pendientes).
- **Ganancias de hoy** y **Calificación**. Pago de ejemplo por domicilio: $4.000 + $700 por km, más propina y bono.
- **Ofertas de pedido**: **Aceptar** o **Rechazar** con motivo (me queda muy lejos, no tengo espacio en el maletín, estoy terminando otro pedido); el rechazo vuelve a Operaciones como alerta.
- **Tarea actual**, **Indicaciones**, **Ruta con varias paradas** (orden por cercanía: «regla simple en la demo») y **Calificaciones recientes**. Ver el [paso 4](#paso-4-repartidor-recoge-y-entrega-con-el-código).
- **Documentos del repartidor**: cédula, licencia, SOAT, técnico-mecánica, tarjeta de propiedad y planilla de seguridad social, con vencimientos frente a la fecha de hoy (avisa con 15 días o menos). **Actualizar** pide el archivo y una nueva fecha posterior a hoy; el archivo no sale del navegador (solo se guarda su nombre).

### En el celular

![Vista móvil](images/doc/demos/delivery/13-movil.jpg)

*La demo en un teléfono (390 px): encabezado con las salidas, pestañas en dos filas y el recorrido.*

En el teléfono cada app ocupa el ancho de la pantalla y crece con su contenido (sin el marco de celular ni un desplazamiento propio), las ventanas suben desde abajo y quedan a la vista (los avisos salen arriba, para no taparlas), la tabla de Despacho se desplaza de lado, los pasos del recorrido se desplazan de lado y el panel de actividad queda debajo de la app. La página no se desborda a lo ancho, en claro ni en oscuro.

---

## Qué es real y qué es simulado

| Parte | Real o simulado | Detalle |
|---|---|---|
| Marca, sedes, menú, clientes, repartidores y la jornada de pedidos | **Datos de ejemplo** | Fogón Demo y su jornada son ficticios; se generan siempre iguales y la fecha es la de hoy en Colombia. |
| Paso del pedido entre las 4 apps, estados, tiempos y código de entrega | **Real (en el navegador)** | Un solo estado compartido; cada acción se registra en «Actividad entre apps». |
| Reloj de la demo | **Real (en el navegador)** | Empieza a las 7:05 p. m., avanza en tiempo real y se adelanta al terminar la preparación, al llegar el repartidor a la sede y al entregar; los pedidos de ejemplo en curso avanzan solos con él. |
| Precios, domicilio por distancia, propina, puntos, división de la cuenta y recargo por lluvia | **Real (cálculo)** | Distancias aproximadas por cuadras con la nomenclatura. |
| Indicadores, tiempos por etapa, pedidos por zona, comisión evitada y CSV | **Real (cálculo)** | Salen de los pedidos de ejemplo más los tuyos. |
| Sugerencia de repartidor, ruta con varias paradas y revisión por reglas | **Reglas, no IA** | Lo dicen las propias pantallas. |
| Pagos (Nequi, Daviplata, PSE, tarjeta) | **Simulado** | Se aprueban, salvo que marques «Probar un pago rechazado»; no se cobra nada. |
| WhatsApp al cliente y llamada enmascarada | **Simulado** | Vista previa y ventana explicativa; no se envía ni se llama. |
| Mapa, posición del repartidor e indicaciones | **Simulado** | Mapa ilustrativo, no a escala; el recorrido en el mapa se ve acelerado. |
| Foto, firma y documentos del repartidor | **Solo en el navegador** | No se suben a ningún servidor. |
| Dónde se guardan tus cambios | **Solo en este navegador** | `localStorage`; no llegan a un servidor ni los ven otras personas. **Reiniciar demo** los borra. |

```mermaid
stateDiagram-v2
    state "Por confirmar" as PEN
    state "En preparación" as PRE
    state "Listo para recoger" as LIS
    state "En camino" as CAM
    state "Entregado" as ENT
    state "Rechazado" as REC
    state "Cancelado" as CAN
    [*] --> PEN: Pedido del cliente (pago aprobado o contraentrega)
    PEN --> PRE: Acepta la sede u Operaciones
    PEN --> REC: La sede rechaza con motivo
    PEN --> CAN: Cancela el cliente u Operaciones
    PRE --> LIS: Listo para recoger (reloj al fin de la preparación)
    LIS --> CAM: El repartidor lo recoge
    CAM --> ENT: Código o foto y firma (reloj + trayecto)
    ENT --> [*]
    REC --> [*]
    CAN --> [*]
```

*Estados de un pedido en la demo. Un pago rechazado no crea pedido. La asignación del repartidor (oferta enviada, aceptada o rechazada) corre en paralelo mientras el pedido se prepara.*

---

## Acceso

**Cómo lo ve un visitante.** La demo aparece en `/demo` con la insignia «Requiere acceso» y los botones **Solicitar acceso** y **Ya tengo acceso: iniciar sesión**. Si alguien abre `/demo/delivery` sin sesión, la web muestra en la misma dirección la pantalla de acceso:

![Pantalla de acceso para visitantes](images/doc/demos/delivery/01-acceso-visitante.jpg)

*Lo que ve un visitante sin sesión: «Requiere acceso», «Sin sesión» y los botones para pedir la demo o iniciar sesión. Debajo, una vista previa con el texto del catálogo.*

- **Solicitar acceso** abre `/solicitar-demo?demos=delivery` con la app de domicilios ya elegida.
- **Ya tengo acceso: iniciar sesión** lleva a `/login` y, al entrar, vuelve a la demo.
- **Ver todas las demos** vuelve a `/demo`.
- Con sesión pero sin acceso, la misma pantalla dice que la cuenta todavía no tiene acceso; si el acceso venció o fue retirado, ofrece pedir más tiempo o solicitarlo de nuevo.

**Cómo se concede.** La solicitud llega a **Admin › Solicitudes de demo**. Pueden aprobarla los roles **admin** y **sales**. Al aprobar, se crea o se reutiliza la cuenta del prospecto, el acceso dura 14 días por defecto (se extiende o se revoca en **Admin › Accesos a demos**) y la persona recibe un correo con la decisión (con el enlace de activación si su cuenta es nueva). El equipo de KopTup (admin, manager, sales y developer) abre la demo sin solicitud. Solo el admin cambia el modo de acceso, en **Admin › Catálogo de demos**. Detalle en el [Manual del administrador](Doc-06-Manual-del-Administrador.md) y en [Flujos del visitante](Doc-04-Flujos-del-Visitante.md).

```mermaid
flowchart LR
    V["Visitante abre /demo/delivery"] --> S{"¿Sesión con acceso?"}
    S -- "Equipo KopTup o acceso vigente" --> D["Demo completa"]
    S -- "No" --> P["Pantalla Requiere acceso"]
    P --> F["/solicitar-demo?demos=delivery"]
    F --> AD["Admin: Solicitudes de demo"]
    AD -- "Aprueba (admin o sales)" --> E["Correo con acceso por 14 días"]
    E --> M["Portal: Mis demos"]
    M --> D
```

*Camino de un visitante hasta la demo.*

---

## Limitaciones conocidas

1. **La vista previa del catálogo todavía promete de más.** La tarjeta del hub y la pantalla de acceso (textos compartidos del catálogo, fuera de la demo) hablan de «routing ML», «tracking en vivo + ETA ML», «pricing dinámico (surge)», «suscripción membership» y «KYC drivers». La demo sugiere repartidores y ordena paradas con reglas simples, el mapa y la posición son simulados, el único recargo es el fijo por lluvia, el club es una prueba simulada y los documentos del repartidor se revisan por fecha de vencimiento. El texto corregido (ES y EN) quedó pedido para el catálogo.
2. **Los cambios viven solo en el navegador.** Si el prospecto cambia de equipo o borra los datos del sitio, vuelve a la jornada de ejemplo; no hay espacio compartido con el vendedor.
3. **En el escritorio cada app vive en un marco de celular de 680 px** con su propio desplazamiento (es la maqueta del teléfono); en un celular real la app ocupa la pantalla sin marco.
4. **Los 45 segundos de la sede son reales.** Si se pasan, el pedido queda escalado: se puede aceptar igual desde Comercio u Operaciones, o usar el Avance automático.
5. **El reloj se adelanta para toda la jornada.** Al saltar, los pedidos de ejemplo que esperan una acción (el que nadie aceptó, el que nadie asignó) también envejecen y aparecen como escalados o tarde en Operaciones; es lo que pasaría en una operación real, pero en una demo larga se acumulan alertas. **Reiniciar demo** vuelve a las 7:05 p. m.
