// Service for OpenAI medical data extraction
import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Lazy initialization - only create when needed
let openai: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured. Please add it to your environment variables.');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface DiagnosticoInfo {
  codigo: string;
  descripcion: string;
  tipo: string;
  principal: boolean;
  confirmacion: string;
  responsable: string;
}

export interface ProcedimientoInfo {
  codigo_cups: string;
  descripcion: string;
  fecha_realizacion: string;
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  profesional: string;
}

export interface AutorizacionInfo {
  tipo: string;
  numero: string;
  fecha: string;
  pac: string;
  forma_pago: string;
  observacion: string;
}

export interface OrdenClinicaInfo {
  codigo: string;
  descripcion: string;
  fecha: string;
  profesional: string;
  prioridad: string;
  estado: string;
}

export interface AntecedenteInfo {
  fecha: string;
  tipo: string;
  descripcion: string;
  responsable: string;
}

export interface MedicalDataExtraction {
  // PESTAÑA 1: DATOS FACTURA
  nro_factura: string | null;
  nro_radicacion: string | null;
  fecha_factura: string | null;
  fecha_radicacion: string | null;
  fecha_vencimiento: string | null;
  ips: string | null;
  nit_ips: string | null;
  aseguradora: string | null;
  nit_aseguradora: string | null;
  convenio: string | null;
  estado_factura: string | null;
  observacion_factura: string | null;

  // PESTAÑA 2: DATOS PACIENTE
  tipo_documento: string | null;
  numero_documento: string | null;
  nombre_completo: string | null;
  fecha_nacimiento: string | null;
  edad_atencion: string | null;
  sexo: string | null;
  direccion: string | null;
  telefono: string | null;
  tipo_afiliado: string | null;
  categoria: string | null;
  regimen: string | null;
  episodio: string | null;

  // PESTAÑA 3: ATENCIÓN MÉDICA
  fecha_ingreso: string | null;
  fecha_egreso: string | null;
  servicio_atencion: string | null;
  tipo_atencion: string | null;
  causa_externa: string | null;
  finalidad_consulta: string | null;
  motivo_consulta: string | null;
  estado_ingreso: string | null;
  especialidad: string | null;
  profesional_tratante: string | null;
  documento_profesional: string | null;

  // PESTAÑA 4: DIAGNÓSTICOS (array)
  diagnosticos: DiagnosticoInfo[];

  // PESTAÑA 5: PROCEDIMIENTOS (array)
  procedimientos: ProcedimientoInfo[];

  // PESTAÑA 6: VALORES Y LIQUIDACIÓN
  valor_bruto: number | null;
  valor_iva: number | null;
  valor_descuentos: number | null;
  valor_neto: number | null;
  cuota_moderadora: number | null;
  valor_cobrar_eps: number | null;
  valor_cargo_paciente: number | null;
  pagos_otras_instituciones: number | null;

  // PESTAÑA 7: AUTORIZACIONES (array)
  autorizaciones: AutorizacionInfo[];

  // PESTAÑA 8: ÓRDENES CLÍNICAS (array)
  ordenes_clinicas: OrdenClinicaInfo[];

  // PESTAÑA 10: ANTECEDENTES (array)
  antecedentes: AntecedenteInfo[];

  // Metadata
  cuenta_id: string;
  documento_origen: string;
}

