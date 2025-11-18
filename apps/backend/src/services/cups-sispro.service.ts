/**
 * Servicio de Integración con CUPS Oficial de SISPRO
 *
 * Permite importar códigos CUPS desde archivos CSV/Excel y sincronizar
 * con el catálogo oficial de SISPRO.
 */

import XLSX from 'xlsx';
import csv from 'csv-parser';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import CUPS from '../models/CUPS';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CUPSImportado {
  codigo: string;
  descripcion: string;
  categoria: string;
  especialidad?: string;
  tarifaSOAT?: number;
  tarifaISS2001?: number;
  tarifaISS2004?: number;
  uvr?: number;
  requiereAutorizacion?: boolean;
  nivelComplejidad?: 'bajo' | 'medio' | 'alto' | 'muy_alto';
  requiereQuirofano?: boolean;
}

export interface ResultadoImportacion {
  exitosos: number;
  errores: number;
  duplicados: number;
  total: number;
  tiempoMs: number;
  mensajes: string[];
}

// ============================================================================
// SERVICIO DE INTEGRACIÓN CUPS SISPRO
// ============================================================================

export class CupsSisproService {
  /**
   * Importa CUPS desde archivo CSV
   */
  async importarDesdeCSV(rutaArchivo: string, opciones: {
    truncate?: boolean;
    batchSize?: number;
  } = {}): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    const resultados: ResultadoImportacion = {
      exitosos: 0,
      errores: 0,
      duplicados: 0,
      total: 0,
      tiempoMs: 0,
      mensajes: [],
    };

