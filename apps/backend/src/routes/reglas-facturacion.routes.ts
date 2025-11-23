import { Router, RequestHandler } from 'express';
import {
  crearRegla,
  obtenerReglas,
  obtenerReglaPorId,
  actualizarRegla,
  eliminarRegla,
  toggleRegla,
  obtenerEjemplosReglas,
  previsualizarRegla,
} from '../controllers/reglas-facturacion.controller';

const router = Router();

/**
 * @swagger
 * /api/reglas-facturacion:
 *   post:
 *     tags: [Reglas de Facturación]
 *     summary: Crear una nueva regla de facturación
 *     description: Crea una regla en lenguaje natural que se interpreta con IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - descripcion
 *               - tipo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Ignorar glosas pequeñas"
 *               descripcion:
 *                 type: string
 *                 example: "No generar glosas por valores menores a $5,000"
 *               tipo:
 *                 type: string
 *                 enum: [glosa, autorizacion, valor, fecha, paciente, servicio, general]
 *                 example: "glosa"
 *               activa:
 *                 type: boolean
 *                 default: true
 *               prioridad:
 *                 type: number
 *                 default: 100
 *               ambito:
 *                 type: object
 *                 properties:
 *                   tipo:
 *                     type: string
 *                     enum: [global, eps, servicio, rango_valor, tipo_atencion]
 *                   valor:
 *                     type: string
 *               creadoPor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Regla creada exitosamente
 *       400:
 *         description: Datos inválidos o regla no interpretable
 */
router.post('/', crearRegla as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion:
 *   get:
 *     tags: [Reglas de Facturación]
 *     summary: Obtener todas las reglas de facturación
 *     parameters:
 *       - in: query
 *         name: activa
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de regla
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de reglas obtenida exitosamente
 */
router.get('/', obtenerReglas as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion/ejemplos:
 *   get:
 *     tags: [Reglas de Facturación]
 *     summary: Obtener ejemplos de reglas predefinidas
 *     responses:
 *       200:
 *         description: Ejemplos obtenidos exitosamente
 */
router.get('/ejemplos', obtenerEjemplosReglas as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion/previsualizar:
 *   post:
 *     tags: [Reglas de Facturación]
 *     summary: Previsualizar cómo se interpretará una regla sin guardarla
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion
 *               - tipo
 *             properties:
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Previsualización generada exitosamente
 */
router.post('/previsualizar', previsualizarRegla as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion/{id}:
 *   get:
 *     tags: [Reglas de Facturación]
 *     summary: Obtener una regla por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Regla obtenida exitosamente
 *       404:
 *         description: Regla no encontrada
 */
router.get('/:id', obtenerReglaPorId as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion/{id}:
 *   patch:
 *     tags: [Reglas de Facturación]
 *     summary: Actualizar una regla
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
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *               activa:
 *                 type: boolean
 *               prioridad:
 *                 type: number
 *               modificadoPor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Regla actualizada exitosamente
 */
router.patch('/:id', actualizarRegla as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion/{id}:
 *   delete:
 *     tags: [Reglas de Facturación]
 *     summary: Eliminar una regla
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Regla eliminada exitosamente
 */
router.delete('/:id', eliminarRegla as RequestHandler);

/**
 * @swagger
 * /api/reglas-facturacion/{id}/toggle:
 *   patch:
 *     tags: [Reglas de Facturación]
 *     summary: Activar/Desactivar una regla
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de regla cambiado exitosamente
 */
router.patch('/:id/toggle', toggleRegla as RequestHandler);

export default router;
