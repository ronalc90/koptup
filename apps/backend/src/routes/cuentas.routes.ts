import { Router, RequestHandler } from 'express';
import {
  createCuenta,
  getCuentas,
  getCuentaById,
  deleteCuenta,
  uploadFilesToCuenta,
  deleteFileFromCuenta,
  toggleFileEnabled,
} from '../controllers/cuentas.controller';
import {
  uploadLey100Documents,
  getLey100Documents,
  deleteLey100Document,
  toggleLey100Enabled,
} from '../controllers/ley100.controller';
import {
  processCuentasAndGenerateExcel,
  exportExcelFile,
} from '../controllers/process.controller';
import {
  procesarCuentaHibrida,
  buscarCUPS,
  buscarMedicamentos,
  buscarDiagnosticos,
  buscarMaterialesInsumos,
  calcularTarifa,
  calcularCostoMeds,
} from '../controllers/cuentas-hybrid.controller';
import { upload, handleUploadError } from '../middleware/upload';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for cuentas-medicas uploads
const cuentasStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/cuentas-medicas/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const cuentasUpload = multer({
  storage: cuentasStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 20, // Max 20 files per request
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

const ley100Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/ley100/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const ley100Upload = multer({
  storage: ley100Storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.docx', '.txt'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

/**
 * @swagger
 * /api/ley100/upload:
 *   post:
 *     tags: [Ley100]
 *     summary: Upload Ley100 documents
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
 *               tipo:
 *                 type: string
 *               tags:
 *                 type: string
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 */
router.post(
  '/ley100/upload',
  ley100Upload.array('files', 10),
  handleUploadError,
  uploadLey100Documents as RequestHandler
);

/**
 * @swagger
 * /api/ley100:
 *   get:
 *     tags: [Ley100]
 *     summary: Get all Ley100 documents
 */
router.get('/ley100', getLey100Documents as RequestHandler);

/**
 * @swagger
 * /api/ley100/{id}:
 *   delete:
 *     tags: [Ley100]
 *     summary: Delete a Ley100 document
 */
router.delete('/ley100/:id', deleteLey100Document as RequestHandler);

/**
 * @swagger
 * /api/ley100/{id}/toggle:
 *   patch:
 *     tags: [Ley100]
 *     summary: Toggle Ley100 document enabled/disabled status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/ley100/:id/toggle', toggleLey100Enabled as RequestHandler);

/**
 * @swagger
 * /api/cuentas:
 *   post:
 *     tags: [Cuentas]
 *     summary: Create a new cuenta médica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cuenta created successfully
 */
router.post('/cuentas', createCuenta as RequestHandler);

/**
 * @swagger
 * /api/cuentas:
 *   get:
 *     tags: [Cuentas]
 *     summary: Get all cuentas médicas
 */
router.get('/cuentas', getCuentas as RequestHandler);

/**
 * @swagger
 * /api/cuentas/{id}:
 *   get:
 *     tags: [Cuentas]
 *     summary: Get a cuenta by ID
 */
router.get('/cuentas/:id', getCuentaById as RequestHandler);

/**
 * @swagger
 * /api/cuentas/{id}:
 *   delete:
 *     tags: [Cuentas]
 *     summary: Delete a cuenta
 */
router.delete('/cuentas/:id', deleteCuenta as RequestHandler);

/**
 * @swagger
 * /api/cuentas/{id}/upload:
 *   post:
 *     tags: [Cuentas]
 *     summary: Upload PDFs to a cuenta
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
 */
router.post(
  '/cuentas/:id/upload',
  cuentasUpload.array('files', 20),
  handleUploadError,
  uploadFilesToCuenta as RequestHandler
);

/**
 * @swagger
 * /api/cuentas/{id}/files/{filename}:
 *   delete:
 *     tags: [Cuentas]
 *     summary: Delete a file from a cuenta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/cuentas/:id/files/:filename', deleteFileFromCuenta as RequestHandler);

/**
 * @swagger
 * /api/cuentas/{id}/files/{filename}/toggle:
 *   patch:
 *     tags: [Cuentas]
 *     summary: Toggle file enabled/disabled status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/cuentas/:id/files/:filename/toggle', toggleFileEnabled as RequestHandler);

/**
 * @swagger
 * /api/process:
 *   post:
 *     tags: [Process]
 *     summary: Process selected cuentas and generate Excel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cuentaIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/process', processCuentasAndGenerateExcel as RequestHandler);

/**
 * @swagger
 * /api/export:
 *   get:
 *     tags: [Process]
 *     summary: Download generated Excel file
 *     parameters:
 *       - in: query
 *         name: file
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/export', exportExcelFile as RequestHandler);

// ========================================
// HYBRID PROCESSING ROUTES (DB + OpenAI)
// ========================================

/**
 * @swagger
 * /api/cuentas/procesar-hibrido:
 *   post:
 *     tags: [Cuentas Hibridas]
 *     summary: Process medical bill using hybrid architecture (DB + OpenAI)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pdfPath:
 *                 type: string
 *               tipoTarifa:
 *                 type: string
 *                 enum: [SOAT, ISS2001, ISS2004]
 */
router.post('/cuentas/procesar-hibrido', procesarCuentaHibrida as RequestHandler);

/**
 * @swagger
 * /api/cuentas/search/cups:
 *   get:
 *     tags: [Busqueda]
 *     summary: Search CUPS codes
 *     parameters:
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *       - in: query
 *         name: descripcion
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 */
router.get('/cuentas/search/cups', buscarCUPS as RequestHandler);

/**
 * @swagger
 * /api/cuentas/search/medicamentos:
 *   get:
 *     tags: [Busqueda]
 *     summary: Search medications
 */
router.get('/cuentas/search/medicamentos', buscarMedicamentos as RequestHandler);

/**
 * @swagger
 * /api/cuentas/search/diagnosticos:
 *   get:
 *     tags: [Busqueda]
 *     summary: Search ICD-10 diagnoses
 */
router.get('/cuentas/search/diagnosticos', buscarDiagnosticos as RequestHandler);

/**
 * @swagger
 * /api/cuentas/search/materiales:
 *   get:
 *     tags: [Busqueda]
 *     summary: Search materials and supplies
 */
router.get('/cuentas/search/materiales', buscarMaterialesInsumos as RequestHandler);

/**
 * @swagger
 * /api/cuentas/calcular-tarifa:
 *   post:
 *     tags: [Calculos]
 *     summary: Calculate procedure fees
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigosCUPS:
 *                 type: array
 *                 items:
 *                   type: string
 *               tipoTarifa:
 *                 type: string
 */
router.post('/cuentas/calcular-tarifa', calcularTarifa as RequestHandler);

/**
 * @swagger
 * /api/cuentas/calcular-costo-medicamentos:
 *   post:
 *     tags: [Calculos]
 *     summary: Calculate medication costs
 */
router.post('/cuentas/calcular-costo-medicamentos', calcularCostoMeds as RequestHandler);

export default router;
