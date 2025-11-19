import EPSMaestro from '../../models/EPSMaestro';

/**
 * Seeds para EPS Maestro
 *
 * Catálogo de las principales EPS de Colombia 2024
 */

export async function seedEPS() {
  try {
    console.log('🌱 Seeding EPS Maestro...');

    const eps = [
      {
        nit: '800249604',
        codigoHabilitacion: 'EPS001',
        razonSocial: 'ASOCIACIÓN MUTUAL EMPRESA SOLIDARIA DE SALUD LA NUEVA EPS',
        nombreComercial: 'NUEVA EPS',
        regimen: 'CONTRIBUTIVO',
        tipoEPS: 'EPS',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Calle 26 No. 92-32',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6018000400',
          email: 'servicioalcliente@nuevaeps.com.co',
          sitioWeb: 'https://www.nuevaeps.com.co',
        },
        cobertura: {
          departamentos: ['Bogotá', 'Cundinamarca', 'Antioquia', 'Valle', 'Atlántico'],
          ciudades: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'],
          nacional: true,
        },
        afiliados: {
          contributivo: 4500000,
          subsidiado: 0,
          total: 4500000,
          fechaCorte: new Date('2024-01-01'),
        },
        tarifarioPreferido: 'ISS_2004',
        factorGlobalTipico: 1.15,
        activo: true,
      },
      {
        nit: '800088702',
        codigoHabilitacion: 'EPS002',
        razonSocial: 'SEGUROS DE VIDA SURAMERICANA S.A.',
        nombreComercial: 'EPS SURA',
        regimen: 'CONTRIBUTIVO',
        tipoEPS: 'EPS',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Carrera 43A No. 1A-40',
          ciudad: 'Medellín',
          departamento: 'Antioquia',
          telefono: '6044305555',
          email: 'eps@sura.com.co',
          sitioWeb: 'https://www.epssura.com',
        },
        cobertura: {
          departamentos: ['Antioquia', 'Cundinamarca', 'Valle', 'Santander'],
          ciudades: ['Medellín', 'Bogotá', 'Cali', 'Bucaramanga'],
          nacional: true,
        },
        afiliados: {
          contributivo: 2800000,
          total: 2800000,
          fechaCorte: new Date('2024-01-01'),
        },
        tarifarioPreferido: 'ISS_2004',
        factorGlobalTipico: 1.20,
        activo: true,
      },
      {
        nit: '800251440',
        codigoHabilitacion: 'EPS003',
        razonSocial: 'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.',
        nombreComercial: 'EPS SANITAS',
        regimen: 'CONTRIBUTIVO',
        tipoEPS: 'EPS',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Carrera 7 No. 156-68',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6015951055',
          email: 'contacto@eps.sanitas.co',
          sitioWeb: 'https://www.eps.sanitas.co',
        },
        cobertura: {
          departamentos: ['Cundinamarca', 'Antioquia', 'Valle', 'Atlántico'],
          ciudades: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
          nacional: true,
        },
        afiliados: {
          contributivo: 2200000,
          total: 2200000,
          fechaCorte: new Date('2024-01-01'),
        },
        tarifarioPreferido: 'ISS_2004',
        factorGlobalTipico: 1.18,
        activo: true,
      },
      {
        nit: '800130907',
        codigoHabilitacion: 'EPS004',
        razonSocial: 'SALUD TOTAL S.A. ENTIDAD PROMOTORA DE SALUD',
        nombreComercial: 'SALUD TOTAL EPS',
        regimen: 'CONTRIBUTIVO',
        tipoEPS: 'EPS',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Avenida Calle 26 No. 69D-91',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6016512222',
          email: 'contactenos@saludtotal.com.co',
          sitioWeb: 'https://www.saludtotal.com.co',
        },
        cobertura: {
          departamentos: ['Cundinamarca', 'Antioquia', 'Valle', 'Bolívar'],
          ciudades: ['Bogotá', 'Medellín', 'Cali', 'Cartagena'],
          nacional: true,
        },
        afiliados: {
          contributivo: 1900000,
          total: 1900000,
          fechaCorte: new Date('2024-01-01'),
        },
        tarifarioPreferido: 'ISS_2004',
        factorGlobalTipico: 1.17,
        activo: true,
      },
      {
        nit: '860066942',
        codigoHabilitacion: 'EPS005',
        razonSocial: 'COMPENSAR ENTIDAD PROMOTORA DE SALUD',
        nombreComercial: 'COMPENSAR EPS',
        regimen: 'CONTRIBUTIVO',
        tipoEPS: 'CCF',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Avenida 68 No. 49A-47',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6014441234',
          email: 'eps@compensar.com',
          sitioWeb: 'https://www.compensar.com',
        },
        cobertura: {
          departamentos: ['Cundinamarca'],
          ciudades: ['Bogotá', 'Soacha', 'Chía', 'Zipaquirá'],
          nacional: false,
        },
        afiliados: {
          contributivo: 850000,
          total: 850000,
          fechaCorte: new Date('2024-01-01'),
        },
        tarifarioPreferido: 'ISS_2004',
        factorGlobalTipico: 1.12,
        activo: true,
      },
      {
        nit: '800177689',
        codigoHabilitacion: 'EPS006',
        razonSocial: 'FAMISANAR EPS LTDA',
        nombreComercial: 'FAMISANAR EPS',
        regimen: 'CONTRIBUTIVO',
        tipoEPS: 'EPS',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Carrera 52 No. 91-66',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6015948080',
          email: 'servicioalcliente@famisanar.com.co',
          sitioWeb: 'https://www.famisanar.com.co',
        },
        cobertura: {
          departamentos: ['Cundinamarca', 'Boyacá', 'Meta', 'Tolima'],
          ciudades: ['Bogotá', 'Tunja', 'Villavicencio', 'Ibagué'],
          nacional: false,
        },
        afiliados: {
          contributivo: 1200000,
          total: 1200000,
          fechaCorte: new Date('2024-01-01'),
        },
        tarifarioPreferido: 'ISS_2004',
        factorGlobalTipico: 1.14,
        activo: true,
      },
    ];

    // Insertar o actualizar
    for (const epsData of eps) {
      await EPSMaestro.findOneAndUpdate({ nit: epsData.nit }, epsData, { upsert: true, new: true });
    }

    console.log(`✅ ${eps.length} EPS insertadas/actualizadas exitosamente`);
  } catch (error) {
    console.error('❌ Error al hacer seed de EPS:', error);
    throw error;
  }
}
