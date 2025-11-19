import Autorizacion from '../../models/Autorizacion';

/**
 * Seeds para Autorizaciones
 *
 * Autorizaciones de ejemplo para pruebas del sistema
 */

export async function seedAutorizaciones() {
  try {
    console.log('🌱 Seeding Autorizaciones...');

    const autorizaciones = [
      {
        numeroAutorizacion: 'AUT20240001',
        epsNit: '800249604',
        epsNombre: 'NUEVA EPS',
        ipsNit: '899999001',
        ipsNombre: 'Hospital San José',
        paciente: {
          tipoDocumento: 'CC',
          numeroDocumento: '1012345678',
          nombres: 'JUAN CARLOS',
          apellidos: 'RODRIGUEZ GOMEZ',
          edad: 45,
          sexo: 'M',
        },
        diagnosticoPrincipal: {
          codigoCIE10: 'I10',
          descripcion: 'Hipertensión esencial (primaria)',
        },
        serviciosAutorizados: [
          {
            codigoCUPS: '890201',
            descripcion: 'Consulta de primera vez por medicina general',
            cantidad: 3,
            cantidadUtilizada: 0,
            valorAutorizado: 135000,
          },
          {
            codigoCUPS: '901120',
            descripcion: 'Hemograma completo',
            cantidad: 2,
            cantidadUtilizada: 0,
            valorAutorizado: 30000,
          },
        ],
        estado: 'ACTIVA',
        fechaEmision: new Date('2024-01-15'),
        fechaVencimiento: new Date('2024-04-15'),
        observaciones: 'Autorización para seguimiento de hipertensión arterial',
        activo: true,
      },
      {
        numeroAutorizacion: 'AUT20240002',
        epsNit: '800249604',
        epsNombre: 'NUEVA EPS',
        ipsNit: '899999001',
        ipsNombre: 'Hospital San José',
        paciente: {
          tipoDocumento: 'CC',
          numeroDocumento: '1045678901',
          nombres: 'MARIA FERNANDA',
          apellidos: 'LOPEZ MARTINEZ',
          edad: 32,
          sexo: 'F',
        },
        diagnosticoPrincipal: {
          codigoCIE10: 'O80',
          descripcion: 'Parto único espontáneo',
        },
        serviciosAutorizados: [
          {
            codigoCUPS: '890202',
            descripcion: 'Consulta de primera vez por especialista',
            cantidad: 5,
            cantidadUtilizada: 2,
            valorAutorizado: 325000,
          },
          {
            codigoCUPS: '871001',
            descripcion: 'Ecografía obstétrica',
            cantidad: 3,
            cantidadUtilizada: 1,
            valorAutorizado: 435000,
          },
        ],
        estado: 'PARCIALMENTE_UTILIZADA',
        fechaEmision: new Date('2024-02-01'),
        fechaVencimiento: new Date('2024-08-01'),
        fechaUtilizacion: new Date('2024-02-15'),
        observaciones: 'Control prenatal',
        activo: true,
      },
      {
        numeroAutorizacion: 'AUT20240003',
        epsNit: '800088702',
        epsNombre: 'EPS SURA',
        ipsNit: '899999002',
        ipsNombre: 'Clínica del Norte',
        paciente: {
          tipoDocumento: 'CC',
          numeroDocumento: '1098765432',
          nombres: 'PEDRO ANTONIO',
          apellidos: 'GARCIA RUIZ',
          edad: 58,
          sexo: 'M',
        },
        diagnosticoPrincipal: {
          codigoCIE10: 'I21.9',
          descripcion: 'Infarto agudo del miocardio, sin otra especificación',
        },
        diagnosticosSecundarios: [
          {
            codigoCIE10: 'I10',
            descripcion: 'Hipertensión esencial',
          },
          {
            codigoCIE10: 'E11.9',
            descripcion: 'Diabetes mellitus tipo 2',
          },
        ],
        serviciosAutorizados: [
          {
            codigoCUPS: '332101',
            descripcion: 'Cateterismo cardíaco',
            cantidad: 1,
            cantidadUtilizada: 1,
            valorAutorizado: 3500000,
          },
          {
            codigoCUPS: '871201',
            descripcion: 'Ecocardiograma',
            cantidad: 2,
            cantidadUtilizada: 2,
            valorAutorizado: 570000,
          },
        ],
        estado: 'UTILIZADA',
        fechaEmision: new Date('2024-01-20'),
        fechaVencimiento: new Date('2024-02-20'),
        fechaUtilizacion: new Date('2024-01-22'),
        observaciones: 'Procedimiento de urgencia cardiovascular',
        activo: true,
      },
      {
        numeroAutorizacion: 'AUT20230099',
        epsNit: '800251440',
        epsNombre: 'EPS SANITAS',
        ipsNit: '899999001',
        ipsNombre: 'Hospital San José',
        paciente: {
          tipoDocumento: 'TI',
          numeroDocumento: '1076543210',
          nombres: 'SOFIA',
          apellidos: 'RAMIREZ PEREZ',
          edad: 8,
          sexo: 'F',
        },
        diagnosticoPrincipal: {
          codigoCIE10: 'J18.9',
          descripcion: 'Neumonía, no especificada',
        },
        serviciosAutorizados: [
          {
            codigoCUPS: '890201',
            descripcion: 'Consulta de primera vez',
            cantidad: 1,
            cantidadUtilizada: 1,
            valorAutorizado: 45000,
          },
        ],
        estado: 'VENCIDA',
        fechaEmision: new Date('2023-12-01'),
        fechaVencimiento: new Date('2024-01-01'),
        fechaUtilizacion: new Date('2023-12-05'),
        observaciones: 'Autorización vencida',
        activo: false,
      },
      {
        numeroAutorizacion: 'AUT20240004',
        epsNit: '800249604',
        epsNombre: 'NUEVA EPS',
        ipsNit: '899999001',
        ipsNombre: 'Hospital San José',
        paciente: {
          tipoDocumento: 'CC',
          numeroDocumento: '1023456789',
          nombres: 'CARLOS ALBERTO',
          apellidos: 'MENDOZA SILVA',
          edad: 52,
          sexo: 'M',
        },
        diagnosticoPrincipal: {
          codigoCIE10: 'E11.9',
          descripcion: 'Diabetes mellitus tipo 2, sin mención de complicación',
        },
        serviciosAutorizados: [
          {
            codigoCUPS: '890201',
            descripcion: 'Consulta medicina general',
            cantidad: 4,
            cantidadUtilizada: 0,
          },
          {
            codigoCUPS: '890202',
            descripcion: 'Consulta endocrinología',
            cantidad: 2,
            cantidadUtilizada: 0,
          },
          {
            codigoCUPS: '901120',
            descripcion: 'Hemoglobina glicosilada',
            cantidad: 3,
            cantidadUtilizada: 0,
          },
        ],
        estado: 'ACTIVA',
        fechaEmision: new Date('2024-02-01'),
        fechaVencimiento: new Date('2024-08-01'),
        observaciones: 'Seguimiento diabetes tipo 2',
        activo: true,
      },
    ];

    // Insertar o actualizar
    for (const autorizacion of autorizaciones) {
      await Autorizacion.findOneAndUpdate(
        { numeroAutorizacion: autorizacion.numeroAutorizacion },
        autorizacion,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ ${autorizaciones.length} autorizaciones insertadas/actualizadas exitosamente`);
  } catch (error) {
    console.error('❌ Error al hacer seed de autorizaciones:', error);
    throw error;
  }
}
