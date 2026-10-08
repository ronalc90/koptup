/**
 * Lógica de la demo de telemedicina: valores por pagador, agenda con festivos,
 * orientación de síntomas por reglas, alertas de alergia, indicadores y RIPS simulado.
 */
import {
  addDays,
  allergyConflicts,
  billingTotals,
  classifySymptoms,
  computeKpis,
  dayStatus,
  fileSlug,
  fmtCOP,
  fmtDate,
  priceFor,
  ripsFor,
  slotsFor,
  toCsv,
} from '../components/logic';
import { INITIAL_ATTENTIONS, INITIAL_PATIENTS, SPECIALTIES } from '../components/mockData';
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
    expect(computeKpis(INITIAL_PATIENTS, INITIAL_ATTENTIONS)).toEqual({ waiting: 5, avgWait: 13, done: 5, pending: 93000 });
  });

  it('formatea pesos sin depender de Intl', () => {
    expect(fmtCOP(1234567, 'es')).toBe('$ 1.234.567');
    expect(fmtCOP(65000, 'en')).toBe('COP 65,000');
  });
});

describe('agenda', () => {
  it('reconoce festivos, domingos y sábados de 2026', () => {
    expect(dayStatus('2026-10-12')).toBe('holiday');
    expect(dayStatus('2026-10-11')).toBe('sunday');
    expect(dayStatus('2026-10-10')).toBe('saturday');
    expect(dayStatus('2026-10-13')).toBe('open');
    expect(addDays('2026-10-08', 5)).toBe('2026-10-13');
  });

  it('no ofrece horarios en festivos ni domingos, y hoy solo después de la hora actual', () => {
    expect(slotsFor('general', '2026-10-12')).toEqual([]);
    expect(slotsFor('general', '2026-10-11')).toEqual([]);
    expect(slotsFor('general', '2026-10-08').every((s) => s.time > '09:30')).toBe(true);
    expect(slotsFor('general', '2026-10-10').every((s) => s.time < '12:00')).toBe(true);
    expect(slotsFor('derma', '2026-10-13')).toEqual(slotsFor('derma', '2026-10-13'));
  });

  it('formatea fechas en es y en', () => {
    expect(fmtDate('2026-10-08', 'es', NAMES_ES, { weekday: true, year: true })).toBe('jue 8 oct 2026');
    expect(fmtDate('2026-10-08', 'en', NAMES_EN, { weekday: true })).toBe('Thu, Oct 8');
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
