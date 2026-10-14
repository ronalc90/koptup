/**
 * Lógica de la demo de telemedicina: valores por pagador, jornada de hoy y reloj de la demo,
 * agenda con festivos, orientación de síntomas por reglas, sala de espera, alertas de alergia,
 * indicadores y RIPS simulado.
 */
import {
  addDays,
  allergyConflicts,
  assignSpec,
  billingTotals,
  classifySymptoms,
  clockAt,
  computeKpis,
  dayStatus,
  fileSlug,
  fmtCOP,
  fmtDate,
  holidaysCO,
  priceFor,
  queuePosition,
  ripsFor,
  shiftIso,
  slotsFor,
  sortQueue,
  toCsv,
  todayInBogota,
  waitMinutes,
} from '../components/logic';
import { BASE_DATE, INITIAL_ATTENTIONS, INITIAL_PATIENTS, SPECIALTIES } from '../components/mockData';
import { initialState } from '../components/store';
import type { PayerKind } from '../components/types';

const NAMES_ES = { months: 'ene,feb,mar,abr,may,jun,jul,ago,sep,oct,nov,dic'.split(','), weekdays: 'dom,lun,mar,mié,jue,vie,sáb'.split(',') };
const NAMES_EN = { months: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','), weekdays: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',') };

describe('valores por pagador', () => {
  it('siempre cuadran: valor = paciente + pagador', () => {
    for (const s of SPECIALTIES) {
      for (const kind of ['eps', 'prepaid', 'private'] as PayerKind[]) {
        const p = priceFor(s.key, kind);
        expect(p.patient + p.payer).toBe(p.value);
        expect(p.patient).toBeGreaterThan(0);
      }
    }
    expect(priceFor('general', 'eps')).toEqual({ value: 45000, patient: 5200, payer: 39800 });
    expect(priceFor('general', 'private')).toEqual({ value: 65000, patient: 65000, payer: 0 });
  });

  it('las atenciones de ejemplo cuadran y los totales coinciden', () => {
    INITIAL_ATTENTIONS.forEach((a) => expect(a.patientShare + a.payerShare).toBe(a.value));
    expect(billingTotals(INITIAL_ATTENTIONS)).toEqual({ collected: 100400, pending: 93000, payers: 166600, total: 360000 });
    expect(computeKpis(INITIAL_PATIENTS, INITIAL_ATTENTIONS, BASE_DATE, '09:30')).toEqual({ waiting: 5, avgWait: 13, done: 5, pending: 93000 });
    // La espera promedio sube con el reloj de la demo.
    expect(computeKpis(INITIAL_PATIENTS, INITIAL_ATTENTIONS, BASE_DATE, '09:40').avgWait).toBe(23);
  });

  it('cada paciente se factura con la tarifa de su especialidad', () => {
    const laura = INITIAL_PATIENTS.find((p) => p.id === 'p5')!;
    const ana = INITIAL_PATIENTS.find((p) => p.id === 'p3')!;
    expect(laura.spec).toBe('pedia');
    expect(priceFor(laura.spec, 'eps')).toEqual({ value: 62000, patient: 5200, payer: 56800 });
    expect(ana.spec).toBe('derma');
    expect(priceFor(ana.spec, 'prepaid')).toEqual({ value: 98000, patient: 28000, payer: 70000 });
  });

  it('formatea pesos sin depender de Intl', () => {
    expect(fmtCOP(1234567, 'es')).toBe('$ 1.234.567');
    expect(fmtCOP(65000, 'en')).toBe('COP 65,000');
  });
});

