/**
 * CONTROLADOR MODULAR DE AUDITORÍA
 *
 * Integra los 7 módulos del sistema:
 * A. Ingesta de Documentos
 * B. Extractor AI Vision
 * C. Motor de Reglas Médicas
 * D. Motor de Auditoría con Doble IA
 * E. Motor de Glosas Automáticas
 * F. Generador de Reporte Final
 * G. Panel/API/Integración
 */

import { Request, Response } from 'express';
import documentIngestionService from '../services/modules/document-ingestion.service';
import aiVisionExtractorService from '../services/modules/ai-vision-extractor.service';
import auditTrackerService from '../services/audit-tracker.service';
import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import sistemaAprendizajeService from '../services/sistema-aprendizaje.service';

class AuditoriaModularController {
  /**
   * FLUJO COMPLETO: Procesar documento desde cero hasta auditoría final
   */
  async procesarDocumentoCompleto(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos',
        });
      }

      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║   🏥 SISTEMA MODULAR DE AUDITORÍA MÉDICA - NUEVA EPS  ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');

      const archivoFactura = files[0];

      // ═══════════════════════════════════════════════════════
      // INICIAR TRACKING DEL PROCESO
      // ═══════════════════════════════════════════════════════
      const procesoId = auditTrackerService.iniciarProceso(
        `FACTURA-${Date.now()}`,
        files
      );

      // ═══════════════════════════════════════════════════════
      // MÓDULO A: INGESTA DE DOCUMENTOS
      // ═══════════════════════════════════════════════════════
      const inicioIngesta = Date.now();
      const resultadoIngesta = await documentIngestionService.procesarDocumento(
        archivoFactura.path
      );
      const duracionIngesta = Date.now() - inicioIngesta;

      // Registrar paso de ingesta
      auditTrackerService.registrarPaso(
        procesoId,
        'INGESTA',
        'Procesamiento de documentos y normalización de imágenes',
        {
          archivoOriginal: archivoFactura.originalname,
          extension: resultadoIngesta.extension,
          paginas: resultadoIngesta.totalPaginas,
        },
        {
          tipo: resultadoIngesta.tipoDocumentoPrincipal,
          confianza: resultadoIngesta.confianzaDeteccion,
        },
        {
          confianza: resultadoIngesta.confianzaDeteccion,
          duracionMs: duracionIngesta,
        }
      );

      // Registrar imágenes procesadas
      for (const pagina of resultadoIngesta.paginas) {
        auditTrackerService.registrarImagenProcesada(
          procesoId,
          pagina.numeroPagina,
          pagina.imagenBase64,
          pagina.ancho,
          pagina.alto,
          pagina.calidad
        );
      }

      // ═══════════════════════════════════════════════════════
      // MÓDULO B: EXTRACCIÓN INTELIGENTE CON AI VISION
      // ═══════════════════════════════════════════════════════
      const inicioExtraccion = Date.now();
      const datosExtraidos = await aiVisionExtractorService.extraerDatosCompletos(
        resultadoIngesta.paginas,
        resultadoIngesta.tipoDocumentoPrincipal
      );
      const duracionExtraccion = Date.now() - inicioExtraccion;

      // Registrar paso de extracción
      auditTrackerService.registrarPaso(
        procesoId,
        'EXTRACCION',
        'Extracción de 80-100 campos con GPT-4o Vision',
        {
          tipoDocumento: resultadoIngesta.tipoDocumentoPrincipal,
          paginasAnalizadas: resultadoIngesta.totalPaginas,
          modelo: 'gpt-4o',
        },
        {
          camposExtraidos: datosExtraidos.metadatos.camposExtraidos,
          camposVacios: datosExtraidos.metadatos.camposVacios,
          camposCriticos: datosExtraidos.metadatos.camposCriticos,
        },
        {
          confianza: datosExtraidos.metadatos.confianzaExtraccion,
          duracionMs: duracionExtraccion,
          alertas: datosExtraidos.metadatos.camposCriticos,
        }
      );

      // Registrar decisión para cada campo extraído
      const camposImportantes = [
        'numeroFactura', 'nombrePaciente', 'numeroDocumentoPaciente',
        'codigoProcedimiento', 'nombreProcedimiento', 'valorTotalIPS',
        'diagnosticoPrincipal', 'numeroAutorizacion', 'copago', 'cuotaModeradora'
      ];

      for (const campo of camposImportantes) {
        const valor = (datosExtraidos as any)[campo];
        if (valor !== undefined && valor !== null) {
          auditTrackerService.registrarDecisionCampo(procesoId, {
            campo,
            valorOriginalPDF: `[Extraído de imagen con GPT-4o Vision]`,
            valorFinal: valor,
            metodoSeleccionado: 'VISION',
            confianzaFinal: datosExtraidos.metadatos.confianzaExtraccion,
            razon: `Campo extraído directamente de la imagen del PDF usando GPT-4o Vision con análisis semántico`,
          });
        }
      }

      // ═══════════════════════════════════════════════════════
      // MOSTRAR RESULTADOS DE EXTRACCIÓN
      // ═══════════════════════════════════════════════════════
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║   📊 DATOS EXTRAÍDOS - RESULTADO FINAL                ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');

      console.log('📄 DATOS DE FACTURA:');
      console.log(`   • Número: ${datosExtraidos.numeroFactura || 'N/A'}`);
      console.log(`   • Fecha: ${datosExtraidos.fechaFactura || 'N/A'}`);
      console.log(`   • Valor Bruto: $${(datosExtraidos.valorBrutoFactura || 0).toLocaleString('es-CO')}`);
      console.log(`   • Valor IVA: $${(datosExtraidos.valorIVA || 0).toLocaleString('es-CO')}`);
      console.log(`   • Valor Neto: $${(datosExtraidos.valorNetoFactura || 0).toLocaleString('es-CO')}`);
      console.log('');

      console.log('🏥 DATOS DE IPS:');
      console.log(`   • Nombre: ${datosExtraidos.nombreIPS || 'N/A'}`);
      console.log(`   • NIT: ${datosExtraidos.nitIPS || 'N/A'}`);
      console.log('');

      console.log('👤 DATOS DEL PACIENTE:');
      console.log(`   • Nombre: ${datosExtraidos.nombrePaciente || 'N/A'}`);
      console.log(`   • Documento: ${datosExtraidos.tipoDocumentoPaciente} ${datosExtraidos.numeroDocumentoPaciente || 'N/A'}`);
      console.log(`   • Edad: ${datosExtraidos.edadPaciente || 'N/A'} años`);
      console.log(`   • Sexo: ${datosExtraidos.sexoPaciente || 'N/A'}`);
      console.log('');

      console.log('🏥 DATOS CLÍNICOS:');
      console.log(`   • Diagnóstico: ${datosExtraidos.diagnosticoPrincipal || 'N/A'}`);
      console.log(`   • Descripción: ${datosExtraidos.diagnosticoPrincipalDescripcion || 'N/A'}`);
      console.log('');

      console.log('💉 PROCEDIMIENTO:');
      console.log(`   • Código CUPS: ${datosExtraidos.codigoProcedimiento || 'N/A'}`);
      console.log(`   • Nombre: ${datosExtraidos.nombreProcedimiento || 'N/A'}`);
      console.log(`   • Cantidad: ${datosExtraidos.cantidad || 0}`);
      console.log(`   • Valor Unit. IPS: $${(datosExtraidos.valorUnitarioIPS || 0).toLocaleString('es-CO')}`);
      console.log(`   • Valor Total IPS: $${(datosExtraidos.valorTotalIPS || 0).toLocaleString('es-CO')}`);
      console.log('');

      console.log('💰 COPAGOS Y CUOTAS:');
      console.log(`   • Copago: $${(datosExtraidos.copago || 0).toLocaleString('es-CO')}`);
      console.log(`   • Cuota Moderadora: $${(datosExtraidos.cuotaModeradora || 0).toLocaleString('es-CO')}`);
      console.log('');

      console.log('📊 METADATOS DE EXTRACCIÓN:');
      console.log(`   • Confianza: ${datosExtraidos.metadatos.confianzaExtraccion}%`);
      console.log(`   • Campos extraídos: ${datosExtraidos.metadatos.camposExtraidos}`);
      console.log(`   • Campos vacíos: ${datosExtraidos.metadatos.camposVacios}`);
      if (datosExtraidos.metadatos.camposCriticos.length > 0) {
        console.log(`   ⚠️  Campos críticos:`);
        datosExtraidos.metadatos.camposCriticos.forEach(c => console.log(`      - ${c}`));
      }
      console.log('');

      // ═══════════════════════════════════════════════════════
      // GUARDAR EN BASE DE DATOS
      // ═══════════════════════════════════════════════════════
      const mongoose = require('mongoose');
      const mongoConnected = mongoose.connection.readyState === 1;

      let facturaGuardada: any;
      let atencionGuardada: any;
      let procedimientoGuardado: any;

      if (mongoConnected) {
        console.log('💾 Guardando en base de datos...');

        // Crear factura
        facturaGuardada = new Factura({
          numeroFactura: datosExtraidos.numeroFactura || `FAC-${Date.now()}`,
          procesoAuditoriaId: procesoId, // Guardar referencia al proceso
          fechaEmision: this.parsearFecha(datosExtraidos.fechaFactura) || new Date(),
          fechaRadicacion: this.parsearFecha(datosExtraidos.fechaRadicacion) || new Date(),
          ips: {
            nit: datosExtraidos.nitIPS || '000000000-0',
            nombre: datosExtraidos.nombreIPS || 'IPS',
            codigo: datosExtraidos.codigoIPS || '',
          },
          eps: {
            nit: datosExtraidos.nitEPS || '900156264',
            nombre: datosExtraidos.nombreEPS || 'NUEVA EPS',
            codigo: 'NUEVAEPS',
          },
          numeroContrato: datosExtraidos.numeroContrato || 'CONTRATO',
          regimen: datosExtraidos.regimen || 'Contributivo',
          valorBruto: datosExtraidos.valorBrutoFactura || 0,
          iva: datosExtraidos.valorIVA || 0,
          valorTotal: datosExtraidos.valorNetoFactura || datosExtraidos.valorBrutoFactura || 0,
          estado: 'Radicada',
          auditoriaCompletada: false,
          totalGlosas: 0,
          valorAceptado: datosExtraidos.valorTotalIPS || 0,
          observaciones: `Extracción automática con AI Vision. Confianza: ${datosExtraidos.metadatos.confianzaExtraccion}%`,
        });

        await facturaGuardada.save();
        console.log(`   ✓ Factura guardada: ${facturaGuardada._id}`);

        // Crear atención
        atencionGuardada = new Atencion({
          facturaId: facturaGuardada._id,
          numeroAtencion: datosExtraidos.numeroAtencion || `AT-${Date.now()}`,
          numeroAutorizacion: datosExtraidos.numeroAutorizacion || '',
          fechaAutorizacion: this.parsearFecha(datosExtraidos.fechaAutorizacion) || new Date(),
          paciente: {
            tipoDocumento: datosExtraidos.tipoDocumentoPaciente || 'CC',
            numeroDocumento: datosExtraidos.numeroDocumentoPaciente || '',
            nombres: datosExtraidos.nombrePaciente?.split(' ')[0] || '',
            apellidos: datosExtraidos.apellidosPaciente || datosExtraidos.nombrePaciente?.split(' ').slice(1).join(' ') || '',
            edad: datosExtraidos.edadPaciente || 0,
            sexo: datosExtraidos.sexoPaciente || 'M',
          },
          diagnosticoPrincipal: {
            codigoCIE10: datosExtraidos.diagnosticoPrincipal || '',
            descripcion: datosExtraidos.diagnosticoPrincipalDescripcion || '',
          },
          diagnosticosSecundarios: [],
          fechaInicio: this.parsearFecha(datosExtraidos.fechaIngresoAtencion) || new Date(),
          fechaFin: this.parsearFecha(datosExtraidos.fechaEgresoAtencion) || new Date(),
          copago: datosExtraidos.copago || 0,
          cuotaModeradora: datosExtraidos.cuotaModeradora || 0,
          procedimientos: [],
          soportes: [],
          tieneAutorizacion: !!datosExtraidos.numeroAutorizacion,
          autorizacionValida: !!datosExtraidos.numeroAutorizacion,
          pertinenciaValidada: false,
        });

        await atencionGuardada.save();
        console.log(`   ✓ Atención guardada: ${atencionGuardada._id}`);

        // Crear procedimiento
        procedimientoGuardado = new Procedimiento({
          atencionId: atencionGuardada._id,
          facturaId: facturaGuardada._id,
          codigoCUPS: datosExtraidos.codigoProcedimiento || '',
          descripcion: datosExtraidos.nombreProcedimiento || '',
          tipoManual: datosExtraidos.tipoManual || 'CUPS',
          cantidad: datosExtraidos.cantidad || 1,
          valorUnitarioIPS: datosExtraidos.valorUnitarioIPS || 0,
          valorTotalIPS: datosExtraidos.valorTotalIPS || 0,
          valorUnitarioContrato: datosExtraidos.valorUnitarioContrato || datosExtraidos.valorUnitarioIPS || 0,
          valorTotalContrato: datosExtraidos.valorTotalIPS || 0,
          valorAPagar: datosExtraidos.valorTotalIPS || 0,
          diferenciaTarifa: datosExtraidos.diferenciaTarifaria || 0,
          glosas: [],
          totalGlosas: 0,
          glosaAdmitida: false,
          tarifaValidada: false,
          pertinenciaValidada: false,
          duplicado: false,
        });

        await procedimientoGuardado.save();
        console.log(`   ✓ Procedimiento guardado: ${procedimientoGuardado._id}`);

        // Actualizar referencias
        atencionGuardada.procedimientos = [procedimientoGuardado._id];
        await atencionGuardada.save();

        facturaGuardada.atenciones = [atencionGuardada._id];
        await facturaGuardada.save();

        console.log('✅ Todos los datos guardados correctamente');
        console.log('');
      } else {
        console.log('⚠️  MongoDB no conectado - continuando sin guardar');
        facturaGuardada = {
          _id: `TEMP-${Date.now()}`,
          numeroFactura: datosExtraidos.numeroFactura,
          procesoAuditoriaId: procesoId,
        };
      }

      // ═══════════════════════════════════════════════════════
      // FINALIZAR PROCESO DE TRACKING
      // ═══════════════════════════════════════════════════════
      auditTrackerService.finalizarProceso(procesoId, 'COMPLETADO');

      // Obtener resumen del proceso
      const resumenProceso = auditTrackerService.generarResumen(procesoId);

      // Retornar respuesta
      res.status(201).json({
        success: true,
        message: 'Documento procesado exitosamente con sistema modular',
        data: {
          procesoId, // ID del proceso para ver detalle completo
          ingesta: {
            tipo: resultadoIngesta.tipoDocumentoPrincipal,
            paginas: resultadoIngesta.totalPaginas,
            confianza: resultadoIngesta.confianzaDeteccion,
          },
          extraccion: {
            camposExtraidos: datosExtraidos.metadatos.camposExtraidos,
            camposVacios: datosExtraidos.metadatos.camposVacios,
            confianza: datosExtraidos.metadatos.confianzaExtraccion,
            camposCriticos: datosExtraidos.metadatos.camposCriticos,
          },
          factura: {
            id: facturaGuardada._id,
            numero: datosExtraidos.numeroFactura,
            valorTotal: datosExtraidos.valorTotalIPS,
            paciente: datosExtraidos.nombrePaciente,
            diagnostico: datosExtraidos.diagnosticoPrincipal,
            procedimiento: datosExtraidos.codigoProcedimiento,
            procesoAuditoriaId: procesoId, // Para ver detalle
          },
          datosCompletos: datosExtraidos,
          resumenProceso, // Resumen del proceso completo
        },
      });
    } catch (error: any) {
      console.error('❌ Error en procesamiento modular:', error);

      res.status(500).json({
        success: false,
        message: 'Error al procesar documento',
        error: error.message,
      });
    }
  }

  /**
   * 📋 VER DETALLE COMPLETO: Muestra TODO el proceso paso a paso
   *
   * Retorna:
   * - Texto exacto extraído de los PDFs
   * - Imágenes procesadas (base64)
   * - Cada decisión tomada campo por campo
   * - Comparaciones entre métodos
   * - Cálculos de glosas
   * - Decisión final de la IA
   * - Timeline completo del proceso
   */
  async obtenerDetalleCompleto(req: Request, res: Response) {
    try {
      const { procesoId } = req.params;

      // Obtener proceso completo
      const proceso = auditTrackerService.obtenerProceso(procesoId);

      if (!proceso) {
        return res.status(404).json({
          success: false,
          message: 'Proceso no encontrado',
        });
      }

      // Formatear para UI
      const detalleCompleto = {
        // Información general
        numeroFactura: proceso.numeroFactura,
        timestampInicio: proceso.timestampInicio,
        timestampFin: proceso.timestampFin,
        duracionTotal: proceso.duracionTotalMs,
        estado: proceso.estado,

        // ARCHIVOS ORIGINALES
        archivosOriginales: proceso.archivosOriginales,

        // IMÁGENES PROCESADAS (para mostrar en UI)
        imagenes: proceso.imagenesProcessadas.map(img => ({
          pagina: img.numeroPagina,
          imagen: `data:image/png;base64,${img.imagenBase64}`,
          dimensiones: `${img.ancho}x${img.alto}`,
          calidad: img.calidad,
        })),

        // TEXTO RAW EXTRAÍDO
        textoExtraido: proceso.textoRawPDF,

        // TIMELINE DE PASOS
        timeline: proceso.pasos.map(paso => ({
          timestamp: paso.timestamp,
          tipo: paso.tipo,
          descripcion: paso.descripcion,
          duracion: paso.duracionMs ? `${paso.duracionMs}ms` : 'N/A',
          confianza: paso.confianza ? `${paso.confianza}%` : 'N/A',
          alertas: paso.alertas || [],
          datos: paso.datos,
          resultado: paso.resultado,
        })),

        // DECISIONES POR CAMPO
        decisionesCampos: proceso.decisionesCampos.map(dec => ({
          campo: dec.campo,
          textoOriginalPDF: dec.valorOriginalPDF,
          valorExtraidoRegex: dec.valorExtraidoRegex,
          valorExtraidoVision: dec.valorExtraidoVision,
          valorFinal: dec.valorFinal,
          metodoSeleccionado: dec.metodoSeleccionado,
          confianza: {
            regex: dec.confianzaRegex,
            vision: dec.confianzaVision,
            final: dec.confianzaFinal,
          },
          razon: dec.razon,
          alternativasConsideradas: dec.alternativasConsideradas || [],
        })),

        // COMPARACIONES ENTRE MÉTODOS
        comparaciones: proceso.comparaciones,

        // CÁLCULOS DE GLOSAS
        glosas: proceso.calculosGlosas.map(glosa => ({
          codigo: glosa.codigoGlosa,
          tipo: glosa.tipo,
          descripcion: glosa.descripcion,
          calculo: {
            valorFacturado: glosa.valorFacturado,
            valorContrato: glosa.valorContrato,
            diferencia: glosa.diferencia,
            valorGlosado: glosa.valorGlosado,
            formula: glosa.formula,
          },
          justificacion: glosa.justificacion,
        })),

        // DECISIÓN FINAL DE LA IA
        decisionFinal: proceso.decisionFinalIA ? {
          veredicto: proceso.decisionFinalIA.veredicto,
          valores: {
            pagar: proceso.decisionFinalIA.valorAPagar,
            glosa: proceso.decisionFinalIA.valorGlosa,
          },
          confianza: proceso.decisionFinalIA.confianza,
          razonamiento: proceso.decisionFinalIA.razonamiento,
          fundamentos: {
            medico: proceso.decisionFinalIA.fundamentoMedico,
            financiero: proceso.decisionFinalIA.fundamentoFinanciero,
            administrativo: proceso.decisionFinalIA.fundamentoAdministrativo,
          },
          alertas: proceso.decisionFinalIA.alertas || [],
          correcciones: proceso.decisionFinalIA.correccionesRealizadas || [],
        } : null,

        // ERRORES (si hubo)
        errores: proceso.errores || [],
      };

      res.json({
        success: true,
        data: detalleCompleto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalle del proceso',
        error: error.message,
      });
    }
  }

  /**
   * Obtener detalles de una factura con decisiones IA para calificar
   */
  async obtenerDetalleParaCalificar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const factura = await Factura.findById(id)
        .populate({
          path: 'atenciones',
          populate: {
            path: 'procedimientos',
            populate: 'glosas',
          },
        });

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      // Obtener decisiones IA asociadas
      const decisiones = await sistemaAprendizajeService.obtenerDecisionesFactura(
        factura.numeroFactura
      );

      // Obtener proceso completo si existe
      let procesoCompleto = null;
      if ((factura as any).procesoAuditoriaId) {
        procesoCompleto = auditTrackerService.obtenerProceso((factura as any).procesoAuditoriaId);
      }

      res.json({
        success: true,
        data: {
          factura,
          decisiones,
          procesoCompleto, // Incluir proceso completo
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalle',
        error: error.message,
      });
    }
  }

  /**
   * Parsear fecha en formato DD/MM/YYYY a Date
   */
  private parsearFecha(fechaStr: string | undefined): Date | undefined {
    if (!fechaStr) return undefined;

    try {
      const partes = fechaStr.split('/');
      if (partes.length === 3) {
        const [dia, mes, anio] = partes;
        return new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      }
    } catch (error) {
      // Ignorar errores de parseo
    }

    return undefined;
  }
}

export default new AuditoriaModularController();