    try {
      logger.info(`Importando CUPS desde CSV: ${rutaArchivo}`);

      // Verificar que el archivo existe
      await fs.access(rutaArchivo);

      // Limpiar colección si se solicita
      if (opciones.truncate) {
        logger.info('Limpiando colección CUPS...');
        await CUPS.deleteMany({});
        resultados.mensajes.push('Colección CUPS limpiada');
      }

      // Leer archivo CSV
      const registros: any[] = [];
      await new Promise<void>((resolve, reject) => {
        createReadStream(rutaArchivo)
          .pipe(csv())
          .on('data', (row) => registros.push(row))
          .on('end', () => resolve())
          .on('error', reject);
      });

      resultados.total = registros.length;
      logger.info(`${registros.length} registros encontrados en CSV`);

      // Procesar en batches
      const batchSize = opciones.batchSize || 1000;
      for (let i = 0; i < registros.length; i += batchSize) {
        const batch = registros.slice(i, i + batchSize);
        const resultado = await this.procesarBatch(batch);

        resultados.exitosos += resultado.exitosos;
        resultados.errores += resultado.errores;
        resultados.duplicados += resultado.duplicados;

        logger.info(`Progreso: ${i + batch.length}/${registros.length}`);
      }

      resultados.tiempoMs = Date.now() - inicio;
      resultados.mensajes.push(`Importación completada en ${resultados.tiempoMs}ms`);

      logger.info(`Importación CSV completada: ${resultados.exitosos} exitosos, ${resultados.errores} errores`);
      return resultados;
    } catch (error: any) {
      logger.error('Error importando CSV:', error);
      resultados.mensajes.push(`Error: ${error.message}`);
      return resultados;
    }
  }

  /**
   * Importa CUPS desde archivo Excel
   */
  async importarDesdeExcel(rutaArchivo: string, opciones: {
    truncate?: boolean;
    batchSize?: number;
    nombreHoja?: string;
  } = {}): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    const resultados: ResultadoImportacion = {
      exitosos: 0,
      errores: 0,
      duplicados: 0,
      total: 0,
      tiempoMs: 0,
      mensajes: [],
    };

    try {
      logger.info(`Importando CUPS desde Excel: ${rutaArchivo}`);

      // Leer archivo Excel
      const workbook = XLSX.readFile(rutaArchivo);
      const nombreHoja = opciones.nombreHoja || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[nombreHoja];
      const registros = XLSX.utils.sheet_to_json(worksheet);

      resultados.total = registros.length;
      logger.info(`${registros.length} registros encontrados en hoja "${nombreHoja}"`);

      // Limpiar colección si se solicita
      if (opciones.truncate) {
        logger.info('Limpiando colección CUPS...');
        await CUPS.deleteMany({});
        resultados.mensajes.push('Colección CUPS limpiada');
      }

      // Procesar en batches
      const batchSize = opciones.batchSize || 1000;
      for (let i = 0; i < registros.length; i += batchSize) {
        const batch = registros.slice(i, i + batchSize);
        const resultado = await this.procesarBatch(batch);

        resultados.exitosos += resultado.exitosos;
        resultados.errores += resultado.errores;
        resultados.duplicados += resultado.duplicados;

        logger.info(`Progreso: ${i + batch.length}/${registros.length}`);
      }

      resultados.tiempoMs = Date.now() - inicio;
      resultados.mensajes.push(`Importación completada en ${resultados.tiempoMs}ms`);

      logger.info(`Importación Excel completada: ${resultados.exitosos} exitosos, ${resultados.errores} errores`);
      return resultados;
    } catch (error: any) {
      logger.error('Error importando Excel:', error);
      resultados.mensajes.push(`Error: ${error.message}`);
      return resultados;
    }
  }

  /**
   * Procesa un batch de registros
   */
  private async procesarBatch(registros: any[]): Promise<{
    exitosos: number;
    errores: number;
    duplicados: number;
  }> {
    const resultado = { exitosos: 0, errores: 0, duplicados: 0 };

    const documentos = registros.map((row) => this.normalizarRegistro(row)).filter(Boolean);

    try {
      await CUPS.insertMany(documentos, { ordered: false });
      resultado.exitosos = documentos.length;
    } catch (error: any) {
      // Manejar errores de duplicados
      if (error.writeErrors) {
        resultado.exitosos = error.result?.nInserted || 0;
        resultado.duplicados = error.writeErrors.filter((e: any) => e.code === 11000).length;
        resultado.errores = error.writeErrors.length - resultado.duplicados;
      } else {
        resultado.errores = documentos.length;
      }
    }

    return resultado;
  }

  /**
   * Normaliza un registro del CSV/Excel
   */
  private normalizarRegistro(row: any): any {
    try {
      // Mapear nombres de columnas comunes
      const codigo = this.obtenerValor(row, ['codigo', 'CODIGO', 'Código', 'CUPS', 'CODE']);
      const descripcion = this.obtenerValor(row, ['descripcion', 'DESCRIPCION', 'Descripción', 'NOMBRE', 'Nombre']);

      if (!codigo || !descripcion) {
        return null; // Registro inválido
      }

      return {
        codigo: String(codigo).trim(),
        descripcion: String(descripcion).trim(),
        categoria: this.obtenerValor(row, ['categoria', 'CATEGORIA', 'Categoría', 'TIPO']) || 'Procedimiento',
        especialidad: this.obtenerValor(row, ['especialidad', 'ESPECIALIDAD', 'Especialidad']),
        tarifaSOAT: this.parseNumero(this.obtenerValor(row, ['tarifaSOAT', 'TARIFA_SOAT', 'Tarifa SOAT', 'SOAT'])),
        tarifaISS2001: this.parseNumero(this.obtenerValor(row, ['tarifaISS2001', 'TARIFA_ISS_2001', 'Tarifa ISS 2001', 'ISS2001'])),
        tarifaISS2004: this.parseNumero(this.obtenerValor(row, ['tarifaISS2004', 'TARIFA_ISS_2004', 'Tarifa ISS 2004', 'ISS2004'])),
        uvr: this.parseNumero(this.obtenerValor(row, ['uvr', 'UVR', 'Uvr'])),
        activo: true,
        metadata: {
          requiereAutorizacion: this.parseBoolean(this.obtenerValor(row, ['requiereAutorizacion', 'REQUIERE_AUTORIZACION', 'Autorización'])),
          nivelComplejidad: this.obtenerValor(row, ['nivelComplejidad', 'COMPLEJIDAD', 'Complejidad']),
          requiereQuirofano: this.parseBoolean(this.obtenerValor(row, ['requiereQuirofano', 'QUIROFANO', 'Quirófano'])),
        },
      };
    } catch (error) {
      logger.warn('Error normalizando registro:', error);
      return null;
    }
  }

  /**
   * Obtiene un valor de un objeto usando múltiples posibles claves
   */
  private obtenerValor(obj: any, claves: string[]): any {
    for (const clave of claves) {
      if (obj[clave] !== undefined && obj[clave] !== null && obj[clave] !== '') {
        return obj[clave];
      }
    }
    return undefined;
  }

  /**
   * Parsea un número de forma segura
   */
  private parseNumero(valor: any): number | undefined {
    if (valor === undefined || valor === null || valor === '') {
      return undefined;
    }
    const numero = parseFloat(String(valor).replace(/[^0-9.-]/g, ''));
    return isNaN(numero) ? undefined : numero;
  }

  /**
   * Parsea un booleano de forma segura
   */
  private parseBoolean(valor: any): boolean {
    if (valor === undefined || valor === null) {
      return false;
    }
    const str = String(valor).toLowerCase();
    return str === 'true' || str === 'si' || str === 'sí' || str === '1' || str === 'yes';
  }

  /**
   * Sincroniza CUPS con un conjunto de códigos (actualiza o inserta)
   */
  async sincronizarCUPS(cups: CUPSImportado[]): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    const resultados: ResultadoImportacion = {
      exitosos: 0,
      errores: 0,
      duplicados: 0,
      total: cups.length,
      tiempoMs: 0,
      mensajes: [],
    };

    try {
      logger.info(`Sincronizando ${cups.length} códigos CUPS...`);

      for (const cup of cups) {
        try {
          await CUPS.findOneAndUpdate(
            { codigo: cup.codigo },
            {
              $set: {
                descripcion: cup.descripcion,
                categoria: cup.categoria,
                especialidad: cup.especialidad,
                tarifaSOAT: cup.tarifaSOAT,
                tarifaISS2001: cup.tarifaISS2001,
                tarifaISS2004: cup.tarifaISS2004,
                uvr: cup.uvr,
                activo: true,
                'metadata.requiereAutorizacion': cup.requiereAutorizacion,
                'metadata.nivelComplejidad': cup.nivelComplejidad,
                'metadata.requiereQuirofano': cup.requiereQuirofano,
              },
            },
            { upsert: true }
          );
          resultados.exitosos++;
        } catch (error) {
          resultados.errores++;
          logger.warn(`Error sincronizando CUPS ${cup.codigo}:`, error);
        }
      }

      resultados.tiempoMs = Date.now() - inicio;
      resultados.mensajes.push(`Sincronización completada en ${resultados.tiempoMs}ms`);

      logger.info(`Sincronización completada: ${resultados.exitosos} exitosos, ${resultados.errores} errores`);
      return resultados;
    } catch (error: any) {
      logger.error('Error sincronizando CUPS:', error);
      resultados.mensajes.push(`Error: ${error.message}`);
      return resultados;
    }
  }

  /**
   * Obtiene estadísticas de la base de datos CUPS
   */
  async obtenerEstadisticas(): Promise<{
    totalCUPS: number;
    cupsActivos: number;
    cupsInactivos: number;
    cupsPorCategoria: Record<string, number>;
    cupsPorEspecialidad: Record<string, number>;
    cupsConTarifaSOAT: number;
    cupsConTarifaISS2001: number;
    cupsConTarifaISS2004: number;
  }> {
    const totalCUPS = await CUPS.countDocuments();
    const cupsActivos = await CUPS.countDocuments({ activo: true });
    const cupsInactivos = await CUPS.countDocuments({ activo: false });

    // Agrupar por categoría
    const porCategoria = await CUPS.aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
    ]);
    const cupsPorCategoria: Record<string, number> = {};
    porCategoria.forEach((item) => {
      cupsPorCategoria[item._id] = item.count;
    });

    // Agrupar por especialidad
    const porEspecialidad = await CUPS.aggregate([
      { $match: { especialidad: { $exists: true, $ne: null } } },
      { $group: { _id: '$especialidad', count: { $sum: 1 } } },
    ]);
    const cupsPorEspecialidad: Record<string, number> = {};
    porEspecialidad.forEach((item) => {
      cupsPorEspecialidad[item._id] = item.count;
    });

    const cupsConTarifaSOAT = await CUPS.countDocuments({ tarifaSOAT: { $exists: true, $gt: 0 } });
    const cupsConTarifaISS2001 = await CUPS.countDocuments({ tarifaISS2001: { $exists: true, $gt: 0 } });
    const cupsConTarifaISS2004 = await CUPS.countDocuments({ tarifaISS2004: { $exists: true, $gt: 0 } });

    return {
      totalCUPS,
      cupsActivos,
      cupsInactivos,
      cupsPorCategoria,
      cupsPorEspecialidad,
      cupsConTarifaSOAT,
      cupsConTarifaISS2001,
      cupsConTarifaISS2004,
    };
  }

  /**
   * Busca CUPS que necesitan actualización
   */
  async buscarCUPSIncompletos(): Promise<any[]> {
    return await CUPS.find({
      $or: [
        { descripcion: { $exists: false } },
        { descripcion: '' },
        { tarifaISS2004: { $exists: false } },
        { tarifaISS2004: 0 },
      ],
    }).limit(100);
  }
}

// Exportar instancia singleton
export const cupsSisproService = new CupsSisproService();