describe('agenda', () => {
  it('calcula los festivos de Colombia de cualquier año (Ley 51 de 1983)', () => {
    expect([...holidaysCO(2026)].sort()).toEqual(
      [
        '2026-01-01',
        '2026-01-12',
        '2026-03-23',
        '2026-04-02',
        '2026-04-03',
        '2026-05-01',
        '2026-05-18',
        '2026-06-08',
        '2026-06-15',
        '2026-06-29',
        '2026-07-20',
        '2026-08-07',
        '2026-08-17',
        '2026-10-12',
        '2026-11-02',
        '2026-11-16',
        '2026-12-08',
        '2026-12-25',
      ].sort(),
    );
    const y2027 = holidaysCO(2027);
    expect(y2027.size).toBe(18);
    // Pascua 2027: 28 de marzo → Jueves y Viernes Santo el 25 y 26 de marzo.
    expect(y2027.has('2027-03-25')).toBe(true);
    expect(y2027.has('2027-03-26')).toBe(true);
    // Reyes 2027 cae miércoles 6 → se pasa al lunes 11.
    expect(y2027.has('2027-01-11')).toBe(true);
  });

  it('reconoce festivos, domingos y sábados de 2026', () => {
    expect(dayStatus('2026-10-12')).toBe('holiday');
    expect(dayStatus('2026-10-11')).toBe('sunday');
    expect(dayStatus('2026-10-10')).toBe('saturday');
    expect(dayStatus('2026-10-13')).toBe('open');
    expect(addDays('2026-10-08', 5)).toBe('2026-10-13');
  });

  it('no ofrece horarios en festivos ni domingos, y hoy solo después de la hora actual', () => {
    const today = '2026-10-08';
    expect(slotsFor('general', '2026-10-12', today, '09:30')).toEqual([]);
    expect(slotsFor('general', '2026-10-11', today, '09:30')).toEqual([]);
    expect(slotsFor('general', today, today, '09:30').every((s) => s.time > '09:30')).toBe(true);
    expect(slotsFor('general', today, today, '14:10').every((s) => s.time > '14:10')).toBe(true);
    expect(slotsFor('general', '2026-10-10', today, '09:30').every((s) => s.time < '12:00')).toBe(true);
    expect(slotsFor('derma', '2026-10-13', today, '09:30')).toEqual(slotsFor('derma', '2026-10-13', today, '15:00'));
  });

  it('formatea fechas en es y en', () => {
    expect(fmtDate('2026-10-08', 'es', NAMES_ES, { weekday: true, year: true })).toBe('jue 8 oct 2026');
    expect(fmtDate('2026-10-08', 'en', NAMES_EN, { weekday: true })).toBe('Thu, Oct 8');
  });
});

describe('jornada de hoy y reloj de la demo', () => {
  it('la fecha de hoy sale en la zona de Colombia', () => {
    // 14 oct 2026 03:00 UTC = 13 oct 2026 22:00 en Bogotá.
    expect(todayInBogota(new Date(Date.UTC(2026, 9, 14, 3, 0)))).toBe('2026-10-13');
    expect(todayInBogota(new Date(Date.UTC(2026, 9, 14, 15, 0)))).toBe('2026-10-14');
  });

  it('el reloj arranca a las 09:30, avanza en tiempo real y no pasa de la medianoche', () => {
    const start = Date.UTC(2026, 9, 14, 12, 0);
    expect(clockAt(0, start)).toBe('09:30');
    expect(clockAt(start, start + 75_000, true)).toBe('09:31:15');
    expect(clockAt(start, start + 3 * 3600_000)).toBe('12:30');
    expect(clockAt(start, start + 20 * 3600_000, true)).toBe('23:59:59');
  });

  it('corre los datos de ejemplo a la jornada de hoy', () => {
    expect(shiftIso('2026-09-28', '2026-10-14')).toBe('2026-10-04');
    const s = initialState('2027-02-03', 1);
    expect(s.day).toBe('2027-02-03');
    expect(s.attentions.every((a) => a.date === '2027-02-03')).toBe(true);
    expect(s.attentions[0].id).toBe('AT-2027-1041');
    expect(s.attentions[0].rx?.number).toBe('RX-2027-0146');
    const pedro = s.patients.find((p) => p.id === 'p4')!;
    expect(pedro.labs[0].date).toBe('2027-01-24');
    // Los datos base no se modifican.
    expect(INITIAL_ATTENTIONS[0].date).toBe(BASE_DATE);
  });
});

