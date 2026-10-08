/**
 * Catálogo de ejemplo de "Academia Quindé" (academia ficticia de educación
 * continua en Pereira). Cada curso trae su propio temario, guion de las
 * lecciones (subtítulos del video simulado y material del tutor IA),
 * evaluación y preguntas sugeridas. Es una versión resumida de cada programa:
 * las horas del curso son las del programa completo.
 */
import type { Course, L, Lesson, Module, QuizQuestion, ScriptLine } from './types';

export const ACADEMY = {
  name: 'Academia Quindé',
  legalName: 'Academia Quindé S.A.S.',
  nit: '901482736',
  city: 'Pereira, Risaralda',
  certPrefix: 'AQ',
};

const l = (es: string, en: string): L => ({ es, en });

function sec(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

const line = (at: string, es: string, en: string): ScriptLine => ({ at: sec(at), text: l(es, en) });
const para = (es: string, en: string): ScriptLine => ({ at: 0, text: l(es, en) });

function video(courseId: string, n: number, title: L, duration: string, lines: ScriptLine[]): Lesson {
  return { id: `${courseId}-l${n}`, n, kind: 'video', title, duration: sec(duration), lines };
}
function reading(courseId: string, n: number, title: L, minutes: number, lines: ScriptLine[]): Lesson {
  return { id: `${courseId}-l${n}`, n, kind: 'reading', title, duration: minutes * 60, lines };
}
function quizLesson(courseId: string, n: number): Lesson {
  return { id: `${courseId}-l${n}`, n, kind: 'quiz', title: l('Evaluación final', 'Final assessment'), duration: 10 * 60, lines: [] };
}
const mod = (id: string, title: L, lessons: Lesson[]): Module => ({ id, title, lessons });
const q = (id: string, lessonId: string, text: L, options: L[], correct: number): QuizQuestion => ({ id, q: text, options, correct, lessonId });

// ---------------------------------------------------------------------------
// 1. Finanzas para no financieros
// ---------------------------------------------------------------------------
const FIN = 'finanzas';
const finanzas: Course = {
  id: FIN,
  title: l('Finanzas para no financieros', 'Finance for non-financial managers'),
  desc: l(
    'Lee estados financieros, entiende la diferencia entre utilidad y caja y arma el flujo de caja de tu negocio.',
    'Read financial statements, understand the difference between profit and cash, and build your business cash flow.',
  ),
  instructor: 'Mónica Restrepo',
  instructorBio: l('Contadora pública y especialista en finanzas; asesora pymes desde hace 12 años.', 'Public accountant and finance specialist; has advised SMEs for 12 years.'),
  category: l('Finanzas', 'Finance'),
  level: 'beginner',
  mode: 'cohort',
  hours: 40,
  price: 890000,
  rating: 4.8,
  reviews: 126,
  gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
  skills: [
    l('Leer un estado de resultados', 'Read an income statement'),
    l('Diferenciar utilidad y flujo de caja', 'Tell profit from cash flow'),
    l('Proyectar la caja mes a mes', 'Forecast cash month by month'),
  ],
  requirements: [
    l('Ninguno: está pensado para personas sin formación contable.', 'None: designed for people without an accounting background.'),
    l('Una hoja de cálculo (Excel o Google Sheets).', 'A spreadsheet (Excel or Google Sheets).'),
  ],
  modules: [
    mod('finanzas-m1', l('Estados financieros sin enredos', 'Financial statements made simple'), [
      video(FIN, 1, l('El estado de resultados', 'The income statement'), '08:24', [
        line('00:00', 'En esta lección leemos un estado de resultados de arriba hacia abajo: ingresos, costos, gastos y utilidad.', 'In this lesson we read an income statement from top to bottom: revenue, costs, expenses and profit.'),
        line('01:40', 'Los ingresos operacionales son las ventas del periodo. Si vendes a crédito, la venta se registra aunque el cliente todavía no te haya pagado.', 'Operating revenue is the sales of the period. If you sell on credit, the sale is recorded even if the customer has not paid you yet.'),
        line('03:05', 'Al restar el costo de ventas obtienes la utilidad bruta; luego restas los gastos de administración y ventas para llegar a la utilidad operacional.', 'Subtracting the cost of sales gives you gross profit; then you subtract administrative and selling expenses to reach operating profit.'),
        line('05:30', 'La utilidad neta es lo que queda después de gastos financieros e impuestos. Una empresa puede tener utilidad y aun así quedarse sin efectivo.', 'Net profit is what remains after financial expenses and taxes. A company can be profitable and still run out of cash.'),
      ]),
      reading(FIN, 2, l('Utilidad no es lo mismo que caja', 'Profit is not the same as cash'), 6, [
        para('La utilidad es un resultado contable: compara los ingresos y los gastos causados en el periodo, se hayan pagado o no.', 'Profit is an accounting result: it compares the revenue and expenses accrued in the period, whether or not they were paid.'),
        para('El flujo de caja registra solo el dinero que efectivamente entra y sale. Las ventas a crédito, el inventario y las cuotas de deuda hacen que la caja se mueva distinto de la utilidad.', 'Cash flow only records the money that actually comes in and goes out. Credit sales, inventory and loan payments make cash move differently from profit.'),
        para('Ejemplo: vendes $10.000.000 en el mes con 60 días de plazo. El estado de resultados muestra la venta hoy, pero el dinero llega en dos meses y mientras tanto debes pagar nómina y proveedores.', 'Example: you sell COP 10,000,000 this month on 60-day terms. The income statement shows the sale today, but the money arrives in two months and meanwhile you must pay payroll and suppliers.'),
      ]),
    ]),
    mod('finanzas-m2', l('Flujo de caja', 'Cash flow'), [
      video(FIN, 3, l('Flujo de caja y capital de trabajo', 'Cash flow and working capital'), '11:40', [
        line('00:00', 'El flujo de caja operativo parte de lo que cobras a clientes y le resta lo que pagas a proveedores, empleados e impuestos.', 'Operating cash flow starts with what you collect from customers and subtracts what you pay suppliers, employees and taxes.'),
        line('02:15', 'El capital de trabajo es la plata que queda atrapada en cartera e inventario. Cuantos más días de crédito das, más caja necesitas para operar.', 'Working capital is the money tied up in receivables and inventory. The more credit days you give, the more cash you need to operate.'),
        line('03:12', 'La diferencia clave: la utilidad dice si el negocio gana dinero; el flujo de caja dice si tienes efectivo para pagar a tiempo. Necesitas mirar las dos.', 'The key difference: profit tells you whether the business makes money; cash flow tells you whether you have cash to pay on time. You need to watch both.'),
        line('07:50', 'Para mejorar la caja puedes acortar los plazos de cobro, negociar plazos con proveedores o reducir el inventario que no rota.', 'To improve cash you can shorten collection terms, negotiate terms with suppliers or reduce slow-moving inventory.'),
      ]),
      video(FIN, 4, l('Presupuesto de caja mes a mes', 'Month-by-month cash budget'), '09:05', [
        line('00:00', 'Un presupuesto de caja proyecta, mes a mes, el saldo inicial, los cobros, los pagos y el saldo final.', 'A cash budget forecasts, month by month, the opening balance, collections, payments and closing balance.'),
        line('02:30', 'Empieza por los cobros esperados según los plazos reales de tus clientes, no según las ventas facturadas.', 'Start with expected collections based on your customers’ real payment terms, not on invoiced sales.'),
        line('04:45', 'Incluye los pagos grandes del año: primas de junio y diciembre, impuestos y cuotas de créditos.', 'Include the big payments of the year: June and December bonuses, taxes and loan installments.'),
        line('07:10', 'Si algún mes el saldo final queda negativo, tienes tiempo de buscar financiación o ajustar pagos antes de que ocurra.', 'If a month ends with a negative balance, you have time to look for financing or adjust payments before it happens.'),
      ]),
    ]),
    mod('finanzas-m3', l('Evaluación', 'Assessment'), [quizLesson(FIN, 5)]),
  ],
  quiz: [
    q('finanzas-q1', 'finanzas-l1', l('¿Qué muestra el estado de resultados?', 'What does the income statement show?'), [
      l('Solo el dinero que entró al banco', 'Only the money that reached the bank'),
      l('Los ingresos, costos y gastos del periodo y la utilidad resultante', 'Revenue, costs and expenses of the period and the resulting profit'),
      l('Las deudas de largo plazo', 'Long-term debt'),
      l('El inventario disponible', 'Available inventory'),
    ], 1),
    q('finanzas-q2', 'finanzas-l2', l('Vendes a crédito a 60 días. ¿Qué pasa este mes?', 'You sell on 60-day credit. What happens this month?'), [
      l('La venta aparece en el estado de resultados, pero el dinero aún no entra a la caja', 'The sale shows in the income statement, but the cash has not come in yet'),
      l('La venta no se registra hasta que te paguen', 'The sale is not recorded until you get paid'),
      l('La caja sube y la utilidad no cambia', 'Cash goes up and profit does not change'),
      l('No cambia nada', 'Nothing changes'),
    ], 0),
    q('finanzas-q3', 'finanzas-l3', l('¿Qué es el capital de trabajo, en términos prácticos?', 'What is working capital, in practical terms?'), [
      l('La utilidad neta del año', 'The net profit of the year'),
      l('El valor de los equipos', 'The value of the equipment'),
      l('El dinero que queda atrapado en cartera e inventario para operar', 'The money tied up in receivables and inventory to operate'),
      l('El capital que aportaron los socios', 'The capital contributed by the partners'),
    ], 2),
    q('finanzas-q4', 'finanzas-l4', l('¿Por dónde empiezas un presupuesto de caja?', 'Where do you start a cash budget?'), [
      l('Por las ventas facturadas', 'With invoiced sales'),
      l('Por la utilidad del año anterior', 'With last year’s profit'),
      l('Por el valor del inventario', 'With the inventory value'),
      l('Por los cobros esperados según los plazos reales de tus clientes', 'With expected collections based on your customers’ real terms'),
    ], 3),
  ],
  suggestions: [
    l('¿Qué diferencia hay entre utilidad y flujo de caja?', 'What is the difference between profit and cash flow?'),
    l('¿Cómo mejoro el flujo de caja de mi negocio?', 'How do I improve my business cash flow?'),
    l('¿Qué pagos grandes incluyo en el presupuesto de caja?', 'Which big payments go in the cash budget?'),
  ],
};

// ---------------------------------------------------------------------------
// 2. Excel para análisis de datos
// ---------------------------------------------------------------------------
const XL = 'excel';
const excel: Course = {
  id: XL,
  title: l('Excel para análisis de datos', 'Excel for data analysis'),
  desc: l(
    'Ordena tus datos, cruza tablas con BUSCARX, resume con tablas dinámicas y arma un tablero de ventas.',
    'Organize your data, match tables with XLOOKUP, summarize with PivotTables and build a sales dashboard.',
  ),
  instructor: 'Andrés Cárdenas',
  instructorBio: l('Analista de datos; capacita equipos comerciales y administrativos.', 'Data analyst; trains sales and admin teams.'),
  category: l('Productividad', 'Productivity'),
  level: 'intermediate',
  mode: 'self-paced',
  hours: 24,
  price: 290000,
  rating: 4.7,
  reviews: 214,
  gradient: 'from-indigo-500 via-purple-500 to-pink-500',
  skills: [
    l('Convertir rangos en tablas con formato', 'Turn ranges into formatted tables'),
    l('Cruzar información con BUSCARX', 'Match data with XLOOKUP'),
    l('Resumir datos con tablas dinámicas', 'Summarize data with PivotTables'),
    l('Construir un tablero de ventas', 'Build a sales dashboard'),
  ],
  requirements: [
    l('Manejo básico de Excel: abrir, guardar y escribir fórmulas simples.', 'Basic Excel: open, save and write simple formulas.'),
    l('Una versión de Excel que tenga la función BUSCARX.', 'An Excel version that includes XLOOKUP.'),
  ],
  modules: [
    mod('excel-m1', l('Datos ordenados', 'Clean data'), [
      video(XL, 1, l('Rangos, tablas y formato como tabla', 'Ranges, tables and Format as Table'), '07:30', [
        line('00:00', 'Antes de analizar, ordena: una fila por registro, una columna por dato y encabezados sin celdas combinadas.', 'Before analyzing, tidy up: one row per record, one column per field and headers without merged cells.'),
        line('01:50', 'Con Ctrl + T conviertes el rango en una tabla. La tabla crece sola cuando agregas filas y las fórmulas se copian automáticamente.', 'Ctrl + T turns the range into a table. The table grows when you add rows and formulas are copied automatically.'),
        line('04:10', 'Ponle un nombre a la tabla, por ejemplo Ventas, para usar fórmulas como Ventas[Valor] en lugar de rangos como B2:B500.', 'Give the table a name, for example Sales, so you can use formulas like Sales[Amount] instead of ranges like B2:B500.'),
        line('06:00', 'Usa los filtros del encabezado para encontrar errores: fechas mal escritas, ciudades con nombres distintos o valores en blanco.', 'Use the header filters to find errors: badly typed dates, cities spelled differently or blank values.'),
      ]),
      video(XL, 2, l('BUSCARX y validación de datos', 'XLOOKUP and data validation'), '10:15', [
        line('00:00', 'BUSCARX busca un valor en una columna y devuelve el dato correspondiente de otra columna, por ejemplo el precio de un código de producto.', 'XLOOKUP finds a value in one column and returns the matching value from another column, for example the price of a product code.'),
        line('02:20', 'La sintaxis básica es BUSCARX(valor_buscado; matriz_buscada; matriz_devuelta; si_no_se_encuentra).', 'The basic syntax is XLOOKUP(lookup_value, lookup_array, return_array, if_not_found).'),
        line('03:12', 'A diferencia de BUSCARV, BUSCARX puede devolver columnas que están a la izquierda y no se rompe si insertas columnas nuevas.', 'Unlike VLOOKUP, XLOOKUP can return columns to the left and does not break when you insert new columns.'),
        line('06:40', 'Con validación de datos creas listas desplegables para que todos escriban igual las ciudades o los vendedores.', 'Data validation lets you create drop-down lists so everyone types cities or salespeople the same way.'),
      ]),
    ]),
    mod('excel-m2', l('Análisis y tableros', 'Analysis and dashboards'), [
      reading(XL, 3, l('Tablas dinámicas paso a paso', 'PivotTables step by step'), 8, [
        para('Una tabla dinámica resume miles de filas en segundos: por ejemplo, ventas por ciudad y por mes.', 'A PivotTable summarizes thousands of rows in seconds: for example, sales by city and by month.'),
        para('Selecciona una celda de tu tabla, ve a Insertar > Tabla dinámica y arrastra Ciudad a Filas, Mes a Columnas y Valor a Valores.', 'Select a cell in your table, go to Insert > PivotTable and drag City to Rows, Month to Columns and Amount to Values.'),
        para('Si agregas datos a la tabla de origen, usa Actualizar para que la tabla dinámica los incluya.', 'If you add data to the source table, use Refresh so the PivotTable includes it.'),
      ]),
      video(XL, 4, l('Gráficos y tablero de ventas', 'Charts and sales dashboard'), '09:40', [
        line('00:00', 'Un tablero muestra en una sola pantalla los indicadores que revisas cada semana.', 'A dashboard shows on a single screen the indicators you review every week.'),
        line('02:05', 'Parte de tablas dinámicas y agrega gráficos dinámicos: columnas para comparar ciudades y líneas para ver la tendencia mensual.', 'Start from PivotTables and add PivotCharts: columns to compare cities and lines to see the monthly trend.'),
        line('05:20', 'Con segmentaciones filtras todo el tablero por vendedor o por producto con un clic.', 'Slicers let you filter the whole dashboard by salesperson or product with one click.'),
        line('08:00', 'Menos es más: tres o cuatro gráficos claros comunican mejor que diez.', 'Less is more: three or four clear charts communicate better than ten.'),
      ]),
    ]),
    mod('excel-m3', l('Evaluación', 'Assessment'), [quizLesson(XL, 5)]),
  ],
  quiz: [
    q('excel-q1', 'excel-l1', l('¿Qué ventaja tiene convertir un rango en tabla (Ctrl + T)?', 'What is the advantage of turning a range into a table (Ctrl + T)?'), [
      l('La tabla crece sola y copia las fórmulas al agregar filas', 'The table grows and copies formulas when you add rows'),
      l('Bloquea el archivo para que nadie lo edite', 'It locks the file so nobody can edit it'),
      l('Convierte el archivo a PDF', 'It converts the file to PDF'),
      l('Elimina los duplicados automáticamente', 'It removes duplicates automatically'),
    ], 0),
    q('excel-q2', 'excel-l2', l('¿Qué hace BUSCARX?', 'What does XLOOKUP do?'), [
      l('Suma una columna', 'Adds up a column'),
      l('Busca un valor y devuelve el dato correspondiente de otra columna', 'Finds a value and returns the matching value from another column'),
      l('Ordena alfabéticamente', 'Sorts alphabetically'),
      l('Crea gráficos', 'Creates charts'),
    ], 1),
    q('excel-q3', 'excel-l3', l('Agregaste filas a la tabla de origen. ¿Cómo las ves en la tabla dinámica?', 'You added rows to the source table. How do you see them in the PivotTable?'), [
      l('Creando la tabla dinámica de nuevo', 'By creating the PivotTable again'),
      l('Guardando el archivo como CSV', 'By saving the file as CSV'),
      l('Con Actualizar', 'With Refresh'),
      l('No hace falta nada: siempre se ven solas', 'Nothing: they always show up on their own'),
    ], 2),
    q('excel-q4', 'excel-l4', l('¿Para qué sirven las segmentaciones en un tablero?', 'What are slicers for in a dashboard?'), [
      l('Para proteger el archivo', 'To protect the file'),
      l('Para imprimir', 'To print'),
      l('Para cambiar los colores', 'To change colors'),
      l('Para filtrar el tablero con un clic', 'To filter the dashboard with one click'),
    ], 3),
  ],
  suggestions: [
    l('¿En qué se diferencia BUSCARX de BUSCARV?', 'How is XLOOKUP different from VLOOKUP?'),
    l('¿Cómo actualizo una tabla dinámica?', 'How do I refresh a PivotTable?'),
    l('¿Qué gráficos uso en un tablero de ventas?', 'Which charts should I use in a sales dashboard?'),
  ],
};

// ---------------------------------------------------------------------------
// 3. Marketing digital para pymes
// ---------------------------------------------------------------------------
const MK = 'marketing';
const marketing: Course = {
  id: MK,
  title: l('Marketing digital para pymes', 'Digital marketing for SMEs'),
  desc: l(
    'Define tu cliente ideal, crea contenido que vende y mide con las métricas que importan, con presupuesto de pyme.',
    'Define your ideal customer, create content that sells and measure what matters, on an SME budget.',
  ),
  instructor: 'Carolina Mejía',
  instructorBio: l('Consultora de marketing digital para pymes y emprendimientos.', 'Digital marketing consultant for SMEs and startups.'),
  category: l('Marketing', 'Marketing'),
  level: 'beginner',
  mode: 'live',
  hours: 30,
  price: 450000,
  rating: 4.6,
  reviews: 98,
  gradient: 'from-rose-500 via-pink-500 to-orange-500',
  skills: [
    l('Definir tu cliente ideal y tu propuesta de valor', 'Define your ideal customer and value proposition'),
    l('Planear contenido para redes sociales', 'Plan social media content'),
    l('Invertir en pauta con presupuesto pequeño', 'Run ads on a small budget'),
    l('Medir el CAC y la tasa de conversión', 'Measure CAC and conversion rate'),
  ],
  requirements: [
    l('Tener un negocio o proyecto donde aplicar lo aprendido.', 'A business or project where you can apply what you learn.'),
    l('Acceso a las redes sociales de tu negocio.', 'Access to your business social media accounts.'),
  ],
  modules: [
    mod('marketing-m1', l('Estrategia', 'Strategy'), [
      video(MK, 1, l('Cliente ideal y propuesta de valor', 'Ideal customer and value proposition'), '08:10', [
        line('00:00', 'Antes de publicar, define a quién le vendes: qué problema tiene, dónde busca soluciones y qué le impide comprar.', 'Before posting, define who you sell to: what problem they have, where they look for solutions and what stops them from buying.'),
        line('02:00', 'La propuesta de valor responde en una frase por qué tu cliente debería elegirte a ti y no a la competencia.', 'Your value proposition answers in one sentence why your customer should choose you over the competition.'),
        line('04:30', 'Escríbela así: ayudo a [cliente] a [resultado] sin [obstáculo]. Pruébala con tres clientes antes de usarla en la pauta.', 'Write it like this: I help [customer] achieve [result] without [obstacle]. Test it with three customers before using it in ads.'),
        line('06:40', 'Un buen cliente ideal es específico: "dueños de restaurantes pequeños en Pereira" funciona mejor que "todo el mundo".', 'A good ideal customer is specific: "small restaurant owners in Pereira" works better than "everyone".'),
      ]),
      video(MK, 2, l('Contenido para redes sociales', 'Social media content'), '09:30', [
        line('00:00', 'Planea el contenido en un calendario semanal con tres tipos de publicación: educar, mostrar prueba y vender.', 'Plan your content in a weekly calendar with three types of posts: educate, show proof and sell.'),
        line('02:40', 'El contenido que educa resuelve dudas de tu cliente ideal; el de prueba muestra testimonios y resultados; el de venta tiene una oferta clara.', 'Educational content answers your ideal customer’s questions; proof content shows testimonials and results; sales content has a clear offer.'),
        line('05:10', 'Un video corto vertical que responde una pregunta frecuente suele tener más alcance que una imagen con mucho texto.', 'A short vertical video that answers a frequent question usually reaches more people than an image full of text.'),
        line('07:45', 'Responde comentarios y mensajes en menos de una hora: la conversación también es parte del contenido.', 'Reply to comments and messages within an hour: the conversation is part of the content too.'),
      ]),
    ]),
    mod('marketing-m2', l('Pauta y medición', 'Ads and measurement'), [
      reading(MK, 3, l('Pauta con presupuesto pequeño', 'Ads on a small budget'), 7, [
        para('Con un presupuesto pequeño, concentra la inversión en una sola campaña con un objetivo claro, por ejemplo mensajes o visitas a la tienda.', 'With a small budget, put your money into a single campaign with a clear goal, such as messages or store visits.'),
        para('Segmenta por ciudad y por los intereses de tu cliente ideal, y prueba dos versiones del anuncio durante una semana antes de invertir más.', 'Target by city and by your ideal customer’s interests, and test two versions of the ad for a week before spending more.'),
        para('Apaga los anuncios que no generan conversaciones o ventas y reinvierte en el que mejor funciona.', 'Turn off the ads that bring no conversations or sales and reinvest in the one that works best.'),
      ]),
      video(MK, 4, l('Métricas que importan: CAC y conversión', 'Metrics that matter: CAC and conversion'), '10:20', [
        line('00:00', 'Los "me gusta" no pagan la nómina: mide lo que se convierte en ventas.', 'Likes do not pay the payroll: measure what turns into sales.'),
        line('02:30', 'El costo de adquisición de clientes, CAC, es la inversión en marketing dividida entre los clientes nuevos del periodo.', 'Customer acquisition cost, CAC, is your marketing spend divided by the new customers of the period.'),
        line('04:50', 'La tasa de conversión es el porcentaje de personas que compran entre las que llegaron: si 200 personas escriben y 20 compran, convertiste el 10 %.', 'Conversion rate is the percentage of people who buy out of those who arrived: if 200 people message you and 20 buy, you converted 10%.'),
        line('07:30', 'Compara el CAC con lo que te compra un cliente en el año: si el CAC es mayor, la campaña pierde plata.', 'Compare CAC with what a customer buys from you in a year: if CAC is higher, the campaign loses money.'),
      ]),
    ]),
    mod('marketing-m3', l('Evaluación', 'Assessment'), [quizLesson(MK, 5)]),
  ],
  quiz: [
    q('marketing-q1', 'marketing-l1', l('¿Qué responde la propuesta de valor?', 'What does the value proposition answer?'), [
      l('Cuánto cuesta el producto', 'How much the product costs'),
      l('Por qué el cliente debería elegirte a ti y no a la competencia', 'Why the customer should choose you over the competition'),
      l('Cuántos seguidores tienes', 'How many followers you have'),
      l('Qué colores usa la marca', 'Which colors the brand uses'),
    ], 1),
    q('marketing-q2', 'marketing-l2', l('¿Cuáles son los tres tipos de publicación del calendario?', 'What are the three types of posts in the calendar?'), [
      l('Educar, mostrar prueba y vender', 'Educate, show proof and sell'),
      l('Memes, fotos y videos', 'Memes, photos and videos'),
      l('Lunes, miércoles y viernes', 'Monday, Wednesday and Friday'),
      l('Historias, videos cortos y transmisiones', 'Stories, short videos and live streams'),
    ], 0),
    q('marketing-q3', 'marketing-l3', l('Con poco presupuesto, ¿qué conviene hacer?', 'With a small budget, what should you do?'), [
      l('Repartirlo en muchas campañas', 'Spread it across many campaigns'),
      l('Pautar sin segmentar', 'Run ads without targeting'),
      l('Concentrarlo en una campaña con objetivo claro y probar dos versiones', 'Focus it on one campaign with a clear goal and test two versions'),
      l('Pautar en todos los países', 'Advertise in every country'),
    ], 2),
    q('marketing-q4', 'marketing-l4', l('Invertiste $1.000.000 y conseguiste 20 clientes nuevos. ¿Cuál es tu CAC?', 'You spent COP 1,000,000 and got 20 new customers. What is your CAC?'), [
      l('$20.000', 'COP 20,000'),
      l('$50.000', 'COP 50,000'),
      l('$100.000', 'COP 100,000'),
      l('$1.000.000', 'COP 1,000,000'),
    ], 1),
  ],
  suggestions: [
    l('¿Cómo calculo el CAC?', 'How do I calculate CAC?'),
    l('¿Qué tipo de contenido debo publicar?', 'What kind of content should I post?'),
    l('¿Cómo invierto en pauta si tengo poco presupuesto?', 'How do I run ads on a small budget?'),
  ],
};

// ---------------------------------------------------------------------------
// 4. Contabilidad básica para emprendedores
// ---------------------------------------------------------------------------
const CT = 'contabilidad';
const contabilidad: Course = {
  id: CT,
  title: l('Contabilidad básica para emprendedores', 'Basic accounting for entrepreneurs'),
  desc: l(
    'Entiende activos, pasivos y patrimonio, registra con partida doble y cierra tu mes con la conciliación bancaria.',
    'Understand assets, liabilities and equity, record with double entry and close your month with a bank reconciliation.',
  ),
  instructor: 'Jorge Salazar',
  instructorBio: l('Contador público; acompaña emprendimientos en su formalización.', 'Public accountant; helps startups formalize their businesses.'),
  category: l('Contabilidad', 'Accounting'),
  level: 'beginner',
  mode: 'self-paced',
  hours: 20,
  price: 350000,
  rating: 4.7,
  reviews: 87,
  gradient: 'from-amber-500 via-orange-500 to-rose-500',
  skills: [
    l('Leer un balance general', 'Read a balance sheet'),
    l('Registrar transacciones con partida doble', 'Record transactions with double entry'),
    l('Hacer la conciliación bancaria del mes', 'Do the monthly bank reconciliation'),
  ],
  requirements: [l('Ninguno.', 'None.')],
  modules: [
    mod('contabilidad-m1', l('Fundamentos', 'Fundamentals'), [
      video(CT, 1, l('Activos, pasivos y patrimonio', 'Assets, liabilities and equity'), '07:50', [
        line('00:00', 'El balance general muestra lo que tiene la empresa, lo que debe y lo que les pertenece a los socios en una fecha.', 'The balance sheet shows what the company owns, what it owes and what belongs to the partners on a given date.'),
        line('01:45', 'Los activos son los recursos que controla el negocio: caja, bancos, cartera, inventario y equipos.', 'Assets are the resources the business controls: cash, bank accounts, receivables, inventory and equipment.'),
        line('03:20', 'Los pasivos son las obligaciones con terceros: proveedores, bancos, impuestos por pagar y nómina por pagar.', 'Liabilities are obligations to third parties: suppliers, banks, taxes payable and payroll payable.'),
        line('05:30', 'La ecuación contable siempre se cumple: el activo es igual al pasivo más el patrimonio.', 'The accounting equation always holds: assets equal liabilities plus equity.'),
      ]),
      video(CT, 2, l('La partida doble', 'Double-entry bookkeeping'), '08:45', [
        line('00:00', 'Cada transacción afecta al menos dos cuentas: lo que se registra en el débito debe ser igual a lo que se registra en el crédito.', 'Every transaction affects at least two accounts: what is recorded as debit must equal what is recorded as credit.'),
        line('02:30', 'Ejemplo: compras mercancía de contado por $2.000.000. Debitas inventario y acreditas bancos por el mismo valor.', 'Example: you buy goods for COP 2,000,000 in cash. You debit inventory and credit the bank for the same amount.'),
        line('04:50', 'Si vendes a crédito, debitas clientes y acreditas ingresos; cuando te pagan, debitas bancos y acreditas clientes.', 'If you sell on credit, you debit receivables and credit revenue; when you get paid, you debit the bank and credit receivables.'),
        line('07:00', 'Si la suma de débitos y créditos no cuadra, hay un error de registro que debes encontrar antes de cerrar el mes.', 'If debits and credits do not balance, there is a recording error you must find before closing the month.'),
      ]),
    ]),
    mod('contabilidad-m2', l('Operación mensual', 'Monthly operations'), [
      reading(CT, 3, l('Facturación electrónica: lo básico', 'Electronic invoicing: the basics'), 6, [
        para('Si estás obligado a facturar en Colombia, cada venta debe soportarse con una factura electrónica validada por la DIAN antes de entregarla al cliente.', 'If you are required to invoice in Colombia, each sale must be backed by an electronic invoice validated by the DIAN before you deliver it to the customer.'),
        para('La factura incluye, entre otros datos, el NIT del vendedor, los datos del comprador, la descripción, el valor, los impuestos y el código único CUFE.', 'The invoice includes, among other data, the seller’s tax ID (NIT), the buyer’s details, the description, the amount, the taxes and the unique CUFE code.'),
        para('Revisa con tu contador si eres responsable de IVA y qué régimen te aplica: de eso dependen los impuestos que cobras y declaras.', 'Check with your accountant whether you must charge VAT and which tax regime applies to you: it defines the taxes you charge and file.'),
      ]),
      video(CT, 4, l('Cierre de mes y conciliación bancaria', 'Month-end close and bank reconciliation'), '09:20', [
        line('00:00', 'La conciliación bancaria compara el saldo de bancos en tu contabilidad con el extracto del banco.', 'A bank reconciliation compares the bank balance in your books with the bank statement.'),
        line('02:10', 'Las diferencias suelen venir de transferencias en tránsito, comisiones bancarias y consignaciones sin identificar.', 'Differences usually come from transfers in transit, bank fees and unidentified deposits.'),
        line('04:40', 'Registra las comisiones y los intereses que aparecen en el extracto y no estaban en tu contabilidad.', 'Record the fees and interest that appear on the statement and were missing from your books.'),
        line('07:15', 'Cuando el saldo conciliado coincide, cierras el mes y generas tus estados financieros.', 'When the reconciled balance matches, you close the month and produce your financial statements.'),
      ]),
    ]),
    mod('contabilidad-m3', l('Evaluación', 'Assessment'), [quizLesson(CT, 5)]),
  ],
  quiz: [
    q('contabilidad-q1', 'contabilidad-l1', l('¿Cuál es la ecuación contable?', 'What is the accounting equation?'), [
      l('Activo = pasivo + patrimonio', 'Assets = liabilities + equity'),
      l('Ingresos = gastos', 'Revenue = expenses'),
      l('Activo = ingresos − gastos', 'Assets = revenue − expenses'),
      l('Pasivo = patrimonio − activo', 'Liabilities = equity − assets'),
    ], 0),
    q('contabilidad-q2', 'contabilidad-l2', l('Compras mercancía de contado. ¿Qué registras?', 'You buy goods in cash. What do you record?'), [
      l('Débito a bancos y crédito a inventario', 'Debit bank and credit inventory'),
      l('Solo un débito a inventario', 'Only a debit to inventory'),
      l('Débito a inventario y crédito a bancos', 'Debit inventory and credit bank'),
      l('Débito a ingresos', 'Debit revenue'),
    ], 2),
    q('contabilidad-q3', 'contabilidad-l3', l('¿Qué código identifica de forma única una factura electrónica en Colombia?', 'Which code uniquely identifies an electronic invoice in Colombia?'), [
      l('El RUT', 'The RUT'),
      l('El CUFE', 'The CUFE'),
      l('El PUC', 'The PUC'),
      l('La cédula del comprador', 'The buyer’s ID number'),
    ], 1),
    q('contabilidad-q4', 'contabilidad-l4', l('¿Qué compara la conciliación bancaria?', 'What does the bank reconciliation compare?'), [
      l('Las ventas con los gastos', 'Sales with expenses'),
      l('El inventario con las compras', 'Inventory with purchases'),
      l('La nómina con la seguridad social', 'Payroll with social security'),
      l('El saldo de bancos en tu contabilidad con el extracto del banco', 'The bank balance in your books with the bank statement'),
    ], 3),
  ],
  suggestions: [
    l('¿Qué es la partida doble?', 'What is double-entry bookkeeping?'),
    l('¿Cómo hago la conciliación bancaria?', 'How do I do the bank reconciliation?'),
    l('¿Qué datos lleva una factura electrónica?', 'What data does an electronic invoice include?'),
  ],
};

// ---------------------------------------------------------------------------
// 5. Servicio al cliente y ventas por WhatsApp
// ---------------------------------------------------------------------------
const SV = 'servicio';
const servicio: Course = {
  id: SV,
  title: l('Servicio al cliente y ventas por WhatsApp', 'Customer service and sales on WhatsApp'),
  desc: l(
    'Atiende rápido, ordena tus conversaciones y convierte más mensajes en ventas sin perder el trato humano.',
    'Reply fast, organize your conversations and turn more messages into sales without losing the human touch.',
  ),
  instructor: 'Natalia Ospina',
  instructorBio: l('Líder de experiencia de cliente; ha formado equipos de servicio en comercio y servicios.', 'Customer experience lead; has trained service teams in retail and services.'),
  category: l('Ventas', 'Sales'),
  level: 'beginner',
  mode: 'cohort',
  hours: 16,
  price: 240000,
  rating: 4.9,
  reviews: 65,
  gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
  skills: [
    l('Responder rápido con respuestas guardadas', 'Reply fast with saved replies'),
    l('Usar etiquetas para ordenar conversaciones', 'Use labels to organize conversations'),
    l('Hacer seguimiento sin ser invasivo', 'Follow up without being pushy'),
    l('Manejar la objeción de precio', 'Handle price objections'),
  ],
  requirements: [l('Una cuenta de WhatsApp Business (la versión gratuita sirve).', 'A WhatsApp Business account (the free version works).')],
  modules: [
    mod('servicio-m1', l('Atención', 'Service'), [
      video(SV, 1, l('Tiempos de respuesta y respuestas rápidas', 'Response times and quick replies'), '06:50', [
        line('00:00', 'El cliente que escribe por WhatsApp espera respuesta rápida: si tardas horas, probablemente ya le compró a otro.', 'Customers who write on WhatsApp expect a quick answer: if you take hours, they probably bought elsewhere.'),
        line('01:30', 'Configura un mensaje de bienvenida y uno de ausencia con tu horario de atención.', 'Set up a greeting message and an away message with your business hours.'),
        line('03:00', 'Guarda respuestas rápidas para las preguntas frecuentes: precios, horarios, medios de pago y envíos.', 'Save quick replies for frequent questions: prices, hours, payment methods and shipping.'),
        line('05:10', 'Personaliza siempre la respuesta rápida con el nombre del cliente y su pregunta concreta.', 'Always personalize the quick reply with the customer’s name and their specific question.'),
      ]),
      video(SV, 2, l('Etiquetas y seguimiento', 'Labels and follow-up'), '07:40', [
        line('00:00', 'Usa etiquetas para saber en qué va cada conversación: nuevo, cotizado, pagado y entregado.', 'Use labels to know where each conversation stands: new, quoted, paid and delivered.'),
        line('02:10', 'Revisa cada día las conversaciones en "cotizado": son ventas que están a un mensaje de cerrarse.', 'Check the "quoted" conversations every day: they are sales one message away from closing.'),
        line('04:00', 'Haz seguimiento a las 24 horas con una pregunta útil, no con un "¿y entonces?".', 'Follow up after 24 hours with a useful question, not with a "so?".'),
        line('06:00', 'Después de la entrega, pide una calificación o un testimonio: alimenta tu contenido de prueba.', 'After delivery, ask for a rating or a testimonial: it feeds your proof content.'),
      ]),
    ]),
    mod('servicio-m2', l('Ventas', 'Sales'), [
      reading(SV, 3, l('Cómo responder a "está muy caro"', 'How to answer "it is too expensive"'), 5, [
        para('Cuando un cliente dice que está caro, casi nunca habla solo del precio: está comparando con algo o no ve el valor completo.', 'When a customer says it is expensive, they are rarely talking only about price: they are comparing with something or do not see the full value.'),
        para('Pregunta con qué lo está comparando y recuerda lo que incluye tu oferta: garantía, envío, acompañamiento o calidad.', 'Ask what they are comparing it with and remind them what your offer includes: warranty, shipping, support or quality.'),
        para('Si das un descuento, que sea a cambio de algo: pago anticipado, compra de mayor volumen o una referencia.', 'If you give a discount, get something in return: prepayment, a larger purchase or a referral.'),
      ]),
      video(SV, 4, l('Cierre y medios de pago', 'Closing and payment methods'), '08:15', [
        line('00:00', 'Cierra con una pregunta concreta: "¿te lo envío hoy o prefieres recogerlo mañana?".', 'Close with a specific question: "should I ship it today or would you rather pick it up tomorrow?".'),
        line('02:20', 'Ten listos tus medios de pago: transferencia, enlace de pago y pago contra entrega si aplica.', 'Have your payment methods ready: bank transfer, payment link and cash on delivery if it applies.'),
        line('04:30', 'Confirma el pedido por escrito con el resumen: producto, valor, dirección y fecha de entrega.', 'Confirm the order in writing with a summary: product, amount, address and delivery date.'),
        line('06:50', 'Registra cada venta en tu hoja de control para medir cuántas conversaciones terminan en compra.', 'Log each sale in your tracking sheet to measure how many conversations end in a purchase.'),
      ]),
    ]),
    mod('servicio-m3', l('Evaluación', 'Assessment'), [quizLesson(SV, 5)]),
  ],
  quiz: [
    q('servicio-q1', 'servicio-l1', l('¿Qué mensajes automáticos conviene configurar primero?', 'Which automatic messages should you set up first?'), [
      l('Bienvenida y ausencia con tu horario', 'Greeting and away messages with your hours'),
      l('Cadenas de promociones', 'Promotion chains'),
      l('Mensajes de cumpleaños', 'Birthday messages'),
      l('Ninguno', 'None'),
    ], 0),
    q('servicio-q2', 'servicio-l2', l('¿Qué conversaciones revisas cada día para cerrar ventas?', 'Which conversations do you check every day to close sales?'), [
      l('Las etiquetadas como "entregado"', 'Those labeled "delivered"'),
      l('Las etiquetadas como "cotizado"', 'Those labeled "quoted"'),
      l('Las archivadas', 'The archived ones'),
      l('Los grupos', 'Group chats'),
    ], 1),
    q('servicio-q3', 'servicio-l3', l('Si das un descuento, ¿cómo conviene hacerlo?', 'If you give a discount, how should you do it?'), [
      l('Siempre y a todos', 'Always and to everyone'),
      l('Nunca', 'Never'),
      l('A cambio de algo: pago anticipado, volumen o una referencia', 'In exchange for something: prepayment, volume or a referral'),
      l('Solo por nota de voz', 'Only by voice note'),
    ], 2),
    q('servicio-q4', 'servicio-l4', l('¿Qué incluye la confirmación del pedido?', 'What goes in the order confirmation?'), [
      l('Solo el precio', 'Only the price'),
      l('Producto, valor, dirección y fecha de entrega', 'Product, amount, address and delivery date'),
      l('Un sticker', 'A sticker'),
      l('La contraseña del cliente', 'The customer’s password'),
    ], 1),
  ],
  suggestions: [
    l('¿Qué hago si el cliente dice que está muy caro?', 'What do I do if the customer says it is too expensive?'),
    l('¿Cómo hago seguimiento sin ser invasivo?', 'How do I follow up without being pushy?'),
    l('¿Qué respuestas rápidas debo guardar?', 'Which quick replies should I save?'),
  ],
};

// ---------------------------------------------------------------------------
// 6. Protección de datos personales (Ley 1581)
// ---------------------------------------------------------------------------
const DT = 'datos';
const datos: Course = {
  id: DT,
  title: l('Protección de datos personales (Ley 1581)', 'Personal data protection (Law 1581)'),
  desc: l(
    'Aplica la Ley 1581 de 2012 en tu empresa: principios, autorización, derechos de los titulares e incidentes de seguridad.',
    'Apply Colombia’s Law 1581 of 2012 in your company: principles, consent, data subject rights and security incidents.',
  ),
  instructor: 'Daniela Rojas',
  instructorBio: l('Abogada especialista en protección de datos y cumplimiento.', 'Lawyer specialized in data protection and compliance.'),
  category: l('Cumplimiento', 'Compliance'),
  level: 'intermediate',
  mode: 'self-paced',
  hours: 12,
  price: 320000,
  rating: 4.8,
  reviews: 143,
  gradient: 'from-slate-700 via-slate-800 to-slate-900',
  skills: [
    l('Aplicar los principios de la Ley 1581', 'Apply the principles of Law 1581'),
    l('Pedir y conservar la autorización del titular', 'Request and keep the data subject’s consent'),
    l('Atender consultas y reclamos a tiempo', 'Answer inquiries and claims on time'),
    l('Gestionar incidentes de seguridad', 'Handle security incidents'),
  ],
  requirements: [l('Ninguno. Útil para las áreas comercial, de talento humano y de servicio.', 'None. Useful for sales, HR and service teams.')],
  modules: [
    mod('datos-m1', l('Marco legal', 'Legal framework'), [
      video(DT, 1, l('Principios de la Ley 1581 de 2012', 'Principles of Law 1581 of 2012'), '09:10', [
        line('00:00', 'La Ley 1581 de 2012 regula el tratamiento de datos personales en Colombia; la autoridad de vigilancia es la Superintendencia de Industria y Comercio (SIC).', 'Law 1581 of 2012 regulates the processing of personal data in Colombia; the supervisory authority is the Superintendence of Industry and Commerce (SIC).'),
        line('02:20', 'Sus principios incluyen legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad.', 'Its principles include legality, purpose, freedom, accuracy, transparency, restricted access and circulation, security and confidentiality.'),
        line('04:30', 'Finalidad significa que solo usas los datos para lo que le informaste al titular; si quieres usarlos para otra cosa, necesitas una nueva autorización.', 'Purpose means you only use the data for what you told the data subject; to use it for something else you need new consent.'),
        line('06:50', 'Los datos sensibles, como los de salud o los biométricos, tienen protección reforzada y el titular no está obligado a autorizar su tratamiento.', 'Sensitive data, such as health or biometric data, has stronger protection and the data subject is not required to consent to its processing.'),
      ]),
      video(DT, 2, l('La autorización del titular', 'The data subject’s consent'), '08:30', [
        line('00:00', 'Para tratar datos personales necesitas la autorización previa, expresa e informada del titular, salvo las excepciones de la ley.', 'To process personal data you need the data subject’s prior, express and informed consent, except in the cases the law exempts.'),
        line('02:00', 'Informada quiere decir que el titular sabe quién trata sus datos, para qué, cuáles son sus derechos y cómo ejercerlos.', 'Informed means the data subject knows who processes the data, for what, what their rights are and how to exercise them.'),
        line('03:12', 'Debes conservar la prueba de la autorización: un formulario firmado, una casilla marcada en la web o la grabación de una llamada.', 'You must keep proof of consent: a signed form, a ticked box on the website or a call recording.'),
        line('06:00', 'Una casilla que ya viene marcada no demuestra una autorización expresa: el titular debe marcarla por decisión propia.', 'A pre-ticked box does not prove express consent: the data subject must tick it on their own.'),
      ]),
    ]),
    mod('datos-m2', l('Derechos e incidentes', 'Rights and incidents'), [
      reading(DT, 3, l('Derechos de los titulares y tiempos de respuesta', 'Data subject rights and response times'), 7, [
        para('El titular puede conocer, actualizar y rectificar sus datos, pedir prueba de la autorización, ser informado del uso, revocar la autorización o pedir la supresión cuando proceda, y presentar quejas ante la SIC.', 'Data subjects can access, update and correct their data, request proof of consent, be told how it is used, revoke consent or request deletion when applicable, and file complaints with the SIC.'),
        para('Las consultas se responden en máximo 10 días hábiles, prorrogables hasta 5 días hábiles más, avisando al titular.', 'Inquiries must be answered within 10 business days, extendable by up to 5 more business days after notifying the data subject.'),
        para('Los reclamos se resuelven en máximo 15 días hábiles, prorrogables hasta 8 días hábiles más, avisando al titular.', 'Claims must be resolved within 15 business days, extendable by up to 8 more business days after notifying the data subject.'),
      ]),
      video(DT, 4, l('Incidentes de seguridad', 'Security incidents'), '08:00', [
        line('00:00', 'Un incidente de seguridad es una violación de los códigos de seguridad, la pérdida, el robo o el acceso no autorizado a una base de datos personales.', 'A security incident is a breach of security codes, or the loss, theft or unauthorized access to a personal database.'),
        line('02:15', 'Ante un incidente, contén el problema, identifica qué datos y qué titulares se afectaron y documenta lo ocurrido.', 'When an incident happens, contain it, identify which data and data subjects were affected, and document what happened.'),
        line('04:20', 'El responsable debe reportar el incidente a la SIC, a través del Registro Nacional de Bases de Datos, dentro de los 15 días hábiles siguientes a su detección.', 'The controller must report the incident to the SIC through the National Database Registry within 15 business days of detecting it.'),
        line('06:30', 'Revisa qué falló y ajusta tus medidas de seguridad para que no se repita.', 'Review what failed and adjust your security measures so it does not happen again.'),
      ]),
    ]),
    mod('datos-m3', l('Evaluación', 'Assessment'), [quizLesson(DT, 5)]),
  ],
  quiz: [
    q('datos-q1', 'datos-l1', l('¿Qué entidad vigila el cumplimiento de la Ley 1581 en Colombia?', 'Which authority supervises compliance with Law 1581 in Colombia?'), [
      l('La DIAN', 'The DIAN (tax authority)'),
      l('La Superintendencia de Industria y Comercio (SIC)', 'The Superintendence of Industry and Commerce (SIC)'),
      l('El Ministerio del Trabajo', 'The Ministry of Labor'),
      l('La Registraduría', 'The National Civil Registry'),
    ], 1),
    q('datos-q2', 'datos-l2', l('¿Cómo debe ser la autorización del titular?', 'What must the data subject’s consent be like?'), [
      l('Previa, expresa e informada', 'Prior, express and informed'),
      l('Verbal y posterior', 'Verbal and after the fact'),
      l('Tácita', 'Implied'),
      l('Solo para datos públicos', 'Only for public data'),
    ], 0),
    q('datos-q3', 'datos-l3', l('¿En cuántos días hábiles se responde una consulta, como máximo, antes de prórroga?', 'Within how many business days must an inquiry be answered, before any extension?'), [
      l('5', '5'),
      l('10', '10'),
      l('15', '15'),
      l('30', '30'),
    ], 1),
    q('datos-q4', 'datos-l4', l('¿Dónde se reporta un incidente de seguridad?', 'Where is a security incident reported?'), [
      l('En la DIAN', 'To the DIAN'),
      l('En una notaría', 'At a notary office'),
      l('Ante la SIC, en el Registro Nacional de Bases de Datos', 'To the SIC, through the National Database Registry'),
      l('No se reporta', 'It is not reported'),
    ], 2),
  ],
  suggestions: [
    l('¿Qué debe tener una autorización válida?', 'What makes consent valid?'),
    l('¿Cuánto tiempo tengo para responder un reclamo?', 'How long do I have to answer a claim?'),
    l('¿Qué hago ante un incidente de seguridad?', 'What do I do after a security incident?'),
  ],
};

export const COURSES: Course[] = [finanzas, excel, marketing, contabilidad, servicio, datos];

/** Siguiente curso recomendado al aprobar (ruta adaptativa). */
export const NEXT_COURSE: Record<string, string> = {
  finanzas: 'contabilidad',
  excel: 'finanzas',
  marketing: 'servicio',
  contabilidad: 'finanzas',
  servicio: 'marketing',
  datos: 'servicio',
};

// ---------------------------------------------------------------------------
// Clases en vivo (sala simulada)
// ---------------------------------------------------------------------------
export interface LiveTemplate {
  id: string;
  courseId: string;
  title: L;
  /** null = empezó hace `startedMinAgo` minutos (está en vivo). */
  dayOffset: number | null;
  time: string;
  startedMinAgo?: number;
  durationMin: number;
  rooms: number;
  attendees: number;
  script: L[];
}

export const LIVE: LiveTemplate[] = [
  {
    id: 'live-marketing',
    courseId: MK,
    title: l('Clínica de contenido: mejoramos tus publicaciones', 'Content clinic: we improve your posts'),
    dayOffset: null,
    time: '',
    startedMinAgo: 20,
    durationMin: 90,
    rooms: 4,
    attendees: 38,
    script: [
      l('Bienvenidos. Hoy revisamos publicaciones de sus negocios y las mejoramos en vivo.', 'Welcome. Today we review posts from your businesses and improve them live.'),
      l('Primera regla: la primera línea debe decir para quién es la publicación y qué gana esa persona.', 'First rule: the first line must say who the post is for and what that person gains.'),
      l('Ahora pasamos a salas de trabajo de cuatro personas durante diez minutos.', 'Now we move to breakout rooms of four people for ten minutes.'),
      l('En cada sala, cada uno muestra una publicación y recibe dos sugerencias concretas.', 'In each room, everyone shows one post and gets two specific suggestions.'),
      l('De vuelta en la sala principal: compartan la mejor idea que les dieron.', 'Back in the main room: share the best idea you got.'),
    ],
  },
  {
    id: 'live-finanzas',
    courseId: FIN,
    title: l('Taller: arma tu flujo de caja de tres meses', 'Workshop: build your three-month cash flow'),
    dayOffset: 1,
    time: '19:00',
    durationMin: 90,
    rooms: 3,
    attendees: 52,
    script: [],
  },
  {
    id: 'live-servicio',
    courseId: SV,
    title: l('Respuestas rápidas que venden', 'Quick replies that sell'),
    dayOffset: 3,
    time: '18:30',
    durationMin: 60,
    rooms: 2,
    attendees: 27,
    script: [],
  },
];

/** Compañeros de la cohorte de ejemplo (tabla de clasificación). */
export const CLASSMATES: { name: string; xp: number }[] = [
  { name: 'Mariana Gómez', xp: 1480 },
  { name: 'Juan Esteban Díaz', xp: 1210 },
  { name: 'Sofía Hernández', xp: 1060 },
  { name: 'Santiago Rojas', xp: 940 },
  { name: 'Camila Ríos', xp: 690 },
  { name: 'Andrés Muñoz', xp: 610 },
  { name: 'Laura Zapata', xp: 520 },
  { name: 'Mateo Arango', xp: 410 },
  { name: 'Valeria Quintero', xp: 330 },
];

export const FIRST_NAMES = [
  'Mariana', 'Juan Esteban', 'Sofía', 'Santiago', 'Valeria', 'Sebastián', 'Daniela', 'Andrés', 'Camila', 'Felipe',
  'Laura', 'Mateo', 'Isabella', 'Nicolás', 'Gabriela', 'Alejandro', 'Paula', 'Julián', 'Natalia', 'David',
  'Carolina', 'Miguel Ángel', 'Luisa Fernanda', 'Juan Pablo', 'María José', 'Esteban', 'Manuela', 'Simón', 'Ana María', 'Tomás',
];
export const LAST_NAMES = [
  'Gómez', 'Rodríguez', 'Martínez', 'López', 'García', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Rojas',
  'Vargas', 'Castro', 'Ortiz', 'Jiménez', 'Ramírez', 'Torres', 'Suárez', 'Ríos', 'Cárdenas', 'Restrepo',
  'Zapata', 'Arango', 'Ospina', 'Quintero', 'Valencia', 'Mejía', 'Salazar', 'Henao', 'Londoño', 'Gutiérrez',
];
export const CITIES = ['Pereira', 'Manizales', 'Armenia', 'Medellín', 'Bogotá', 'Cali', 'Bucaramanga', 'Barranquilla', 'Ibagué', 'Cartagena'];

/** Tamaño de la cohorte de ejemplo por curso. */
export const COHORT_SIZE: Record<string, number> = {
  finanzas: 64,
  excel: 118,
  marketing: 86,
  contabilidad: 52,
  servicio: 41,
  datos: 73,
};
