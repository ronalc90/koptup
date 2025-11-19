import CUPS from '../models/CUPS';
import axios from 'axios';

interface CUPSInfo {
  codigo: string;
  descripcion: string;
  categoria?: string;
  especialidad?: string;
  tarifaSOAT?: number;
  tarifaISS2001?: number;
  tarifaISS2004?: number;
}

class CUPSLookupService {
  /**
   * Busca un código CUPS, si no existe lo busca en fuentes externas
   */
  async obtenerCUPS(codigo: string): Promise<any> {
    // Primero buscar en la base de datos
    let cups = await CUPS.findOne({ codigo });

    if (cups) {
      return cups;
    }

    // Si no existe, buscar en fuentes externas
    console.log(`⚠️ CUPS ${codigo} no encontrado en BD, buscando en fuentes externas...`);

    const cupsInfo = await this.buscarEnFuentesExternas(codigo);

    if (cupsInfo) {
      // Guardar en base de datos
      cups = new CUPS({
        codigo: cupsInfo.codigo,
        descripcion: cupsInfo.descripcion,
        categoria: cupsInfo.categoria || 'Otro',
        especialidad: cupsInfo.especialidad,
        tarifaSOAT: cupsInfo.tarifaSOAT,
        tarifaISS2001: cupsInfo.tarifaISS2001,
        tarifaISS2004: cupsInfo.tarifaISS2004,
        activo: true,
        metadata: {
          requiereAutorizacion: this.determinarSiRequiereAutorizacion(cupsInfo.categoria),
          nivelComplejidad: 'medio',
        },
      });

      await cups.save();
      console.log(`✅ CUPS ${codigo} guardado en BD desde fuentes externas`);

      return cups;
    }

    // Si no se encuentra, crear uno básico
    cups = await this.crearCUPSBasico(codigo);
    return cups;
  }

  /**
   * Busca en múltiples fuentes externas
   */
  private async buscarEnFuentesExternas(codigo: string): Promise<CUPSInfo | null> {
    // 1. Intentar con API del Ministerio de Salud (si existe endpoint público)
    const resultadoMinisterio = await this.buscarEnMinisterioSalud(codigo);
    if (resultadoMinisterio) return resultadoMinisterio;

    // 2. Intentar con API de datos abiertos
    const resultadoDatosAbiertos = await this.buscarEnDatosAbiertos(codigo);
    if (resultadoDatosAbiertos) return resultadoDatosAbiertos;

    // 3. Buscar en web scraping (última opción)
    const resultadoWeb = await this.buscarEnWeb(codigo);
    if (resultadoWeb) return resultadoWeb;

    return null;
  }

  /**
   * Busca en SISPRO (Sistema Integrado de Información de la Protección Social)
   */
  private async buscarEnMinisterioSalud(codigo: string): Promise<CUPSInfo | null> {
    try {
      // SISPRO - Consulta de CUPS
      // URL real: https://web.sispro.gov.co/WebPublico/Consultas/ConsultarDetalleReferenciaBasica.aspx?Code=CUPS
      // Nota: Esta es una consulta web, no una API REST. Requeriría web scraping para automatizar.
      console.log(`ℹ️ SISPRO requiere consulta web manual para CUPS ${codigo}`);
      console.log('   URL: https://web.sispro.gov.co/WebPublico/Consultas/ConsultarDetalleReferenciaBasica.aspx?Code=CUPS');
    } catch (error) {
      console.log(`ℹ️ No se pudo consultar SISPRO para CUPS ${codigo}`);
    }
    return null;
  }

