/**
 * Servicio Principal del Sistema Experto de Auditoría de Cuentas Médicas
 *
 * Orquesta el procesamiento completo:
 * 1. Extracción de datos del PDF con OpenAI
 * 2. Validación con BD de CUPS, Diagnósticos, etc.
 * 3. Aplicación del motor de reglas para detectar glosas
 * 4. Generación de Excel con 5 hojas
 */

import { extractTextFromPDF } from './pdf.service';
import { getOpenAI } from './openai.service';
import {
  searchCUPS,
  searchDiagnosticos,
  calcularTarifaProcedimientos,
} from './medical-search.service';
import { motorReglas } from './expert-rules.service';
import {
  ResultadoSistemaExperto,
  RadicacionFacturaGeneral,
  DetalleFactura,
  RegistroAtencion,
  ProcedimientoAtencion,
  GlosaDetalle,
  ContextoValidacion,
  CodigoGlosa,
} from '../types/expert-system.types';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES INTERNAS
// ============================================================================

interface DatosExtraidosPDF {
  // Radicación y Factura
  nroFactura: string;
  fechaFactura: Date;
  ips: string;
  eps?: string;
  nitIPS?: string;
  nitEPS?: string;
  formaPago?: string;

  // Paciente
  paciente: {
    nombre: string;
    tipoDocumento: string;
    numeroDocumento: string;
    edad?: string;
    sexo?: string;
    regimen?: string;
  };

  // Atención
  atencion: {
    numeroEpisodio?: string;
    fechaIngreso?: Date;
    fechaEgreso?: Date;
    tipoAtencion?: string;
  };

  // Diagnósticos
  diagnosticos: Array<{
    codigoCIE10: string;
    descripcion: string;
    tipo: 'Principal' | 'Secundario' | 'Relacionado';
  }>;

  // Procedimientos
  procedimientos: Array<{
    codigoCUPS: string;
    descripcion: string;
    cantidad: number;
    valorUnitario: number;
    valorTotal: number;
    fecha?: Date;
    profesional?: string;
    autorizacion?: string;
  }>;

