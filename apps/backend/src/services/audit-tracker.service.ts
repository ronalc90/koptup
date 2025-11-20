/**
 * SERVICIO DE TRACKING DE AUDITORÍA
 *
 * Registra CADA PASO del proceso de auditoría:
 * - Texto exacto extraído del PDF
 * - Imágenes procesadas
 * - Cada campo extraído con su método y confianza
 * - Comparaciones entre métodos
 * - Decisiones de validación
 * - Cálculos de glosas
 * - Decisión final de la IA
 *
 * Todo para mostrar el proceso completo en "Ver Detalle"
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Paso individual del proceso
 */
export interface PasoAuditoria {
  id: string;
  timestamp: Date;
  tipo: 'INGESTA' | 'EXTRACCION' | 'VALIDACION' | 'COMPARACION' | 'GLOSA' | 'DECISION_FINAL';
  descripcion: string;
  datos: any;
  resultado: any;
  confianza?: number;
  alertas?: string[];
  duracionMs?: number;
}

/**
 * Decisión sobre un campo específico
 */
export interface DecisionCampo {
  campo: string;
  valorOriginalPDF: string; // Texto exacto del PDF
  valorExtraidoRegex?: any;
  valorExtraidoVision?: any;
  valorFinal: any;
  metodoSeleccionado: 'REGEX' | 'VISION' | 'MANUAL' | 'IA_AUDITOR';
  confianzaRegex?: number;
  confianzaVision?: number;
  confianzaFinal: number;
  razon: string;
  alternativasConsideradas?: {
    valor: any;
    metodo: string;
    confianza: number;
    razonDescarte: string;
  }[];
}

/**
 * Proceso completo de auditoría de una factura
 */
export interface ProcesoAuditoria {
  facturaId: string;
  numeroFactura: string;
  timestampInicio: Date;
  timestampFin?: Date;
  duracionTotalMs?: number;

  // Archivos originales
  archivosOriginales: {
    nombre: string;
    ruta: string;
    tamanoBytes: number;
    tipo: string;
  }[];

  // Imágenes procesadas (base64 para mostrar en UI)
  imagenesProcessadas: {
    numeroPagina: number;
    imagenBase64: string;
    ancho: number;
    alto: number;
    calidad: {
      contraste: number;
      nitidez: number;
      escaneable: boolean;
    };
  }[];

  // Texto raw extraído del PDF (OCR básico)
  textoRawPDF: {
    pagina: number;
    texto: string;
    metodo: string; // 'PDF.js', 'Tesseract', etc.
  }[];

  // Pasos del proceso
  pasos: PasoAuditoria[];

  // Decisiones por campo
  decisionesCampos: DecisionCampo[];

  // Comparaciones entre métodos
  comparaciones: {
    campo: string;
    metodos: {
      nombre: string;
      valor: any;
      confianza: number;
    }[];
    valorFinal: any;
    razon: string;
  }[];

  // Cálculos de glosas
  calculosGlosas: {
    codigoGlosa: string;
    tipo: string;
    descripcion: string;
    valorFacturado: number;
    valorContrato: number;
    diferencia: number;
    valorGlosado: number;
    formula: string;
    justificacion: string;
  }[];

  // Decisión final de la IA
  decisionFinalIA: {
    veredicto: string;
    valorAPagar: number;
    valorGlosa: number;
    confianza: number;
    razonamiento: string;
    fundamentoMedico: string;
    fundamentoFinanciero: string;
    fundamentoAdministrativo: string;
    alertas: string[];
    correccionesRealizadas: {
      campo: string;
      valorAnterior: any;
      valorNuevo: any;
      razon: string;
    }[];
  };

  // Estado final
  estado: 'EN_PROCESO' | 'COMPLETADO' | 'ERROR';
  errores?: {
    paso: string;
    error: string;
    timestamp: Date;
  }[];
}

class AuditTrackerService {
  private procesosPath: string;
  private procesosActivos: Map<string, ProcesoAuditoria> = new Map();

  constructor() {
    this.procesosPath = path.join(process.cwd(), 'data', 'procesos-auditoria');
    this.inicializarDirectorios();
  }

  private inicializarDirectorios(): void {
    if (!fs.existsSync(this.procesosPath)) {
      fs.mkdirSync(this.procesosPath, { recursive: true });
    }
  }

