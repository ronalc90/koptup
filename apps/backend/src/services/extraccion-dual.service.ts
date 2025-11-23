/**
 * SERVICIO DE EXTRACCIÓN CON IA
 *
 * Usa únicamente IA (GPT-4) para extraer datos de facturas médicas.
 * Elimina dependencias de:
 * - pdf-to-png-converter (incompatible con Node v18)
 * - GPT-4o Vision
 * - Extracción con REGEX
 *
 * Objetivo: Extracción confiable usando solo IA estándar
 */

import * as fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { DatosFacturaPDF } from './pdf-extractor.service';

/**
 * Resultado de extracción con metadatos de confianza
 */
interface ExtraccionConConfianza extends DatosFacturaPDF {
  metadatos: {
    metodo: 'IA';
    confianza: number; // 0-100
    tiempoExtraccion: number; // ms
    camposExtraidos: number;
    camposVacios: number;
  };
}

/**
 * Resultado final de la extracción
 */
interface ResultadoExtraccionDual {
  datosFinales: DatosFacturaPDF;

  extraccionRegex: ExtraccionConConfianza;
  extraccionVision: ExtraccionConConfianza;

  comparacion: {
    camposComparados: any[];
    coincidencias: number;
    discrepancias: number;
    porcentajeCoincidencia: number;
  };

  decision: {
    nivelConfianza: number; // 0-100
    metodoPreferido: 'REGEX' | 'GPT4O_VISION' | 'HIBRIDO' | 'IA';
    requiereRevisionHumana: boolean;
    razonamiento: string;
  };

  // Para compatibilidad con otros servicios
  imagenPDFBase64?: string;
}