  // Valores
  valores: {
    subtotal: number;
    cuotaModeradora?: number;
    copago?: number;
    descuentos?: number;
    totalPaciente?: number;
    totalEPS?: number;
  };
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class SistemaExpertoService {
  /**
   * Procesa una factura médica completa y genera el resultado para Excel
   */
  async procesarFacturaMedica(
    pdfPath: string,
    opciones: {
      nroRadicacion?: string;
      fechaRadicacion?: Date;
      convenio?: string;
      manualTarifario?: 'ISS2001' | 'ISS2004' | 'SOAT';
    } = {}
  ): Promise<ResultadoSistemaExperto> {
    const inicio = Date.now();
    logger.info(`Iniciando procesamiento experto de: ${pdfPath}`);

    try {
      // ================================================================
      // PASO 1: Extraer texto del PDF
      // ================================================================
      logger.info('Paso 1/5: Extrayendo texto del PDF...');
      const extractedData = await extractTextFromPDF(pdfPath);
      const textoPDF = extractedData.text;

      // ================================================================
      // PASO 2: Extraer datos estructurados con OpenAI
      // ================================================================
      logger.info('Paso 2/5: Extrayendo datos con OpenAI...');
      const datosExtraidos = await this.extraerDatosConIA(textoPDF);

      // ================================================================
      // PASO 3: Validar y enriquecer con BD
      // ================================================================
      logger.info('Paso 3/5: Validando y enriqueciendo con BD...');
      const datosEnriquecidos = await this.validarYEnriquecer(datosExtraidos, opciones);

      // ================================================================
      // PASO 4: Aplicar motor de reglas y detectar glosas
      // ================================================================
      logger.info('Paso 4/5: Aplicando motor de reglas...');
      const resultado = await this.aplicarReglasYGenerarGlosas(datosEnriquecidos, opciones);

      // ================================================================
      // PASO 5: Estructurar datos para Excel
      // ================================================================
      logger.info('Paso 5/5: Estructurando resultado final...');
      const resultadoFinal = this.estructurarResultadoFinal(resultado, opciones);

      const tiempoTotal = Date.now() - inicio;
      logger.info(`Procesamiento completado en ${tiempoTotal}ms`);

      resultadoFinal.metadata.tiempoMs = tiempoTotal;
      return resultadoFinal;
    } catch (error) {
      logger.error('Error en procesamiento experto:', error);
      throw error;
    }
  }

  /**
   * Extrae datos estructurados del PDF usando OpenAI
   */
  private async extraerDatosConIA(textoPDF: string): Promise<DatosExtraidosPDF> {
    const openai = getOpenAI();

    const prompt = `Eres un experto en auditoría de cuentas médicas colombianas.
Extrae los siguientes datos de esta factura médica:

1. **Información de la Factura:**
   - Número de factura
   - Fecha de factura
   - IPS (nombre e identificación)
   - EPS (nombre e identificación)
   - Forma de pago

2. **Información del Paciente:**
   - Nombre completo
   - Tipo de documento (CC, TI, RC, etc.)
   - Número de documento
   - Edad
   - Sexo
   - Régimen (Contributivo/Subsidiado)

3. **Información de la Atención:**
   - Número de episodio o atención
   - Fecha de ingreso
   - Fecha de egreso
   - Tipo de atención (consulta ambulatoria, hospitalización, urgencias, etc.)

4. **Diagnósticos:**
   - Código CIE-10
   - Descripción
   - Tipo (Principal, Secundario, Relacionado)

5. **Procedimientos:**
   - Código CUPS
   - Descripción del procedimiento
   - Cantidad
   - Valor unitario
   - Valor total
   - Fecha del servicio
   - Profesional que realizó el servicio
   - Número de autorización (si está disponible)

6. **Valores y Totales:**
   - Subtotal
   - Cuota moderadora
   - Copago
   - Descuentos
   - Total a cargo del paciente
   - Total a cargo de la EPS

IMPORTANTE:
- Extrae TODOS los procedimientos que encuentres
- NO calcules valores, solo extrae lo que está en el documento
- Si un dato no está disponible, usa null
- Los códigos CUPS pueden tener ceros al inicio, consérvalos

Responde ÚNICAMENTE con JSON válido siguiendo esta estructura:
{
  "nroFactura": "string",
  "fechaFactura": "YYYY-MM-DD",
  "ips": "string",
  "eps": "string",
  "nitIPS": "string",
  "nitEPS": "string",
  "formaPago": "string",
  "paciente": {
    "nombre": "string",
    "tipoDocumento": "string",
    "numeroDocumento": "string",
    "edad": "string",
    "sexo": "M|F",
    "regimen": "Contributivo|Subsidiado"
  },
  "atencion": {
    "numeroEpisodio": "string",
    "fechaIngreso": "YYYY-MM-DD",
    "fechaEgreso": "YYYY-MM-DD",
    "tipoAtencion": "string"
  },
  "diagnosticos": [
    {
      "codigoCIE10": "string",
      "descripcion": "string",
      "tipo": "Principal|Secundario|Relacionado"
    }
  ],
  "procedimientos": [
    {
      "codigoCUPS": "string",
      "descripcion": "string",
      "cantidad": number,
      "valorUnitario": number,
      "valorTotal": number,
      "fecha": "YYYY-MM-DD",
      "profesional": "string",
      "autorizacion": "string"
    }
  ],
  "valores": {
    "subtotal": number,
    "cuotaModeradora": number,
    "copago": number,
    "descuentos": number,
    "totalPaciente": number,
    "totalEPS": number
  }
}`;

    try {
      const respuesta = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: textoPDF },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const contenido = respuesta.choices[0]?.message?.content || '{}';
      const datos = JSON.parse(contenido);

      // Convertir fechas
      if (datos.fechaFactura) datos.fechaFactura = new Date(datos.fechaFactura);
      if (datos.atencion?.fechaIngreso) datos.atencion.fechaIngreso = new Date(datos.atencion.fechaIngreso);
      if (datos.atencion?.fechaEgreso) datos.atencion.fechaEgreso = new Date(datos.atencion.fechaEgreso);

      datos.procedimientos?.forEach((proc: any) => {
        if (proc.fecha) proc.fecha = new Date(proc.fecha);
      });

      logger.info(`Datos extraídos: ${datos.procedimientos?.length || 0} procedimientos`);
      return datos as DatosExtraidosPDF;
    } catch (error) {
      logger.error('Error extrayendo datos con OpenAI:', error);
      throw new Error('Error en extracción de datos del PDF');
    }
  }

