import Tarifario from '../../models/Tarifario';

export const tarifariosSeed = [
  // TARIFARIO ISS 2001
  {
    nombre: 'ISS 2001',
    tipo: 'ISS',
    vigenciaInicio: new Date('2001-01-01'),
    activo: true,
    items: [
      { codigoCUPS: '890201', valor: 38500, unidad: 'COP' },
      { codigoCUPS: '890202', valor: 32500, unidad: 'COP' },
      { codigoCUPS: '890301', valor: 58000, unidad: 'COP' },
      { codigoCUPS: '890302', valor: 49500, unidad: 'COP' },
      { codigoCUPS: '902210', valor: 21500, unidad: 'COP' },
      { codigoCUPS: '903841', valor: 12800, unidad: 'COP' },
      { codigoCUPS: '903895', valor: 13700, unidad: 'COP' },
      { codigoCUPS: '871101', valor: 36000, unidad: 'COP' },
      { codigoCUPS: '876001', valor: 81300, unidad: 'COP' },
      { codigoCUPS: '890801', valor: 72800, unidad: 'COP' },
      { codigoCUPS: '890802', valor: 107000, unidad: 'COP' },
      { codigoCUPS: '334101', valor: 2440000, unidad: 'COP' },
      { codigoCUPS: '363100', valor: 2740000, unidad: 'COP' },
      { codigoCUPS: '878100', valor: 27400, unidad: 'COP' },
      { codigoCUPS: '879120', valor: 158400, unidad: 'COP' },
      { codigoCUPS: '931100', valor: 30000, unidad: 'COP' },
    ],
  },

  // TARIFARIO ISS 2004
  {
    nombre: 'ISS 2004',
    tipo: 'ISS',
    vigenciaInicio: new Date('2004-01-01'),
    activo: true,
    items: [
      { codigoCUPS: '890201', valor: 42000, unidad: 'COP' },
      { codigoCUPS: '890202', valor: 35500, unidad: 'COP' },
      { codigoCUPS: '890301', valor: 63000, unidad: 'COP' },
      { codigoCUPS: '890302', valor: 54000, unidad: 'COP' },
      { codigoCUPS: '902210', valor: 23500, unidad: 'COP' },
      { codigoCUPS: '903841', valor: 14000, unidad: 'COP' },
      { codigoCUPS: '903895', valor: 15000, unidad: 'COP' },
      { codigoCUPS: '871101', valor: 39300, unidad: 'COP' },
      { codigoCUPS: '876001', valor: 88800, unidad: 'COP' },
      { codigoCUPS: '890801', valor: 79500, unidad: 'COP' },
      { codigoCUPS: '890802', valor: 116900, unidad: 'COP' },
      { codigoCUPS: '334101', valor: 2665000, unidad: 'COP' },
      { codigoCUPS: '363100', valor: 2993000, unidad: 'COP' },
      { codigoCUPS: '878100', valor: 29900, unidad: 'COP' },
      { codigoCUPS: '879120', valor: 173000, unidad: 'COP' },
      { codigoCUPS: '931100', valor: 32700, unidad: 'COP' },
    ],
  },

  // TARIFARIO SOAT 2024
  {
    nombre: 'SOAT 2024',
    tipo: 'SOAT',
    vigenciaInicio: new Date('2024-01-01'),
    activo: true,
    items: [
      { codigoCUPS: '890201', valor: 45000, unidad: 'COP' },
      { codigoCUPS: '890202', valor: 38000, unidad: 'COP' },
      { codigoCUPS: '890301', valor: 68000, unidad: 'COP' },
      { codigoCUPS: '890302', valor: 58000, unidad: 'COP' },
      { codigoCUPS: '902210', valor: 25000, unidad: 'COP' },
      { codigoCUPS: '903841', valor: 15000, unidad: 'COP' },
      { codigoCUPS: '903895', valor: 16000, unidad: 'COP' },
      { codigoCUPS: '871101', valor: 42000, unidad: 'COP' },
      { codigoCUPS: '876001', valor: 95000, unidad: 'COP' },
      { codigoCUPS: '890801', valor: 85000, unidad: 'COP' },
      { codigoCUPS: '890802', valor: 125000, unidad: 'COP' },
      { codigoCUPS: '334101', valor: 2850000, unidad: 'COP' },
      { codigoCUPS: '363100', valor: 3200000, unidad: 'COP' },
      { codigoCUPS: '878100', valor: 32000, unidad: 'COP' },
      { codigoCUPS: '879120', valor: 185000, unidad: 'COP' },
      { codigoCUPS: '931100', valor: 35000, unidad: 'COP' },
    ],
  },

  // CONTRATO EPS SURA (Ejemplo)
  {
    nombre: 'Contrato EPS Sura 2024',
    tipo: 'Contrato',
    eps: 'EPS Sura',
    vigenciaInicio: new Date('2024-01-01'),
    vigenciaFin: new Date('2024-12-31'),
    activo: true,
    items: [
      { codigoCUPS: '890201', valor: 43000, unidad: 'COP' },
      { codigoCUPS: '890202', valor: 36500, unidad: 'COP' },
      { codigoCUPS: '890301', valor: 65000, unidad: 'COP' },
      { codigoCUPS: '890302', valor: 56000, unidad: 'COP' },
      { codigoCUPS: '902210', valor: 24000, unidad: 'COP' },
      { codigoCUPS: '903841', valor: 14500, unidad: 'COP' },
      { codigoCUPS: '903895', valor: 15500, unidad: 'COP' },
      { codigoCUPS: '871101', valor: 40000, unidad: 'COP' },
      { codigoCUPS: '876001', valor: 92000, unidad: 'COP' },
      { codigoCUPS: '890801', valor: 82000, unidad: 'COP' },
      { codigoCUPS: '890802', valor: 120000, unidad: 'COP' },
      { codigoCUPS: '334101', valor: 2750000, unidad: 'COP' },
      { codigoCUPS: '363100', valor: 3100000, unidad: 'COP' },
      { codigoCUPS: '878100', valor: 31000, unidad: 'COP' },
      { codigoCUPS: '879120', valor: 180000, unidad: 'COP' },
      { codigoCUPS: '931100', valor: 34000, unidad: 'COP' },
    ],
  },

  // CONTRATO EPS SALUD TOTAL (Ejemplo)
  {
    nombre: 'Contrato EPS Salud Total 2024',
    tipo: 'Contrato',
    eps: 'Salud Total EPS',
    vigenciaInicio: new Date('2024-01-01'),
    vigenciaFin: new Date('2024-12-31'),
    activo: true,
    items: [
      { codigoCUPS: '890201', valor: 44000, unidad: 'COP' },
      { codigoCUPS: '890202', valor: 37000, unidad: 'COP' },
      { codigoCUPS: '890301', valor: 66500, unidad: 'COP' },
      { codigoCUPS: '890302', valor: 57000, unidad: 'COP' },
      { codigoCUPS: '902210', valor: 24500, unidad: 'COP' },
      { codigoCUPS: '903841', valor: 14800, unidad: 'COP' },
      { codigoCUPS: '903895', valor: 15800, unidad: 'COP' },
      { codigoCUPS: '871101', valor: 41000, unidad: 'COP' },
      { codigoCUPS: '876001', valor: 93500, unidad: 'COP' },
      { codigoCUPS: '890801', valor: 83500, unidad: 'COP' },
      { codigoCUPS: '890802', valor: 122000, unidad: 'COP' },
      { codigoCUPS: '334101', valor: 2800000, unidad: 'COP' },
      { codigoCUPS: '363100', valor: 3150000, unidad: 'COP' },
      { codigoCUPS: '878100', valor: 31500, unidad: 'COP' },
      { codigoCUPS: '879120', valor: 182000, unidad: 'COP' },
      { codigoCUPS: '931100', valor: 34500, unidad: 'COP' },
    ],
  },
];

export async function seedTarifarios() {
  try {
    console.log('🌱 Seeding Tarifarios...');

    // Limpiar colección existente
    await Tarifario.deleteMany({});

    // Insertar datos
    await Tarifario.insertMany(tarifariosSeed);

    console.log(`✅ ${tarifariosSeed.length} tarifarios insertados exitosamente`);
  } catch (error) {
    console.error('❌ Error seeding Tarifarios:', error);
    throw error;
  }
}
