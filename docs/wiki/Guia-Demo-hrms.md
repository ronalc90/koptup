# Guía de la demo: Gestión Humana y Nómina

> Ruta `/demo/hrms` · Modo de acceso: **Con solicitud** · Tipo: **datos de ejemplo** en el navegador, con **IA real** solo en el asistente de políticas (llama al servidor, con tope de gasto mensual) · Plan del producto: [HRMS](Producto-hrms.md)

**Resumen.** Es el sistema de gestión humana de una empresa ficticia de alimentos, Alimentos Valdeora S.A.S. (planta en Funza, oficina en Bogotá y centro de distribución en Medellín, 186 colaboradores). Muestra el expediente digital, las vacaciones en días hábiles con festivos de Colombia, la selección con puntaje por reglas, los ingresos y retiros con lista de chequeo, la evaluación de desempeño, la nómina quincenal colombiana con aportes, provisiones y asiento contable, la formación obligatoria y una app del colaborador con un asistente que responde con IA a partir del reglamento. Está pensada para gerentes de gestión humana, jefes de nómina y dueños de pymes con personal operativo; se abre solo con un acceso aprobado. Al entrar, el encabezado dice qué es y para quién, y un **recorrido sugerido de 5 pasos** lleva por el ciclo completo y se marca solo a medida que lo haces.

