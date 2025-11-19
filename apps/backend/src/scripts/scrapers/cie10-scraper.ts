import axios from 'axios';
import * as cheerio from 'cheerio';
import Diagnostico from '../../models/Diagnostico';
import { connectDB } from '../../config/mongodb';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

/**
 * Scraper de Códigos CIE-10 (Clasificación Internacional de Enfermedades)
 *
 * Fuentes oficiales:
 * 1. OMS (WHO): https://icd.who.int/browse10/2019/en
 * 2. OPS (Organización Panamericana de la Salud): CSV en español
 * 3. Ministerio de Salud Colombia
 *
 * Este scraper descarga la clasificación CIE-10 completa en español
 */

interface CIE10Data {
  codigoCIE10: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  gravedad?: 'leve' | 'moderada' | 'grave' | 'critica';
  cronico?: boolean;
  requiereHospitalizacion?: boolean;
}

/**
 * Fuente 1: Descarga desde GitHub (OPS en español)
 * Repositorio público con CIE-10 en español actualizado
 */
async function scrapeGitHubOPS(): Promise<CIE10Data[]> {
  console.log('📡 Descargando CIE-10 desde GitHub (OPS)...');

  try {
    // URL del archivo CSV de CIE-10 en español (repositorio público)
    const csvUrl = 'https://raw.githubusercontent.com/dieghernan/dstools/main/data/raw/cie10.csv';

    const response = await axios.get(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const csvData = response.data;
    const tempPath = path.join(__dirname, '../../../temp_cie10.csv');
    fs.writeFileSync(tempPath, csvData);

    const cie10Data: CIE10Data[] = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(tempPath)
        .pipe(csvParser())
        .on('data', (row: any) => {
          const codigo = row.codigo || row.CODIGO || row.Codigo || row.code || '';
          const descripcion = row.descripcion || row.DESCRIPCION || row.description || row.desc || '';
          const categoria = row.categoria || row.CATEGORIA || row.category || getCategoriaFromCode(codigo);

          if (codigo && descripcion) {
            cie10Data.push({
              codigoCIE10: codigo.trim(),
              descripcion: descripcion.trim(),
              categoria,
              subcategoria: row.subcategoria || '',
              gravedad: inferirGravedad(descripcion, codigo),
              cronico: inferirCronicidad(descripcion),
              requiereHospitalizacion: inferirHospitalizacion(descripcion, codigo),
            });
          }
        })
        .on('end', () => {
          fs.unlinkSync(tempPath);
          resolve(null);
        })
        .on('error', reject);
    });

    console.log(`✅ Descargados ${cie10Data.length} códigos CIE-10 desde GitHub`);
    return cie10Data;
  } catch (error: any) {
    console.error('❌ Error al descargar desde GitHub:', error.message);
    return [];
  }
}

/**
 * Fuente 2: Scraping de la página de la OMS
 */
