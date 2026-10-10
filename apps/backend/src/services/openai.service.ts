// Service for OpenAI medical data extraction
import OpenAI from 'openai';
import type { Fetch } from 'openai/core';
import { fetch as sdkFetch } from 'openai/_shims/index';
import { logger } from '../utils/logger';
import { getBudgetStatus, recordSpend, type BudgetFeature } from './ai-budget.service';

// Lazy initialization - only create when needed
let openai: OpenAI | null = null;
/**
 * Cliente perezoso: se crea en el primer uso, no al importar el módulo. Así el
 * servidor arranca aunque falte OPENAI_API_KEY (las funciones de IA responden
 * con su error controlado en lugar de tumbar el proceso).
 *
 * Con `feature`, el cliente es el de esa función (ver `getOpenAIFor`).
 */
export function lazyOpenAI(feature?: BudgetFeature): OpenAI {
  return new Proxy({} as OpenAI, {
    get: (_target, prop) => Reflect.get((feature ? getOpenAIFor(feature) : getOpenAI()) as object, prop),
  });
}

/**
 * Cliente sin tope propio. Lo usan las funciones que ya registran su gasto
 * por su cuenta (chatbot, gestor de contenido). Las demás usan `getOpenAIFor`.
 */
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

// ---------------------------------------------------------------------------
//   Clientes con tope de gasto por función
// ---------------------------------------------------------------------------

/** USD por 1M de tokens (entrada, salida) de los modelos que usa el backend. */
const OPENAI_PRICES_PER_1M: ReadonlyArray<{ prefix: string; input: number; output: number }> = [
  { prefix: 'gpt-4o-mini', input: 0.15, output: 0.6 },
  { prefix: 'gpt-4o', input: 2.5, output: 10 },
  { prefix: 'gpt-4-turbo', input: 10, output: 30 },
  { prefix: 'gpt-4', input: 30, output: 60 },
  { prefix: 'gpt-3.5-turbo', input: 0.5, output: 1.5 },
  { prefix: 'text-embedding-3-small', input: 0.02, output: 0 },
  { prefix: 'text-embedding-3-large', input: 0.13, output: 0 },
  { prefix: 'text-embedding-ada-002', input: 0.1, output: 0 },
];
/** Modelo desconocido: se cobra caro (mejor detenerse antes que pasarse del tope). */
const UNKNOWN_MODEL_PRICE = { input: 10, output: 30 };

/**
 * Costo estimado de una llamada con los tokens que informa OpenAI. El modelo
 * de la respuesta trae fecha (`gpt-4o-2024-08-06`): se busca el prefijo más
 * largo de la tabla.
 */
export function estimateOpenAICostUSD(model: string | undefined, promptTokens: number, completionTokens: number): number {
  const id = String(model ?? '').toLowerCase();
  const match = OPENAI_PRICES_PER_1M.filter((p) => id.startsWith(p.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  const price = match ?? UNKNOWN_MODEL_PRICE;
  const cost = (Math.max(0, promptTokens) / 1e6) * price.input + (Math.max(0, completionTokens) / 1e6) * price.output;
  return Number(cost.toFixed(6));
}

/** Código del error que reciben los servicios cuando el tope no permite llamar. */
export const AI_BUDGET_ERROR_CODES = ['budget_exhausted', 'ai_unavailable'] as const;

function refusal(reason: 'budget_exhausted' | 'unavailable'): Response {
  const code = reason === 'budget_exhausted' ? 'budget_exhausted' : 'ai_unavailable';
  const message =
    reason === 'budget_exhausted'
      ? 'Se alcanzó el tope mensual de gasto de IA de esta función.'
      : 'No se puede medir el gasto de IA en este momento (Redis no disponible).';
  // 429 sin reintentos (x-should-retry: false): el SDK lanza RateLimitError
  // con este código y no vuelve a intentar.
  return new Response(JSON.stringify({ error: { message, type: code, code } }), {
    status: 429,
    headers: { 'content-type': 'application/json', 'x-should-retry': 'false' },
  });
}

/**
 * `fetch` del SDK con tope mensual: antes de cada llamada revisa el gasto del
 * mes de la función (falla cerrada si Redis no responde) y, al leer la
 * respuesta, suma su costo real (tokens informados por OpenAI).
 */
export function budgetedFetch(feature: BudgetFeature): Fetch {
  return (async (url: any, init?: any) => {
    const budget = await getBudgetStatus(feature);
    if (!budget.available) {
      logger.warn(`[ai-budget] Llamada a OpenAI de ${feature} rechazada: ${budget.reason}`);
      return refusal(budget.reason === 'budget_exhausted' ? 'budget_exhausted' : 'unavailable') as any;
    }
    const res: any = await sdkFetch(url, init);
    if (res && typeof res.json === 'function') {
      const readJson = res.json.bind(res);
      res.json = async () => {
        const body = await readJson();
        const usage = body?.usage;
        if (usage && typeof usage === 'object') {
          const cost = estimateOpenAICostUSD(body.model, Number(usage.prompt_tokens) || 0, Number(usage.completion_tokens) || 0);
          await recordSpend(feature, cost);
        }
        return body;
      };
    }
    return res;
  }) as Fetch;
}

/** Crea un cliente de OpenAI ligado al tope de gasto de `feature`. */
export function createOpenAIClient(opts: { feature: BudgetFeature; apiKey?: string }): OpenAI {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured. Please add it to your environment variables.');
  }
  return new OpenAI({ apiKey, fetch: budgetedFetch(opts.feature) });
}

const featureClients = new Map<BudgetFeature, OpenAI>();

/**
 * Cliente compartido de una función con tope (`documents`, `health`): cada
 * llamada respeta el tope mensual y suma su costo al gasto del mes.
 */
export function getOpenAIFor(feature: BudgetFeature): OpenAI {
  let client = featureClients.get(feature);
  if (!client) {
    client = createOpenAIClient({ feature });
    featureClients.set(feature, client);
  }
  return client;
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
      // Extracción de cuentas médicas: tope de las APIs de salud.
      const client = getOpenAIFor('health');
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
