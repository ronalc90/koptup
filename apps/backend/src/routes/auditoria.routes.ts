import express from 'express';
import auditoriaController, { upload } from '../controllers/auditoria.controller';

const router = express.Router();

/**
 * @swagger
 * /api/auditoria/facturas:
 *   post:
 *     tags: [Auditoría]
 *     summary: Crear nueva factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Factura creada exitosamente
 */
router.post('/facturas', auditoriaController.crearFactura);

/**
 * @swagger
 * /api/auditoria/procesar-archivos:
 *   post:
 *     tags: [Auditoría]
 *     summary: Procesar archivos y crear factura automáticamente
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombreCuenta:
 *                 type: string
 *                 description: Nombre de la cuenta médica
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Factura creada y archivos procesados
 */
router.post('/procesar-archivos', upload.array('files', 10), auditoriaController.procesarArchivos);

/**
 * @swagger
 * /api/auditoria/facturas:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener listado de facturas
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: eps
 *         schema:
 *           type: string
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listado de facturas
 */
router.get('/facturas', auditoriaController.obtenerFacturas);

/**
 * @swagger
 * /api/auditoria/facturas/{id}:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener factura por ID con detalles completos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles de la factura
 *       404:
 *         description: Factura no encontrada
 */
router.get('/facturas/:id', auditoriaController.obtenerFacturaPorId);

/**
 * @swagger
 * /api/auditoria/facturas/{id}/auditar:
 *   post:
 *     tags: [Auditoría]
 *     summary: Ejecutar auditoría automática de una factura
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auditoría ejecutada exitosamente
 *       404:
 *         description: Factura no encontrada
 */
router.post('/facturas/:id/auditar', auditoriaController.ejecutarAuditoria);

/**
 * @swagger
 * /api/auditoria/facturas/{id}/excel:
 *   get:
 *     tags: [Auditoría]
 *     summary: Generar Excel con resultados de auditoría
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel generado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Factura no encontrada
 */
router.get('/facturas/:id/excel', auditoriaController.generarExcel);

/**
 * @swagger
 * /api/auditoria/soportes:
 *   post:
 *     tags: [Auditoría]
 *     summary: Subir soporte documental
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               facturaId:
 *                 type: string
 *               atencionId:
 *                 type: string
 *               procedimientoId:
 *                 type: string
 *               tipo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Soporte cargado exitosamente
 */
router.post('/soportes', upload.single('file'), auditoriaController.subirSoporte);

/**
 * @swagger
 * /api/auditoria/tarifarios:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener tarifarios disponibles
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: eps
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Listado de tarifarios
 */
router.get('/tarifarios', auditoriaController.obtenerTarifarios);

/**
 * @swagger
 * /api/auditoria/glosas/{id}:
 *   patch:
 *     tags: [Auditoría]
 *     summary: Actualizar glosa manualmente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Glosa actualizada
 *       404:
 *         description: Glosa no encontrada
 */
router.patch('/glosas/:id', auditoriaController.actualizarGlosa);

/**
 * @swagger
 * /api/auditoria/estadisticas:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener estadísticas del dashboard
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estadísticas generadas
 */
router.get('/estadisticas', auditoriaController.obtenerEstadisticas);

export default router;