class ExtraccionDualService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI GPT-4 inicializado para extracción con IA');
    } else {
      console.log('⚠️  OPENAI_API_KEY no configurada');
    }
  }

  /**
   * MÉTODO PRINCIPAL: Extracción solo con IA
   */
  async extraerConDobleValidacion(pdfPath: string): Promise<ResultadoExtraccionDual> {
    console.log('🔍 Iniciando extracción con IA...');

    if (!this.openai) {
      throw new Error('OpenAI no está configurado. Configure OPENAI_API_KEY en las variables de entorno.');
    }

    const inicio = Date.now();
    const datosIA = await this.extraerConIA(pdfPath);
    const tiempoExtraccion = Date.now() - inicio;

    console.log(`✅ Extracción IA completada en ${tiempoExtraccion}ms`);
    console.log(`   - Campos extraídos: ${datosIA.metadatos.camposExtraidos}`);
    console.log(`   - Confianza: ${datosIA.metadatos.confianza}%`);

    return {
      datosFinales: datosIA,
      extraccionRegex: datosIA,
      extraccionVision: datosIA,
      comparacion: {
        camposComparados: [],
        coincidencias: 0,
        discrepancias: 0,
        porcentajeCoincidencia: 100,
      },
      decision: {
        nivelConfianza: datosIA.metadatos.confianza,
        metodoPreferido: 'IA',
        requiereRevisionHumana: datosIA.metadatos.confianza < 70,
        razonamiento: `Extracción completada con IA - Confianza: ${datosIA.metadatos.confianza}%`,
      },
    };
  }

  /**
   * Extracción con IA usando texto del PDF
   */
  private async extraerConIA(pdfPath: string): Promise<ExtraccionConConfianza> {
    if (!this.openai) {
      throw new Error('OpenAI no está configurado');
    }

    // 1. Extraer texto del PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const textoPDF = pdfData.text;

    console.log(`📄 Texto extraído del PDF (${textoPDF.length} caracteres)`);

    // 2. Llamar a GPT-4 para extraer datos estructurados
    const prompt = `Eres un experto en extracción de datos de facturas médicas colombianas.

Analiza el siguiente texto de una factura médica y extrae EXACTAMENTE los siguientes campos:

**DATOS DE LA FACTURA:**
- nroFactura: Número de factura
- fechaFactura: Fecha de emisión (formato DD/MM/YYYY)
- fechaRadicacion: Fecha de radicación
- valorBrutoFactura: Valor bruto total
- valorNetoFactura: Valor neto
- valorIVA: Valor del IVA

**DATOS DEL PACIENTE:**
- nombrePaciente: Nombre completo del paciente
- tipoDocumentoPaciente: Tipo de documento (CC, RC, TI, CE)
- numeroDocumento: Número de documento de identidad
- edad: Edad del paciente (número)
- sexo: Sexo (M/F)

**DATOS DEL PROCEDIMIENTO:**
- codigoProcedimiento: Código CUPS del procedimiento (6 dígitos que empiezan con 8 o 9)
- nombreProcedimiento: Descripción del procedimiento
- descripcionProcedimiento: Descripción completa
- cant: Cantidad de procedimientos realizados

**DATOS CLÍNICOS:**
- diagnosticoPrincipal: Código CIE-10 del diagnóstico principal (formato: letra + 2-3 números)
- diagnosticoRelacionado1: Diagnóstico relacionado si existe
- diagnosticoRelacionado2: Segundo diagnóstico relacionado si existe

**DATOS FINANCIEROS:**
- valorIPS: Valor facturado por la IPS (número)
- copago: Valor de copago
- cmo: Cuota moderadora

**DATOS DE AUTORIZACIÓN:**
- nroAutNvo: Número de autorización Nueva EPS
- autorizacion: Número de autorización general

**IMPORTANTE:**
- Los códigos CUPS DEBEN empezar con 8 o 9 (procedimientos médicos)
- Los códigos CIE-10 son letra seguida de números (ej: Q659, J18, I10)
- NO confundir códigos de vehículos (V03) con diagnósticos médicos
- Si un campo no se encuentra, devuelve cadena vacía "" o 0 para números
- Extrae los valores EXACTOS del texto, sin inventar datos

**FORMATO DE RESPUESTA:**
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:

{
  "nroFactura": "valor",
  "fechaFactura": "valor",
  "fechaRadicacion": "valor",
  "nombrePaciente": "valor",
  "tipoDocumentoPaciente": "valor",
  "numeroDocumento": "valor",
  "edad": numero,
  "sexo": "valor",
  "codigoProcedimiento": "valor",
  "nombreProcedimiento": "valor",
  "descripcionProcedimiento": "valor",
  "cant": numero,
  "diagnosticoPrincipal": "valor",
  "diagnosticoRelacionado1": "valor",
  "diagnosticoRelacionado2": "valor",
  "valorIPS": numero,
  "valorBrutoFactura": numero,
  "valorNetoFactura": numero,
  "valorIVA": numero,
  "copago": numero,
  "cmo": numero,
  "nroAutNvo": "valor",
  "autorizacion": "valor",
  "confianzaExtraccion": numero_0_a_100
}

TEXTO DE LA FACTURA:
${textoPDF}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0, // Temperatura baja para precisión máxima
    });

    // 3. Parsear respuesta JSON
    const contenido = response.choices[0].message.content || '{}';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('IA no devolvió JSON válido');
    }

    const datosExtraidos = JSON.parse(jsonMatch[0]);
    const confianzaExtraccion = datosExtraidos.confianzaExtraccion || 50;

    // 4. Crear objeto completo con valores por defecto
    const datoCompletos: any = {
      // Valores extraídos por IA
      ...datosExtraidos,

      // Campos adicionales con valores por defecto
      nroRadicacion: datosExtraidos.nroFactura || '',
      prefijoFactura: '',
      consecutivoFactura: '',
      tipoDocumentoIPS: '',
      regional: '',
      estadoFactura: '',
      observacion: '',

      // Procedimiento
      mapiss: '',
      cantParagr: datosExtraidos.cant || 0,
      matricUno: '',
      matrizLiquidacion: '',
      valorAPagar: datosExtraidos.valorIPS || 0,
      valorNotaCredito: 0,
      gestionGlosas: '',
      valorGlosaAdmitiva: 0,
      valorGlosaAuditoria: 0,
      estado: '',
      categoria: '',
      tipoLiquidacion: '',
      valor: datosExtraidos.valorIPS || 0,
      subServicioContratado: '',
      uvr: 0,
      regimen: '',
      convenioPaC: '',
      tipoDocumentoIPS2: '',

      // Glosas
      codigoDevolucion: '',
      cantGlosada: 0,
      vlrUnitGlosado: 0,
      valorDevolucion: 0,
      observacionesGlosa: '',
      origen: '',
      usuario: '',
      codigoDevolucionItem: '',
      totalGlosas: 0,
      diferencia: 0,

      // Autorización
      pai: '',
      formaDePago: '',
      observacionAut: '',

      // Paciente
      regimenPaciente: '',
      categoriaPaciente: '',
      tipoAfiliado: '',
      direccion: '',
      telefono: '',
      departamento: '',
      municipio: '',

      // Diagnósticos
      diagnosticoEgreso: '',

      // Fechas
      fechaIngreso: datosExtraidos.fechaFactura || '',
      horaIngreso: '',
      fechaEgreso: '',
      horaEgreso: '',
      servicioEgreso: '',
      cama: '',

      // Valores finales
      vlrBrutoFact: datosExtraidos.valorBrutoFactura || 0,
      vlrNetoFact: datosExtraidos.valorNetoFactura || 0,
      netoDigitado: 0,
      dif: 0,
      docValorIPS: datosExtraidos.valorIPS || 0,
      dacto: 0,
      totales: datosExtraidos.valorNetoFactura || 0,
      nroAtenciones: 1,
    };

    // 5. Contar campos extraídos
    const camposEsperados = [
      'nroFactura', 'nombrePaciente', 'numeroDocumento', 'codigoProcedimiento',
      'diagnosticoPrincipal', 'valorIPS', 'cant'
    ];

    const camposExtraidos = camposEsperados.filter(campo => {
      const valor = datoCompletos[campo];
      return valor && valor !== '' && valor !== 0;
    }).length;

    const camposVacios = camposEsperados.length - camposExtraidos;

    return {
      ...datoCompletos,
      metadatos: {
        metodo: 'IA',
        confianza: confianzaExtraccion,
        tiempoExtraccion: 0,
        camposExtraidos,
        camposVacios,
      },
    };
  }

  /**
   * Generar reporte de comparación (mantenido para compatibilidad)
   */
  generarReporteComparacion(resultado: ResultadoExtraccionDual): string {
    const lineas: string[] = [];

    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('     REPORTE DE EXTRACCIÓN CON IA');
    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('');

    lineas.push('📊 ESTADÍSTICAS DE EXTRACCIÓN:');
    lineas.push(`   - Confianza: ${resultado.decision.nivelConfianza}%`);
    lineas.push(`   - Método: ${resultado.decision.metodoPreferido}`);
    lineas.push('');

    lineas.push('🎯 DECISIÓN FINAL:');
    lineas.push(`   - Revisión humana: ${resultado.decision.requiereRevisionHumana ? 'SÍ ⚠️' : 'NO ✅'}`);
    lineas.push(`   - Razonamiento: ${resultado.decision.razonamiento}`);
    lineas.push('');
    lineas.push('═══════════════════════════════════════════════════════');

    return lineas.join('\n');
  }
}

export default new ExtraccionDualService();
