import { Router, RequestHandler } from 'express';
import {
  crearRadicado,
  obtenerRadicados,
  obtenerRadicadoPorId,
  subirDocumentos,
  liquidarRadicado,
  descargarExcel,
  eliminarRadicado,
  obtenerEstadisticas,
} from '../controllers/liquidacion.controller';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { handleUploadError } from '../middleware/upload';

const router = Router();

// Configurar multer para documentos de liquidación
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/cuentas-medicas/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
});

/**
 * @swagger
 * /api/liquidacion/radicados:
 *   post:
 *     tags: [Liquidación]
 *     summary: Crear un nuevo radicado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numeroRadicado
 *               - nit
 *               - eps
 *             properties:
 *               numeroRadicado:
 *                 type: string
 *               nit:
 *                 type: string
 *               eps:
 *                 type: string
 *               nombreIPS:
 *                 type: string
 *               valorContratado:
 *                 type: number
 *               creadoPor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Radicado creado exitosamente
 */
router.post('/radicados', crearRadicado as RequestHandler);

/**
 * @swagger
 * /api/liquidacion/radicados:
 *   get:
 *     tags: [Liquidación]
 *     summary: Obtener todos los radicados
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
 *         name: rango
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de radicados
 */
router.get('/radicados', obtenerRadicados as RequestHandler);

/**
 * @swagger
 * /api/liquidacion/estadisticas:
 *   get:
 *     tags: [Liquidación]
 *     summary: Obtener estadísticas de liquidación
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas
 */
router.get('/estadisticas', obtenerEstadisticas as RequestHandler);

/**
 * @swagger
 * /api/liquidacion/radicados/{id}:
 *   get:
 *     tags: [Liquidación]
 *     summary: Obtener un radicado por ID o número
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Radicado encontrado
 *       404:
 *         description: Radicado no encontrado
 */
router.get('/radicados/:id', obtenerRadicadoPorId as RequestHandler);

/**
 * @swagger
 * /api/liquidacion/radicados/{id}/documentos:
 *   post:
 *     tags: [Liquidación]
 *     summary: Subir documentos a un radicado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Documentos subidos exitosamente
 */
router.post(
  '/radicados/:id/documentos',
  upload.array('files', 20),
  handleUploadError,
  subirDocumentos as RequestHandler
);

/**
 * @swagger
 * /api/liquidacion/radicados/{id}/liquidar:
 *   post:
 *     tags: [Liquidación]
 *     summary: Ejecutar liquidación automatizada de un radicado
 *     description: |
 *       Ejecuta el proceso completo de liquidación:
 *       1. Extrae datos de PDFs
 *       2. Consulta sistemas externos (OnBase, Nueva EPS)
 *       3. Ejecuta validaciones automáticas
 *       4. Aplica reglas de negocio
 *       5. Calcula glosas
 *       6. Genera Excel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liquidación completada
 *       404:
 *         description: Radicado no encontrado
 *       500:
 *         description: Error en liquidación
 */
router.post('/radicados/:id/liquidar', liquidarRadicado as RequestHandler);

/**
 * @swagger
 * /api/liquidacion/radicados/{id}/descargar-excel:
 *   get:
 *     tags: [Liquidación]
 *     summary: Descargar Excel de liquidación
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo Excel descargado
 *       404:
 *         description: Excel no encontrado
 */
router.get('/radicados/:id/descargar-excel', descargarExcel as RequestHandler);

/**
 * @swagger
 * /api/liquidacion/radicados/{id}:
 *   delete:
 *     tags: [Liquidación]
 *     summary: Eliminar un radicado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Radicado eliminado
 *       404:
 *         description: Radicado no encontrado
 */
router.delete('/radicados/:id', eliminarRadicado as RequestHandler);

export default router;
