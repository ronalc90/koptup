import IPSMaestro from '../../models/IPSMaestro';

/**
 * Seeds para IPS Maestro
 *
 * Catálogo de IPS de ejemplo para el sistema
 */

export async function seedIPS() {
  try {
    console.log('🌱 Seeding IPS Maestro...');

    const ips = [
      {
        nit: '899999001',
        codigoHabilitacion: 'IPS001',
        razonSocial: 'HOSPITAL UNIVERSITARIO SAN JOSÉ',
        nombreComercial: 'Hospital San José',
        tipoIPS: 'HOSPITAL',
        nivelAtencion: '3',
        naturaleza: 'PRIVADA',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Carrera 19 No. 8A-32',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6013538000',
          email: 'info@hospitalsanjose.edu.co',
          sitioWeb: 'https://www.hospitalsanjose.edu.co',
        },
        sedes: [
          {
            nombre: 'Sede Principal',
            direccion: 'Carrera 19 No. 8A-32',
            ciudad: 'Bogotá',
            departamento: 'Cundinamarca',
            telefono: '6013538000',
            activa: true,
          },
        ],
        serviciosHabilitados: [
          {
            codigoServicio: '301',
            nombreServicio: 'Consulta Externa',
            complejidad: 'ALTA',
            fechaHabilitacion: new Date('2020-01-01'),
            activo: true,
          },
          {
            codigoServicio: '302',
            nombreServicio: 'Hospitalización',
            complejidad: 'ALTA',
            fechaHabilitacion: new Date('2020-01-01'),
            activo: true,
          },
          {
            codigoServicio: '305',
            nombreServicio: 'Quirófano',
            complejidad: 'ALTA',
            fechaHabilitacion: new Date('2020-01-01'),
            activo: true,
          },
        ],
        especialidades: [
          'Medicina Interna',
          'Cirugía General',
          'Ginecología',
          'Pediatría',
          'Ortopedia',
          'Cardiología',
          'Neurología',
        ],
        convenios: [
          {
            epsNit: '800249604',
            epsNombre: 'NUEVA EPS',
            tipoConvenio: 'POS',
            fechaInicio: new Date('2024-01-01'),
            fechaFin: new Date('2024-12-31'),
            activo: true,
          },
          {
            epsNit: '800088702',
            epsNombre: 'EPS SURA',
            tipoConvenio: 'POS',
            fechaInicio: new Date('2024-01-01'),
            fechaFin: new Date('2024-12-31'),
            activo: true,
          },
        ],
        capacidadInstalada: {
          camas: 250,
          camasUCI: 30,
          camasUrgencias: 40,
          quirofanos: 12,
          consultorios: 50,
        },
        tarifarioPreferido: 'ISS_2004',
        activo: true,
      },
      {
        nit: '899999002',
        codigoHabilitacion: 'IPS002',
        razonSocial: 'CLÍNICA DEL NORTE S.A.',
        nombreComercial: 'Clínica del Norte',
        tipoIPS: 'CLINICA',
        nivelAtencion: '3',
        naturaleza: 'PRIVADA',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Calle 170 No. 8-52',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6016768080',
          email: 'contacto@clin icanorte.com.co',
          sitioWeb: 'https://www.clinicanorte.com.co',
        },
        sedes: [
          {
            nombre: 'Sede Principal',
            direccion: 'Calle 170 No. 8-52',
            ciudad: 'Bogotá',
            departamento: 'Cundinamarca',
            activa: true,
          },
        ],
        serviciosHabilitados: [
          {
            codigoServicio: '301',
            nombreServicio: 'Consulta Externa',
            complejidad: 'ALTA',
            fechaHabilitacion: new Date('2019-01-01'),
            activo: true,
          },
        ],
        especialidades: ['Cirugía Cardiovascular', 'Cardiología', 'Medicina Interna'],
        convenios: [
          {
            epsNit: '800251440',
            epsNombre: 'EPS SANITAS',
            tipoConvenio: 'POS',
            fechaInicio: new Date('2024-01-01'),
            activo: true,
          },
        ],
        capacidadInstalada: {
          camas: 180,
          camasUCI: 24,
          quirofanos: 8,
          consultorios: 35,
        },
        tarifarioPreferido: 'ISS_2004',
        activo: true,
      },
      {
        nit: '899999003',
        codigoHabilitacion: 'IPS003',
        razonSocial: 'CENTRO MÉDICO SALUD TOTAL',
        nombreComercial: 'Centro Médico Salud Total',
        tipoIPS: 'CENTRO_SALUD',
        nivelAtencion: '1',
        naturaleza: 'PRIVADA',
        estado: 'ACTIVA',
        contacto: {
          direccion: 'Carrera 15 No. 45-23',
          ciudad: 'Bogotá',
          departamento: 'Cundinamarca',
          telefono: '6013456789',
        },
        sedes: [
          {
            nombre: 'Sede Única',
            direccion: 'Carrera 15 No. 45-23',
            ciudad: 'Bogotá',
            departamento: 'Cundinamarca',
            activa: true,
          },
        ],
        serviciosHabilitados: [
          {
            codigoServicio: '301',
            nombreServicio: 'Consulta Externa',
            complejidad: 'BAJA',
            fechaHabilitacion: new Date('2022-01-01'),
            activo: true,
          },
        ],
        especialidades: ['Medicina General', 'Odontología'],
        convenios: [
          {
            epsNit: '800249604',
            epsNombre: 'NUEVA EPS',
            tipoConvenio: 'POS',
            fechaInicio: new Date('2024-01-01'),
            activo: true,
          },
        ],
        capacidadInstalada: {
          consultorios: 10,
        },
        tarifarioPreferido: 'ISS_2004',
        activo: true,
      },
    ];

    // Insertar o actualizar
    for (const ipsData of ips) {
      await IPSMaestro.findOneAndUpdate({ nit: ipsData.nit }, ipsData, { upsert: true, new: true });
    }

    console.log(`✅ ${ips.length} IPS insertadas/actualizadas exitosamente`);
  } catch (error) {
    console.error('❌ Error al hacer seed de IPS:', error);
    throw error;
  }
}
