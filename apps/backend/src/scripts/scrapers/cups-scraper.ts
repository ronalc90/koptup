import axios from 'axios';
import * as cheerio from 'cheerio';
import CUPS from '../../models/CUPS';
import { connectDB } from '../../config/mongodb';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Scraper de Códigos CUPS (Colombia)
 *
 * Fuentes oficiales:
 * 1. Datos Abiertos Colombia: https://www.datos.gov.co/resource/9zcz-bjue.json
 * 2. SISPRO: https://www.sispro.gov.co/
 * 3. Ministerio de Salud PDFs (requiere extracción con OpenAI)
 *
 * Este scraper descarga datos reales de códigos CUPS desde fuentes oficiales
 * y los importa a la base de datos MongoDB.
 */

interface CUPSData {
  codigo: string;
  descripcion: string;
  categoria?: string;
  especialidad?: string;
  tarifaSOAT?: number;
  tarifaISS2001?: number;
  tarifaISS2004?: number;
}

/**
 * Fuente 1: Datos Abiertos Colombia (API REST)
 * Esta es la fuente más confiable y actualizada
 */
async function scrapeDatosAbiertosColombia(): Promise<CUPSData[]> {
  console.log('📡 Descargando CUPS desde Datos Abiertos Colombia...');

  try {
    const response = await axios.get('https://www.datos.gov.co/resource/9zcz-bjue.json', {
      params: {
        $limit: 50000, // Obtener hasta 50,000 registros
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = response.data;
    console.log(`✅ Descargados ${data.length} códigos CUPS desde Datos Abiertos Colombia`);

    // Mapear a nuestro formato
    const cupsData: CUPSData[] = data.map((item: any) => ({
      codigo: item.codigo || item.CODIGO || item.Codigo || '',
      descripcion: item.descripcion || item.DESCRIPCION || item.Descripcion || '',
      categoria: categorizeByCode(item.codigo || ''),
      especialidad: item.especialidad || '',
    }));

    return cupsData.filter(item => item.codigo && item.descripcion);
  } catch (error: any) {
    console.error('❌ Error al descargar desde Datos Abiertos Colombia:', error.message);
    return [];
  }
}

/**
 * Fuente 2: SISPRO (Sistema Integrado de Información de la Protección Social)
 * Scraping de la página oficial
 */
async function scrapeSISPRO(): Promise<CUPSData[]> {
  console.log('📡 Intentando scraping de SISPRO...');

  try {
    // URL de la búsqueda de CUPS en SISPRO
    const response = await axios.get('https://www.sispro.gov.co/Pages/CUPS.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const cupsData: CUPSData[] = [];

    // Buscar tablas con códigos CUPS (esto dependerá de la estructura real del sitio)
    $('table tbody tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');

      if (cells.length >= 2) {
        const codigo = $(cells[0]).text().trim();
        const descripcion = $(cells[1]).text().trim();

        if (codigo && descripcion) {
          cupsData.push({
            codigo,
            descripcion,
            categoria: categorizeByCode(codigo),
          });
        }
      }
    });

    console.log(`✅ Extraídos ${cupsData.length} códigos desde SISPRO`);
    return cupsData;
  } catch (error: any) {
    console.error('⚠️ Error al hacer scraping de SISPRO:', error.message);
    console.log('💡 Nota: Es posible que SISPRO requiera autenticación o haya cambiado su estructura');
    return [];
  }
}

/**
 * Fuente 3: Ministerio de Salud (PDFs)
 * Descarga PDFs y extrae con OpenAI
 */
async function scrapeMinisterioSaludPDF(): Promise<CUPSData[]> {
  console.log('📡 Buscando PDFs del Ministerio de Salud en Google...');

  // URLs conocidas de documentos oficiales (actualizar según disponibilidad)
  const pdfUrls = [
    'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/cups.pdf',
    // Agregar más URLs de PDFs oficiales aquí
  ];

  const allCupsData: CUPSData[] = [];

  for (const pdfUrl of pdfUrls) {
    try {
      console.log(`📄 Descargando PDF: ${pdfUrl}`);

      // Descargar PDF
      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      // Guardar temporalmente
      const tempPath = path.join(__dirname, '../../../temp_cups.pdf');
      fs.writeFileSync(tempPath, response.data);

      console.log('🤖 Extrayendo datos con OpenAI...');

      // Usar OpenAI para extraer datos estructurados del PDF
      const extractedData = await extractCUPSFromPDF(tempPath);
      allCupsData.push(...extractedData);

      // Eliminar archivo temporal
      fs.unlinkSync(tempPath);

      console.log(`✅ Extraídos ${extractedData.length} códigos del PDF`);
    } catch (error: any) {
      console.error(`❌ Error al procesar PDF ${pdfUrl}:`, error.message);
    }
  }

  return allCupsData;
}

/**
 * Extrae códigos CUPS de un PDF usando OpenAI
 */
async function extractCUPSFromPDF(pdfPath: string): Promise<CUPSData[]> {
  try {
    // Leer el PDF como base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');

    // Nota: OpenAI no soporta PDFs directamente, necesitamos convertir a texto primero
    // Por ahora retornamos vacío y sugerimos usar una librería de PDF parsing
    console.log('⚠️ La extracción de PDFs requiere una librería adicional como pdf-parse');
    console.log('💡 Por ahora, use la fuente de Datos Abiertos Colombia que es más confiable');

    return [];
  } catch (error: any) {
    console.error('Error al extraer datos del PDF:', error.message);
    return [];
  }
}

/**
 * Categoriza un código CUPS según su prefijo
 * Basado en la estructura oficial de CUPS Colombia
 */
function categorizeByCode(codigo: string): string {
  if (!codigo) return 'Otro';

  const prefix = codigo.substring(0, 2);

  const categorias: Record<string, string> = {
    '89': 'Consulta',
    '90': 'Laboratorio',
    '87': 'Imagenología',
    '88': 'Imagenología',
    '85': 'Procedimiento',
    '86': 'Procedimiento',
    '95': 'Terapia',
    '96': 'Terapia',
    '97': 'Terapia',
    '99': 'Otro',
  };

  return categorias[prefix] || 'Procedimiento';
}

/**
 * Importa los códigos CUPS a la base de datos
 */
async function importToDatabase(cupsData: CUPSData[]) {
  console.log(`\n💾 Importando ${cupsData.length} códigos a MongoDB...`);

  let insertados = 0;
  let actualizados = 0;
  let errores = 0;

  // Procesar en lotes de 1000
  const batchSize = 1000;

  for (let i = 0; i < cupsData.length; i += batchSize) {
    const batch = cupsData.slice(i, i + batchSize);

    try {
      const operations = batch.map(item => ({
        updateOne: {
          filter: { codigo: item.codigo },
          update: {
            $set: {
              descripcion: item.descripcion,
              categoria: item.categoria || 'Otro',
              especialidad: item.especialidad || '',
              activo: true,
            },
            $setOnInsert: {
              tarifaSOAT: item.tarifaSOAT || 0,
              tarifaISS2001: item.tarifaISS2001 || 0,
              tarifaISS2004: item.tarifaISS2004 || 0,
              uvr: 0,
              metadata: {
                requiereAutorizacion: false,
                duracionPromedio: 0,
                nivelComplejidad: 'medio',
                requiereQuirofano: false,
              },
            },
          },
          upsert: true,
        },
      }));

      const result = await CUPS.bulkWrite(operations);

      insertados += result.upsertedCount;
      actualizados += result.modifiedCount;
    } catch (error: any) {
      console.error(`❌ Error en lote ${i}-${i + batchSize}:`, error.message);
      errores += batch.length;
    }

    // Mostrar progreso
    if ((i + batchSize) % 5000 === 0) {
      console.log(`Procesados: ${Math.min(i + batchSize, cupsData.length)} / ${cupsData.length}`);
    }
  }

  console.log('\n✅ Importación completada:');
  console.log(`   - Insertados: ${insertados}`);
  console.log(`   - Actualizados: ${actualizados}`);
  console.log(`   - Errores: ${errores}`);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando scraper de códigos CUPS\n');

    // Conectar a MongoDB
    await connectDB();

    let allCupsData: CUPSData[] = [];

    // Fuente 1: Datos Abiertos Colombia (RECOMENDADO)
    console.log('\n═══════════════════════════════════════');
    console.log('Fuente 1: Datos Abiertos Colombia');
    console.log('═══════════════════════════════════════');
    const datosAbiertos = await scrapeDatosAbiertosColombia();
    allCupsData.push(...datosAbiertos);

    // Fuente 2: SISPRO (opcional, como respaldo)
    if (allCupsData.length < 1000) {
      console.log('\n═══════════════════════════════════════');
      console.log('Fuente 2: SISPRO (Respaldo)');
      console.log('═══════════════════════════════════════');
      const sisproCups = await scrapeSISPRO();
      allCupsData.push(...sisproCups);
    }

    // Fuente 3: PDFs Ministerio de Salud (opcional)
    // Descomentado solo si se requiere
    // const pdfCups = await scrapeMinisterioSaludPDF();
    // allCupsData.push(...pdfCups);

    // Eliminar duplicados
    const uniqueCups = new Map<string, CUPSData>();
    allCupsData.forEach(item => {
      if (!uniqueCups.has(item.codigo)) {
        uniqueCups.set(item.codigo, item);
      }
    });

    const finalData = Array.from(uniqueCups.values());
    console.log(`\n📊 Total de códigos CUPS únicos: ${finalData.length}`);

    // Importar a la base de datos
    if (finalData.length > 0) {
      await importToDatabase(finalData);
    } else {
      console.log('⚠️ No se encontraron datos para importar');
    }

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { scrapeDatosAbiertosColombia, scrapeSISPRO, categorizeByCode };
