import { Router, RequestHandler } from 'express';
import {
  getConfiguracion,
  toggleDocumento,
  inicializarConfiguraciones,
  resetearConfiguraciones,
} from '../controllers/documentoConocimientoConfig.controller';

const router = Router();

/**
 * @swagger
 * /api/documentos-conocimiento/config:
 *   get:
 *     tags: [Documentos Conocimiento]
 *     summary: Obtener configuración de todos los documentos de conocimiento
 *     responses:
 *       200:
 *         description: Configuración obtenida correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/config', getConfiguracion as RequestHandler);

/**
 * @swagger
 * /api/documentos-conocimiento/config/{documento_id}:
 *   patch:
 *     tags: [Documentos Conocimiento]
 *     summary: Actualizar estado activo/inactivo de un documento
 *     parameters:
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuración actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.patch('/config/:documento_id', toggleDocumento as RequestHandler);

/**
 * @swagger
 * /api/documentos-conocimiento/config/inicializar:
 *   post:
 *     tags: [Documentos Conocimiento]
 *     summary: Inicializar configuraciones por defecto
 *     responses:
 *       200:
 *         description: Configuraciones inicializadas correctamente
 *       500:
 *         description: Error del servidor
 */
router.post('/config/inicializar', inicializarConfiguraciones as RequestHandler);

/**
 * @swagger
 * /api/documentos-conocimiento/config/resetear:
 *   post:
 *     tags: [Documentos Conocimiento]
 *     summary: Resetear todas las configuraciones a valores por defecto
 *     responses:
 *       200:
 *         description: Configuraciones reseteadas correctamente
 *       500:
 *         description: Error del servidor
 */
router.post('/config/resetear', resetearConfiguraciones as RequestHandler);

export default router;
