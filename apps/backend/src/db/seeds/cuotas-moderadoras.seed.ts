import CuotaModeradora from '../../models/CuotaModeradora';

/**
 * Seeds para Cuotas Moderadoras
 *
 * Cuotas moderadoras según normativa colombiana 2024
 * Basado en Acuerdo 260 de 2004 y Resolución 5521 de 2013
 */

export async function seedCuotasModeradoras() {
  try {
    console.log('🌱 Seeding Cuotas Moderadoras...');

    const salarioMinimo2024 = 1300000; // Salario mínimo Colombia 2024

    const cuotas = [
      // RÉGIMEN CONTRIBUTIVO - CATEGORÍA A
      {
        nombre: 'Consulta Medicina General - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'CONSULTA_MEDICINA_GENERAL',
        valorCuota: 12800,
        porcentaje: 0.98,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo', 'Víctimas del conflicto'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Consulta Especializada - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'CONSULTA_ESPECIALIZADA',
        valorCuota: 19100,
        porcentaje: 1.47,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Consulta Odontología - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'CONSULTA_ODONTOLOGIA',
        valorCuota: 12800,
        porcentaje: 0.98,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Consulta Urgencias - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'CONSULTA_URGENCIAS',
        valorCuota: 32000,
        porcentaje: 2.46,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Procedimiento Ambulatorio - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        valorCuota: 32000,
        porcentaje: 2.46,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Hospitalización - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'HOSPITALIZACION',
        valorCuota: 64000,
        porcentaje: 4.92,
        valorMaximo: 320000, // Máximo 5 días
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
        observaciones: 'Máximo 5 días de cuota moderadora por evento',
      },

      // RÉGIMEN CONTRIBUTIVO - CATEGORÍA B
      {
        nombre: 'Consulta Medicina General - Contributivo B',
        regimen: 'CONTRIBUTIVO',
        categoria: 'B',
        tipoServicio: 'CONSULTA_MEDICINA_GENERAL',
        valorCuota: 9600,
        porcentaje: 0.74,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Consulta Especializada - Contributivo B',
        regimen: 'CONTRIBUTIVO',
        categoria: 'B',
        tipoServicio: 'CONSULTA_ESPECIALIZADA',
        valorCuota: 14400,
        porcentaje: 1.11,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },

      // RÉGIMEN CONTRIBUTIVO - CATEGORÍA C
      {
        nombre: 'Consulta Medicina General - Contributivo C',
        regimen: 'CONTRIBUTIVO',
        categoria: 'C',
        tipoServicio: 'CONSULTA_MEDICINA_GENERAL',
        valorCuota: 6400,
        porcentaje: 0.49,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo', 'Población desplazada'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },

      // RÉGIMEN SUBSIDIADO - CATEGORÍA A
      {
        nombre: 'Consulta Medicina General - Subsidiado A',
        regimen: 'SUBSIDIADO',
        categoria: 'A',
        tipoServicio: 'CONSULTA_MEDICINA_GENERAL',
        valorCuota: 3200,
        porcentaje: 0.25,
        salarioMinimo: salarioMinimo2024,
        exenciones: [
          'Menores de 1 año',
          'Mujeres en embarazo',
          'Población desplazada',
          'Víctimas del conflicto',
          'Población indígena',
        ],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Consulta Especializada - Subsidiado A',
        regimen: 'SUBSIDIADO',
        categoria: 'A',
        tipoServicio: 'CONSULTA_ESPECIALIZADA',
        valorCuota: 4800,
        porcentaje: 0.37,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo', 'Población desplazada'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },

      // RÉGIMEN SUBSIDIADO - CATEGORÍA B (Exentos)
      {
        nombre: 'Consulta Medicina General - Subsidiado B (EXENTA)',
        regimen: 'SUBSIDIADO',
        categoria: 'B',
        tipoServicio: 'CONSULTA_MEDICINA_GENERAL',
        valorCuota: 0,
        exenciones: ['Todos'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
        observaciones: 'Categoría B y C del régimen subsidiado están exentas',
      },
      {
        nombre: 'Consulta Medicina General - Subsidiado C (EXENTA)',
        regimen: 'SUBSIDIADO',
        categoria: 'C',
        tipoServicio: 'CONSULTA_MEDICINA_GENERAL',
        valorCuota: 0,
        exenciones: ['Todos'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
        observaciones: 'Categoría B y C del régimen subsidiado están exentas',
      },

      // AYUDAS DIAGNÓSTICAS
      {
        nombre: 'Laboratorio - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'LABORATORIO',
        valorCuota: 9600,
        porcentaje: 0.74,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
      {
        nombre: 'Imagenología - Contributivo A',
        regimen: 'CONTRIBUTIVO',
        categoria: 'A',
        tipoServicio: 'IMAGENOLOGIA',
        valorCuota: 12800,
        porcentaje: 0.98,
        salarioMinimo: salarioMinimo2024,
        exenciones: ['Menores de 1 año', 'Mujeres en embarazo'],
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        activo: true,
      },
    ];

    // Insertar o actualizar
    for (const cuota of cuotas) {
      await CuotaModeradora.findOneAndUpdate(
        {
          regimen: cuota.regimen,
          categoria: cuota.categoria,
          tipoServicio: cuota.tipoServicio,
        },
        cuota,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ ${cuotas.length} cuotas moderadoras insertadas/actualizadas exitosamente`);
  } catch (error) {
    console.error('❌ Error al hacer seed de cuotas moderadoras:', error);
    throw error;
  }
}