  /**
   * Iniciar tracking de un nuevo proceso
   */
  iniciarProceso(numeroFactura: string, archivos: any[]): string {
    const procesoId = `proceso_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const proceso: ProcesoAuditoria = {
      facturaId: procesoId,
      numeroFactura,
      timestampInicio: new Date(),
      archivosOriginales: archivos.map(a => ({
        nombre: a.originalname || a.name,
        ruta: a.path,
        tamanoBytes: a.size,
        tipo: a.mimetype,
      })),
      imagenesProcessadas: [],
      textoRawPDF: [],
      pasos: [],
      decisionesCampos: [],
      comparaciones: [],
      calculosGlosas: [],
      decisionFinalIA: {} as any,
      estado: 'EN_PROCESO',
    };

    this.procesosActivos.set(procesoId, proceso);

    console.log(`📋 Proceso de auditoría iniciado: ${procesoId}`);

    return procesoId;
  }

  /**
   * Registrar paso del proceso
   */
  registrarPaso(
    procesoId: string,
    tipo: PasoAuditoria['tipo'],
    descripcion: string,
    datos: any,
    resultado: any,
    opciones?: {
      confianza?: number;
      alertas?: string[];
      duracionMs?: number;
    }
  ): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) {
      console.warn(`⚠️  Proceso ${procesoId} no encontrado`);
      return;
    }

    const paso: PasoAuditoria = {
      id: `paso_${Date.now()}`,
      timestamp: new Date(),
      tipo,
      descripcion,
      datos,
      resultado,
      confianza: opciones?.confianza,
      alertas: opciones?.alertas,
      duracionMs: opciones?.duracionMs,
    };

    proceso.pasos.push(paso);

    console.log(`  ✓ [${tipo}] ${descripcion}`);
  }

  /**
   * Registrar texto raw extraído del PDF
   */
  registrarTextoRaw(procesoId: string, pagina: number, texto: string, metodo: string): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.textoRawPDF.push({
      pagina,
      texto,
      metodo,
    });

    console.log(`  ✓ Texto raw de página ${pagina} registrado (${texto.length} caracteres)`);
  }

  /**
   * Registrar imagen procesada
   */
  registrarImagenProcesada(
    procesoId: string,
    numeroPagina: number,
    imagenBase64: string,
    ancho: number,
    alto: number,
    calidad: any
  ): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.imagenesProcessadas.push({
      numeroPagina,
      imagenBase64,
      ancho,
      alto,
      calidad,
    });

    console.log(`  ✓ Imagen de página ${numeroPagina} registrada (${ancho}x${alto})`);
  }

  /**
   * Registrar decisión sobre un campo
   */
  registrarDecisionCampo(procesoId: string, decision: DecisionCampo): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.decisionesCampos.push(decision);

    console.log(`  ✓ Decisión sobre campo "${decision.campo}": ${decision.valorFinal} (${decision.metodoSeleccionado}, confianza: ${decision.confianzaFinal}%)`);
  }

  /**
   * Registrar comparación entre métodos
   */
  registrarComparacion(
    procesoId: string,
    campo: string,
    metodos: { nombre: string; valor: any; confianza: number }[],
    valorFinal: any,
    razon: string
  ): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.comparaciones.push({
      campo,
      metodos,
      valorFinal,
      razon,
    });

    console.log(`  ✓ Comparación de campo "${campo}": ${metodos.length} métodos evaluados`);
  }

  /**
   * Registrar cálculo de glosa
   */
  registrarCalculoGlosa(procesoId: string, calculo: any): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.calculosGlosas.push(calculo);

    console.log(`  ✓ Glosa calculada: ${calculo.codigoGlosa} - $${calculo.valorGlosado.toLocaleString('es-CO')}`);
  }

  /**
   * Registrar decisión final de la IA
   */
  registrarDecisionFinal(procesoId: string, decision: any): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.decisionFinalIA = decision;

    console.log(`  ✓ Decisión final IA: ${decision.veredicto} - Pagar $${decision.valorAPagar.toLocaleString('es-CO')}`);
  }

  /**
   * Finalizar proceso
   */
  finalizarProceso(procesoId: string, estado: 'COMPLETADO' | 'ERROR' = 'COMPLETADO'): void {
    const proceso = this.procesosActivos.get(procesoId);
    if (!proceso) return;

    proceso.timestampFin = new Date();
    proceso.duracionTotalMs = proceso.timestampFin.getTime() - proceso.timestampInicio.getTime();
    proceso.estado = estado;

    // Guardar en archivo
    const archivo = path.join(this.procesosPath, `${procesoId}.json`);
    fs.writeFileSync(archivo, JSON.stringify(proceso, null, 2));

    console.log(`✅ Proceso ${procesoId} finalizado (${proceso.duracionTotalMs}ms) - Estado: ${estado}`);

    // Remover de activos
    this.procesosActivos.delete(procesoId);
  }

  /**
   * Obtener proceso completo por ID
   */
  obtenerProceso(procesoId: string): ProcesoAuditoria | null {
    // Primero buscar en activos
    if (this.procesosActivos.has(procesoId)) {
      return this.procesosActivos.get(procesoId)!;
    }

    // Buscar en archivos guardados
    const archivo = path.join(this.procesosPath, `${procesoId}.json`);
    if (fs.existsSync(archivo)) {
      const contenido = fs.readFileSync(archivo, 'utf-8');
      return JSON.parse(contenido);
    }

    return null;
  }

  /**
   * Obtener proceso por número de factura
   */
  obtenerProcesoPorFactura(numeroFactura: string): ProcesoAuditoria | null {
    // Buscar en activos
    for (const proceso of this.procesosActivos.values()) {
      if (proceso.numeroFactura === numeroFactura) {
        return proceso;
      }
    }

    // Buscar en archivos
    const archivos = fs.readdirSync(this.procesosPath);
    for (const archivo of archivos) {
      if (archivo.endsWith('.json')) {
        const contenido = fs.readFileSync(path.join(this.procesosPath, archivo), 'utf-8');
        const proceso: ProcesoAuditoria = JSON.parse(contenido);
        if (proceso.numeroFactura === numeroFactura) {
          return proceso;
        }
      }
    }

    return null;
  }

  /**
   * Generar resumen del proceso para mostrar en UI
   */
  generarResumen(procesoId: string): any {
    const proceso = this.obtenerProceso(procesoId);
    if (!proceso) return null;

    return {
      numeroFactura: proceso.numeroFactura,
      duracionTotal: proceso.duracionTotalMs,
      estado: proceso.estado,

      // Resumen de archivos
      archivos: {
        total: proceso.archivosOriginales.length,
        tamanoCombinado: proceso.archivosOriginales.reduce((sum, a) => sum + a.tamanoBytes, 0),
        tipos: [...new Set(proceso.archivosOriginales.map(a => a.tipo))],
      },

      // Resumen de extracción
      extraccion: {
        paginasProcesadas: proceso.imagenesProcessadas.length,
        camposExtraidos: proceso.decisionesCampos.length,
        camposConDiscrepancia: proceso.comparaciones.filter(c => c.metodos.length > 1).length,
        confianzaPromedio: proceso.decisionesCampos.length > 0
          ? Math.round(
              proceso.decisionesCampos.reduce((sum, d) => sum + d.confianzaFinal, 0) /
              proceso.decisionesCampos.length
            )
          : 0,
      },

      // Resumen de glosas
      glosas: {
        total: proceso.calculosGlosas.length,
        valorTotal: proceso.calculosGlosas.reduce((sum, g) => sum + g.valorGlosado, 0),
        tipos: [...new Set(proceso.calculosGlosas.map(g => g.tipo))],
      },

      // Decisión final
      decision: {
        veredicto: proceso.decisionFinalIA?.veredicto,
        valorAPagar: proceso.decisionFinalIA?.valorAPagar,
        valorGlosa: proceso.decisionFinalIA?.valorGlosa,
        confianza: proceso.decisionFinalIA?.confianza,
        correccionesRealizadas: proceso.decisionFinalIA?.correccionesRealizadas?.length || 0,
      },

      // Timeline de pasos
      timeline: proceso.pasos.map(p => ({
        tipo: p.tipo,
        descripcion: p.descripcion,
        timestamp: p.timestamp,
        duracion: p.duracionMs,
      })),
    };
  }
}

export default new AuditTrackerService();
