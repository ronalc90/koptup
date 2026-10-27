/**
 * Negocios de ejemplo de la demo. Los nombres, NIT, direcciones, teléfonos y
 * personas son ficticios (los teléfonos usan el bloque 555, reservado para
 * ficción, y los correos el dominio example.com).
 */
import type { Business, PresetId, Shift } from './types';

/** Dígito de verificación de un NIT (algoritmo de la DIAN). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  const r = sum % 11;
  return r >= 2 ? 11 - r : r;
}

function nit(base: string): string {
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6)}-${nitDv(base)}`;
}

const h = (hh: number, mm = 0) => hh * 60 + mm;
const shift = (loc: string, start: number, end: number): Shift => ({ loc, start, end });
/** Turno partido con almuerzo. */
const split = (loc: string, a: number, b: number, c: number, d: number): Shift[] => [shift(loc, a, b), shift(loc, c, d)];

const odontologia: Business = {
  id: 'odontologia',
  name: 'Clínica Dental Arrayán',
  nit: nit('901482317'),
  sector: { es: 'Odontología', en: 'Dental clinic' },
  tagline: { es: 'Odontología general, higiene oral y ortodoncia', en: 'General dentistry, oral hygiene and orthodontics' },
  city: 'Bogotá',
  phone: '+57 601 555 0142',
  staffKind: 'professional',
  holidaysOpen: false,
  healthData: true,
  step: 30,
  leadMinutes: 60,
  cancelHours: 24,
  horizonDays: 60,
  locations: [
    { id: 'chapinero', name: 'Sede Chapinero', address: 'Calle 63 # 9-41, consultorio 302', city: 'Bogotá' },
    { id: 'cedritos', name: 'Sede Cedritos', address: 'Calle 140 # 13-25, local 104', city: 'Bogotá' },
  ],
  staff: [
    {
      id: 'laura',
      name: 'Dra. Laura Méndez',
      role: { es: 'Ortodoncista', en: 'Orthodontist' },
      color: 'violet',
      services: ['valoracion', 'ortodoncia', 'blanqueamiento'],
      schedule: {
        1: split('chapinero', h(7), h(12), h(13), h(17)),
        2: split('cedritos', h(9), h(13), h(14), h(19)),
        3: split('chapinero', h(7), h(12), h(13), h(17)),
        4: split('cedritos', h(9), h(13), h(14), h(19)),
        5: [shift('chapinero', h(7), h(13))],
        6: [shift('cedritos', h(8), h(13))],
      },
    },
    {
      id: 'andres',
      name: 'Dr. Andrés Rojas',
      role: { es: 'Odontólogo general', en: 'General dentist' },
      color: 'sky',
      services: ['valoracion', 'limpieza', 'blanqueamiento'],
      schedule: {
        1: split('chapinero', h(8), h(12), h(13), h(18)),
        2: split('chapinero', h(8), h(12), h(13), h(18)),
        3: split('chapinero', h(8), h(12), h(13), h(18)),
        4: split('chapinero', h(8), h(12), h(13), h(18)),
        5: split('chapinero', h(8), h(12), h(13), h(18)),
        6: [shift('chapinero', h(8), h(13))],
      },
    },
    {
      id: 'paola',
      name: 'Paola Gómez',
      role: { es: 'Higienista oral', en: 'Dental hygienist' },
      color: 'emerald',
      services: ['limpieza'],
      schedule: {
        1: split('cedritos', h(7), h(13), h(14), h(19)),
        2: split('cedritos', h(7), h(13), h(14), h(19)),
        3: split('cedritos', h(7), h(13), h(14), h(19)),
        4: split('cedritos', h(7), h(13), h(14), h(19)),
        5: split('cedritos', h(7), h(13), h(14), h(19)),
        6: [shift('cedritos', h(8), h(13))],
      },
    },
  ],
  services: [
    {
      id: 'valoracion',
      name: { es: 'Valoración odontológica', en: 'Dental check-up' },
      description: { es: 'Revisión completa y plan de tratamiento por escrito.', en: 'Full check-up and a written treatment plan.' },
      duration: 30,
      buffer: 10,
      price: 60000,
      deposit: 0,
      icon: 'search',
    },
    {
      id: 'limpieza',
      name: { es: 'Limpieza dental', en: 'Dental cleaning' },
      description: { es: 'Profilaxis, retiro de cálculos y pulido.', en: 'Prophylaxis, tartar removal and polishing.' },
      duration: 45,
      buffer: 15,
      price: 140000,
      deposit: 30,
      icon: 'sparkles',
    },
    {
      id: 'blanqueamiento',
      name: { es: 'Blanqueamiento dental', en: 'Teeth whitening' },
      description: { es: 'Sesión en consultorio con valoración previa.', en: 'In-office session with a prior assessment.' },
      duration: 90,
      buffer: 15,
      price: 650000,
      deposit: 30,
      icon: 'sun',
    },
    {
      id: 'ortodoncia',
      name: { es: 'Control de ortodoncia', en: 'Orthodontic check' },
      description: { es: 'Ajuste mensual de brackets o alineadores.', en: 'Monthly adjustment of braces or aligners.' },
      duration: 20,
      buffer: 10,
      price: 90000,
      deposit: 0,
      icon: 'wrench',
    },
  ],
};

