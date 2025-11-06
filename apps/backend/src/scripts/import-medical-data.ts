import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { connectDB } from '../config/mongodb';
import CUPS from '../models/CUPS';
import Medicamento from '../models/Medicamento';
import Diagnostico from '../models/Diagnostico';
import MaterialInsumo from '../models/MaterialInsumo';
import { logger } from '../utils/logger';

/**
 * Script para importar datos médicos desde archivos CSV/Excel
 *
 * Uso:
 *   npx ts-node src/scripts/import-medical-data.ts cups data/cups.csv
 *   npx ts-node src/scripts/import-medical-data.ts medicamentos data/medicamentos.xlsx
 *   npx ts-node src/scripts/import-medical-data.ts diagnosticos data/cie10.csv
 *   npx ts-node src/scripts/import-medical-data.ts materiales data/materiales.csv
 */

interface ImportOptions {
  truncate?: boolean; // Limpiar colección antes de importar
  batchSize?: number; // Tamaño de lote para inserción
}

/**
 * Leer archivo CSV
 */
async function readCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Leer archivo Excel
 */
function readExcel(filePath: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Importar códigos CUPS
 *
 * Formato CSV esperado:
 * codigo,descripcion,categoria,especialidad,tarifaSOAT,tarifaISS2001,tarifaISS2004,uvr
 */
async function importCUPS(filePath: string, options: ImportOptions = {}): Promise<void> {
  try {
    logger.info(`Importando CUPS desde ${filePath}...`);

    const data = filePath.endsWith('.csv') ? await readCSV(filePath) : readExcel(filePath);

    if (options.truncate) {
      logger.info('Limpiando colección CUPS...');
      await CUPS.deleteMany({});
    }

    const batchSize = options.batchSize || 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const documents = batch.map((row) => ({
        codigo: row.codigo || row.CODIGO || row.Código,
        descripcion: row.descripcion || row.DESCRIPCION || row.Descripción,
        categoria: row.categoria || row.CATEGORIA || row.Categoría || 'Procedimiento',
        especialidad: row.especialidad || row.ESPECIALIDAD || row.Especialidad,
        tarifaSOAT: parseFloat(row.tarifaSOAT || row.TARIFA_SOAT || row['Tarifa SOAT'] || '0'),
        tarifaISS2001: parseFloat(row.tarifaISS2001 || row.TARIFA_ISS_2001 || row['Tarifa ISS 2001'] || '0'),
        tarifaISS2004: parseFloat(row.tarifaISS2004 || row.TARIFA_ISS_2004 || row['Tarifa ISS 2004'] || '0'),
        uvr: parseFloat(row.uvr || row.UVR || row.Uvr || '0'),
        activo: true,
      }));

      try {
        await CUPS.insertMany(documents, { ordered: false });
        imported += documents.length;
      } catch (error: any) {
        // Si hay duplicados, algunos se insertarán y otros fallarán
        imported += error.result?.nInserted || 0;
        errors += error.writeErrors?.length || 0;
      }

      logger.info(`Progreso: ${imported + errors}/${data.length}`);
    }

    logger.info(`✅ Importación CUPS completada: ${imported} importados, ${errors} errores`);
  } catch (error) {
    logger.error('Error importando CUPS:', error);
    throw error;
  }
}

/**
 * Importar medicamentos
 *
 * Formato CSV esperado:
 * codigoATC,codigoCUM,principioActivo,nombreComercial,concentracion,formaFarmaceutica,viaAdministracion,presentacion,precioUnitario,laboratorio,pos
 */
async function importMedicamentos(filePath: string, options: ImportOptions = {}): Promise<void> {
  try {
    logger.info(`Importando medicamentos desde ${filePath}...`);

    const data = filePath.endsWith('.csv') ? await readCSV(filePath) : readExcel(filePath);

    if (options.truncate) {
      logger.info('Limpiando colección medicamentos...');
      await Medicamento.deleteMany({});
    }

    const batchSize = options.batchSize || 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const documents = batch.map((row) => ({
        codigoATC: row.codigoATC || row.CODIGO_ATC || row['Código ATC'],
        codigoCUM: row.codigoCUM || row.CODIGO_CUM || row['Código CUM'],
        principioActivo: row.principioActivo || row.PRINCIPIO_ACTIVO || row['Principio Activo'],
        nombreComercial: row.nombreComercial || row.NOMBRE_COMERCIAL || row['Nombre Comercial'],
        concentracion: row.concentracion || row.CONCENTRACION || row.Concentración,
        formaFarmaceutica: row.formaFarmaceutica || row.FORMA_FARMACEUTICA || row['Forma Farmacéutica'] || 'Tableta',
        viaAdministracion: [row.viaAdministracion || row.VIA_ADMINISTRACION || row['Vía Administración'] || 'Oral'],
        presentacion: row.presentacion || row.PRESENTACION || row.Presentación,
        precioUnitario: parseFloat(row.precioUnitario || row.PRECIO_UNITARIO || row['Precio Unitario'] || '0'),
        laboratorio: row.laboratorio || row.LABORATORIO || row.Laboratorio,
        pos: (row.pos || row.POS || row.Pos || 'true').toString().toLowerCase() === 'true',
        requiereFormula: true,
        controlEspecial: false,
        activo: true,
      }));

      try {
        await Medicamento.insertMany(documents, { ordered: false });
        imported += documents.length;
      } catch (error: any) {
        imported += error.result?.nInserted || 0;
        errors += error.writeErrors?.length || 0;
      }

      logger.info(`Progreso: ${imported + errors}/${data.length}`);
    }

    logger.info(`✅ Importación medicamentos completada: ${imported} importados, ${errors} errores`);
  } catch (error) {
    logger.error('Error importando medicamentos:', error);
    throw error;
  }
}

