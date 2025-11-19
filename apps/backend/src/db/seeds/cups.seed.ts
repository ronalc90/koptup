import CUPS from '../../models/CUPS';

export const cupsSeed = [
  // CONSULTAS
  {
    codigo: '890201',
    descripcion: 'Consulta de primera vez por medicina general',
    categoria: 'Consulta',
    especialidad: 'Medicina General',
    tarifaSOAT: 45000,
    tarifaISS2001: 38500,
    tarifaISS2004: 42000,
    uvr: 2.5,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 20,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '890202',
    descripcion: 'Consulta de control por medicina general',
    categoria: 'Consulta',
    especialidad: 'Medicina General',
    tarifaSOAT: 38000,
    tarifaISS2001: 32500,
    tarifaISS2004: 35500,
    uvr: 2.0,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 15,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '890301',
    descripcion: 'Consulta de primera vez por medicina especializada',
    categoria: 'Consulta',
    especialidad: 'Medicina Especializada',
    tarifaSOAT: 68000,
    tarifaISS2001: 58000,
    tarifaISS2004: 63000,
    uvr: 3.8,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 30,
      nivelComplejidad: 'medio',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '890302',
    descripcion: 'Consulta de control por medicina especializada',
    categoria: 'Consulta',
    especialidad: 'Medicina Especializada',
    tarifaSOAT: 58000,
    tarifaISS2001: 49500,
    tarifaISS2004: 54000,
    uvr: 3.2,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 20,
      nivelComplejidad: 'medio',
      requiereQuirofano: false,
    },
  },

  // LABORATORIOS
  {
    codigo: '902210',
    descripcion: 'Hemograma IV (Hemoglobina, hematocrito, recuento leucocitos y diferencial)',
    categoria: 'Laboratorio',
    especialidad: 'Hematología',
    tarifaSOAT: 25000,
    tarifaISS2001: 21500,
    tarifaISS2004: 23500,
    uvr: 1.5,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 60,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '903841',
    descripcion: 'Glicemia',
    categoria: 'Laboratorio',
    especialidad: 'Química Clínica',
    tarifaSOAT: 15000,
    tarifaISS2001: 12800,
    tarifaISS2004: 14000,
    uvr: 0.9,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 30,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '903895',
    descripcion: 'Creatinina',
    categoria: 'Laboratorio',
    especialidad: 'Química Clínica',
    tarifaSOAT: 16000,
    tarifaISS2001: 13700,
    tarifaISS2004: 15000,
    uvr: 1.0,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 30,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },

  // IMAGENOLOGÍA
  {
    codigo: '871101',
    descripcion: 'Radiografía de tórax',
    categoria: 'Imagenología',
    especialidad: 'Radiología',
    tarifaSOAT: 42000,
    tarifaISS2001: 36000,
    tarifaISS2004: 39300,
    uvr: 2.4,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 15,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '876001',
    descripcion: 'Ecografía abdominal total',
    categoria: 'Imagenología',
    especialidad: 'Radiología',
    tarifaSOAT: 95000,
    tarifaISS2001: 81300,
    tarifaISS2004: 88800,
    uvr: 5.6,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 30,
      nivelComplejidad: 'medio',
      requiereQuirofano: false,
    },
  },

  // PROCEDIMIENTOS
  {
    codigo: '890801',
    descripcion: 'Sutura de heridas, únicas y/o múltiples hasta 5 cm',
    categoria: 'Procedimiento',
    especialidad: 'Cirugía General',
    tarifaSOAT: 85000,
    tarifaISS2001: 72800,
    tarifaISS2004: 79500,
    uvr: 5.0,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 30,
      nivelComplejidad: 'medio',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '890802',
    descripcion: 'Sutura de heridas, únicas y/o múltiples de más de 5 cm',
    categoria: 'Procedimiento',
    especialidad: 'Cirugía General',
    tarifaSOAT: 125000,
    tarifaISS2001: 107000,
    tarifaISS2004: 116900,
    uvr: 7.4,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 45,
      nivelComplejidad: 'medio',
      requiereQuirofano: false,
    },
  },

  // CIRUGÍAS
  {
    codigo: '334101',
    descripcion: 'Apendicectomía',
    categoria: 'Cirugía',
    especialidad: 'Cirugía General',
    tarifaSOAT: 2850000,
    tarifaISS2001: 2440000,
    tarifaISS2004: 2665000,
    uvr: 168.0,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 90,
      nivelComplejidad: 'alto',
      requiereQuirofano: true,
    },
  },
  {
    codigo: '363100',
    descripcion: 'Cesárea',
    categoria: 'Cirugía',
    especialidad: 'Obstetricia',
    tarifaSOAT: 3200000,
    tarifaISS2001: 2740000,
    tarifaISS2004: 2993000,
    uvr: 189.0,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 60,
      nivelComplejidad: 'alto',
      requiereQuirofano: true,
    },
  },

  // AYUDAS DIAGNÓSTICAS
  {
    codigo: '878100',
    descripcion: 'Electrocardiograma',
    categoria: 'Ayudas Diagnósticas',
    especialidad: 'Cardiología',
    tarifaSOAT: 32000,
    tarifaISS2001: 27400,
    tarifaISS2004: 29900,
    uvr: 1.9,
    activo: true,
    metadata: {
      requiereAutorizacion: false,
      duracionPromedio: 15,
      nivelComplejidad: 'bajo',
      requiereQuirofano: false,
    },
  },
  {
    codigo: '879120',
    descripcion: 'Ecocardiograma transtorácico bidimensional con doppler a color',
    categoria: 'Ayudas Diagnósticas',
    especialidad: 'Cardiología',
    tarifaSOAT: 185000,
    tarifaISS2001: 158400,
    tarifaISS2004: 173000,
    uvr: 10.9,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 45,
      nivelComplejidad: 'alto',
      requiereQuirofano: false,
    },
  },

  // TERAPIAS
  {
    codigo: '931100',
    descripcion: 'Terapia física individual',
    categoria: 'Terapia',
    especialidad: 'Fisioterapia',
    tarifaSOAT: 35000,
    tarifaISS2001: 30000,
    tarifaISS2004: 32700,
    uvr: 2.1,
    activo: true,
    metadata: {
      requiereAutorizacion: true,
      duracionPromedio: 30,
      nivelComplejidad: 'medio',
      requiereQuirofano: false,
    },
  },
];

export async function seedCUPS() {
  try {
    console.log('🌱 Seeding CUPS...');

    // Limpiar colección existente
    await CUPS.deleteMany({});

    // Insertar datos
    await CUPS.insertMany(cupsSeed);

    console.log(`✅ ${cupsSeed.length} códigos CUPS insertados exitosamente`);
  } catch (error) {
    console.error('❌ Error seeding CUPS:', error);
    throw error;
  }
}
