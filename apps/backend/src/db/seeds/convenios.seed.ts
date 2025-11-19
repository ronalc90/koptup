import ConvenioTarifa from '../../models/ConvenioTarifa';

/**
 * Seeds para Convenios y Tarifas
 *
 * Crea convenios de ejemplo entre IPS y EPS principales de Colombia
 */

export async function seedConvenios() {
  try {
    console.log('🌱 Seeding Convenios y Tarifas...');

    const convenios = [
      // CONVENIO NUEVA EPS
      {
        nombre: 'Convenio NUEVA EPS - POS 2024',
        epsNit: '800249604',
        epsNombre: 'NUEVA EPS',
        tipoConvenio: 'POS',
        tipoTarifario: 'ISS_2004',
        factorGlobal: 1.15, // ISS 2004 + 15%
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        tarifasPorCUPS: [
          { codigoCUPS: '890201', valorPactado: 45000, observaciones: 'Consulta medicina general' },
          { codigoCUPS: '890202', valorPactado: 65000, observaciones: 'Consulta especializada' },
          { codigoCUPS: '871001', valorPactado: 145000, observaciones: 'RX tórax' },
          { codigoCUPS: '901120', valorPactado: 15000, observaciones: 'Hemograma' },
        ],
        reglasEspeciales: [
          {
            categoria: 'Consulta',
            factorMultiplicador: 1.15,
            observaciones: 'Todas las consultas ISS 2004 + 15%',
          },
          {
            categoria: 'Cirugía',
            factorMultiplicador: 1.20,
            observaciones: 'Procedimientos quirúrgicos ISS 2004 + 20%',
          },
          {
            categoria: 'Laboratorio',
            factorMultiplicador: 1.10,
            observaciones: 'Ayudas diagnósticas ISS 2004 + 10%',
          },
        ],
        cuotaModeradoras: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 12800 },
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'PROCEDIMIENTO', valor: 32000 },
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'HOSPITALIZACION', valor: 64000 },
          { regimen: 'SUBSIDIADO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 3200 },
        ],
        copagos: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', porcentaje: 20, valorMaximo: 1200000 },
          { regimen: 'CONTRIBUTIVO', categoria: 'B', porcentaje: 15, valorMaximo: 900000 },
          { regimen: 'CONTRIBUTIVO', categoria: 'C', porcentaje: 10, valorMaximo: 600000 },
        ],
        activo: true,
      },

      // CONVENIO SURA
      {
        nombre: 'Convenio SURA - POS 2024',
        epsNit: '800088702',
        epsNombre: 'EPS SURA',
        tipoConvenio: 'POS',
        tipoTarifario: 'ISS_2004',
        factorGlobal: 1.20, // ISS 2004 + 20%
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        tarifasPorCUPS: [
          { codigoCUPS: '890201', valorPactado: 48000, observaciones: 'Consulta medicina general' },
          { codigoCUPS: '890202', valorPactado: 70000, observaciones: 'Consulta especializada' },
          { codigoCUPS: '871001', valorPactado: 155000, observaciones: 'RX tórax' },
        ],
        reglasEspeciales: [
          {
            categoria: 'Consulta',
            factorMultiplicador: 1.20,
            observaciones: 'Todas las consultas ISS 2004 + 20%',
          },
          {
            categoria: 'Cirugía',
            factorMultiplicador: 1.25,
            observaciones: 'Procedimientos quirúrgicos ISS 2004 + 25%',
          },
        ],
        cuotaModeradoras: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 13000 },
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'PROCEDIMIENTO', valor: 33000 },
        ],
        copagos: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', porcentaje: 20, valorMaximo: 1300000 },
        ],
        activo: true,
      },

      // CONVENIO SANITAS
      {
        nombre: 'Convenio SANITAS - POS 2024',
        epsNit: '800251440',
        epsNombre: 'EPS SANITAS',
        tipoConvenio: 'POS',
        tipoTarifario: 'ISS_2004',
        factorGlobal: 1.18,
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        tarifasPorCUPS: [
          { codigoCUPS: '890201', valorPactado: 47000 },
          { codigoCUPS: '890202', valorPactado: 68000 },
        ],
        reglasEspeciales: [
          {
            categoria: 'Consulta',
            factorMultiplicador: 1.18,
          },
        ],
        cuotaModeradoras: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 12500 },
        ],
        copagos: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', porcentaje: 20 },
        ],
        activo: true,
      },

      // CONVENIO SALUD TOTAL
      {
        nombre: 'Convenio SALUD TOTAL - POS 2024',
        epsNit: '800130907',
        epsNombre: 'SALUD TOTAL EPS',
        tipoConvenio: 'POS',
        tipoTarifario: 'ISS_2004',
        factorGlobal: 1.17,
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        tarifasPorCUPS: [
          { codigoCUPS: '890201', valorPactado: 46500 },
          { codigoCUPS: '890202', valorPactado: 67000 },
        ],
        reglasEspeciales: [
          {
            categoria: 'Consulta',
            factorMultiplicador: 1.17,
          },
        ],
        cuotaModeradoras: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 12600 },
        ],
        copagos: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', porcentaje: 20 },
        ],
        activo: true,
      },

      // CONVENIO COMPENSAR
      {
        nombre: 'Convenio COMPENSAR - POS 2024',
        epsNit: '860066942',
        epsNombre: 'COMPENSAR EPS',
        tipoConvenio: 'POS',
        tipoTarifario: 'ISS_2004',
        factorGlobal: 1.12,
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        tarifasPorCUPS: [],
        reglasEspeciales: [
          {
            categoria: 'Consulta',
            factorMultiplicador: 1.12,
          },
          {
            categoria: 'Procedimiento',
            factorMultiplicador: 1.12,
          },
        ],
        cuotaModeradoras: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 12700 },
        ],
        copagos: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', porcentaje: 20 },
        ],
        activo: true,
      },

      // CONVENIO FAMISANAR
      {
        nombre: 'Convenio FAMISANAR - POS 2024',
        epsNit: '800177689',
        epsNombre: 'FAMISANAR EPS',
        tipoConvenio: 'POS',
        tipoTarifario: 'ISS_2004',
        factorGlobal: 1.14,
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFin: new Date('2024-12-31'),
        tarifasPorCUPS: [],
        reglasEspeciales: [
          {
            categoria: 'Consulta',
            factorMultiplicador: 1.14,
          },
        ],
        cuotaModeradoras: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', tipoServicio: 'CONSULTA', valor: 12800 },
        ],
        copagos: [
          { regimen: 'CONTRIBUTIVO', categoria: 'A', porcentaje: 20 },
        ],
        activo: true,
      },
    ];

    // Insertar o actualizar
    for (const convenio of convenios) {
      await ConvenioTarifa.findOneAndUpdate(
        {
          epsNit: convenio.epsNit,
          nombre: convenio.nombre,
        },
        convenio,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ ${convenios.length} convenios insertados/actualizados exitosamente`);
  } catch (error) {
    console.error('❌ Error al hacer seed de convenios:', error);
    throw error;
  }
}