**En esta página:** [Recorrido sugerido](#recorrido-sugerido-demo-comercial-de-5-minutos) · [Pantallas y funciones](#pantallas-y-funciones) · [Qué es real y qué es simulado](#qué-es-real-y-qué-es-simulado) · [Acceso](#acceso) · [Limitaciones conocidas](#limitaciones-conocidas)

![Vista general](images/doc/demos/hrms/00-general.jpg)

*Lo primero que ve una cuenta con acceso: el encabezado con qué es, para quién y las salidas, y debajo el recorrido sugerido.*

1. **Volver al catálogo de demos** (`/demo`).
2. **Datos de ejemplo**: al pasar el mouse dice que la empresa, las personas, el NIT, las entidades y las cifras son inventados. Debajo del título, una línea dice para quién es («gerentes de gestión humana, jefes de nómina y dueños de pymes con personal operativo») y que todo corre en el navegador salvo el asistente, que usa IA real.
3. **Solicitar demo guiada** (`/solicitar-demo?demos=hrms`, con esta demo ya elegida) y **Cotizar este sistema** (`/contact?service=hrms`, con «HRMS» prellenado).
4. **Ver app del colaborador** y **Restablecer datos**, con la empresa, su NIT y la fecha de los datos.
5. **Recorrido sugerido: el ciclo completo en 5 pasos**: pedir vacaciones desde la app, aprobarlas, contratar, liquidar y pagar la quincena y preguntarle al asistente. Cada tarjeta tiene su botón (abre la app en la pantalla correcta o cambia de pestaña), se marca «Hecho» sola y arriba lleva la cuenta «n de 5 hechos». **Ocultar** lo pliega (el navegador lo recuerda). En el celular cada paso muestra solo el título y el botón.

Al final de la página está el cierre común de las demos (demo guiada, cotización y planes).

> **Sobre las cifras y las capturas.** Los datos se generan con la fecha del día en que abres la demo («Datos al 14 de octubre de 2026» en esta guía), así que las fechas, los vencimientos y algunas cifras cambian según el día. El texto de la respuesta del asistente lo produjo el modelo simulado del entorno de pruebas (por eso empieza con «Respuesta simulada (mock de OpenAI)…»); con la clave real del proveedor lo redacta el modelo. La búsqueda en el reglamento y las fuentes citadas sí son el comportamiento real del servidor.

---

## Recorrido sugerido (demo comercial de 5 minutos)

El guion muestra el ciclo completo: el colaborador pide algo desde su celular, Gestión Humana lo aprueba, se contrata a alguien nuevo, se liquida y se paga la quincena y, al final, el colaborador consulta su desprendible y le pregunta al asistente. Es el mismo orden del **recorrido sugerido** que la demo muestra arriba (los pasos 2 a 6 de esta guía son sus 5 tarjetas), así que el prospecto puede seguirlo solo. Empieza con los datos limpios: si alguien ya usó la demo en ese navegador, pulsa **Restablecer datos** (arriba a la derecha) y confirma; el recorrido vuelve a «0 de 5 hechos».

![Recorrido de la demo](images/doc/demos/hrms/recorrido.gif)

*Recorrido completo en 11 cuadros: vista general, solicitud desde la app, aprobación, contratación, lista de chequeo del ingreso, nómina, pago, siguiente quincena, desprendible, asistente y recorrido completo.*

```mermaid
flowchart LR
    APP["App del colaborador: pide vacaciones"] --> PEN["Solicitud pendiente"]
    PEN --> APR["Gestión Humana aprueba o rechaza"]
    APR --> SAL["Saldo de vacaciones y calendario"]
    CAN["Candidato en Oferta"] --> CON["Contratado"]
    CON --> ING["Proceso de ingreso (8 tareas)"]
    ING --> DIR["Activo en el directorio"]
    DIR --> NOM["Nómina de la quincena"]
    NOV["Novedades: horas extra y comisiones"] --> NOM
    NOM --> LIQ["Liquidar, aprobar y pagar"]
    LIQ --> DES["Desprendible en la app"]
    LIQ --> ASI["Asiento contable y archivo de dispersión"]
    LIQ --> SIG["Siguiente quincena"]
```

*Cómo se conectan las pestañas: cada flecha es algo que la demo hace por ti al registrar la operación.*

### Paso 1. Inicio: indicadores y alertas de cumplimiento

En la pestaña **Inicio** abre el grupo **Contratos que vencen en los próximos 30 días** (botón **Ver**).

![Paso 1: Inicio con las alertas abiertas](images/doc/demos/hrms/02-paso1-inicio.jpg)

*Indicadores del mes y las seis personas con contrato a término fijo que vence en los próximos 30 días.*

1. **Indicadores**: colaboradores activos (186: Bogotá 24, Funza 143, Medellín 19), rotación de 12 meses (11,8 %, 22 retiros), ausentismo de 30 días (2,3 %, 88 días hábiles perdidos), costo de nómina del mes ($ 713,6 M), vacantes abiertas (14 en 4 procesos) y eNPS (+32 con 142 respuestas). Las tarjetas de personas, ausentismo, costo y vacantes llevan a su pestaña.
2. **Alertas de cumplimiento laboral**: contratos por vencer, periodos de prueba que terminan en 15 días, personas con 30 o más días hábiles de vacaciones acumuladas y exámenes médicos ocupacionales vencidos o por vencer. Cada grupo se abre con **Ver** y muestra cuántos casos hay.
3. **Renovar**: extiende el contrato por su mismo plazo y avisa «Contrato de … renovado por N meses más». La persona sale de la alerta.
4. **Preaviso de no renovación**: registra el preaviso (envío simulado) y crea el proceso de retiro en **Selección › Ingresos y retiros**.
5. **Solicitudes por aprobar**: las cuatro más próximas, con **Aprobar** y **Rechazar** ahí mismo, y **Ver todas**.

Más abajo están las **Próximas fechas de pago y reporte** (planilla de aportes, nómina electrónica, prima, dotación, intereses y consignación de cesantías, con «en N días»), los **Próximos cumpleaños** y el **Clima laboral**.

Qué decir: «El sistema le avisa a Gestión Humana lo que vence antes de que sea un problema legal».

### Paso 2. App del colaborador: pedir vacaciones desde el celular

Pulsa **Abrir la app** en el paso 1 del recorrido (o **Ver app del colaborador** arriba y luego **Solicitar vacaciones**). Se abre la app de ejemplo de **Camila Rojas Parra**, operaria de empaque en Funza, directo en **Solicitar vacaciones**.

![Paso 2: solicitud de vacaciones en la app](images/doc/demos/hrms/03-paso2-app.jpg)

*La app muestra el saldo y calcula la fecha de regreso en días hábiles.*

1. **Saldo**: causados 42, tomados 30, disponibles 12 días hábiles.
2. **Desde**: viene propuesto el primer día hábil después de dos semanas (29 de octubre en la prueba).
3. **Días hábiles**: en la prueba, 3. La app dice «Del 29 de oct de 2026 al 3 de nov de 2026; regresa el 4 de nov de 2026» (el lunes 2 de noviembre es festivo y no cuenta) y recuerda que se cuentan días de lunes a viernes sin festivos de Colombia.
4. **Enviar solicitud**: avisa «Solicitud de Camila Rojas Parra enviada para aprobación» y pasa a **Mis solicitudes**, donde aparece como **Pendiente**. La app se cierra con la X o con Escape, y el foco vuelve al botón que la abrió.

La app no deja enviar si la fecha es anterior a hoy, si los días no están entre 1 y 30, si superan el saldo disponible (que ya descuenta las solicitudes pendientes) o si se cruzan con otra ausencia aprobada o pendiente («Ya hay una ausencia aprobada o pendiente que se cruza con esas fechas»). Si eliges un sábado, un domingo o un festivo, las vacaciones empiezan el siguiente día hábil: desde el sábado 31 de octubre de 2026, por ejemplo, la app dice «Del 3 de nov de 2026 al 4 de nov de 2026; regresa el 5 de nov de 2026» (el lunes 2 es festivo). La misma validación aplica cuando Gestión Humana registra una ausencia.

### Paso 3. Gestión Humana aprueba la solicitud

Cierra la app y pulsa **Ir a Vacaciones** en el paso 2 del recorrido (o la pestaña **Vacaciones y ausencias**). El contador de la pestaña sube a 6.

![Paso 3: aprobar la solicitud que llegó desde la app](images/doc/demos/hrms/04-paso3-aprobar.jpg)

*La solicitud de Camila aparece con la marca «desde la app» y el saldo que le quedará.*

1. **Pendientes (6)**: filtros por estado (pendientes, aprobadas, rechazadas, todas) y por tipo de ausencia.
2. **La solicitud**: tipo y días, fechas, «· desde la app» y «Saldo actual 12 → 9 días si se aprueba».
3. **Aprobar**: avisa «Vacaciones de Camila Rojas Parra aprobadas. Nuevo saldo: 9 días hábiles». El saldo, el calendario y la app de Camila se actualizan.
4. **Rechazar**: pide un motivo (temporada alta de producción, cruce con otras ausencias, saldo insuficiente u otro). «El colaborador verá el motivo en su app y su saldo no cambia»: en **Mis solicitudes** la solicitud aparece como **Rechazada** con «Motivo: Temporada alta de producción».
5. **Registrar ausencia**: Gestión Humana registra vacaciones, permisos, licencias no remuneradas o incapacidades (estas quedan aprobadas de inmediato).

![Motivo del rechazo en la app](images/doc/demos/hrms/17-app-motivo-rechazo.jpg)

*Mis solicitudes en la app de Camila: la solicitud rechazada con su motivo (1) y la aprobada (2).*

Qué decir: «Nadie llena un formato en papel: el colaborador pide desde el celular y el jefe aprueba con un clic, con el saldo a la vista».

### Paso 4. Selección: contratar desde la oferta

Pulsa **Ir a Selección** en el paso 3 del recorrido (o la pestaña **Selección**). Arriba están las cuatro vacantes con sus cupos; debajo, los candidatos por etapa.

![Paso 4: candidatos por etapa](images/doc/demos/hrms/05-paso4-seleccion.jpg)

*Vacantes y candidatos en cinco columnas: Postulados, Filtro, Entrevista, Oferta y Contratados.*

1. **Vacante**: «Analista de costos · Bogotá · 0 de 1 cupo cubierto». Un clic filtra los candidatos de esa vacante.
2. **Candidato**: Diego González Moreno, con puntaje de ajuste **100** (verde alto, ámbar medio, gris bajo).
3. **Avanzar**: lo pasa a la siguiente etapa. Desde **Oferta** pasa a **Contratados** y avisa «Diego González Moreno contratado(a): se creó su proceso de ingreso».
4. **Hoja de vida**: muestra cómo se calculó el puntaje (experiencia 40/40 con 6 años frente a un mínimo de 3; formación 25/25; disponibilidad para turnos 20/20, «no se exige»; distancia 15/15 a 8 km), permite **Mover a…** cualquier etapa, **Descartar** y **Descargar hoja de vida (PDF)**.
5. **Agregar candidato**: nombre, vacante, celular, fuente, formación, años de experiencia, distancia y turnos; entra a Postulados con su puntaje.

El puntaje «se calcula con reglas transparentes: experiencia (40), formación (25), disponibilidad para turnos (20) y distancia a la sede (15). No es IA».

Baja a **Ingresos y retiros**: aparece el proceso de ingreso de Diego.

![Paso 4: lista de chequeo del ingreso](images/doc/demos/hrms/06-seleccion-ingreso.jpg)

*El proceso de ingreso de Diego con cuatro de ocho tareas hechas.*

1. **Proceso de ingreso**: «Analista de costos · Bogotá · ingresa el 28 de oct de 2026 (en 14 días)».
2. **Avance**: porcentaje de tareas hechas (50 % en la captura).
3. **Contrato firmado**: la primera tarea dice «Enviar contrato a firma electrónica»; al marcarla avisa «Contrato de … firmado electrónicamente (simulado)» y la insignia pasa a «Contrato firmado».
4. **Tareas pendientes**: afiliaciones a ARL («obligatoria antes del primer día de trabajo»), EPS, pensión y caja, examen médico de ingreso, dotación y elementos de protección e inducción SG-SST. Cada clic marca o desmarca.
5. **Activar colaborador**: se habilita con las 8 tareas; avisa «Diego González Moreno ya aparece en el directorio; entra a la nómina desde su fecha de ingreso (28 de oct de 2026)». En **Personas** el total pasa a 187; su perfil dice «Antigüedad: Ingresa el 28 de oct de 2026» y su jefe inmediato es el mismo de quienes ya tienen su cargo (para el analista de costos, Ricardo Salazar Pineda, director financiero). En **Formación** recibe los cursos obligatorios de su cargo (a Diego le llegan inducción SG-SST, prevención del acoso laboral, SAGRILAFT y protección de datos: la inducción pasa a contar 187 personas). Entra en la nómina desde la quincena en la que ingresa.

Qué decir: «Del candidato al primer día sin hojas de cálculo: el puntaje es explicable y el ingreso tiene su lista de chequeo legal».

### Paso 5. Nómina: novedades, liquidación, aprobación y pago

Pulsa **Ir a Nómina** en el paso 4 del recorrido (o la pestaña **Nómina**). La quincena en curso es la «1.ª quincena de octubre de 2026 (del 1 al 15)», con pago el 15 de octubre para 186 colaboradores (Diego no entra porque ingresa después del 15). En **Novedades de la quincena** escribe «javier garcia» en **Buscar por nombre o cédula** (sin tildes también sirve; con un solo resultado lo elige solo), deja **Hora extra diurna (+25 %)**, 6 horas, y pulsa **Agregar** («Novedad agregada a Javier García Quintero: $ 149.643»).

![Paso 5: nómina de la quincena](images/doc/demos/hrms/07-paso5-nomina.jpg)

*Encabezado de la quincena, sus cuatro estados, los seis totales y el formulario de novedades.*

1. **Liquidar quincena**: avisa «Quincena liquidada: 186 colaboradores, neto a pagar $ 240.832.219». Luego aparecen **Volver a borrador** y **Aprobar nómina**; después de aprobar, **Pagar: descargar archivo de dispersión**, que descarga `dispersion-2026-10-Q1.csv` y deja la insignia **Pagada**.
2. **Estados**: Novedades → Liquidada → Aprobada → Pagada.
3. **Totales**: devengado ($ 262,2 M), deducciones ($ 21,3 M), neto ($ 240,8 M), aportes del empleador ($ 44,7 M), provisiones ($ 55,1 M) y **costo total de la quincena** ($ 361,9 M).
4. **Novedades**: buscador por nombre o cédula, colaborador (solo quienes trabajan en esa quincena y no son aprendices), tipo (hora extra diurna o nocturna, recargo nocturno, recargo dominical o festivo, o comisión en pesos) y cantidad. El valor usa el valor hora (salario ÷ 210). Al liquidar, el formulario se bloquea hasta volver a borrador.

Debajo están el **Resumen por concepto** (con la comprobación «devengado − deducciones = neto»), el **Detalle por colaborador** (con buscador por nombre o cédula, sin importar tildes, **Desprendible** en PDF cuando la quincena está liquidada y exportación CSV) y el **Asiento contable de la quincena** con cuentas del PUC («Débitos = créditos: el asiento cuadra»; en la prueba, sumas iguales de $ 361.929.933), que se descarga en CSV.

**Siguiente quincena.** Ya pagada, la quincena muestra **Abrir la siguiente quincena** y explica cuál es. Al pulsarlo avisa «Se abrió la 2.ª quincena de octubre de 2026 (del 16 al 31): empieza sin novedades», vuelve a **Novedades** y suma la pagada a **Quincenas pagadas en la demo** («186 colaboradores · neto $ 240.832.219 · costo total $ 361.929.933»). La nueva quincena tiene 187 colaboradores: Diego entra con los días que trabaja desde su ingreso. Así el ciclo se puede repetir sin restablecer los datos; de la 2.ª quincena se pasa a la 1.ª del mes siguiente.

![Siguiente quincena abierta](images/doc/demos/hrms/15-nomina-siguiente-quincena.jpg)

*La 2.ª quincena de octubre recién abierta (1), el historial con la quincena pagada (2) y el ciclo que vuelve a empezar en Liquidar quincena (3).*

```mermaid
stateDiagram-v2
    state "Novedades (borrador)" as B
    state "Liquidada" as L
    state "Aprobada" as A
    state "Pagada" as P
    [*] --> B
    B --> L: Liquidar quincena
    L --> B: Volver a borrador
    L --> A: Aprobar nómina
    A --> P: Pagar (descarga el archivo de dispersión)
    P --> B: Abrir la siguiente quincena (sin novedades)
```

*Estados de la quincena. Solo en borrador se pueden agregar o quitar novedades; una quincena pagada pasa al historial y se abre la siguiente.*

Qué decir: «La nómina cuadra sola: cada total es la suma de las filas, y el asiento contable sale listo para el software contable».

### Paso 6. El colaborador ve su desprendible y le pregunta al asistente

Vuelve a **Ver app del colaborador**. En **Mi desprendible** aparece la última quincena pagada: la actual («Quincena actual, ya pagada.») o, si ya abriste la siguiente, la que pagaste («1.ª quincena de octubre de 2026 (del 1 al 15)»: devengado $ 1.142.881, deducciones $ 81.466, neto $ 1.061.415 en la prueba), con **Descargar PDF**. Antes del primer pago, la app muestra la quincena anterior.

Luego abre **Pregúntale a Gestión Humana** (o pulsa **Abrir el asistente** en el paso 5 del recorrido) y toca la sugerencia «¿Cuántos días de licencia de luto tengo?». Con la respuesta, el recorrido llega a «5 de 5 hechos» y muestra el cierre «Recorriste el ciclo completo. ¿Quieres verlo con los cargos, sedes y reglas de tu empresa?» con **Solicitar demo guiada** y **Cotizar este sistema**.

![Paso 6: asistente de políticas con IA](images/doc/demos/hrms/08-paso6-asistente.jpg)

*La pregunta, la respuesta, sus fuentes y el aviso de cómo se generó.*

1. **Tu pregunta**. También hay sugerencias: días de vacaciones, anticipación para pedirlas, licencia de luto y fechas de pago de nómina. Se puede escribir hasta 300 caracteres.
2. **Respuesta**: el servidor busca en los cinco documentos de ejemplo (capítulos de vacaciones, permisos y licencias, y jornada y horas extra del reglamento, y las políticas de certificados y de beneficios) y responde citando la fuente. El artículo encontrado en la prueba fue el 40: «Licencia de luto: cinco (5) días hábiles remunerados… (Ley 1280 de 2009)».
3. **Fuentes (5)**: al abrirlo muestra los fragmentos usados, con el nombre del documento.
4. **Cómo se generó**: «Respuesta generada con IA (modelo) a partir de los documentos». Si no la redactó el modelo, dice por qué: el servidor no tiene clave del proveedor, se agotó el cupo mensual de IA de la demo, no se pudo verificar el cupo o el proveedor no respondió; en esos casos muestra los fragmentos encontrados.
5. **Escribe tu pregunta**.

Qué decir: «Las preguntas repetidas a Gestión Humana las responde el asistente, con el artículo del reglamento como respaldo».

![Recorrido completo](images/doc/demos/hrms/16-recorrido-completo.jpg)

*Los cinco pasos marcados (1) y el cierre con la demo guiada y la cotización (2).*

---

## Pantallas y funciones

### Encabezado

| Elemento | Qué hace |
|---|---|
| **Volver al catálogo de demos** | Lleva a `/demo`. |
| **Datos de ejemplo** | Insignia; al pasar el mouse dice que la empresa, las personas, el NIT, las entidades y las cifras son inventados. |
| **Para quién** | Línea bajo el título: gerentes de gestión humana, jefes de nómina y dueños de pymes con personal operativo; todo corre en el navegador y solo el asistente usa IA real. |
| **Solicitar demo guiada** y **Cotizar este sistema** | Abren `/solicitar-demo?demos=hrms` y `/contact?service=hrms`. |
| **Ver app del colaborador** | Abre la app de ejemplo de Camila Rojas Parra en un marco de celular (ver [App del colaborador](#app-del-colaborador)). |
| **Restablecer datos** | Pide confirmación, borra los cambios de este navegador y genera los datos de nuevo con la fecha de hoy. |
| **Empresa y fecha** | «Alimentos Valdeora S.A.S. · NIT 901.738.264-4» y «Datos al …». |
| **Recorrido sugerido** | Cinco pasos con su botón, que se marcan solos; **Ocultar** / **Mostrar pasos**. Ver la [vista general](#guía-de-la-demo-gestión-humana-y-nómina). |
| **Pestañas** | Inicio, Personas, Vacaciones y ausencias (con el número de pendientes), Selección, Desempeño, Nómina y Formación. Se desplazan de lado en el celular y con el teclado se recorren con las flechas, Inicio y Fin. |

### Inicio

Ver el [paso 1](#paso-1-inicio-indicadores-y-alertas-de-cumplimiento). Además:

- **Solicitudes por aprobar**: las cuatro más próximas y «y N más en Vacaciones y ausencias».
- **Programar vacaciones** (en la alerta de vacaciones acumuladas) abre el formulario de ausencia para esa persona; **Programar examen** marca el examen para dentro de 7 días («aviso simulado») y deja la insignia «Programado para el …».
- **Próximos cumpleaños**: hoy y los próximos 14 días; cada nombre abre el perfil.
- **Clima laboral**: resultado de la última encuesta de pulso (en la prueba, eNPS +32 con 142 de 186 respuestas), la barra de promotores, neutros y detractores y la evolución del eNPS. **Lanzar encuesta** elige la pregunta (eNPS, carga de trabajo o seguridad) y el público (toda la empresa o una sede); el envío es simulado y **Simular respuestas** cierra la encuesta con respuestas generadas para ver cómo cambia el indicador.

### Personas

![Perfil de una colaboradora](images/doc/demos/hrms/09-personas-perfil.jpg)

*Directorio filtrado por «Camila Rojas» y su perfil abierto en el panel lateral.*

- **Directorio**: buscador por nombre, cédula o cargo; filtros por área, sede y tipo de contrato; **Incluir retirados**; **Exportar CSV**. Muestra 12 tarjetas por página con cargo, área, sede, contrato, fecha de ingreso, jefe inmediato y la marca «Ausente hoy» cuando aplica.
- **Organigrama**: se arma con el jefe inmediato de cada persona (gerente general y cinco directores o jefes). Cada nivel se despliega y **Equipo (N)** filtra el directorio por ese equipo.
- **Perfil** (panel lateral, numerado en la captura):
  1. **Certificado laboral (PDF)**, con o sin salario (descarga `certificado-laboral-<nombre>.pdf`, marcado como documento de ejemplo).
  2. **Registrar ausencia** para esa persona.
  3. **Registrar retiro**: motivo (renuncia, vencimiento del plazo, despido sin justa causa o mutuo acuerdo) y último día. Crea el proceso de retiro con la liquidación estimada.
  - Además: datos personales, contrato y cargo (antigüedad, periodo de prueba, jornada, jefe inmediato), compensación (salario, auxilio de transporte, cuenta de nómina enmascarada), seguridad social (EPS, fondo, ARL con clase de riesgo, caja), vacaciones (causados, tomados y saldo, con sus solicitudes), documentos del expediente en PDF (resumen del contrato, afiliaciones y concepto del examen médico), desempeño y formación asignada.

### Vacaciones y ausencias

Ver el [paso 3](#paso-3-gestión-humana-aprueba-la-solicitud). Además de las solicitudes:

- **Calendario** mensual con el número de personas ausentes por día y los festivos nacionales en rojo (por ejemplo, el 12 de octubre de 2026). Al elegir un día lista quién está ausente, por qué y hasta cuándo. Se navega mes a mes.
- **Saldos de vacaciones**: causados, tomados y saldo por persona, de mayor a menor, con buscador (sin importar tildes: «garcia» encuentra «García»), paginación y CSV (con coma decimal en español, como la espera Excel en Colombia). Regla: «15 días hábiles por año de servicio, proporcionales desde la fecha de ingreso. Saldo = causados − tomados». Los aprendices no acumulan vacaciones en la demo.

### Selección

Ver el [paso 4](#paso-4-selección-contratar-desde-la-oferta). Además:

- **Ver descartados (N)** muestra los candidatos descartados con **Devolver al proceso** (en la tarjeta y en su hoja de vida): el candidato vuelve a la etapa en la que estaba («Wilson Duarte Herrera volvió al proceso en Postulados»). **Ver activos** regresa a la vista normal.

![Candidatos descartados](images/doc/demos/hrms/14-seleccion-descartados.jpg)

*Vista de descartados (1): el candidato (2) y su botón para devolverlo al proceso (3).*
- Si una vacante ya tiene todos sus cupos, no deja contratar más: «Esta vacante ya tiene todos sus cupos cubiertos».
- **Ingresos y retiros** alterna entre **Ingresos** y **Retiros** y tiene **Ver procesos cerrados**. Un retiro trae su lista de chequeo (carta o preaviso, liquidación aprobada, paz y salvo, examen de egreso, **Generar certificado laboral (PDF)** y retiro de seguridad social) y la **Liquidación estimada**: salario y auxilio pendientes, cesantías, intereses, prima proporcional, vacaciones no disfrutadas e indemnización, con la nota «Cálculo simplificado de ejemplo». La indemnización solo aparece en el despido sin justa causa y depende del contrato (art. 64 del C.S.T.): en contrato indefinido, 30 días de salario por el primer año y 20 por cada año adicional (20 y 15 desde 10 salarios mínimos); a término fijo, los salarios del tiempo que falta del plazo; por obra o labor, mínimo 15 días; el contrato de aprendizaje no tiene. Debajo del valor dice cuántos días de salario paga. **Finalizar retiro** saca a la persona del directorio, la suma a la rotación y cancela las solicitudes de ausencia que tenía pendientes (las aprobadas y rechazadas quedan en su historial).

![Liquidación de un despido sin justa causa a término fijo](images/doc/demos/hrms/18-retiro-indemnizacion.jpg)

*Retiro de Adriana Gaitán Ospina, auxiliar de bodega con contrato a término fijo hasta el 8 de febrero de 2027, despedida sin justa causa con último día el 29 de octubre de 2026 (1): la indemnización paga los 102 días que faltan del plazo, $ 6.392.000 (2), dentro de un total de $ 10.537.062 (3); la nota explica la regla por tipo de contrato (4).*

### Desempeño

![Evaluación de desempeño](images/doc/demos/hrms/10-desempeno.jpg)

*Formulario de evaluación con cinco competencias en escala de 1 a 5 y el comentario con el plan de desarrollo.*

- **Evaluación de desempeño 2026, semestre 2**: 38 de 55 evaluaciones completadas al inicio. Solo participan los cargos administrativos, comerciales, técnicos y de mando (no los operarios de planta). Filtro **Pendientes / Completadas** y **CSV**.
- **Evaluar**: cinco competencias (cumple objetivos, calidad, trabajo en equipo, seguridad y salud en el trabajo, iniciativa) y comentarios. **Enviar evaluación** se habilita al calificar todo; muestra el promedio y pasa a Completadas. **Ver** abre una completada en modo lectura.
- **Resultados del ciclo**: promedio general (3,9 de 5) y personas por banda (sobresaliente, cumple, en desarrollo, por debajo de lo esperado).
- **Objetivos de la empresa**: rotación y cumplimiento del plan de formación se calculan con los datos de la demo («Calculado»); OEE, mermas y accidentes son «Dato de ejemplo».
- **Plan de sucesión**: cuatro personas con el cargo al que podrían llegar y si están listas ahora, en un año o en dos o más (ejemplo fijo).

### Nómina

Ver el [paso 5](#paso-5-nómina-novedades-liquidación-aprobación-y-pago), con la siguiente quincena y el historial de quincenas pagadas. Al final de la pestaña están las obligaciones del mes anterior y los beneficios.

![Obligaciones del mes: nómina electrónica y planilla de aportes](images/doc/demos/hrms/11-nomina-obligaciones.jpg)

*Obligaciones de septiembre de 2026 después de transmitir la nómina electrónica y generar la planilla.*

1. **Nómina electrónica (DIAN)**: «184 documentos soporte de pago de nómina por $ 510.383.367 devengados» con el plazo aproximado. **Transmitir a la DIAN (simulado)** pasa a «Aceptada (simulado)» y muestra un CUNE por persona.
2. **Descargar CUNE (CSV)**: colaborador, cédula, neto y CUNE. La pantalla aclara que «el CUNE se calcula con SHA-384 en tu navegador y no es válido ante la DIAN».
3. **Planilla de aportes (PILA)**: salud, pensión y solidaridad, riesgos laborales, caja e ICBF y SENA (total $ 124.550.603 en la prueba). **Generar archivo de aportes** descarga `aportes-2026-09.csv`, un archivo «de EJEMPLO con estructura simplificada; no es el formato oficial».
4. **Marcar como pagada**: estado «Pagada (simulado)». **Descargar de nuevo** repite la descarga.

**Beneficios**: auxilio de alimentación, póliza de vida colectiva, plan complementario de salud, medio día libre de cumpleaños y jornada familiar, con su costo por persona, beneficiarios y costo mensual (valores de ejemplo).

### Formación

![Plan de formación](images/doc/demos/hrms/12-formacion.jpg)

*Cumplimiento del plan y los primeros cursos con su avance y vencimiento, después de activar a Diego: la inducción cuenta 187 personas.*

- **Indicadores**: cumplimiento del plan (59,8 %, 344 de 575 asignaciones al empezar; 59,4 %, 344 de 579, después de activar a Diego), cursos en el plan (8), cursos vencidos (2) y horas de formación completadas (2.112).
- **Quien ingresa recibe sus cursos**: al activar a un colaborador nuevo se le asignan los cursos obligatorios de su cargo y área, con la misma regla que al resto (por ejemplo, todos reciben inducción SG-SST y prevención del acoso laboral; producción y calidad, manipulación de alimentos).
- **Plan de formación**: ocho cursos obligatorios (inducción SG-SST, curso de 50 horas SG-SST, manipulación de alimentos, trabajo en alturas, seguridad vial, SAGRILAFT, protección de datos y prevención del acoso laboral), cada uno con horas, vencimiento, público, avance y estado (En curso, Vence pronto, Vencido, Completo).
- **Ver pendientes (N)** lista quién falta; **Recordar a pendientes** avisa «Recordatorio enviado a N personas (envío simulado)» y deja la marca «Recordatorio enviado hoy (simulado)».
- **CSV** y **Ver la demo de plataforma de formación**, que lleva a `/demo/lms` (ver su [guía](Guia-Demo-lms.md)). Debajo del plan, la demo aclara que «La plataforma de formación es otra demo con su propio acceso: si no la tienes habilitada, allí mismo puedes solicitarla».

### App del colaborador

Se abre con **Ver app del colaborador** (o desde los pasos 1 y 5 del recorrido, que la abren directo en **Solicitar vacaciones** o en el asistente) y se cierra con la X o con Escape; el foco vuelve al botón que la abrió. Es la vista de Camila Rojas Parra. Abajo dice: «Vista de ejemplo de la app del colaborador. En tu proyecto es una app web que se abre en el celular sin instalar nada».

| Opción | Qué hace |
|---|---|
| **Solicitar vacaciones** | Saldo (causados, tomados, disponibles) y formulario en días hábiles (ver el [paso 2](#paso-2-app-del-colaborador-pedir-vacaciones-desde-el-celular)). |
| **Mis solicitudes** | Sus solicitudes con estado Pendiente, Aprobada o Rechazada; las rechazadas muestran el motivo («Motivo: …»). |
| **Mi desprendible** | Última quincena pagada (la actual si ya se pagó, o la última del historial) y **Descargar PDF**. |
| **Mi certificado laboral** | Con o sin salario, en PDF. La pantalla aclara que en la demo es un documento de ejemplo, sin validez. |
| **Mis cursos** | Sus cursos con estado y vencimiento; «Se toma en la plataforma de formación». |
| **Pregúntale a Gestión Humana** | Asistente con IA (ver el [paso 6](#paso-6-el-colaborador-ve-su-desprendible-y-le-pregunta-al-asistente)). La conversación se conserva al volver al menú o cerrar la app mientras la página siga abierta. |
| **Mis datos** | Cédula, cargo, sede, ingreso, EPS, fondo y cuenta de nómina enmascarada. «Los cambios de datos se solicitan a Gestión Humana». |

```mermaid
sequenceDiagram
    participant C as App del colaborador
    participant B as Servidor KopTup /api/chatbot
    participant M as Modelo de IA
    C->>B: Pide el bot de ejemplo compartido con los 5 documentos (POST /sample-bots)
    B-->>C: Identificador del bot (el mismo para todos los visitantes, se crea e indexa una sola vez)
    C->>B: Pregunta y últimos mensajes
    B->>B: Busca los fragmentos del reglamento
    alt Hay clave del proveedor y cupo del mes
        B->>M: Fragmentos y reglas para citar y no inventar
        M-->>B: Respuesta
        B-->>C: Respuesta, fuentes y modelo
    else Sin clave, sin cupo o el proveedor falla
        B-->>C: Fragmentos encontrados y el motivo (modo sin IA)
    end
```

*Cómo responde el asistente: usa las mismas rutas del chatbot RAG del sitio. El bot de ejemplo es compartido (cada navegador no crea uno propio) y sus conversaciones no se guardan; si el servidor lo borra por inactividad, la demo lo pide de nuevo sola. Con un servidor anterior sin bots compartidos, crea uno propio como antes.*

### En el celular

![Vista móvil](images/doc/demos/hrms/13-movil.jpg)

*La demo en un teléfono de 390 px: el encabezado con las salidas apiladas y el recorrido sugerido (izquierda), y la app del colaborador, que ocupa casi toda la pantalla (derecha).*

En el teléfono los botones del encabezado se apilan, los pasos del recorrido muestran solo título y botón, los indicadores van de dos en dos, las pestañas se desplazan de lado y las tablas anchas (nómina, asiento, saldos) se desplazan horizontalmente. La página no se desborda a lo ancho, en modo claro ni oscuro.

---

## Qué es real y qué es simulado

| Parte | Real o simulado | Detalle |
|---|---|---|
| Empresa, personas, candidatos, EPS, fondos, cajas, ARL y bancos | **Datos de ejemplo** | Alimentos Valdeora S.A.S. es ficticia; los datos se generan con la fecha del día. |
| Saldos de vacaciones, días hábiles y festivos de Colombia | **Real (en el navegador)** | 15 días hábiles por año, proporcionales; el calendario calcula los festivos. |
| Liquidación de la quincena, aportes, provisiones, retención y asiento | **Real (en el navegador), con parámetros de ejemplo 2026** | Salario mínimo, auxilio, UVT, jornada y recargos son valores de ejemplo; retención con un procedimiento 1 simplificado. |
| Puntaje de candidatos y alertas laborales | **Reglas, no IA** | Lo dice la propia pantalla. |
| Asistente «Pregúntale a Gestión Humana» | **IA real** | Llama al servidor de KopTup (`/api/chatbot`, bot de ejemplo compartido) con el tope de gasto mensual del chatbot; sin clave, sin cupo o si el proveedor falla responde con los fragmentos y dice por qué. |
| Nómina electrónica, CUNE y planilla de aportes | **Simulados** | El CUNE se calcula en el navegador y no es válido ante la DIAN; el archivo de aportes no es el formato oficial. |
| Archivo de dispersión bancaria | **Ejemplo** | CSV con formato propio de la demo («cada banco define su propio formato»). |
| Firma electrónica del contrato, encuestas, recordatorios y avisos | **Simulados** | No se envía nada. |
| Certificados, desprendibles, hojas de vida y documentos del expediente | **PDF real de ejemplo** | Se generan en el navegador con la marca «DOCUMENTO DE EJEMPLO… Sin validez». |
| Recorrido sugerido | **Real (en el navegador)** | Cada paso se marca con lo que de verdad hiciste en la demo. |
| Siguiente quincena e historial de quincenas pagadas | **Real (en el navegador)** | La nueva quincena se liquida con el personal activo en esas fechas. |
| Dónde se guardan tus cambios | **Solo en este navegador** | `localStorage` (clave `koptup.hrms.state`) durante 7 días; después se regeneran los datos. **Restablecer datos** vuelve al inicio. |

---

## Acceso

**Cómo lo ve un visitante.** La demo aparece en `/demo` con la insignia «Requiere acceso» y los botones **Solicitar acceso** y **Ya tengo acceso: iniciar sesión**. Si alguien abre `/demo/hrms` sin sesión, la web muestra en la misma dirección la pantalla de acceso:

![Pantalla de acceso para visitantes](images/doc/demos/hrms/01-acceso-visitante.jpg)

*Lo que ve un visitante sin sesión: «Requiere acceso», «Sin sesión» y los botones para pedir la demo o iniciar sesión. Debajo, la vista previa con el texto del catálogo.*

- **Solicitar acceso** abre `/solicitar-demo?demos=hrms` con la demo ya elegida.
- **Ya tengo acceso: iniciar sesión** lleva a `/login?redirect=%2Fdemo%2Fhrms` y, al entrar, vuelve a la demo.
- **Ver todas las demos** vuelve a `/demo`.
- Con sesión pero sin acceso, la misma pantalla dice «Sin acceso»; si el acceso venció o fue retirado, ofrece pedir más tiempo o solicitarlo de nuevo.

**Cómo se concede.** La solicitud llega a **Admin › Solicitudes de demo** y la aprueban los roles **admin** o **sales**. Al aprobar se crea o se reutiliza la cuenta del prospecto, el acceso dura 14 días por defecto (se extiende o se revoca en **Admin › Accesos a demos**) y la persona recibe un correo con la decisión (con el enlace de activación si su cuenta es nueva). El equipo de KopTup (admin, manager, sales y developer) abre la demo sin solicitud. El modo de acceso se cambia en **Admin › Catálogo de demos**. Detalle en el [Manual del administrador](Doc-06-Manual-del-Administrador.md) y en [Flujos del visitante](Doc-04-Flujos-del-Visitante.md).

```mermaid
flowchart LR
    V["Visitante abre /demo/hrms"] --> S{"¿Sesión con acceso?"}
    S -- "Equipo KopTup o acceso vigente" --> D["Demo completa"]
    S -- "No" --> P["Pantalla Requiere acceso"]
    P --> F["/solicitar-demo?demos=hrms"]
    F --> AD["Admin: Solicitudes de demo"]
    AD -- "Aprueba (admin o sales)" --> E["Correo con acceso por 14 días"]
    E --> M["Portal: Mis demos"]
    M --> D
```

*Camino de un visitante hasta la demo.*

---

## Limitaciones conocidas

La sonda automática hizo clic en todos los controles visibles de la vista inicial (escritorio y 390 px, en español y en inglés, en claro y en oscuro) y ninguno quedó sin efecto, sin errores de consola ni de hidratación de la demo. Los flujos principales (pedir, aprobar y rechazar vacaciones, contratar y activar, descartar y devolver, registrar un retiro con su liquidación, buscar y agregar novedades, liquidar, aprobar, pagar y abrir la siguiente quincena, desprendible, asistente, teclado en las pestañas, Escape en diálogos y restablecer) se recorrieron con Playwright.

**Revisión del 14 de octubre de 2026.** Una revisión de comprador exigente encontró y corrigió: la antigüedad de quien aún no ingresa salía en negativo («-1 años»); quien se contrataba quedaba con la directora de planta como jefe aunque fuera de otra área; el despido sin justa causa de un contrato a término fijo daba indemnización de $ 0 (y la nota decía que solo aplicaba al indefinido); se podían pedir dos veces las mismas fechas; unas vacaciones pedidas desde un sábado quedaban registradas desde el sábado; la pantalla decía que el colaborador veía el motivo del rechazo en su app, pero la app no lo mostraba; la conversación con el asistente se borraba al volver al menú; el aviso de activación decía que la persona ya estaba «en la nómina» aunque entra desde su fecha de ingreso; las solicitudes pendientes de alguien retirado seguían esperando aprobación; los buscadores de saldos y del detalle de nómina no encontraban nombres sin tildes, y los CSV en español usaban punto decimal.

Lo que sí conviene saber:

1. **La vista previa todavía promete más de lo que hace la demo.** La tarjeta del hub y la pantalla de acceso usan el texto del catálogo: «ATS con scoring CV IA y screening calls automáticas», «Payroll multi-país con compliance laboral (CO, MX, AR)» y «AI: retención predicha, eNPS y salary benchmarks». La demo trabaja solo con Colombia, el puntaje de candidatos es por reglas («No es IA»), no hace llamadas de preselección y no predice retención ni compara salarios. La IA está solo en el asistente de políticas. El texto nuevo de la tarjeta, del plan del producto y el nombre «Gestión Humana y Nómina (HRMS)» para el catálogo del admin están propuestos a la pista de plataforma.
2. **Los cambios viven solo en el navegador**, por 7 días. Si el prospecto cambia de equipo o de navegador, o borra los datos del sitio, vuelve a los datos de ejemplo. No hay espacio compartido con el vendedor. La conversación con el asistente se borra al recargar la página.
3. **La siguiente quincena se puede abrir antes de tiempo.** Para repetir el ciclo, la demo deja abrir la quincena siguiente apenas se paga la actual, aunque en la vida real se liquida cerca de su fecha de pago. El historial guarda los totales pagados, no el detalle por persona; el desprendible de la app se recalcula con las novedades de esa quincena. Las **obligaciones del mes** (nómina electrónica y planilla de aportes) siguen siendo las del mes anterior a la fecha de los datos.
4. **DIAN, planilla de aportes, banco, firma electrónica y mensajes simulados**, como lo dicen las pantallas.
5. **Las aprobaciones no dependen de roles**: quien usa la demo aprueba como jefe y como Gestión Humana a la vez (el recorrido lo dice). La app del colaborador es siempre la de Camila Rojas Parra.
6. **La liquidación de retiro es una estimación simplificada**: usa el salario básico (sin promedio de horas extra ni comisiones), no descuenta préstamos ni anticipos y, en el contrato por obra o labor, paga el mínimo de 15 días porque la demo no conoce la fecha de fin de la obra. Así lo dice la nota de la pantalla.
7. **El enlace «Ver la demo de plataforma de formación»** lleva a `/demo/lms`, que tiene su propio acceso: un prospecto con acceso solo a esta demo verá ahí la pantalla «Requiere acceso» (la demo lo advierte debajo del plan de formación). En **Formación** el avance de cada curso viene en los datos de ejemplo: los cursos se toman en la plataforma de formación, no se marcan como hechos desde esta demo.
8. **Un colaborador nuevo no entra en el ciclo de desempeño en curso** (ingresó después de que empezó) ni en las obligaciones del mes anterior.
9. **Límites del asistente**: comparte el tope de gasto mensual y los límites del chatbot del sitio. Si el servidor está ocupado o en mantenimiento, la app lo dice y se puede volver a preguntar.