const estetica: Business = {
  id: 'estetica',
  name: 'Casa Ámbar Spa',
  nit: nit('901736204'),
  sector: { es: 'Estética y spa', en: 'Beauty & spa' },
  tagline: { es: 'Faciales, masajes y manos y pies', en: 'Facials, massages and nail care' },
  city: 'Medellín',
  phone: '+57 604 555 0187',
  staffKind: 'professional',
  holidaysOpen: false,
  healthData: false,
  step: 30,
  leadMinutes: 60,
  cancelHours: 24,
  horizonDays: 60,
  locations: [
    { id: 'poblado', name: 'Sede El Poblado', address: 'Carrera 37 # 8A-32', city: 'Medellín' },
    { id: 'laureles', name: 'Sede Laureles', address: 'Circular 4 # 70-18', city: 'Medellín' },
  ],
  staff: [
    {
      id: 'valentina',
      name: 'Valentina Restrepo',
      role: { es: 'Esteticista', en: 'Beauty therapist' },
      color: 'rose',
      services: ['facial', 'relajante'],
      schedule: {
        1: split('poblado', h(9), h(13), h(14), h(19)),
        2: split('poblado', h(9), h(13), h(14), h(19)),
        3: split('poblado', h(9), h(13), h(14), h(19)),
        4: split('poblado', h(9), h(13), h(14), h(19)),
        5: split('poblado', h(9), h(13), h(14), h(19)),
        6: [shift('laureles', h(9), h(15))],
      },
    },
    {
      id: 'camila',
      name: 'Camila Ospina',
      role: { es: 'Masajista', en: 'Massage therapist' },
      color: 'violet',
      services: ['relajante', 'descontracturante'],
      schedule: {
        1: split('poblado', h(10), h(14), h(15), h(19)),
        2: split('laureles', h(9), h(13), h(14), h(18)),
        3: split('poblado', h(10), h(14), h(15), h(19)),
        4: split('laureles', h(9), h(13), h(14), h(18)),
        5: split('poblado', h(10), h(14), h(15), h(19)),
        6: [shift('poblado', h(9), h(15))],
      },
    },
    {
      id: 'daniela',
      name: 'Daniela Zapata',
      role: { es: 'Manicurista', en: 'Nail technician' },
      color: 'sky',
      services: ['manicure'],
      schedule: {
        1: split('laureles', h(9), h(13), h(14), h(19)),
        2: split('laureles', h(9), h(13), h(14), h(19)),
        3: split('laureles', h(9), h(13), h(14), h(19)),
        4: split('laureles', h(9), h(13), h(14), h(19)),
        5: split('laureles', h(9), h(13), h(14), h(19)),
        6: [shift('laureles', h(9), h(15))],
      },
    },
  ],
  services: [
    {
      id: 'facial',
      name: { es: 'Limpieza facial profunda', en: 'Deep cleansing facial' },
      description: { es: 'Extracción, exfoliación y mascarilla según tu tipo de piel.', en: 'Extraction, exfoliation and a mask for your skin type.' },
      duration: 60,
      buffer: 15,
      price: 150000,
      deposit: 20,
      icon: 'face',
    },
    {
      id: 'relajante',
      name: { es: 'Masaje relajante', en: 'Relaxing massage' },
      description: { es: 'Cuerpo completo con aceites tibios.', en: 'Full body with warm oils.' },
      duration: 60,
      buffer: 15,
      price: 170000,
      deposit: 20,
      icon: 'hand',
    },
    {
      id: 'descontracturante',
      name: { es: 'Masaje descontracturante', en: 'Deep tissue massage' },
      description: { es: 'Espalda, cuello y hombros con presión profunda.', en: 'Back, neck and shoulders with deep pressure.' },
      duration: 90,
      buffer: 15,
      price: 210000,
      deposit: 20,
      icon: 'heart',
    },
    {
      id: 'manicure',
      name: { es: 'Manicure y pedicure spa', en: 'Spa manicure and pedicure' },
      description: { es: 'Limado, cutícula, exfoliación y esmaltado.', en: 'Filing, cuticle care, scrub and polish.' },
      duration: 75,
      buffer: 15,
      price: 85000,
      deposit: 0,
      icon: 'scissors',
    },
  ],
};