  /**
   * Busca en plataforma de datos abiertos (datos.gov.co)
   */
  private async buscarEnDatosAbiertos(codigo: string): Promise<CUPSInfo | null> {
    try {
      // Dataset real de Procedimientos del PBS en datos.gov.co
      // URL: https://www.datos.gov.co/Salud-y-Protecci-n-Social/Procedimiento-del-PBS/9zcz-bjue/data
      // Endpoint API Socrata (datos.gov.co usa Socrata)
      const url = `https://www.datos.gov.co/resource/9zcz-bjue.json?codigo_cups=${codigo}`;

      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200 && response.data && response.data.length > 0) {
        const data = response.data[0];
        return {
          codigo: codigo,
          descripcion: data.descripcion || data.nombre_procedimiento || 'Descripción no disponible',
          categoria: data.categoria || 'Otro',
          especialidad: data.especialidad,
        };
      }
    } catch (error) {
      console.log(`ℹ️ No se pudo consultar datos abiertos para CUPS ${codigo}`);
    }
    return null;
  }

  /**
   * Busca información en la web mediante scraping o búsqueda
   */
  private async buscarEnWeb(codigo: string): Promise<CUPSInfo | null> {
    try {
      // Podríamos usar web scraping, pero por límites de ética y legalidad,
      // mejor usar búsqueda semántica o retornar info básica
      console.log(`ℹ️ Búsqueda web no implementada para CUPS ${codigo}`);
    } catch (error) {
      console.log(`ℹ️ Error en búsqueda web para CUPS ${codigo}`);
    }
    return null;
  }

  /**
   * Parsea respuesta de API externa
   */
  private parsearRespuestaAPI(data: any, codigo: string): CUPSInfo | null {
    try {
      return {
        codigo: codigo,
        descripcion: data.descripcion || data.name || 'Descripción no disponible',
        categoria: data.categoria || data.category || 'Otro',
        especialidad: data.especialidad || data.specialty,
        tarifaSOAT: data.tarifaSOAT || data.soat,
        tarifaISS2001: data.tarifaISS2001 || data.iss2001,
        tarifaISS2004: data.tarifaISS2004 || data.iss2004,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Crea un CUPS básico cuando no se encuentra en ninguna fuente
   */
  private async crearCUPSBasico(codigo: string): Promise<any> {
    const cups = new CUPS({
      codigo,
      descripcion: `Procedimiento ${codigo} (información pendiente de completar)`,
      categoria: 'Otro',
      activo: true,
      metadata: {
        requiereAutorizacion: true, // Por seguridad, asumir que requiere
        nivelComplejidad: 'medio',
      },
    });

    await cups.save();
    console.log(`⚠️ CUPS ${codigo} creado con información básica`);

    return cups;
  }

  /**
   * Determina si un procedimiento requiere autorización según categoría
   */
  private determinarSiRequiereAutorizacion(categoria?: string): boolean {
    const categoriasQueRequieren = [
      'Cirugía',
      'Imagenología',
      'Ayudas Diagnósticas',
      'Terapia',
    ];

    return categoria ? categoriasQueRequieren.includes(categoria) : true;
  }

  /**
   * Actualiza masivamente códigos CUPS desde fuente externa
   */
  async actualizarCUPSDesdeAPI(codigos: string[]): Promise<void> {
    console.log(`🔄 Actualizando ${codigos.length} códigos CUPS...`);

    for (const codigo of codigos) {
      await this.obtenerCUPS(codigo);
      // Pequeña pausa para no saturar APIs
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('✅ Actualización de CUPS completada');
  }

  /**
   * Busca CUPS faltantes en una factura y los completa
   */
  async completarCUPSFaltantes(facturaId: string): Promise<void> {
    const Procedimiento = (await import('../models/Procedimiento')).default;
    const procedimientos = await Procedimiento.find({ facturaId });

    const codigosFaltantes: string[] = [];

    for (const proc of procedimientos) {
      const cups = await CUPS.findOne({ codigo: proc.codigoCUPS });
      if (!cups) {
        codigosFaltantes.push(proc.codigoCUPS);
      }
    }

    if (codigosFaltantes.length > 0) {
      console.log(`📋 Encontrados ${codigosFaltantes.length} códigos CUPS faltantes`);
      await this.actualizarCUPSDesdeAPI([...new Set(codigosFaltantes)]);
    }
  }
}

export default new CUPSLookupService();
