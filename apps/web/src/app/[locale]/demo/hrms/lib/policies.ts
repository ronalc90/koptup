/**
 * Reglamento interno y políticas de EJEMPLO de la empresa ficticia. Son la
 * única fuente del asistente "Pregúntale a Gestión Humana". Las cifras
 * legales citadas son de referencia general y se validan en cada proyecto.
 */
export interface PolicyDoc {
  name: string;
  text: string;
}

const ES: PolicyDoc[] = [
  {
    name: 'Reglamento interno - Capítulo VII Vacaciones',
    text: `Reglamento interno de trabajo de Alimentos Valdeora S.A.S. (documento de ejemplo).
Capítulo VII. Vacaciones.
Artículo 30. Todo colaborador con contrato laboral tiene derecho a quince (15) días hábiles consecutivos de vacaciones remuneradas por cada año de servicio. Los días se causan de forma proporcional desde la fecha de ingreso. Para la empresa son días hábiles de lunes a viernes, sin contar domingos ni festivos.
Artículo 31. Las vacaciones se solicitan desde la app del colaborador con al menos quince (15) días calendario de anticipación. El jefe inmediato aprueba o rechaza la solicitud en un máximo de tres (3) días hábiles y la app muestra el estado y el saldo actualizado.
Artículo 32. Se pueden acumular vacaciones hasta por dos (2) años, siempre que se disfruten al menos seis (6) días hábiles continuos por año. Gestión Humana programará las vacaciones de quienes tengan más de dos periodos acumulados.
Artículo 33. Durante la temporada alta de producción (del 15 de noviembre al 20 de diciembre) las vacaciones del personal de planta solo se aprueban por casos excepcionales.
Artículo 34. Las vacaciones solo se compensan en dinero al terminar el contrato o en los casos que permite la ley.`,
  },
  {
    name: 'Reglamento interno - Capítulo VIII Permisos y licencias',
    text: `Capítulo VIII. Permisos y licencias (documento de ejemplo).
Artículo 40. Licencia de luto: cinco (5) días hábiles remunerados por el fallecimiento del cónyuge, compañero(a) permanente o familiares hasta el segundo grado de consanguinidad, primero de afinidad y primero civil (Ley 1280 de 2009).
Artículo 41. Licencia de maternidad de dieciocho (18) semanas y licencia de paternidad de dos (2) semanas, en los términos de la ley vigente.
Artículo 42. Permiso por calamidad doméstica: hasta dos (2) días remunerados; se informa al jefe inmediato el mismo día y se registra en la app.
Artículo 43. Citas médicas: se concede el tiempo necesario presentando el soporte de la EPS en la app.
Artículo 44. Jornada familiar: cada semestre el colaborador disfruta una jornada con su familia (Ley 1857 de 2017), programada por Gestión Humana.
Artículo 45. Las licencias no remuneradas se solicitan por escrito y no generan salario ni prestaciones por los días de la licencia.`,
  },
  {
    name: 'Reglamento interno - Capítulo V Jornada y horas extra',
    text: `Capítulo V. Jornada de trabajo y horas extra (documento de ejemplo).
Artículo 20. La jornada ordinaria de la empresa se ajusta a la jornada máxima legal vigente, que se reduce de forma gradual por la Ley 2101 de 2021. Los turnos de planta son rotativos y se publican con una semana de anticipación.
Artículo 21. Las horas extra solo se trabajan con autorización previa y por escrito del jefe inmediato y se reportan en la novedad de nómina de la quincena.
Artículo 22. El trabajo nocturno, dominical y festivo se paga con los recargos de ley vigentes en la fecha en que se trabaja.
Artículo 23. La nómina se paga por quincenas vencidas, los días 15 y último de cada mes, por transferencia a la cuenta registrada.`,
  },
  {
    name: 'Política de certificados y desprendibles',
    text: `Política de documentos del colaborador (documento de ejemplo).
1. El certificado laboral se descarga en la app del colaborador en cualquier momento, con o sin salario, y lleva la firma de la Jefe de Gestión Humana.
2. El desprendible de pago de cada quincena queda disponible en la app el mismo día del pago.
3. Para certificados de ingresos y retenciones del año anterior, la empresa los publica en la app antes del 31 de marzo.
4. Los cambios de cuenta bancaria, dirección o beneficiarios se solicitan en la app y se aplican en la siguiente quincena.`,
  },
  {
    name: 'Política de beneficios',
    text: `Política de beneficios (documento de ejemplo).
1. Auxilio de alimentación para el personal de planta y logística, entregado en la quincena.
2. Póliza de vida colectiva para todos los colaboradores, pagada por la empresa.
3. Medio día libre remunerado en la semana del cumpleaños, que se programa con el jefe inmediato.
4. Plan complementario de salud con aporte parcial de la empresa para cargos desde coordinación.
5. Los préstamos por libranza se solicitan a Gestión Humana y el descuento no puede superar el límite que permite la ley.`,
  },
];

