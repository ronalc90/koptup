import ReglaAuditoria from '../../models/ReglaAuditoria';

export const reglasAuditoriaSeed = [
  // REGLA 1: Diferencia de tarifa
  {
    nombre: 'Diferencia de tarifa mayor a $0',
    descripcion: 'Genera glosa cuando el valor cobrado por la IPS es mayor al valor contratado',
    codigo: 'REGLA_001',
    condiciones: [
      {
        campo: 'diferenciaTarifa',
        operador: '>',
        valor: 0,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G001',
      tipo: 'Tarifa',
      descripcion: 'Diferencia entre valor cobrado y valor contratado',
      calcularValor: 'diferencia',
    },
    prioridad: 10,
    activa: true,
    categoria: 'Tarifas',
  },

  // REGLA 2: Falta de autorización
  {
    nombre: 'Procedimiento sin autorización',
    descripcion: 'Genera glosa cuando un procedimiento que requiere autorización no la tiene',
    codigo: 'REGLA_002',
    condiciones: [
      {
        campo: 'tieneAutorizacion',
        operador: '=',
        valor: false,
      },
      {
        campo: 'requiereAutorizacion',
        operador: '=',
        valor: true,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G002',
      tipo: 'Autorización',
      descripcion: 'Falta de autorización para procedimiento que lo requiere',
      calcularValor: 'total',
    },
    prioridad: 5,
    activa: true,
    categoria: 'Autorizaciones',
  },

  // REGLA 3: Procedimiento duplicado
  {
    nombre: 'Procedimiento duplicado',
    descripcion: 'Genera glosa cuando se detecta un procedimiento duplicado en la misma atención',
    codigo: 'REGLA_003',
    condiciones: [
      {
        campo: 'duplicado',
        operador: '=',
        valor: true,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G004',
      tipo: 'Duplicidad',
      descripcion: 'Procedimiento duplicado en la misma atención',
      calcularValor: 'total',
    },
    prioridad: 8,
    activa: true,
    categoria: 'Facturación',
  },

  // REGLA 4: Falta de soporte documental
  {
    nombre: 'Falta soporte documental',
    descripcion: 'Genera glosa cuando no existe soporte documental para un procedimiento',
    codigo: 'REGLA_004',
    condiciones: [
      {
        campo: 'soportes',
        operador: 'not_exists',
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G007',
      tipo: 'Soporte',
      descripcion: 'Falta de soporte documental',
      calcularValor: 'total',
    },
    prioridad: 20,
    activa: true,
    categoria: 'Soportes',
  },

  // REGLA 5: Pertinencia médica - Procedimiento no pertinente
  {
    nombre: 'Procedimiento no pertinente con diagnóstico',
    descripcion: 'Genera glosa cuando un procedimiento no es pertinente con el diagnóstico',
    codigo: 'REGLA_005',
    condiciones: [
      {
        campo: 'pertinenciaValidada',
        operador: '=',
        valor: false,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G003',
      tipo: 'Pertinencia',
      descripcion: 'Procedimiento no pertinente con el diagnóstico registrado',
      calcularValor: 'total',
    },
    prioridad: 15,
    activa: true,
    categoria: 'Pertinencia',
  },

  // REGLA 6: Sobrecosto mayor al 20%
  {
    nombre: 'Sobrecosto mayor al 20%',
    descripcion: 'Genera glosa especial cuando la diferencia supera el 20% del valor contratado',
    codigo: 'REGLA_006',
    condiciones: [
      {
        campo: 'porcentajeDiferencia',
        operador: '>',
        valor: 20,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G001-A',
      tipo: 'Tarifa',
      descripcion: 'Sobrecosto mayor al 20% del valor contratado',
      calcularValor: 'diferencia',
    },
    prioridad: 5,
    activa: true,
    categoria: 'Tarifas',
  },

  // REGLA 7: Autorización vencida
  {
    nombre: 'Autorización vencida',
    descripcion: 'Genera glosa cuando la fecha de atención es posterior a la vigencia de la autorización',
    codigo: 'REGLA_007',
    condiciones: [
      {
        campo: 'autorizacionValida',
        operador: '=',
        valor: false,
      },
      {
        campo: 'tieneAutorizacion',
        operador: '=',
        valor: true,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G002-A',
      tipo: 'Autorización',
      descripcion: 'Autorización vencida o fecha de atención fuera de vigencia',
      calcularValor: 'total',
    },
    prioridad: 6,
    activa: true,
    categoria: 'Autorizaciones',
  },

  // REGLA 8: Procedimientos incompatibles
  {
    nombre: 'Procedimientos incompatibles en misma atención',
    descripcion: 'Detecta procedimientos que no pueden facturarse juntos en la misma atención',
    codigo: 'REGLA_008',
    condiciones: [
      {
        campo: 'procedimientosIncompatibles',
        operador: '=',
        valor: true,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G005',
      tipo: 'Facturación',
      descripcion: 'Procedimientos incompatibles facturados en la misma atención',
      calcularValor: 'porcentaje',
      porcentaje: 50,
    },
    prioridad: 12,
    activa: true,
    categoria: 'Facturación',
  },

  // REGLA 9: Cantidad excesiva
  {
    nombre: 'Cantidad excesiva de procedimientos',
    descripcion: 'Genera glosa cuando la cantidad de un procedimiento excede el promedio normal',
    codigo: 'REGLA_009',
    condiciones: [
      {
        campo: 'cantidad',
        operador: '>',
        valor: 10,
      },
    ],
    operadorLogico: 'AND',
    accion: {
      codigoGlosa: 'G006',
      tipo: 'Facturación',
      descripcion: 'Cantidad excesiva de procedimientos',
      calcularValor: 'porcentaje',
      porcentaje: 30,
    },
    prioridad: 18,
    activa: false, // Desactivada por defecto, se activa según necesidad
    categoria: 'Facturación',
  },
];

export async function seedReglasAuditoria() {
  try {
    console.log('🌱 Seeding Reglas de Auditoría...');

    // Limpiar colección existente
    await ReglaAuditoria.deleteMany({});

    // Insertar datos
    await ReglaAuditoria.insertMany(reglasAuditoriaSeed);

    console.log(`✅ ${reglasAuditoriaSeed.length} reglas de auditoría insertadas exitosamente`);
  } catch (error) {
    console.error('❌ Error seeding Reglas de Auditoría:', error);
    throw error;
  }
}
