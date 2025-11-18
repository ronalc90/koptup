/**
 * Servicio de Embeddings para Búsqueda Semántica
 *
 * Utiliza OpenAI text-embedding-3-small para vectorizar CUPS y permitir
 * búsqueda semántica rápida y precisa.
 */

import { getOpenAI } from './openai.service';
import CUPS from '../models/CUPS';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ResultadoBusquedaSemantica {
  cups: any;
  similaridad: number; // Cosine similarity (0-1)
}

export interface ResultadoVectorizacion {
  procesados: number;
  errores: number;
  tiempoMs: number;
}

// ============================================================================
// SERVICIO DE EMBEDDINGS
// ============================================================================

export class EmbeddingsService {
  private dimensiones = 1536; // text-embedding-3-small dimensiones
  private batchSize = 100; // Procesar en batches

  /**
   * Genera embedding para un texto usando OpenAI
   */
  async generarEmbedding(texto: string): Promise<number[]> {
    const openai = getOpenAI();

    try {
      const respuesta = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texto,
        encoding_format: 'float',
      });

      return respuesta.data[0].embedding;
    } catch (error: any) {
      logger.error('Error generando embedding:', error);
      throw new Error(`Error generando embedding: ${error.message}`);
    }
  }

  /**
   * Vectoriza todos los CUPS que no tienen embedding
   */
  async vectorizarTodosCUPS(): Promise<ResultadoVectorizacion> {
    const inicio = Date.now();
    let procesados = 0;
    let errores = 0;

    try {
      logger.info('Iniciando vectorización de CUPS...');

      // Obtener CUPS sin embedding
      const cupsSinEmbedding = await CUPS.find({
        $or: [
          { embedding: { $exists: false } },
          { embedding: null },
          { embedding: [] },
        ],
        activo: true,
      }).select('codigo descripcion categoria especialidad');

      logger.info(`${cupsSinEmbedding.length} CUPS pendientes de vectorizar`);

      // Procesar en batches
      for (let i = 0; i < cupsSinEmbedding.length; i += this.batchSize) {
        const batch = cupsSinEmbedding.slice(i, i + this.batchSize);

        for (const cup of batch) {
          try {
            // Crear texto descriptivo combinando código, descripción, categoría y especialidad
            const textoCompleto = [
              `Código: ${cup.codigo}`,
              `Descripción: ${cup.descripcion}`,
              cup.categoria ? `Categoría: ${cup.categoria}` : null,
              cup.especialidad ? `Especialidad: ${cup.especialidad}` : null,
            ]
              .filter(Boolean)
              .join('. ');

            // Generar embedding
            const embedding = await this.generarEmbedding(textoCompleto);

            // Guardar en BD
            await CUPS.updateOne(
              { _id: cup._id },
              {
                $set: {
                  embedding,
                  embeddingGenerado: new Date(),
                },
              }
            );

            procesados++;
            if (procesados % 10 === 0) {
              logger.info(`Vectorizados: ${procesados}/${cupsSinEmbedding.length}`);
            }

            // Pequeña pausa para no exceder rate limits
            await this.esperar(100);
          } catch (error) {
            errores++;
            logger.warn(`Error vectorizando CUPS ${cup.codigo}:`, error);
          }
        }
      }

      const tiempoMs = Date.now() - inicio;
      logger.info(`Vectorización completada: ${procesados} exitosos, ${errores} errores en ${tiempoMs}ms`);

      return { procesados, errores, tiempoMs };
    } catch (error: any) {
      logger.error('Error en vectorización masiva:', error);
      return {
        procesados,
        errores: errores + 1,
        tiempoMs: Date.now() - inicio,
      };
    }
  }

  /**
   * Búsqueda semántica de CUPS usando embeddings
   */
  async buscarSemantica(
    consulta: string,
    opciones: {
      limite?: number;
      umbralSimilaridad?: number;
      categoria?: string;
      especialidad?: string;
    } = {}
  ): Promise<ResultadoBusquedaSemantica[]> {
    try {
      const { limite = 10, umbralSimilaridad = 0.7, categoria, especialidad } = opciones;

      logger.info(`Búsqueda semántica: "${consulta}"`);

      // Generar embedding de la consulta
      const embeddingConsulta = await this.generarEmbedding(consulta);

      // Construir filtros
      const filtros: any = {
        embedding: { $exists: true, $ne: null },
        activo: true,
      };

      if (categoria) filtros.categoria = categoria;
      if (especialidad) filtros.especialidad = especialidad;

      // Buscar CUPS con embeddings
      const cupsConEmbedding = await CUPS.find(filtros)
        .select('codigo descripcion categoria especialidad embedding tarifaISS2004 tarifaSOAT metadata')
        .lean();

      // Calcular similaridad coseno para cada CUPS
      const resultados: ResultadoBusquedaSemantica[] = cupsConEmbedding
        .map((cup) => ({
          cups: {
            _id: cup._id,
            codigo: cup.codigo,
            descripcion: cup.descripcion,
            categoria: cup.categoria,
            especialidad: cup.especialidad,
            tarifaISS2004: cup.tarifaISS2004,
            tarifaSOAT: cup.tarifaSOAT,
            metadata: cup.metadata,
          },
          similaridad: this.calcularSimilaridadCoseno(embeddingConsulta, cup.embedding!),
        }))
        .filter((r) => r.similaridad >= umbralSimilaridad)
        .sort((a, b) => b.similaridad - a.similaridad)
        .slice(0, limite);

      logger.info(`Encontrados ${resultados.length} resultados relevantes`);
      return resultados;
    } catch (error: any) {
      logger.error('Error en búsqueda semántica:', error);
      throw new Error(`Error en búsqueda semántica: ${error.message}`);
    }
  }

  /**
   * Busca CUPS similares a uno dado
   */
  async buscarSimilares(
    codigoCUPS: string,
    opciones: {
      limite?: number;
      umbralSimilaridad?: number;
    } = {}
  ): Promise<ResultadoBusquedaSemantica[]> {
    try {
      const { limite = 10, umbralSimilaridad = 0.75 } = opciones;

      // Buscar el CUPS base
      const cupsBase = await CUPS.findOne({ codigo: codigoCUPS })
        .select('embedding descripcion')
        .lean();

      if (!cupsBase || !cupsBase.embedding) {
        throw new Error(`CUPS ${codigoCUPS} no encontrado o sin embedding`);
      }

      // Buscar CUPS similares
      const todosCUPS = await CUPS.find({
        codigo: { $ne: codigoCUPS },
        embedding: { $exists: true, $ne: null },
        activo: true,
      })
        .select('codigo descripcion categoria especialidad embedding tarifaISS2004 metadata')
        .lean();

      const resultados: ResultadoBusquedaSemantica[] = todosCUPS
        .map((cup) => ({
          cups: {
            _id: cup._id,
            codigo: cup.codigo,
            descripcion: cup.descripcion,
            categoria: cup.categoria,
            especialidad: cup.especialidad,
            tarifaISS2004: cup.tarifaISS2004,
            metadata: cup.metadata,
          },
          similaridad: this.calcularSimilaridadCoseno(cupsBase.embedding!, cup.embedding!),
        }))
        .filter((r) => r.similaridad >= umbralSimilaridad)
        .sort((a, b) => b.similaridad - a.similaridad)
        .slice(0, limite);

      logger.info(`Encontrados ${resultados.length} CUPS similares a ${codigoCUPS}`);
      return resultados;
    } catch (error: any) {
      logger.error('Error buscando CUPS similares:', error);
      throw error;
    }
  }

  /**
   * Calcula la similaridad coseno entre dos vectores
   */
  private calcularSimilaridadCoseno(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Los vectores deben tener la misma dimensión');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Espera un tiempo determinado (para rate limiting)
   */
  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas de vectorización
   */
  async obtenerEstadisticasVectorizacion(): Promise<{
    totalCUPS: number;
    cupsVectorizados: number;
    cupsPendientes: number;
    porcentajeVectorizado: number;
  }> {
    const totalCUPS = await CUPS.countDocuments({ activo: true });
    const cupsVectorizados = await CUPS.countDocuments({
      embedding: { $exists: true, $ne: null },
      activo: true,
    });
    const cupsPendientes = totalCUPS - cupsVectorizados;
    const porcentajeVectorizado = totalCUPS > 0 ? (cupsVectorizados / totalCUPS) * 100 : 0;

    return {
      totalCUPS,
      cupsVectorizados,
      cupsPendientes,
      porcentajeVectorizado,
    };
  }

  /**
   * Re-vectoriza CUPS desactualizados (por ejemplo, si cambió la descripción)
   */
  async revectorizarDesactualizados(): Promise<ResultadoVectorizacion> {
    const inicio = Date.now();
    let procesados = 0;
    let errores = 0;

    try {
      // Buscar CUPS actualizados después de su vectorización
      const cupsDesactualizados = await CUPS.find({
        $and: [
          { embedding: { $exists: true, $ne: null } },
          { embeddingGenerado: { $exists: true } },
          { $expr: { $gt: ['$updatedAt', '$embeddingGenerado'] } },
        ],
        activo: true,
      }).select('codigo descripcion categoria especialidad');

      logger.info(`${cupsDesactualizados.length} CUPS desactualizados encontrados`);

      for (const cup of cupsDesactualizados) {
        try {
          const textoCompleto = [
            `Código: ${cup.codigo}`,
            `Descripción: ${cup.descripcion}`,
            cup.categoria ? `Categoría: ${cup.categoria}` : null,
            cup.especialidad ? `Especialidad: ${cup.especialidad}` : null,
          ]
            .filter(Boolean)
            .join('. ');

          const embedding = await this.generarEmbedding(textoCompleto);

          await CUPS.updateOne(
            { _id: cup._id },
            {
              $set: {
                embedding,
                embeddingGenerado: new Date(),
              },
            }
          );

          procesados++;
          await this.esperar(100);
        } catch (error) {
          errores++;
          logger.warn(`Error re-vectorizando CUPS ${cup.codigo}:`, error);
        }
      }

      const tiempoMs = Date.now() - inicio;
      logger.info(`Re-vectorización completada: ${procesados} exitosos, ${errores} errores`);

      return { procesados, errores, tiempoMs };
    } catch (error: any) {
      logger.error('Error en re-vectorización:', error);
      return {
        procesados,
        errores: errores + 1,
        tiempoMs: Date.now() - inicio,
      };
    }
  }
}

// Exportar instancia singleton
export const embeddingsService = new EmbeddingsService();