const EN: PolicyDoc[] = [
  {
    name: 'Internal rules - Chapter VII Vacation',
    text: `Internal work rules of Alimentos Valdeora S.A.S. (sample document).
Chapter VII. Vacation.
Article 30. Every employee with an employment contract is entitled to fifteen (15) consecutive paid business days of vacation per year of service. Days accrue proportionally from the hire date. For the company, business days are Monday to Friday, excluding Sundays and public holidays.
Article 31. Vacation is requested in the employee app at least fifteen (15) calendar days in advance. The direct manager approves or rejects the request within three (3) business days and the app shows the status and the updated balance.
Article 32. Vacation can be accumulated for up to two (2) years, as long as at least six (6) consecutive business days are taken each year. HR will schedule vacation for anyone with more than two accumulated periods.
Article 33. During the production peak season (November 15 to December 20), vacation for plant staff is only approved in exceptional cases.
Article 34. Vacation is only paid out in cash when the contract ends or in the cases allowed by law.`,
  },
  {
    name: 'Internal rules - Chapter VIII Leave and permits',
    text: `Chapter VIII. Leave and permits (sample document).
Article 40. Bereavement leave: five (5) paid business days for the death of a spouse, permanent partner or relatives up to the second degree of consanguinity, first degree of affinity and first civil degree (Law 1280 of 2009).
Article 41. Maternity leave of eighteen (18) weeks and paternity leave of two (2) weeks, under current law.
Article 42. Family emergency leave: up to two (2) paid days; the direct manager is informed the same day and it is recorded in the app.
Article 43. Medical appointments: the necessary time is granted when the health provider's proof is uploaded to the app.
Article 44. Family day: every semester the employee enjoys a day with their family (Law 1857 of 2017), scheduled by HR.
Article 45. Unpaid leave is requested in writing and generates no salary or benefits for the days of leave.`,
  },
  {
    name: 'Internal rules - Chapter V Working hours and overtime',
    text: `Chapter V. Working hours and overtime (sample document).
Article 20. The company's ordinary working hours follow the current legal maximum, which is being reduced gradually by Law 2101 of 2021. Plant shifts rotate and are published one week in advance.
Article 21. Overtime is only worked with prior written authorization from the direct manager and is reported in the payroll changes of the pay period.
Article 22. Night, Sunday and holiday work is paid with the legal surcharges in force on the date it is worked.
Article 23. Payroll is paid twice a month in arrears, on the 15th and the last day of each month, by transfer to the registered account.`,
  },
  {
    name: 'Certificates and payslips policy',
    text: `Employee documents policy (sample document).
1. The employment certificate can be downloaded in the employee app at any time, with or without salary, and is signed by the HR Manager.
2. The payslip for each pay period is available in the app on payday.
3. Income and withholding certificates for the previous year are published in the app before March 31.
4. Changes of bank account, address or beneficiaries are requested in the app and applied in the next pay period.`,
  },
  {
    name: 'Benefits policy',
    text: `Benefits policy (sample document).
1. Meal allowance for plant and logistics staff, paid with each pay period.
2. Group life insurance for all employees, paid by the company.
3. Half a paid day off during the week of the employee's birthday, scheduled with the direct manager.
4. Supplementary health plan with a partial company contribution for coordinator-level roles and above.
5. Payroll loans are requested from HR and the deduction cannot exceed the legal limit.`,
  },
];

export function policyDocs(locale: string): PolicyDoc[] {
  return locale === 'en' ? EN : ES;
}