describe('sala de espera', () => {
  it('ordena por prioridad y hora de llegada, y mide la espera con el reloj de la demo', () => {
    const order = sortQueue(INITIAL_PATIENTS).map((p) => p.name);
    expect(order).toEqual(['María González', 'Pedro López', 'Carlos Rodríguez', 'Laura Pérez', 'Ana Martínez']);
    expect(waitMinutes(INITIAL_PATIENTS[0], '09:30')).toBe(4);
    expect(waitMinutes(INITIAL_PATIENTS[0], '10:00')).toBe(34);
  });

  it('el turno aproximado no cuenta a los pacientes con signo de alarma', () => {
    expect(queuePosition(INITIAL_PATIENTS, 'yellow')).toBe(3);
    expect(queuePosition(INITIAL_PATIENTS, 'green')).toBe(5);
    expect(queuePosition(INITIAL_PATIENTS, 'red')).toBe(0);
  });

  it('asigna la especialidad de quien llega sin cita', () => {
    expect(assignSpec(classifySymptoms('Me duele el oído'), 6)).toBe('pedia');
    expect(assignSpec(classifySymptoms('Me duele el oído'), 40)).toBe('general');
    expect(assignSpec(classifySymptoms('Erupción con picazón'), 30)).toBe('derma');
    expect(assignSpec(classifySymptoms('Tos y fiebre'), 9)).toBe('pedia');
    expect(assignSpec(classifySymptoms('Ansiedad'), 25)).toBe('psych');
  });
});

describe('orientación de síntomas', () => {
  it('los signos de alarma derivan a urgencias sin especialidad para agendar', () => {
    const r = classifySymptoms('Dolor en el pecho y dificultad para respirar');
    expect(r).toMatchObject({ urgency: 'red', alarm: true, specs: [] });
    expect(classifySymptoms('I have chest pain').alarm).toBe(true);
  });

  it('clasifica síntomas comunes', () => {
    expect(classifySymptoms('Tos seca y fiebre de 38 °C')).toMatchObject({ urgency: 'yellow', rule: 'resp' });
    expect(classifySymptoms('Erupción en la piel con picazón')).toMatchObject({ rule: 'skin', specs: ['derma'] });
    expect(classifySymptoms('Ansiedad y no puedo dormir').specs).toEqual(['psych']);
    expect(classifySymptoms('Me duele el oído derecho').rule).toBe('ear');
    expect(classifySymptoms('I have had headaches for years').rule).toBe('head');
    expect(classifySymptoms('algo raro').rule).toBe('default');
  });
});

describe('seguridad del paciente', () => {
  it('detecta alergias también en medicamentos escritos a mano', () => {
    const ana = INITIAL_PATIENTS.find((p) => p.id === 'p3')!;
    const maria = INITIAL_PATIENTS.find((p) => p.id === 'p1')!;
    const pedro = INITIAL_PATIENTS.find((p) => p.id === 'p4')!;
    expect(allergyConflicts(ana, [{ name: 'Trimetoprim/sulfametoxazol 160/800 mg' }])).toEqual(['sulfa']);
    expect(allergyConflicts(maria, [{ name: 'amoxicilina 875 mg' }])).toEqual(['penicillin']);
    expect(allergyConflicts(pedro, [{ name: 'Ibuprofeno 400 mg' }])).toEqual(['nsaid']);
    expect(allergyConflicts(pedro, [{ name: 'Acetaminofén 500 mg' }])).toEqual([]);
  });
});

describe('exportaciones', () => {
  it('RIPS simulado con diagnóstico sin punto y sin cuota para particulares', () => {
    const particular = INITIAL_ATTENTIONS.find((a) => a.payerId === 'particular')!;
    const rips = ripsFor(particular);
    const consulta = rips.usuarios[0].servicios.consultas[0];
    expect(consulta.valorPagoModerador).toBe(0);
    expect(consulta.codDiagnosticoPrincipal).toBe(particular.dx!.code.replace('.', ''));
    expect(rips.numDocumentoIdObligado).toBe('901487236');
  });

  it('CSV con comillas y nombres de archivo seguros', () => {
    expect(toCsv([['a', 'b,c'], [1, 'd"e']])).toBe('a,"b,c"\n1,"d""e"');
    expect(fileSlug('Carlos Rodríguez')).toBe('carlos-rodriguez');
  });
});