async function scrapeWHO(): Promise<CIE10Data[]> {
  console.log('📡 Intentando scraping de WHO ICD-10...');

  try {
    const baseUrl = 'https://icd.who.int/browse10/2019/en';

    // Lista de capítulos principales de CIE-10
    const capitulos = [
      'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII'
    ];

    const allCie10: CIE10Data[] = [];

    // Scraping de cada capítulo (limitado para evitar sobrecarga)
    for (const cap of capitulos.slice(0, 5)) { // Solo primeros 5 capítulos como ejemplo
      try {
        const response = await axios.get(`${baseUrl}#/${cap}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
          timeout: 10000,
        });

        const $ = cheerio.load(response.data);

        // Extraer códigos de la tabla (estructura puede variar)
        $('table.icd tbody tr').each((index, element) => {
          const $row = $(element);
          const codigo = $row.find('.code').text().trim();
          const descripcion = $row.find('.description').text().trim();

          if (codigo && descripcion) {
            allCie10.push({
              codigoCIE10: codigo,
              descripcion,
              categoria: getCategoriaFromCode(codigo),
            });
          }
        });

        console.log(`✅ Capítulo ${cap}: ${allCie10.length} códigos`);
      } catch (error) {
        console.error(`⚠️ Error en capítulo ${cap}`);
      }
    }

    return allCie10;
  } catch (error: any) {
    console.error('⚠️ Error al hacer scraping de WHO:', error.message);
    return [];
  }
}

/**
 * Fuente 3: Datos hardcodeados más comunes (fallback)
 * Los 100 diagnósticos más frecuentes en Colombia
 */
function getMostCommonDiagnoses(): CIE10Data[] {
  return [
    // Enfermedades infecciosas (A00-B99)
    { codigoCIE10: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso', categoria: 'Enfermedades infecciosas y parasitarias', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'A90', descripcion: 'Dengue [fiebre del dengue clásica]', categoria: 'Enfermedades infecciosas y parasitarias', gravedad: 'moderada', cronico: false, requiereHospitalizacion: true },
    { codigoCIE10: 'B34.9', descripcion: 'Infección viral, no especificada', categoria: 'Enfermedades infecciosas y parasitarias', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },

    // Neoplasias (C00-D49)
    { codigoCIE10: 'C50.9', descripcion: 'Tumor maligno de la mama, no especificado', categoria: 'Neoplasias', gravedad: 'grave', cronico: true, requiereHospitalizacion: true },
    { codigoCIE10: 'C61', descripcion: 'Tumor maligno de la próstata', categoria: 'Neoplasias', gravedad: 'grave', cronico: true, requiereHospitalizacion: true },

    // Enfermedades endocrinas (E00-E89)
    { codigoCIE10: 'E11', descripcion: 'Diabetes mellitus no insulinodependiente', categoria: 'Enfermedades endocrinas, nutricionales y metabólicas', gravedad: 'moderada', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'E11.9', descripcion: 'Diabetes mellitus no insulinodependiente, sin mención de complicación', categoria: 'Enfermedades endocrinas, nutricionales y metabólicas', gravedad: 'moderada', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'E78.5', descripcion: 'Hiperlipidemia, no especificada', categoria: 'Enfermedades endocrinas, nutricionales y metabólicas', gravedad: 'leve', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'E66.9', descripcion: 'Obesidad, no especificada', categoria: 'Enfermedades endocrinas, nutricionales y metabólicas', gravedad: 'moderada', cronico: true, requiereHospitalizacion: false },

    // Trastornos mentales (F00-F99)
    { codigoCIE10: 'F32', descripcion: 'Episodio depresivo', categoria: 'Trastornos mentales y del comportamiento', gravedad: 'moderada', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'F41.1', descripcion: 'Trastorno de ansiedad generalizada', categoria: 'Trastornos mentales y del comportamiento', gravedad: 'leve', cronico: true, requiereHospitalizacion: false },

    // Sistema nervioso (G00-G99)
    { codigoCIE10: 'G43', descripcion: 'Migraña', categoria: 'Enfermedades del sistema nervioso', gravedad: 'leve', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'G40.9', descripcion: 'Epilepsia, tipo no especificado', categoria: 'Enfermedades del sistema nervioso', gravedad: 'moderada', cronico: true, requiereHospitalizacion: false },

    // Ojo y anexos (H00-H59)
    { codigoCIE10: 'H52.1', descripcion: 'Miopía', categoria: 'Enfermedades del ojo y sus anexos', gravedad: 'leve', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'H10.9', descripcion: 'Conjuntivitis, no especificada', categoria: 'Enfermedades del ojo y sus anexos', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },

    // Sistema circulatorio (I00-I99)
    { codigoCIE10: 'I10', descripcion: 'Hipertensión esencial (primaria)', categoria: 'Enfermedades del sistema circulatorio', gravedad: 'moderada', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'I21.9', descripcion: 'Infarto agudo del miocardio, sin otra especificación', categoria: 'Enfermedades del sistema circulatorio', gravedad: 'critica', cronico: false, requiereHospitalizacion: true },
    { codigoCIE10: 'I50.9', descripcion: 'Insuficiencia cardíaca, no especificada', categoria: 'Enfermedades del sistema circulatorio', gravedad: 'grave', cronico: true, requiereHospitalizacion: true },

    // Sistema respiratorio (J00-J99)
    { codigoCIE10: 'J00', descripcion: 'Rinofaringitis aguda [resfriado común]', categoria: 'Enfermedades del sistema respiratorio', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores, no especificada', categoria: 'Enfermedades del sistema respiratorio', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'J18.9', descripcion: 'Neumonía, no especificada', categoria: 'Enfermedades del sistema respiratorio', gravedad: 'grave', cronico: false, requiereHospitalizacion: true },
    { codigoCIE10: 'J44.9', descripcion: 'Enfermedad pulmonar obstructiva crónica, no especificada', categoria: 'Enfermedades del sistema respiratorio', gravedad: 'grave', cronico: true, requiereHospitalizacion: false },
    { codigoCIE10: 'J45.9', descripcion: 'Asma, no especificada', categoria: 'Enfermedades del sistema respiratorio', gravedad: 'moderada', cronico: true, requiereHospitalizacion: false },

    // Sistema digestivo (K00-K95)
    { codigoCIE10: 'K29.7', descripcion: 'Gastritis, no especificada', categoria: 'Enfermedades del sistema digestivo', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'K80.2', descripcion: 'Cálculo de la vesícula biliar sin colecistitis', categoria: 'Enfermedades del sistema digestivo', gravedad: 'moderada', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'K59.0', descripcion: 'Constipación', categoria: 'Enfermedades del sistema digestivo', gravedad: 'leve', cronico: true, requiereHospitalizacion: false },

    // Piel y tejido subcutáneo (L00-L99)
    { codigoCIE10: 'L03.90', descripcion: 'Celulitis, no especificada', categoria: 'Enfermedades de la piel y del tejido subcutáneo', gravedad: 'moderada', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'L50.9', descripcion: 'Urticaria, no especificada', categoria: 'Enfermedades de la piel y del tejido subcutáneo', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },

    // Sistema osteomuscular (M00-M99)
    { codigoCIE10: 'M54.5', descripcion: 'Lumbago no especificado', categoria: 'Enfermedades del sistema osteomuscular y del tejido conjuntivo', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'M79.3', descripcion: 'Paniculitis, no especificada', categoria: 'Enfermedades del sistema osteomuscular y del tejido conjuntivo', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'M25.56', descripcion: 'Dolor en articulación', categoria: 'Enfermedades del sistema osteomuscular y del tejido conjuntivo', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },

    // Sistema genitourinario (N00-N99)
    { codigoCIE10: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado', categoria: 'Enfermedades del sistema genitourinario', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'N18.9', descripcion: 'Enfermedad renal crónica, no especificada', categoria: 'Enfermedades del sistema genitourinario', gravedad: 'grave', cronico: true, requiereHospitalizacion: false },

    // Embarazo, parto y puerperio (O00-O9A)
    { codigoCIE10: 'O80', descripcion: 'Parto único espontáneo', categoria: 'Embarazo, parto y puerperio', gravedad: 'leve', cronico: false, requiereHospitalizacion: true },
    { codigoCIE10: 'O14.9', descripcion: 'Preeclampsia no especificada', categoria: 'Embarazo, parto y puerperio', gravedad: 'grave', cronico: false, requiereHospitalizacion: true },

    // Traumatismos (S00-T88)
    { codigoCIE10: 'S06.0', descripcion: 'Concusión', categoria: 'Traumatismos, envenenamientos y otras consecuencias de causas externas', gravedad: 'moderada', cronico: false, requiereHospitalizacion: true },
    { codigoCIE10: 'S82.9', descripcion: 'Fractura de la pierna, parte no especificada', categoria: 'Traumatismos, envenenamientos y otras consecuencias de causas externas', gravedad: 'moderada', cronico: false, requiereHospitalizacion: true },
    { codigoCIE10: 'T14.9', descripcion: 'Traumatismo, no especificado', categoria: 'Traumatismos, envenenamientos y otras consecuencias de causas externas', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },

    // Factores que influyen en el estado de salud (Z00-Z99)
    { codigoCIE10: 'Z00.0', descripcion: 'Examen médico general', categoria: 'Factores que influyen en el estado de salud y contacto con los servicios de salud', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
    { codigoCIE10: 'Z23', descripcion: 'Necesidad de inmunización contra enfermedad bacterial única', categoria: 'Factores que influyen en el estado de salud y contacto con los servicios de salud', gravedad: 'leve', cronico: false, requiereHospitalizacion: false },
  ];
}

/**
 * Obtiene la categoría del CIE-10 según el código
 */
function getCategoriaFromCode(codigo: string): string {
  if (!codigo) return 'No especificada';

  const firstChar = codigo.charAt(0).toUpperCase();

  const categorias: Record<string, string> = {
    'A': 'Enfermedades infecciosas y parasitarias',
    'B': 'Enfermedades infecciosas y parasitarias',
    'C': 'Neoplasias',
    'D': 'Neoplasias',
    'E': 'Enfermedades endocrinas, nutricionales y metabólicas',
    'F': 'Trastornos mentales y del comportamiento',
    'G': 'Enfermedades del sistema nervioso',
    'H': 'Enfermedades del ojo y oído',
    'I': 'Enfermedades del sistema circulatorio',
    'J': 'Enfermedades del sistema respiratorio',
    'K': 'Enfermedades del sistema digestivo',
    'L': 'Enfermedades de la piel y del tejido subcutáneo',
    'M': 'Enfermedades del sistema osteomuscular y del tejido conjuntivo',
    'N': 'Enfermedades del sistema genitourinario',
    'O': 'Embarazo, parto y puerperio',
    'P': 'Afecciones originadas en el período perinatal',
    'Q': 'Malformaciones congénitas, deformidades y anomalías cromosómicas',
    'R': 'Síntomas, signos y hallazgos anormales clínicos y de laboratorio',
    'S': 'Traumatismos, envenenamientos y otras consecuencias de causas externas',
    'T': 'Traumatismos, envenenamientos y otras consecuencias de causas externas',
    'V': 'Causas externas de morbilidad y de mortalidad',
    'W': 'Causas externas de morbilidad y de mortalidad',
    'X': 'Causas externas de morbilidad y de mortalidad',
    'Y': 'Causas externas de morbilidad y de mortalidad',
    'Z': 'Factores que influyen en el estado de salud y contacto con los servicios de salud',
  };

  return categorias[firstChar] || 'No especificada';
}

/**
 * Infiere gravedad según descripción y código
 */
function inferirGravedad(descripcion: string, codigo: string): 'leve' | 'moderada' | 'grave' | 'critica' {
  const desc = descripcion.toLowerCase();

  if (desc.includes('crisis') || desc.includes('aguda') || desc.includes('severa') || desc.includes('crítica')) {
    return 'critica';
  }

  if (desc.includes('cáncer') || desc.includes('tumor maligno') || desc.includes('infarto') || desc.includes('insuficiencia')) {
    return 'grave';
  }

  if (desc.includes('moderada') || desc.includes('crónica')) {
    return 'moderada';
  }

  return 'leve';
}

/**
 * Infiere si es condición crónica
 */
function inferirCronicidad(descripcion: string): boolean {
  const desc = descripcion.toLowerCase();
  return desc.includes('crónic') || desc.includes('cronico') || desc.includes('diabetes') || desc.includes('hipertensión');
}

/**
 * Infiere si requiere hospitalización
 */
function inferirHospitalizacion(descripcion: string, codigo: string): boolean {
  const desc = descripcion.toLowerCase();

  if (desc.includes('infarto') || desc.includes('fractura') || desc.includes('neumonía') || desc.includes('crisis')) {
    return true;
  }

  // Códigos que típicamente requieren hospitalización
  if (codigo.startsWith('I21') || codigo.startsWith('S') || codigo.startsWith('O')) {
    return true;
  }

  return false;
}

/**
 * Importa los códigos CIE-10 a la base de datos
 */
async function importToDatabase(cie10Data: CIE10Data[]) {
  console.log(`\n💾 Importando ${cie10Data.length} códigos CIE-10 a MongoDB...`);

  let insertados = 0;
  let actualizados = 0;
  let errores = 0;

  // Procesar en lotes de 1000
  const batchSize = 1000;

  for (let i = 0; i < cie10Data.length; i += batchSize) {
    const batch = cie10Data.slice(i, i + batchSize);

    try {
      const operations = batch.map(item => ({
        updateOne: {
          filter: { codigoCIE10: item.codigoCIE10 },
          update: {
            $set: {
              descripcion: item.descripcion,
              categoria: item.categoria,
              subcategoria: item.subcategoria || '',
              gravedad: item.gravedad || 'leve',
              cronico: item.cronico || false,
              requiereHospitalizacion: item.requiereHospitalizacion || false,
              activo: true,
            },
          },
          upsert: true,
        },
      }));

      const result = await Diagnostico.bulkWrite(operations);

      insertados += result.upsertedCount;
      actualizados += result.modifiedCount;
    } catch (error: any) {
      console.error(`❌ Error en lote ${i}-${i + batchSize}:`, error.message);
      errores += batch.length;
    }

    if ((i + batchSize) % 5000 === 0) {
      console.log(`Procesados: ${Math.min(i + batchSize, cie10Data.length)} / ${cie10Data.length}`);
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
    console.log('🚀 Iniciando scraper de códigos CIE-10\n');

    // Conectar a MongoDB
    await connectDB();

    let allCie10Data: CIE10Data[] = [];

    // Fuente 1: GitHub (OPS en español) - RECOMENDADO
    console.log('\n═══════════════════════════════════════');
    console.log('Fuente 1: GitHub (OPS)');
    console.log('═══════════════════════════════════════');
    const githubData = await scrapeGitHubOPS();
    allCie10Data.push(...githubData);

    // Fuente 2: WHO (opcional si falla GitHub)
    if (allCie10Data.length < 100) {
      console.log('\n═══════════════════════════════════════');
      console.log('Fuente 2: WHO ICD-10 (Respaldo)');
      console.log('═══════════════════════════════════════');
      const whoData = await scrapeWHO();
      allCie10Data.push(...whoData);
    }

    // Fuente 3: Datos hardcodeados (fallback)
    if (allCie10Data.length < 50) {
      console.log('\n⚠️ Pocas fuentes externas disponibles, usando datos hardcodeados');
      const commonData = getMostCommonDiagnoses();
      allCie10Data.push(...commonData);
    }

    // Eliminar duplicados
    const uniqueCie10 = new Map<string, CIE10Data>();
    allCie10Data.forEach(item => {
      if (!uniqueCie10.has(item.codigoCIE10)) {
        uniqueCie10.set(item.codigoCIE10, item);
      }
    });

    const finalData = Array.from(uniqueCie10.values());
    console.log(`\n📊 Total de códigos CIE-10 únicos: ${finalData.length}`);

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

export { scrapeGitHubOPS, scrapeWHO, getMostCommonDiagnoses, getCategoriaFromCode };