/**
 * Importar diagnósticos CIE-10
 *
 * Formato CSV esperado:
 * codigoCIE10,descripcion,categoria,subcategoria
 */
async function importDiagnosticos(filePath: string, options: ImportOptions = {}): Promise<void> {
  try {
    logger.info(`Importando diagnósticos desde ${filePath}...`);

    const data = filePath.endsWith('.csv') ? await readCSV(filePath) : readExcel(filePath);

    if (options.truncate) {
      logger.info('Limpiando colección diagnósticos...');
      await Diagnostico.deleteMany({});
    }

    const batchSize = options.batchSize || 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const documents = batch.map((row) => ({
        codigoCIE10: row.codigoCIE10 || row.CODIGO_CIE10 || row['Código CIE-10'],
        descripcion: row.descripcion || row.DESCRIPCION || row.Descripción,
        categoria: row.categoria || row.CATEGORIA || row.Categoría || 'General',
        subcategoria: row.subcategoria || row.SUBCATEGORIA || row.Subcategoría,
        cronico: false,
        requiereHospitalizacion: false,
        activo: true,
      }));

      try {
        await Diagnostico.insertMany(documents, { ordered: false });
        imported += documents.length;
      } catch (error: any) {
        imported += error.result?.nInserted || 0;
        errors += error.writeErrors?.length || 0;
      }

      logger.info(`Progreso: ${imported + errors}/${data.length}`);
    }

    logger.info(`✅ Importación diagnósticos completada: ${imported} importados, ${errors} errores`);
  } catch (error) {
    logger.error('Error importando diagnósticos:', error);
    throw error;
  }
}

/**
 * Importar materiales e insumos
 *
 * Formato CSV esperado:
 * codigo,nombre,descripcion,categoria,unidadMedida,precioUnitario,proveedor
 */
async function importMaterialesInsumos(filePath: string, options: ImportOptions = {}): Promise<void> {
  try {
    logger.info(`Importando materiales/insumos desde ${filePath}...`);

    const data = filePath.endsWith('.csv') ? await readCSV(filePath) : readExcel(filePath);

    if (options.truncate) {
      logger.info('Limpiando colección materiales/insumos...');
      await MaterialInsumo.deleteMany({});
    }

    const batchSize = options.batchSize || 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const documents = batch.map((row) => ({
        codigo: row.codigo || row.CODIGO || row.Código,
        nombre: row.nombre || row.NOMBRE || row.Nombre,
        descripcion: row.descripcion || row.DESCRIPCION || row.Descripción,
        categoria: row.categoria || row.CATEGORIA || row.Categoría || 'Insumo médico',
        unidadMedida: row.unidadMedida || row.UNIDAD_MEDIDA || row['Unidad Medida'] || 'Unidad',
        precioUnitario: parseFloat(row.precioUnitario || row.PRECIO_UNITARIO || row['Precio Unitario'] || '0'),
        proveedor: row.proveedor || row.PROVEEDOR || row.Proveedor,
        activo: true,
      }));

      try {
        await MaterialInsumo.insertMany(documents, { ordered: false });
        imported += documents.length;
      } catch (error: any) {
        imported += error.result?.nInserted || 0;
        errors += error.writeErrors?.length || 0;
      }

      logger.info(`Progreso: ${imported + errors}/${data.length}`);
    }

    logger.info(`✅ Importación materiales/insumos completada: ${imported} importados, ${errors} errores`);
  } catch (error) {
    logger.error('Error importando materiales/insumos:', error);
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.log(`
Uso: npx ts-node src/scripts/import-medical-data.ts <tipo> <archivo> [--truncate]

Tipos disponibles:
  - cups         : Códigos CUPS (procedimientos)
  - medicamentos : Medicamentos con códigos CUM
  - diagnosticos : Diagnósticos CIE-10
  - materiales   : Materiales e insumos

Ejemplos:
  npx ts-node src/scripts/import-medical-data.ts cups data/cups.csv
  npx ts-node src/scripts/import-medical-data.ts medicamentos data/medicamentos.xlsx --truncate
      `);
      process.exit(1);
    }

    const tipo = args[0].toLowerCase();
    const archivo = args[1];
    const truncate = args.includes('--truncate');

    if (!fs.existsSync(archivo)) {
      throw new Error(`Archivo no encontrado: ${archivo}`);
    }

    await connectDB();

    const options: ImportOptions = { truncate, batchSize: 1000 };

    switch (tipo) {
      case 'cups':
        await importCUPS(archivo, options);
        break;
      case 'medicamentos':
        await importMedicamentos(archivo, options);
        break;
      case 'diagnosticos':
        await importDiagnosticos(archivo, options);
        break;
      case 'materiales':
        await importMaterialesInsumos(archivo, options);
        break;
      default:
        throw new Error(`Tipo desconocido: ${tipo}`);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error en importación:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { importCUPS, importMedicamentos, importDiagnosticos, importMaterialesInsumos };
