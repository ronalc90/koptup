import express from 'express';
import auditoriaController, { upload } from '../controllers/auditoria.controller';
import auditoriaMedicaController from '../controllers/auditoria-medica.controller';

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
 * /api/auditoria/procesar-facturas-pdf:
 *   post:
 *     tags: [Auditoría Médica]
 *     summary: Procesar PDFs de facturas médicas (Nueva EPS) con extracción real
 *     description: Extrae datos de PDFs de facturas médicas, calcula glosas según tarifario Nueva EPS y genera Excel completo con 8 pestañas
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
 *                 description: PDFs de factura y/o historia clínica
 *     responses:
 *       201:
 *         description: Factura procesada y auditada exitosamente con datos reales del PDF
 */
router.post('/procesar-facturas-pdf', upload.array('files', 10), auditoriaMedicaController.procesarFacturasPDF);

/**
 * @swagger
 * /api/auditoria/facturas/{id}/excel-auditoria-medica:
 *   get:
 *     tags: [Auditoría Médica]
 *     summary: Descargar Excel de auditoría médica con 8 pestañas
 *     description: Genera Excel completo con FACTURACION, PROCEDIMIENTOS, GLOSAS, AUTORIZACIONES, PACIENTE, DIAGNOSTICOS, FECHAS, RESUMEN
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Excel de auditoría médica generado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Factura no encontrada
 */
router.get('/facturas/:id/excel-auditoria-medica', auditoriaMedicaController.descargarExcelAuditoria);

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
 * /api/auditoria/facturas/{id}:
 *   delete:
 *     tags: [Auditoría]
 *     summary: Eliminar factura y todos sus datos relacionados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Factura eliminada exitosamente
 *       404:
 *         description: Factura no encontrada
 */
router.delete('/facturas/:id', auditoriaController.eliminarFactura);

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

/**
 * @swagger
 * /api/auditoria/facturas/{id}/auditar-paso-a-paso:
 *   post:
 *     tags: [Auditoría]
 *     summary: Iniciar auditoría paso a paso con control manual
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Sesión de auditoría iniciada
 *       404:
 *         description: Factura no encontrada
 */
router.post('/facturas/:id/auditar-paso-a-paso', auditoriaController.iniciarAuditoriaPasoPaso);

/**
 * @swagger
 * /api/auditoria/sesion/{sesionId}/siguiente:
 *   post:
 *     tags: [Auditoría]
 *     summary: Avanzar al siguiente paso en la auditoría
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión de auditoría
 *     responses:
 *       200:
 *         description: Paso ejecutado exitosamente
 *       404:
 *         description: Sesión no encontrada
 */
router.post('/sesion/:sesionId/siguiente', auditoriaController.avanzarPasoAuditoria);

/**
 * @swagger
 * /api/auditoria/sesion/{sesionId}:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener estado actual de la sesión de auditoría
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión de auditoría
 *     responses:
 *       200:
 *         description: Estado de la sesión
 *       404:
 *         description: Sesión no encontrada
 */
router.get('/sesion/:sesionId', auditoriaController.obtenerSesionAuditoria);

/**
 * @swagger
 * /api/auditoria/aprendizaje/feedback/{decisionId}:
 *   post:
 *     tags: [Sistema de Aprendizaje]
 *     summary: Agregar feedback humano a una decisión de la IA
 *     description: Permite a los administradores calificar decisiones de la IA con score 0-100 y comentarios
 *     parameters:
 *       - in: path
 *         name: decisionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la decisión de la IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scoreHumano
 *               - comentario
 *             properties:
 *               scoreHumano:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Puntuación de la decisión (0-100)
 *                 example: 85
 *               comentario:
 *                 type: string
 *                 description: Comentario en lenguaje natural explicando la calificación
 *                 example: "La IA identificó correctamente el código CUPS pero el valor calculado fue menor al esperado"
 *               valorCorrecto:
 *                 type: object
 *                 description: Valor correcto si la IA se equivocó (opcional)
 *     responses:
 *       200:
 *         description: Feedback agregado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 */
router.post('/aprendizaje/feedback/:decisionId', auditoriaController.agregarFeedbackDecision);

/**
 * @swagger
 * /api/auditoria/aprendizaje/estadisticas:
 *   get:
 *     tags: [Sistema de Aprendizaje]
 *     summary: Obtener estadísticas de calibración del sistema
 *     description: Muestra cómo está aprendiendo el sistema - scores, errores comunes, recomendaciones
 *     responses:
 *       200:
 *         description: Estadísticas de aprendizaje
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDecisiones:
 *                   type: number
 *                 decisionesConFeedback:
 *                   type: number
 *                 scorePromedioGlobal:
 *                   type: number
 *                 porcentajeFeedback:
 *                   type: number
 *                 porTipo:
 *                   type: object
 *                 erroresComunes:
 *                   type: array
 */
router.get('/aprendizaje/estadisticas', auditoriaController.obtenerEstadisticasAprendizaje);

/**
 * @swagger
 * /api/auditoria/aprendizaje/reporte:
 *   get:
 *     tags: [Sistema de Aprendizaje]
 *     summary: Generar reporte de calibración completo
 *     description: Reporte detallado del estado del sistema de aprendizaje con recomendaciones
 *     responses:
 *       200:
 *         description: Reporte de calibración generado
 */
router.get('/aprendizaje/reporte', auditoriaController.generarReporteCalibracion);

export default router;
