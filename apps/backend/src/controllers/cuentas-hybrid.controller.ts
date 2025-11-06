import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { procesarCuentaMedicaHibrida } from '../services/cuenta-medica-hybrid.service';
import {
  searchCUPS,
  searchMedicamentos,
  searchDiagnosticos,
  searchMaterialesInsumos,
  calcularTarifaProcedimientos,
  calcularCostoMedicamentos,
} from '../services/medical-search.service';

/**
 * Procesar cuenta médica usando arquitectura híbrida (BD + OpenAI)
 * POST /api/cuentas/procesar-hibrido
 *
 * Body:
 * {
 *   "pdfPath": "uploads/cuentas-medicas/file.pdf",
 *   "tipoTarifa": "SOAT" | "ISS2001" | "ISS2004"
 * }
 */
export async function procesarCuentaHibrida(req: Request, res: Response): Promise<void> {
  try {
    const { pdfPath, tipoTarifa = 'SOAT' } = req.body;

    if (!pdfPath) {
      res.status(400).json({
        success: false,
        message: 'El campo pdfPath es requerido',
      });
      return;
    }

    logger.info(`Procesando cuenta médica (híbrido): ${pdfPath}`);

    const resultado = await procesarCuentaMedicaHibrida(pdfPath, tipoTarifa as any);

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error procesando cuenta médica (híbrido):', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la cuenta médica',
      error: error.message,
    });
  }
}

/**
 * Buscar códigos CUPS
 * GET /api/cuentas/search/cups?codigo=890201&descripcion=consulta&categoria=Consulta
 */
export async function buscarCUPS(req: Request, res: Response): Promise<void> {
  try {
    const { codigo, descripcion, categoria, especialidad, limit } = req.query;

    const resultado = await searchCUPS({
      codigo: codigo as string,
      descripcion: descripcion as string,
      categoria: categoria as string,
      especialidad: especialidad as string,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error buscando CUPS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar códigos CUPS',
      error: error.message,
    });
  }
}

/**
 * Buscar medicamentos
 * GET /api/cuentas/search/medicamentos?principioActivo=acetaminofen&codigoCUM=123456
 */
export async function buscarMedicamentos(req: Request, res: Response): Promise<void> {
  try {
    const { principioActivo, nombreComercial, codigoATC, codigoCUM, pos, limit } = req.query;

    const resultado = await searchMedicamentos({
      principioActivo: principioActivo as string,
      nombreComercial: nombreComercial as string,
      codigoATC: codigoATC as string,
      codigoCUM: codigoCUM as string,
      pos: pos === 'true' ? true : pos === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error buscando medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar medicamentos',
      error: error.message,
    });
  }
}

/**
 * Buscar diagnósticos CIE-10
 * GET /api/cuentas/search/diagnosticos?codigoCIE10=A09&descripcion=diarrea
 */
export async function buscarDiagnosticos(req: Request, res: Response): Promise<void> {
  try {
    const { codigoCIE10, descripcion, categoria, limit } = req.query;

    const resultado = await searchDiagnosticos({
      codigoCIE10: codigoCIE10 as string,
      descripcion: descripcion as string,
      categoria: categoria as string,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error buscando diagnósticos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar diagnósticos',
      error: error.message,
    });
  }
}

/**
 * Buscar materiales e insumos
 * GET /api/cuentas/search/materiales?nombre=gasa&categoria=Material quirúrgico
 */
export async function buscarMaterialesInsumos(req: Request, res: Response): Promise<void> {
  try {
    const { codigo, nombre, categoria, limit } = req.query;

    const resultado = await searchMaterialesInsumos({
      codigo: codigo as string,
      nombre: nombre as string,
      categoria: categoria as string,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error buscando materiales/insumos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar materiales e insumos',
      error: error.message,
    });
  }
}

/**
 * Calcular tarifa de procedimientos
 * POST /api/cuentas/calcular-tarifa
 *
 * Body:
 * {
 *   "codigosCUPS": ["890201", "890301"],
 *   "tipoTarifa": "SOAT"
 * }
 */
export async function calcularTarifa(req: Request, res: Response): Promise<void> {
  try {
    const { codigosCUPS, tipoTarifa = 'SOAT' } = req.body;

    if (!codigosCUPS || !Array.isArray(codigosCUPS)) {
      res.status(400).json({
        success: false,
        message: 'El campo codigosCUPS debe ser un array',
      });
      return;
    }

    const resultado = await calcularTarifaProcedimientos(codigosCUPS, tipoTarifa as any);

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error calculando tarifa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular tarifa de procedimientos',
      error: error.message,
    });
  }
}

/**
 * Calcular costo de medicamentos
 * POST /api/cuentas/calcular-costo-medicamentos
 *
 * Body:
 * {
 *   "medicamentos": [
 *     { "codigoCUM": "123456", "cantidad": 10 },
 *     { "codigoCUM": "789012", "cantidad": 5 }
 *   ]
 * }
 */
export async function calcularCostoMeds(req: Request, res: Response): Promise<void> {
  try {
    const { medicamentos } = req.body;

    if (!medicamentos || !Array.isArray(medicamentos)) {
      res.status(400).json({
        success: false,
        message: 'El campo medicamentos debe ser un array',
      });
      return;
    }

    const resultado = await calcularCostoMedicamentos(medicamentos);

    res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    logger.error('Error calculando costo medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular costo de medicamentos',
      error: error.message,
    });
  }
}

export default {
  procesarCuentaHibrida,
  buscarCUPS,
  buscarMedicamentos,
  buscarDiagnosticos,
  buscarMaterialesInsumos,
  calcularTarifa,
  calcularCostoMeds,
};