const EXTRACTION_PROMPT = `Eres un extractor experto de datos médicos para cuentas médicas colombianas. Recibirás el texto de documentos como facturas, historias clínicas, autorizaciones, RIPS, etc.

PRIORIDAD MÁXIMA: Extrae SIEMPRE los datos del paciente (nombre completo, tipo y número de documento, sexo, edad) OBLIGATORIAMENTE. Estos campos NO pueden ser null si aparecen en el documento.

Busca con atención especial:
- Nombre del paciente (puede estar en "PACIENTE:", "NOMBRE:", "BENEFICIARIO:", etc.)
- Cédula/Documento (puede estar como "CC", "DOCUMENTO", "IDENTIFICACIÓN", número solo)
- Diagnósticos CIE-10 (códigos con letras y números como "Q659", "K80", etc.)
- Procedimientos CUPS (códigos numéricos largos)
- Valores monetarios

Debes extraer TODOS los campos disponibles y devolverlos en formato JSON estrictamente válido. Si un campo no está presente en el documento, usar null.

ESTRUCTURA JSON ESPERADA:
{
  "prestaciones": [
    {
      // DATOS FACTURA
      "nro_factura": "string|null",
      "nro_radicacion": "string|null",
      "fecha_factura": "DD/MM/YYYY|null",
      "fecha_radicacion": "DD/MM/YYYY|null",
      "fecha_vencimiento": "DD/MM/YYYY|null",
      "ips": "string|null",
      "nit_ips": "string|null",
      "aseguradora": "string|null",
      "nit_aseguradora": "string|null",
      "convenio": "string|null",
      "estado_factura": "string|null",
      "observacion_factura": "string|null",

      // DATOS PACIENTE
      "tipo_documento": "CC|RC|TI|etc|null",
      "numero_documento": "string|null",
      "nombre_completo": "string|null",
      "fecha_nacimiento": "DD/MM/YYYY|null",
      "edad_atencion": "string|null",
      "sexo": "Masculino|Femenino|null",
      "direccion": "string|null",
      "telefono": "string|null",
      "tipo_afiliado": "string|null",
      "categoria": "string|null",
      "regimen": "CONTRIBUTIVO|SUBSIDIADO|null",
      "episodio": "string|null",

      // ATENCIÓN MÉDICA
      "fecha_ingreso": "DD/MM/YYYY HH:mm|null",
      "fecha_egreso": "DD/MM/YYYY|null",
      "servicio_atencion": "string|null",
      "tipo_atencion": "Ambulatoria|Hospitalaria|null",
      "causa_externa": "string|null",
      "finalidad_consulta": "string|null",
      "motivo_consulta": "string|null",
      "estado_ingreso": "Vivo|null",
      "especialidad": "string|null",
      "profesional_tratante": "string|null",
      "documento_profesional": "string|null",

      // DIAGNÓSTICOS (array)
      "diagnosticos": [
        {
          "codigo": "Q659",
          "descripcion": "DEFORMIDAD CONGENITA...",
          "tipo": "Diag. Tratam",
          "principal": true,
          "confirmacion": "Impresión Diagnostica",
          "responsable": "NOMBRE MEDICO"
        }
      ],

      // PROCEDIMIENTOS (array)
      "procedimientos": [
        {
          "codigo_cups": "0000890281",
          "descripcion": "CONSULTA DE PRIMERA VEZ...",
          "fecha_realizacion": "DD/MM/YYYY HH:mm",
          "cantidad": 1,
          "valor_unitario": 38586,
          "valor_total": 38586,
          "profesional": "NOMBRE"
        }
      ],

      // VALORES
      "valor_bruto": number|null,
      "valor_iva": number|null,
      "valor_descuentos": number|null,
      "valor_neto": number|null,
      "cuota_moderadora": number|null,
      "valor_cobrar_eps": number|null,
      "valor_cargo_paciente": number|null,
      "pagos_otras_instituciones": number|null,

      // AUTORIZACIONES (array)
      "autorizaciones": [
        {
          "tipo": "string",
          "numero": "string",
          "fecha": "DD/MM/YYYY",
          "pac": "string",
          "forma_pago": "string",
          "observacion": "string"
        }
      ],

      // ÓRDENES CLÍNICAS (array)
      "ordenes_clinicas": [
        {
          "codigo": "string",
          "descripcion": "string",
          "fecha": "DD/MM/YYYY HH:mm",
          "profesional": "string",
          "prioridad": "Prioritaria|Normal",
          "estado": "string"
        }
      ],

      // ANTECEDENTES (array)
      "antecedentes": [
        {
          "fecha": "DD/MM/YYYY",
          "tipo": "Patológicos|Traumáticos|etc",
          "descripcion": "string",
          "responsable": "string"
        }
      ]
    }
  ]
}

REGLAS IMPORTANTES:
1. Fechas siempre en formato DD/MM/YYYY o DD/MM/YYYY HH:mm
2. Valores numéricos SIN separador de miles (ej: 38586 no "38,586")
3. Si hay múltiples procedimientos en UN documento, crear elementos separados en el array "procedimientos"
4. Si hay múltiples diagnósticos, agregarlos al array "diagnosticos"
5. Extracta TODA la información disponible, aunque sean muchos campos
6. Si un campo no está en el documento, usar null
7. SOLO devuelve JSON válido, sin explicaciones adicionales

VALORES COMUNES:
- tipo_documento: CC, RC, TI, CE, PA
- regimen: CONTRIBUTIVO, SUBSIDIADO
- sexo: Masculino, Femenino
- tipo_atencion: Ambulatoria, Hospitalaria
- estado_ingreso: Vivo`;