  /**
   * Valida códigos contra BD y enriquece con información adicional
   */
  private async validarYEnriquecer(
    datos: DatosExtraidosPDF,
    opciones: any
  ): Promise<any> {
    logger.info('Validando códigos CUPS y diagnósticos...');

    const procedimientosEnriquecidos = [];

    for (const proc of datos.procedimientos) {
      // Buscar CUPS en BD
      const cups = await searchCUPS({ codigo: proc.codigoCUPS });
      let cupsEncontrado = cups && cups.items && cups.items.length > 0 ? cups.items[0] : null;

      // Calcular tarifa según manual
      const manualTarifario = opciones.manualTarifario || 'ISS2004';
      let tarifaContratada = 0;

      if (cupsEncontrado) {
        switch (manualTarifario) {
          case 'ISS2001':
            tarifaContratada = cupsEncontrado.tarifaISS2001 || 0;
            break;
          case 'ISS2004':
            tarifaContratada = cupsEncontrado.tarifaISS2004 || 0;
            break;
          case 'SOAT':
            tarifaContratada = cupsEncontrado.tarifaSOAT || 0;
            break;
        }
      }

      procedimientosEnriquecidos.push({
        ...proc,
        cupsEnBD: cupsEncontrado,
        tarifaContratada,
        manualTarifario,
      });
    }

    // Validar diagnósticos
    const diagnosticosValidados = [];
    for (const diag of datos.diagnosticos) {
      const diagEnBD = await searchDiagnosticos({ codigoCIE10: diag.codigoCIE10 });
      diagnosticosValidados.push({
        ...diag,
        validado: diagEnBD && diagEnBD.items && diagEnBD.items.length > 0,
        diagnosticoEnBD: diagEnBD && diagEnBD.items && diagEnBD.items.length > 0 ? diagEnBD.items[0] : null,
      });
    }

    return {
      ...datos,
      procedimientos: procedimientosEnriquecidos,
      diagnosticos: diagnosticosValidados,
    };
  }

  /**
   * Aplica motor de reglas y detecta glosas automáticamente
   */
  private async aplicarReglasYGenerarGlosas(datos: any, opciones: any): Promise<any> {
    logger.info('Aplicando motor de reglas...');

    const procedimientosConGlosas = [];
    const glosasDetectadas: GlosaDetalle[] = [];
    let itemsConGlosas = 0;

    for (const proc of datos.procedimientos) {
      // Crear contexto de validación
      const contexto: ContextoValidacion = {
        procedimiento: proc,
        diagnosticos: datos.diagnosticos,
        autorizacion: proc.autorizacion
          ? {
              numero: proc.autorizacion,
              vigencia: null,
              cantidadAutorizada: null,
            }
          : undefined,
        cupsEnBD: proc.cupsEnBD,
        tarifaContratada: proc.tarifaContratada,
        convenio: opciones.convenio,
      };

      // Validar con motor de reglas
      const resultadosReglas = motorReglas.validarProcedimiento(contexto);

      // Procesar glosas detectadas
      let tieneGlosas = false;
      let valorGlosaTotal = 0;

      for (const resultado of resultadosReglas) {
        if (resultado.glosa) {
          tieneGlosas = true;
          valorGlosaTotal += resultado.glosa.valorGlosado;

          // Agregar a lista de glosas
          glosasDetectadas.push({
            codigoDevolucion: resultado.glosa.codigo,
            cantidadGlosada: proc.cantidad || 1,
            vrUnitGlosado: resultado.glosa.valorGlosado / (proc.cantidad || 1),
            valorTotalDevolucion: resultado.glosa.valorGlosado,
            observacionesGlosa: resultado.glosa.observaciones,
            origen: this.determinarOrigenGlosa(resultado.glosa.codigo),
            valorGlosaFinal: resultado.glosa.valorGlosado,
            codigoProcedimiento: proc.codigoCUPS,
            nombreProcedimiento: proc.descripcion,
          });
        }
      }

      if (tieneGlosas) itemsConGlosas++;

      procedimientosConGlosas.push({
        ...proc,
        tieneGlosas,
        valorGlosaTotal,
        glosas: resultadosReglas.filter((r) => r.glosa).map((r) => r.glosa),
      });
    }

    return {
      ...datos,
      procedimientos: procedimientosConGlosas,
      glosas: glosasDetectadas,
      itemsConGlosas,
    };
  }

