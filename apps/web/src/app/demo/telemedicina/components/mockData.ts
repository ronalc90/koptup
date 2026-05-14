import { LabRow, QueuePatient } from './types';

export const INITIAL_QUEUE: QueuePatient[] = [
  {
    id: 'p1', name: 'María González', age: 54, doc: 'CC 41.220.118', blood: 'O+', insurance: 'Sura',
    reason: 'Dolor torácico opresivo', priority: 'red', waitingSince: 4,
    allergies: ['Penicilina'], history: ['HTA', 'Dislipidemia'],
    meds: [{ name: 'Losartán', dose: '50mg', freq: 'c/24h' }, { name: 'Atorvastatina', dose: '20mg', freq: 'noche' }],
    vitals: { hr: 102, bp: '152/96', spo2: 95, temp: 36.8, steps: 1842, sleep: 5.4 },
    pastConsults: [
      { date: '2026-04-12', specialty: 'Cardiología', notes: 'Control HTA. Ajuste de dosis.' },
      { date: '2026-02-03', specialty: 'Medicina general', notes: 'Cefalea tensional.' },
    ],
  },
  {
    id: 'p2', name: 'Carlos Rodríguez', age: 38, doc: 'CC 1.020.554.881', blood: 'A+', insurance: 'Sanitas',
    reason: 'Tos seca y fiebre 38.5°C', priority: 'yellow', waitingSince: 9,
    allergies: [], history: ['Asma leve'],
    meds: [{ name: 'Salbutamol', dose: '100mcg', freq: 'PRN' }],
    vitals: { hr: 92, bp: '124/80', spo2: 96, temp: 38.4, steps: 3210, sleep: 6.8 },
    pastConsults: [{ date: '2025-11-22', specialty: 'Neumología', notes: 'Exacerbación leve de asma.' }],
  },
  {
    id: 'p3', name: 'Ana Martínez', age: 29, doc: 'CC 1.018.477.230', blood: 'B-', insurance: 'Sura',
    reason: 'Erupción cutánea pruriginosa', priority: 'green', waitingSince: 16,
    allergies: ['Sulfas'], history: ['Dermatitis atópica'],
    meds: [],
    vitals: { hr: 76, bp: '118/72', spo2: 99, temp: 36.5, steps: 6541, sleep: 7.5 },
    pastConsults: [{ date: '2025-08-04', specialty: 'Dermatología', notes: 'Brote leve. Hidratación.' }],
  },
  {
    id: 'p4', name: 'Pedro López', age: 67, doc: 'CC 17.332.901', blood: 'AB+', insurance: 'Compensar',
    reason: 'Mareo y visión borrosa', priority: 'yellow', waitingSince: 12,
    allergies: ['Aspirina'], history: ['DM2', 'HTA'],
    meds: [{ name: 'Metformina', dose: '850mg', freq: 'c/12h' }, { name: 'Enalapril', dose: '10mg', freq: 'c/24h' }],
    vitals: { hr: 88, bp: '148/92', spo2: 97, temp: 36.6, steps: 920, sleep: 6.1 },
    pastConsults: [{ date: '2026-03-30', specialty: 'Endocrinología', notes: 'Control glicémico.' }],
  },
  {
    id: 'p5', name: 'Laura Pérez', age: 8, doc: 'TI 1.135.220.776', blood: 'O+', insurance: 'Salud Total',
    reason: 'Otalgia derecha', priority: 'green', waitingSince: 22,
    allergies: [], history: ['Otitis recurrente'],
    meds: [],
    vitals: { hr: 104, bp: '102/64', spo2: 99, temp: 37.4, steps: 0, sleep: 9.2 },
    pastConsults: [{ date: '2025-12-18', specialty: 'Pediatría', notes: 'Otitis media aguda.' }],
  },
];

export const LAB_ROWS: LabRow[] = [
  { test: 'Hemoglobina', value: '11.2 g/dL', ref: '12.0 - 16.0', flag: 'low', date: '2026-05-10', source: 'FHIR' },
  { test: 'Hematocrito', value: '34%', ref: '36 - 46', flag: 'low', date: '2026-05-10', source: 'FHIR' },
  { test: 'Glucosa', value: '186 mg/dL', ref: '70 - 110', flag: 'high', date: '2026-05-10', source: 'FHIR' },
  { test: 'Creatinina', value: '0.9 mg/dL', ref: '0.6 - 1.2', flag: 'normal', date: '2026-05-10', source: 'HL7' },
  { test: 'TSH', value: '4.1 mUI/L', ref: '0.4 - 4.0', flag: 'high', date: '2026-05-08', source: 'FHIR' },
  { test: 'Troponina I', value: '0.45 ng/mL', ref: '< 0.04', flag: 'critical', date: '2026-05-10', source: 'HL7' },
  { test: 'Colesterol total', value: '198 mg/dL', ref: '< 200', flag: 'normal', date: '2026-05-08', source: 'FHIR' },
  { test: 'PCR', value: '12.4 mg/L', ref: '< 5.0', flag: 'high', date: '2026-05-09', source: 'FHIR' },
];