/**
 * Extract medical data from PDF text using OpenAI
 */
export async function extractMedicalDataFromText(
  pdfText: string,
  cuentaId: string,
  documentOrigin: string,
  retries = 3
): Promise<MedicalDataExtraction[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: EXTRACTION_PROMPT,
          },
          {
            role: 'user',
            content: `Cuenta ID: ${cuentaId}\nDocumento origen: ${documentOrigin}\n\nTexto del PDF:\n${pdfText.slice(0, 30000)}`,
          },
        ],
        temperature: 0.05,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse the JSON response
      const parsed = JSON.parse(content);

      // Extract prestaciones array
      let extractions: MedicalDataExtraction[];
      if (Array.isArray(parsed)) {
        extractions = parsed;
      } else if (parsed.prestaciones && Array.isArray(parsed.prestaciones)) {
        extractions = parsed.prestaciones;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        extractions = parsed.data;
      } else {
        // Single object response
        extractions = [parsed];
      }

      // Ensure metadata is set and defaults for arrays
      extractions.forEach((item) => {
        item.cuenta_id = cuentaId;
        item.documento_origen = documentOrigin;

        // Ensure arrays exist
        item.diagnosticos = item.diagnosticos || [];
        item.procedimientos = item.procedimientos || [];
        item.autorizaciones = item.autorizaciones || [];
        item.ordenes_clinicas = item.ordenes_clinicas || [];
        item.antecedentes = item.antecedentes || [];
      });

      return extractions;
    } catch (error: any) {
      logger.error(`Attempt ${attempt}/${retries} failed for OpenAI extraction:`, error);

      if (attempt === retries) {
        logger.error('All OpenAI extraction attempts failed');
        throw new Error(
          `Failed to extract medical data after ${retries} attempts: ${error.message}`
        );
      }

      // Exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return [];
}

/**
 * Process multiple PDFs in batches to avoid rate limits
 */
export async function extractMedicalDataBatch(
  pdfTexts: Array<{ text: string; cuentaId: string; filename: string }>,
  batchSize = 5
): Promise<MedicalDataExtraction[]> {
  const allExtractions: MedicalDataExtraction[] = [];

  for (let i = 0; i < pdfTexts.length; i += batchSize) {
    const batch = pdfTexts.slice(i, i + batchSize);
    logger.info(`Processing batch ${i / batchSize + 1}, items ${i + 1}-${i + batch.length}`);

    const batchResults = await Promise.allSettled(
      batch.map(({ text, cuentaId, filename }) =>
        extractMedicalDataFromText(text, cuentaId, filename)
      )
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allExtractions.push(...result.value);
      } else {
        logger.error(
          `Failed to process ${batch[index].filename}:`,
          result.reason
        );
      }
    });

    // Rate limiting: wait between batches
    if (i + batchSize < pdfTexts.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return allExtractions;
}
