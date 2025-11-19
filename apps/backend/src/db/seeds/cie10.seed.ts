import Diagnostico from '../../models/Diagnostico';

export const cie10Seed = [
  // ENFERMEDADES RESPIRATORIAS
  {
    codigoCIE10: 'J00',
    descripcion: 'Rinofaringitis aguda (resfriado común)',
    categoria: 'Enfermedades del sistema respiratorio',
    subcategoria: 'Infecciones agudas de las vías respiratorias superiores',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'J06.9',
    descripcion: 'Infección aguda de las vías respiratorias superiores, no especificada',
    categoria: 'Enfermedades del sistema respiratorio',
    subcategoria: 'Infecciones agudas de las vías respiratorias superiores',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'J18.9',
    descripcion: 'Neumonía, no especificada',
    categoria: 'Enfermedades del sistema respiratorio',
    subcategoria: 'Neumonía',
    gravedad: 'grave',
    cronico: false,
    requiereHospitalizacion: true,
    activo: true,
  },
  {
    codigoCIE10: 'J45.9',
    descripcion: 'Asma, no especificada',
    categoria: 'Enfermedades del sistema respiratorio',
    subcategoria: 'Enfermedades crónicas de las vías respiratorias inferiores',
    gravedad: 'moderada',
    cronico: true,
    requiereHospitalizacion: false,
    activo: true,
  },

  // ENFERMEDADES ENDOCRINAS
  {
    codigoCIE10: 'E11.9',
    descripcion: 'Diabetes mellitus tipo 2, sin mención de complicación',
    categoria: 'Enfermedades endocrinas, nutricionales y metabólicas',
    subcategoria: 'Diabetes mellitus',
    gravedad: 'moderada',
    cronico: true,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'E10.9',
    descripcion: 'Diabetes mellitus tipo 1, sin mención de complicación',
    categoria: 'Enfermedades endocrinas, nutricionales y metabólicas',
    subcategoria: 'Diabetes mellitus',
    gravedad: 'moderada',
    cronico: true,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'E66.9',
    descripcion: 'Obesidad, no especificada',
    categoria: 'Enfermedades endocrinas, nutricionales y metabólicas',
    subcategoria: 'Obesidad y otros tipos de hiperalimentación',
    gravedad: 'leve',
    cronico: true,
    requiereHospitalizacion: false,
    activo: true,
  },

  // ENFERMEDADES CARDIOVASCULARES
  {
    codigoCIE10: 'I10',
    descripcion: 'Hipertensión esencial (primaria)',
    categoria: 'Enfermedades del sistema circulatorio',
    subcategoria: 'Enfermedades hipertensivas',
    gravedad: 'moderada',
    cronico: true,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'I21.9',
    descripcion: 'Infarto agudo del miocardio, sin otra especificación',
    categoria: 'Enfermedades del sistema circulatorio',
    subcategoria: 'Enfermedades isquémicas del corazón',
    gravedad: 'critica',
    cronico: false,
    requiereHospitalizacion: true,
    activo: true,
  },
  {
    codigoCIE10: 'I50.9',
    descripcion: 'Insuficiencia cardíaca, no especificada',
    categoria: 'Enfermedades del sistema circulatorio',
    subcategoria: 'Insuficiencia cardíaca',
    gravedad: 'grave',
    cronico: true,
    requiereHospitalizacion: true,
    activo: true,
  },

  // ENFERMEDADES DIGESTIVAS
  {
    codigoCIE10: 'K35.8',
    descripcion: 'Apendicitis aguda, otra y la no especificada',
    categoria: 'Enfermedades del sistema digestivo',
    subcategoria: 'Apendicitis',
    gravedad: 'grave',
    cronico: false,
    requiereHospitalizacion: true,
    activo: true,
  },
  {
    codigoCIE10: 'K29.7',
    descripcion: 'Gastritis, no especificada',
    categoria: 'Enfermedades del sistema digestivo',
    subcategoria: 'Enfermedades del esófago, del estómago y del duodeno',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'K80.2',
    descripcion: 'Cálculo de la vesícula biliar sin colecistitis',
    categoria: 'Enfermedades del sistema digestivo',
    subcategoria: 'Trastornos de la vesícula biliar',
    gravedad: 'moderada',
    cronico: true,
    requiereHospitalizacion: false,
    activo: true,
  },

  // EMBARAZO Y PARTO
  {
    codigoCIE10: 'O80',
    descripcion: 'Parto único espontáneo',
    categoria: 'Embarazo, parto y puerperio',
    subcategoria: 'Parto',
    gravedad: 'moderada',
    cronico: false,
    requiereHospitalizacion: true,
    activo: true,
  },
  {
    codigoCIE10: 'O82',
    descripcion: 'Parto único por cesárea',
    categoria: 'Embarazo, parto y puerperio',
    subcategoria: 'Parto',
    gravedad: 'moderada',
    cronico: false,
    requiereHospitalizacion: true,
    activo: true,
  },

  // TRAUMATISMOS
  {
    codigoCIE10: 'S06.0',
    descripcion: 'Conmoción cerebral',
    categoria: 'Traumatismos, envenenamientos',
    subcategoria: 'Traumatismos de la cabeza',
    tipoLesion: 'Contusa',
    gravedad: 'grave',
    cronico: false,
    requiereHospitalizacion: true,
    activo: true,
  },
  {
    codigoCIE10: 'S52.5',
    descripcion: 'Fractura del extremo inferior del radio',
    categoria: 'Traumatismos, envenenamientos',
    subcategoria: 'Traumatismos del antebrazo',
    tipoLesion: 'Fractura',
    gravedad: 'moderada',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'T14.1',
    descripcion: 'Herida de región no especificada del cuerpo',
    categoria: 'Traumatismos, envenenamientos',
    subcategoria: 'Traumatismos no especificados',
    tipoLesion: 'Herida',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },

  // ENFERMEDADES INFECCIOSAS
  {
    codigoCIE10: 'A09',
    descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso',
    categoria: 'Enfermedades infecciosas y parasitarias',
    subcategoria: 'Enfermedades infecciosas intestinales',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'B34.9',
    descripcion: 'Infección viral, no especificada',
    categoria: 'Enfermedades infecciosas y parasitarias',
    subcategoria: 'Infecciones virales',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },

  // OTRAS ENFERMEDADES COMUNES
  {
    codigoCIE10: 'M79.1',
    descripcion: 'Mialgia',
    categoria: 'Enfermedades del sistema musculoesquelético',
    subcategoria: 'Trastornos de los tejidos blandos',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'R10.4',
    descripcion: 'Otros dolores abdominales y los no especificados',
    categoria: 'Síntomas y signos generales',
    subcategoria: 'Síntomas abdominales y pélvicos',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
  {
    codigoCIE10: 'R50.9',
    descripcion: 'Fiebre, no especificada',
    categoria: 'Síntomas y signos generales',
    subcategoria: 'Síntomas generales',
    gravedad: 'leve',
    cronico: false,
    requiereHospitalizacion: false,
    activo: true,
  },
];

export async function seedCIE10() {
  try {
    console.log('🌱 Seeding CIE-10...');

    // Limpiar colección existente
    await Diagnostico.deleteMany({});

    // Insertar datos
    await Diagnostico.insertMany(cie10Seed);

    console.log(`✅ ${cie10Seed.length} diagnósticos CIE-10 insertados exitosamente`);
  } catch (error) {
    console.error('❌ Error seeding CIE-10:', error);
    throw error;
  }
}