const everyDay = (loc: string, week: [number, number], weekend: [number, number]) => ({
  0: [shift(loc, h(weekend[0]), h(weekend[1]))],
  1: [shift(loc, h(week[0]), h(week[1]))],
  2: [shift(loc, h(week[0]), h(week[1]))],
  3: [shift(loc, h(week[0]), h(week[1]))],
  4: [shift(loc, h(week[0]), h(week[1]))],
  5: [shift(loc, h(week[0]), h(week[1]))],
  6: [shift(loc, h(weekend[0]), h(weekend[1]))],
});

const canchas: Business = {
  id: 'canchas',
  name: 'Complejo Deportivo La Pradera',
  nit: nit('901258640'),
  sector: { es: 'Canchas sintéticas', en: 'Five-a-side pitches' },
  tagline: { es: 'Fútbol 5 y fútbol 8 en grama sintética', en: 'Five- and eight-a-side football on artificial turf' },
  city: 'Cali',
  phone: '+57 602 555 0119',
  staffKind: 'court',
  holidaysOpen: true,
  healthData: false,
  step: 60,
  leadMinutes: 30,
  cancelHours: 12,
  horizonDays: 45,
  locations: [
    { id: 'sur', name: 'Sede Sur', address: 'Carrera 100 # 16-45', city: 'Cali' },
    { id: 'norte', name: 'Sede Norte', address: 'Avenida 4N # 52-30', city: 'Cali' },
  ],
  staff: [
    {
      id: 'c1',
      name: 'Cancha 1 · F5',
      role: { es: 'Fútbol 5, techada', en: 'Five-a-side, covered' },
      color: 'emerald',
      services: ['f5-60', 'f5-90'],
      schedule: everyDay('sur', [8, 23], [7, 21]),
    },
    {
      id: 'c2',
      name: 'Cancha 2 · F5',
      role: { es: 'Fútbol 5, al aire libre', en: 'Five-a-side, outdoor' },
      color: 'sky',
      services: ['f5-60', 'f5-90'],
      schedule: everyDay('sur', [8, 23], [7, 21]),
    },
    {
      id: 'c3',
      name: 'Cancha 3 · F8',
      role: { es: 'Fútbol 8, iluminada', en: 'Eight-a-side, floodlit' },
      color: 'violet',
      services: ['f8-60'],
      schedule: everyDay('norte', [9, 23], [7, 21]),
    },
    {
      id: 'c4',
      name: 'Cancha 4 · F5',
      role: { es: 'Fútbol 5, techada', en: 'Five-a-side, covered' },
      color: 'rose',
      services: ['f5-60', 'f5-90'],
      schedule: everyDay('norte', [9, 23], [7, 21]),
    },
  ],
  services: [
    {
      id: 'f5-60',
      name: { es: 'Cancha fútbol 5 · 1 hora', en: 'Five-a-side pitch · 1 hour' },
      description: { es: 'Incluye balón y petos.', en: 'Ball and bibs included.' },
      duration: 60,
      buffer: 0,
      price: 120000,
      deposit: 50,
      icon: 'trophy',
    },
    {
      id: 'f5-90',
      name: { es: 'Cancha fútbol 5 · 1 h 30 min', en: 'Five-a-side pitch · 1 h 30 min' },
      description: { es: 'Para torneos relámpago y partidos largos.', en: 'For quick tournaments and longer games.' },
      duration: 90,
      buffer: 0,
      price: 170000,
      deposit: 50,
      icon: 'trophy',
    },
    {
      id: 'f8-60',
      name: { es: 'Cancha fútbol 8 · 1 hora', en: 'Eight-a-side pitch · 1 hour' },
      description: { es: 'Cancha grande con iluminación nocturna.', en: 'Large pitch with floodlights.' },
      duration: 60,
      buffer: 0,
      price: 220000,
      deposit: 50,
      icon: 'bolt',
    },
  ],
};

export const BUSINESSES: Record<PresetId, Business> = { odontologia, estetica, canchas };