  /**
   * Determina el origen de la glosa según su código
   */
  private determinarOrigenGlosa(
    codigo: CodigoGlosa
  ): 'Facturación' | 'Auditoría' | 'Clínica' | 'Administrativa' {
    const codigoNum = parseInt(codigo);
    if (codigoNum >= 100 && codigoNum < 200) return 'Facturación';
    if (codigoNum >= 200 && codigoNum < 300) return 'Administrativa';
    if (codigoNum >= 300 && codigoNum < 400) return 'Clínica';
    if (codigoNum >= 400 && codigoNum < 500) return 'Auditoría';
    return 'Administrativa';
  }

  /**
   * Estructura el resultado final en el formato de las 5 hojas del Excel
   */
  private estructurarResultadoFinal(datos: any, opciones: any): ResultadoSistemaExperto {
    // Generar número de radicación si no se proporcionó
    const nroRadicacion = opciones.nroRadicacion || `RAD-${Date.now()}`;
    const fechaRadicacion = opciones.fechaRadicacion || new Date();

    // ========================================================================
    // HOJA 1: RADICACIÓN / FACTURA GENERAL
    // ========================================================================
    const hoja1: RadicacionFacturaGeneral = {
      nroRadicacion,
      fechaRadicacion,
      tipoCuenta: 'Servicios',
      auditoriaEnfermeria: 'Auditoría',
      regimen: datos.paciente.regimen === 'Contributivo' ? 'Contributivo' : 'Subsidiado',
      producto: 'POS',
      convenio: opciones.convenio || 'GENERAL',
      ips: datos.ips,
      nroFactura: datos.nroFactura,
      fechaFactura: datos.fechaFactura,
      nroAtenciones: 1,
      valorBrutoFactura: datos.valores.subtotal || 0,
      valorIVA: 0,
      valorNetoFactura: datos.valores.subtotal || 0,
      observacionFactura: 'Procesada con Sistema Experto',
      estadoFactura: datos.glosas.length > 0 ? 'DEV' : 'LIQ',
      regional: 'Principal',
      tipoDocumentoIPS: datos.nitIPS || '',
      radicacionPIC: undefined,
    };

    // ========================================================================
    // HOJA 2: DETALLE DE LA FACTURA
    // ========================================================================
    const hoja2: DetalleFactura[] = [
      {
        lineaConsecutivo: 1,
        autoriza: datos.procedimientos[0]?.autorizacion || undefined,
        tipoDoc: datos.paciente.tipoDocumento,
        identificacion: datos.paciente.numeroDocumento,
        nombre: datos.paciente.nombre,
        fechaInicio: datos.atencion.fechaIngreso || datos.fechaFactura,
        fechaFin: datos.atencion.fechaEgreso || datos.fechaFactura,
        regimen: datos.paciente.regimen === 'Contributivo' ? 'Contributivo' : 'Subsidiado',
        ipsPrimaria: undefined,
        documentoSoporte: datos.atencion.numeroEpisodio,
        valorIPS: datos.valores.subtotal || 0,
        copagoIPS: datos.valores.copago || 0,
        cmoIPS: datos.valores.cuotaModeradora || 0,
        descuento: datos.valores.descuentos || 0,
        totales: (datos.valores.subtotal || 0) - (datos.valores.descuentos || 0),
        estado: datos.glosas.length > 0 ? 'DEV' : 'LIQ',
        usuario: 'SISTEMA_EXPERTO',
        plan: 'POS',
      },
    ];

    // ========================================================================
    // HOJA 3: REGISTRO DE ATENCIONES
    // ========================================================================
    const hoja3: RegistroAtencion[] = datos.diagnosticos.map((diag: any, index: number) => ({
      nroRadicacion,
      nroAtencion: datos.atencion.numeroEpisodio || '1',
      autorizacion: datos.procedimientos[0]?.autorizacion || undefined,
      pai: undefined,
      formaPago: 'NORMAL',
      observacionAutorizacion: undefined,
      diagnostico: diag.codigoCIE10,
      dxNombre: diag.descripcion,
      dxClase: diag.tipo,
    }));

    // ========================================================================
    // HOJA 4: PROCEDIMIENTOS POR ATENCIÓN
    // ========================================================================
    const hoja4: ProcedimientoAtencion[] = datos.procedimientos.map((proc: any, index: number) => {
      const valorEPS = proc.tarifaContratada * (proc.cantidad || 1);
      const valorGlosa = proc.valorGlosaTotal || 0;
      const valorAPagar = valorEPS - valorGlosa;

      return {
        nroRadicacion,
        nroAtencion: datos.atencion.numeroEpisodio || '1',
        codigoManual: proc.manualTarifario || 'ISS2004',
        codigoProcedimiento: proc.codigoCUPS,
        nombreProcedimiento: proc.descripcion,
        mapiiss: undefined,
        cantidad: proc.cantidad || 1,
        valorIPS: proc.valorUnitario,
        valorEPS: proc.tarifaContratada,
        valorAPagar: valorAPagar > 0 ? valorAPagar : 0,
        valorNotaCredito: 0,
        gestion: undefined,
        glosas: proc.tieneGlosas,
        valorGlosaAdmisiva: 0,
        valorGlosaAuditoria: valorGlosa,
        estado: proc.tieneGlosas ? 'GLOS' : 'AUT',
        tipoLiquidacion: 'UNIL',
        valorContratadoEPS: proc.tarifaContratada,
        subservicio: proc.cupsEnBD?.categoria || undefined,
      };
    });

    // ========================================================================
    // HOJA 5: GLOSAS
    // ========================================================================
    const hoja5: GlosaDetalle[] = datos.glosas.map((glosa: GlosaDetalle) => ({
      ...glosa,
      nroRadicacion,
      nroAtencion: datos.atencion.numeroEpisodio || '1',
    }));

    // ========================================================================
    // RESUMEN
    // ========================================================================
    const totalFacturado = datos.valores.subtotal || 0;
    const totalGlosado = datos.glosas.reduce((sum: number, g: GlosaDetalle) => sum + g.valorTotalDevolucion, 0);
    const totalAPagar = totalFacturado - totalGlosado;

    const glosasPorTipo: Record<string, number> = {};
    datos.glosas.forEach((g: GlosaDetalle) => {
      glosasPorTipo[g.codigoDevolucion] = (glosasPorTipo[g.codigoDevolucion] || 0) + 1;
    });

    return {
      metadata: {
        fechaProcesamiento: new Date(),
        tiempoMs: 0, // Se completa después
        version: '1.0.0',
        itemsValidados: datos.procedimientos.length,
        itemsConGlosas: datos.itemsConGlosas,
        advertencias: [],
      },
      hoja1_radicacion: hoja1,
      hoja2_detalles: hoja2,
      hoja3_atenciones: hoja3,
      hoja4_procedimientos: hoja4,
      hoja5_glosas: hoja5,
      resumen: {
        totalFacturado,
        totalGlosado,
        totalAPagar,
        cantidadGlosas: datos.glosas.length,
        glosasPorTipo,
      },
    };
  }
}

// Exportar instancia singleton
export const sistemaExperto = new SistemaExpertoService();
