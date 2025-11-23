import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import pdfExtractorService from '../services/pdf-extractor.service';
import glosaCalculatorService from '../services/glosa-calculator.service';
import excelFacturaMedicaService from '../services/excel-factura-medica.service';
import validacionDualService from '../services/validacion-dual.service';
import extraccionDualService from '../services/extraccion-dual.service';
import auditorIAFinalService from '../services/auditor-ia-final.service';

class AuditoriaMedicaController {
  /**
   * Procesar archivos PDF y crear factura con auditoría completa
   */
  procesarFacturasPDF = async (req: Request, res: Response) => {
    try {
      const { nombreCuenta } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos',
        });
      }

      console.log(`📂 Procesando ${files.length} archivos para cuenta: ${nombreCuenta}`);

      // 1. ANALIZAR TODOS LOS ARCHIVOS Y CLASIFICARLOS POR CONTENIDO
      console.log('📄 Paso 1: Analizando TODOS los archivos y extrayendo datos con IA...');

      const archivosFacturas: Array<{
        archivo: Express.Multer.File;
        resultado: any;
        datos: any;
      }> = [];
      const archivosHistoriaClinica: Express.Multer.File[] = [];
      const todosProcedimientos: any[] = [];
      const todosDiagnosticos: Set<string> = new Set();

      // Intentar extraer datos de TODOS los archivos
      for (const file of files) {
        try {
          console.log(`   📄 Analizando: ${file.originalname}`);
          const resultado = await extraccionDualService.extraerConDobleValidacion(file.path);

          // Clasificar según el contenido: Si tiene datos de factura, es una factura
          const tieneDatosFactura = resultado.datosFinales.nroFactura ||
                                    resultado.datosFinales.codigoProcedimiento ||
                                    resultado.datosFinales.valorIPS > 0;

          if (tieneDatosFactura) {
            console.log(`   ✅ FACTURA/PROCEDIMIENTO encontrado (factura=${resultado.datosFinales.nroFactura || 'N/A'}, procedimiento=${resultado.datosFinales.codigoProcedimiento || 'N/A'}, valor=${resultado.datosFinales.valorIPS})`);
            archivosFacturas.push({
              archivo: file,
              resultado: resultado,
              datos: resultado.datosFinales
            });

            // Agregar procedimiento a la lista consolidada
            if (resultado.datosFinales.codigoProcedimiento) {
              todosProcedimientos.push(resultado.datosFinales);
            }

            // Agregar diagnósticos a la lista consolidada
            if (resultado.datosFinales.diagnosticoPrincipal) {
              todosDiagnosticos.add(resultado.datosFinales.diagnosticoPrincipal);
            }
          } else {
            console.log(`   📋 Clasificado como HISTORIA CLÍNICA/SOPORTE`);
            archivosHistoriaClinica.push(file);
          }
        } catch (error: any) {
          console.log(`   ⚠️  Error al analizar ${file.originalname}: ${error.message}`);
          archivosHistoriaClinica.push(file);
        }
      }

      // Validar que se encontró al menos un archivo con datos de factura
      if (archivosFacturas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se encontraron datos de factura en ninguno de los archivos. Asegúrate de subir al menos un archivo con información de facturación.',
        });
      }

      console.log(`\n📊 Resumen de análisis:`);
      console.log(`   - Archivos con datos de factura/procedimientos: ${archivosFacturas.length}`);
      console.log(`   - Total procedimientos encontrados: ${todosProcedimientos.length}`);
      console.log(`   - Historias clínicas/soportes: ${archivosHistoriaClinica.length}`);

      // Usar la primera factura como base, pero consolidar datos de todas
      const facturaBase = archivosFacturas[0];
      const datosFactura = facturaBase.datos;
      const resultadoExtraccion = facturaBase.resultado;

      console.log('✅ Datos extraídos de la factura:');
      console.log(`   - Factura: ${datosFactura.nroFactura}`);
      console.log(`   - Paciente: ${datosFactura.nombrePaciente}`);
      console.log(`   - Procedimiento: ${datosFactura.codigoProcedimiento} - ${datosFactura.nombreProcedimiento}`);
      console.log(`   - Valor IPS: $${datosFactura.valorIPS.toLocaleString('es-CO')}`);
      console.log(`   - Diagnóstico: ${datosFactura.diagnosticoPrincipal}`);
      console.log(`   - Confianza IA: ${resultadoExtraccion.decision.nivelConfianza}%`);

      // 2. EXTRAER DATOS DE HISTORIA CLÍNICA (si existe)
      if (archivosHistoriaClinica.length > 0) {
        console.log('📋 Paso 2: Extrayendo datos de historia clínica...');
        const archivoHC = archivosHistoriaClinica[0];
        const datosHC = await pdfExtractorService.extraerDatosHistoriaClinica(archivoHC.path);

        // Complementar datos de la factura con la historia clínica
        if (datosHC.diagnosticoPrincipal && !datosFactura.diagnosticoPrincipal) {
          datosFactura.diagnosticoPrincipal = datosHC.diagnosticoPrincipal;
        }
        if (datosHC.autorizacion && !datosFactura.autorizacion) {
          datosFactura.autorizacion = datosHC.autorizacion;
        }
      }

      // 3. CALCULAR GLOSAS CON TARIFARIO NUEVA EPS
      console.log('💰 Paso 3: Calculando glosas con tarifario Nueva EPS...');
      const resultadoGlosas = glosaCalculatorService.calcularGlosas(datosFactura);

      console.log('📊 Resultado de la auditoría:');
      console.log(`   - Valor a pagar: $${resultadoGlosas.valorAPagar.toLocaleString('es-CO')}`);
      console.log(`   - Glosa admitiva: $${resultadoGlosas.valorGlosaAdmitiva.toLocaleString('es-CO')}`);
      console.log(`   - Cantidad de glosas: ${resultadoGlosas.glosas.length}`);
      console.log(`   - Observación: ${resultadoGlosas.observacion}`);

      // 3.5. 🤖 AUDITOR IA FINAL: TOMA LA DECISIÓN DEFINITIVA
      console.log('🤖 Paso 3.5: AUDITOR IA FINAL - Análisis y decisión definitiva...');

      // Preparar discrepancias para la IA
      const discrepancias = resultadoExtraccion.comparacion.camposComparados
        .filter(c => !c.coincide)
        .map(c => ({
          campo: c.campo,
          valorRegex: c.valorRegex,
          valorVision: c.valorVision,
        }));

      const decisionFinalIA = await auditorIAFinalService.tomarDecisionFinal({
        extraccionRegex: {
          datos: resultadoExtraccion.extraccionRegex,
          confianza: resultadoExtraccion.extraccionRegex.metadatos.confianza,
        },
        extraccionVision: {
          datos: resultadoExtraccion.extraccionVision,
          confianza: resultadoExtraccion.extraccionVision.metadatos.confianza,
        },
        discrepancias,
        sistemaExperto: {
          valorIPSFacturado: datosFactura.valorIPS || 0,
          valorContratoNuevaEPS: resultadoGlosas.valorAPagar,
          glosaCalculada: resultadoGlosas.valorGlosaAdmitiva,
          observacion: resultadoGlosas.observacion,
        },
        imagenPDFBase64: resultadoExtraccion.imagenPDFBase64,
      });

      // USAR LOS DATOS CONFIRMADOS POR LA IA (no los de extracción)
      const datosFinalesConfirmados = decisionFinalIA.datosConfirmados;

      // USAR LOS VALORES DECIDIDOS POR LA IA (no los del sistema experto)
      const valorFinalAPagar = decisionFinalIA.decisionFinal.valorAPagar;
      const valorFinalGlosa = decisionFinalIA.decisionFinal.valorGlosa;

      console.log('');
      console.log('✅ DECISIÓN FINAL TOMADA POR LA IA:');
      console.log(`   💵 Valor a pagar: $${valorFinalAPagar.toLocaleString('es-CO')}`);
      console.log(`   📉 Glosa: $${valorFinalGlosa.toLocaleString('es-CO')} (${decisionFinalIA.decisionFinal.porcentajeGlosa}%)`);
      console.log(`   🎯 Veredicto: ${decisionFinalIA.decisionFinal.veredicto}`);
      console.log(`   📊 Confianza IA: ${decisionFinalIA.metadatos.confianzaDecision}%`);
      console.log('');

      // 4. CREAR FACTURA EN LA BASE DE DATOS (CON VALORES DECIDIDOS POR LA IA)
      console.log('💾 Paso 4: Guardando en base de datos con valores confirmados por IA...');
      const numeroFactura = datosFinalesConfirmados.nroFactura || `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Mapear veredicto de IA a estado válido de Factura
      const mapearVeredictoAEstado = (veredicto: string): 'Radicada' | 'En Auditoría' | 'Auditada' | 'Glosada' | 'Aceptada' | 'Pagada' | 'Rechazada' => {
        const mappings: Record<string, 'Radicada' | 'En Auditoría' | 'Auditada' | 'Glosada' | 'Aceptada' | 'Pagada' | 'Rechazada'> = {
          'APROBADO': 'Aceptada',
          'REQUIERE_REVISION_HUMANA': 'En Auditoría',
          'RECHAZADO': 'Rechazada',
          'GLOSADO': 'Glosada',
        };
        return mappings[veredicto] || 'En Auditoría';
      };

      const estadoFactura = mapearVeredictoAEstado(decisionFinalIA.decisionFinal.veredicto);

      // Mapear tipo de glosa a valores válidos del schema
      const mapearTipoGlosa = (tipoOriginal: string): 'Tarifa' | 'Soporte' | 'Pertinencia' | 'Duplicidad' | 'Autorización' | 'Facturación' | 'Otro' => {
        const mappings: Record<string, 'Tarifa' | 'Soporte' | 'Pertinencia' | 'Duplicidad' | 'Autorización' | 'Facturación' | 'Otro'> = {
          'DIFERENCIA_TARIFA': 'Tarifa',
          'FALTA_SOPORTE': 'Soporte',
          'FALTA_PERTINENCIA': 'Pertinencia',
          'DUPLICIDAD': 'Duplicidad',
          'FALTA_AUTORIZACION': 'Autorización',
          'ERROR_FACTURACION': 'Facturación',
        };
        return mappings[tipoOriginal] || 'Otro';
      };

      // Verificar si MongoDB está conectado
      const mongoose = require('mongoose');
      const mongoConnected = mongoose.connection.readyState === 1;

      let factura: any;
      let atencion: any;
      let procedimiento: any;

      if (!mongoConnected) {
        console.log('⚠️  MongoDB no conectado - continuando sin guardar en DB');
        // Crear objetos mock para continuar con el proceso (usando valores de IA)
        factura = {
          _id: `TEMP-${Date.now()}`,
          numeroFactura,
          valorBruto: datosFinalesConfirmados.valorIPS || 0,
          valorTotal: datosFinalesConfirmados.valorIPS || 0,
          totalGlosas: valorFinalGlosa,
          valorAceptado: valorFinalAPagar,
          estado: estadoFactura,
          auditoriaCompletada: !decisionFinalIA.decisionFinal.requiereRevisionHumana,
          observacionesIA: decisionFinalIA.decisionFinal.justificacion.resumenEjecutivo,
        };

        atencion = {
          numeroAtencion: datosFinalesConfirmados.nroAutNvo || `AT-${Date.now()}`,
          paciente: {
            nombres: datosFinalesConfirmados.nombrePaciente?.split(' ').slice(0, 2).join(' ') || '',
            apellidos: datosFinalesConfirmados.nombrePaciente?.split(' ').slice(2).join(' ') || '',
            tipoDocumento: datosFinalesConfirmados.tipoDocumentoPaciente,
            numeroDocumento: datosFinalesConfirmados.numeroDocumento,
          },
          diagnosticoPrincipal: {
            codigoCIE10: datosFinalesConfirmados.diagnosticoPrincipal,
          },
        };

        procedimiento = {
          codigoCUPS: datosFinalesConfirmados.codigoProcedimiento,
          descripcion: datosFinalesConfirmados.nombreProcedimiento,
          valorUnitarioIPS: datosFinalesConfirmados.valorIPS,
          valorUnitarioContrato: valorFinalAPagar,
          diferenciaTarifa: (datosFinalesConfirmados.valorIPS || 0) - valorFinalAPagar,
        };
      } else {
        // Verificar si ya existe factura con ese número y agregar sufijo si es necesario
        let numeroFacturaFinal = numeroFactura;
        const facturaExistente = await Factura.findOne({ numeroFactura: numeroFacturaFinal });
        if (facturaExistente) {
          console.log(`⚠️  Factura ${numeroFacturaFinal} ya existe. Agregando sufijo...`);
          numeroFacturaFinal = `${numeroFacturaFinal}-${Date.now()}`;
        }

        factura = new Factura({
          numeroFactura: numeroFacturaFinal,
          fechaEmision: this.parsearFecha(datosFinalesConfirmados.fechaFactura) || new Date(),
          fechaRadicacion: this.parsearFecha(datosFinalesConfirmados.fechaRadicacion) || new Date(),
          ips: {
            nit: datosFinalesConfirmados.tipoDocumentoIPS || '860007336-1',
            nombre: 'COLSUBSIDIO',
            codigo: datosFinalesConfirmados.tipoDocumentoIPS?.split('-')[0] || '',
          },
          eps: {
            nit: '900156264',
            nombre: 'NUEVA EPS',
            codigo: 'NUEVAEPS',
          },
          numeroContrato: 'NUEVA EPS EVENTO CLINICAS',
          regimen: datosFinalesConfirmados.regimen || 'Contributivo',
          valorBruto: datosFinalesConfirmados.valorIPS || 0,
          iva: datosFinalesConfirmados.valorIVA || 0,
          valorTotal: datosFinalesConfirmados.valorIPS || 0,
          estado: estadoFactura,
          auditoriaCompletada: !decisionFinalIA.decisionFinal.requiereRevisionHumana,
          fechaAuditoria: new Date(),
          totalGlosas: valorFinalGlosa,
          valorAceptado: valorFinalAPagar,
          observaciones: `${decisionFinalIA.decisionFinal.justificacion.resumenEjecutivo}\n\nFundamento Médico: ${decisionFinalIA.decisionFinal.justificacion.fundamentoMedico}\n\nFundamento Financiero: ${decisionFinalIA.decisionFinal.justificacion.fundamentoFinanciero}`,
        });

        await factura.save();
        console.log(`✅ Factura guardada con ID: ${factura._id}`);

        // 5. CREAR ATENCIÓN
        atencion = new Atencion({
          facturaId: factura._id,
          numeroAtencion: datosFactura.nroAutNvo || `AT-${Date.now()}`,
          numeroAutorizacion: datosFactura.autorizacion || '',
          fechaAutorizacion: this.parsearFecha(datosFactura.fechaIngreso) || new Date(),
          paciente: {
            tipoDocumento: datosFactura.tipoDocumentoPaciente || 'RC',
            numeroDocumento: datosFactura.numeroDocumento || '',
            nombres: datosFactura.nombrePaciente?.split(' ').slice(0, 2).join(' ') || '',
            apellidos: datosFactura.nombrePaciente?.split(' ').slice(2).join(' ') || '',
            edad: this.calcularEdad(datosFactura.fechaIngreso) || 1,
            sexo: 'M',
          },
          diagnosticoPrincipal: {
            codigoCIE10: datosFactura.diagnosticoPrincipal || '',
            descripcion: this.obtenerDescripcionCIE10(datosFactura.diagnosticoPrincipal),
          },
          diagnosticosSecundarios: [],
          fechaInicio: this.parsearFecha(datosFactura.fechaIngreso) || new Date(),
          fechaFin: this.parsearFecha(datosFactura.fechaEgreso) || new Date(),
          copago: datosFactura.copago || 0,
          cuotaModeradora: datosFactura.cmo || 0,
          procedimientos: [],
          soportes: [],
          tieneAutorizacion: !!datosFactura.autorizacion,
          autorizacionValida: !!datosFactura.autorizacion,
          pertinenciaValidada: true,
        });

        await atencion.save();
        console.log(`✅ Atención guardada con ID: ${atencion._id}`);

        // 6. CREAR PROCEDIMIENTO
        procedimiento = new Procedimiento({
          atencionId: atencion._id,
          facturaId: factura._id,
          codigoCUPS: datosFactura.codigoProcedimiento || datosFactura.matrizLiquidacion,
          descripcion: datosFactura.nombreProcedimiento || '',
          tipoManual: 'CUPS',
          cantidad: datosFactura.cant || 1,
          valorUnitarioIPS: datosFactura.valorIPS,
          valorTotalIPS: datosFactura.valorIPS * (datosFactura.cant || 1),
          valorUnitarioContrato: resultadoGlosas.valorAPagar,
          valorTotalContrato: resultadoGlosas.valorAPagar * (datosFactura.cant || 1),
          valorAPagar: resultadoGlosas.valorAPagar,
          diferenciaTarifa: datosFactura.valorIPS - resultadoGlosas.valorAPagar,
          glosas: [],
          totalGlosas: resultadoGlosas.valorGlosaAdmitiva,
          glosaAdmitida: resultadoGlosas.valorGlosaAdmitiva > 0,
          tarifaValidada: true,
          pertinenciaValidada: true,
          duplicado: false,
        });

        await procedimiento.save();
        console.log(`✅ Procedimiento guardado con ID: ${procedimiento._id}`);

        // 7. CREAR GLOSAS
        for (const glosaData of resultadoGlosas.glosas) {
          const glosa = new Glosa({
            facturaId: factura._id,
            procedimientoId: procedimiento._id,
            atencionId: atencion._id,
            tipo: mapearTipoGlosa(glosaData.tipo),
            codigo: glosaData.codigo,
            descripcion: glosaData.observacion,
            valorGlosado: glosaData.valorTotalGlosa,
            estado: 'Pendiente',
            generadaAutomaticamente: glosaData.automatica,
            fechaGeneracion: new Date(),
            justificacion: glosaData.observacion,
            requiereSoporte: false,
          });

          await glosa.save();
          procedimiento.glosas.push(glosa._id);
        }

        await procedimiento.save();
        console.log(`✅ ${resultadoGlosas.glosas.length} glosa(s) creada(s)`);

        // 8. ACTUALIZAR REFERENCIAS
        atencion.procedimientos = [procedimiento._id];
        await atencion.save();

        factura.atenciones = [atencion._id];
        await factura.save();
      } // Cerrar el else de mongoConnected

      // 9. GENERAR EXCEL DE AUDITORÍA
      console.log('📊 Paso 5: Generando Excel de auditoría...');
      const workbook = await excelFacturaMedicaService.generarExcelCompleto(
        datosFactura,
        resultadoGlosas.glosas,
        resultadoGlosas.valorAPagar,
        resultadoGlosas.valorGlosaAdmitiva
      );

      // Guardar Excel temporalmente para descarga
      const excelBuffer = await excelFacturaMedicaService.obtenerBuffer(workbook);

      // Crear carpeta si no existe
      const uploadsDir = path.join(process.cwd(), 'uploads', 'cuentas-medicas');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const excelPath = path.join(uploadsDir, `auditoria_${factura._id}.xlsx`);
      fs.writeFileSync(excelPath, Buffer.from(excelBuffer));

      console.log(`✅ Excel generado en: ${excelPath}`);

      // RESPUESTA FINAL
      return res.status(201).json({
        success: true,
        message: 'Factura procesada y auditada exitosamente',
        data: {
          factura: {
            _id: factura._id,
            numeroFactura: factura.numeroFactura,
            valorBruto: factura.valorBruto,
            valorTotal: factura.valorTotal,
            totalGlosas: factura.totalGlosas,
            valorAceptado: factura.valorAceptado,
            estado: factura.estado,
            auditoriaCompletada: factura.auditoriaCompletada,
          },
          atencion: {
            numeroAtencion: atencion.numeroAtencion,
            paciente: atencion.paciente,
            diagnostico: atencion.diagnosticoPrincipal,
          },
          procedimiento: {
            codigoCUPS: procedimiento.codigoCUPS,
            descripcion: procedimiento.descripcion,
            valorIPS: procedimiento.valorUnitarioIPS,
            valorContrato: procedimiento.valorUnitarioContrato,
            diferencia: procedimiento.diferenciaTarifa,
          },
          glosas: resultadoGlosas.glosas.map((g) => ({
            codigo: g.codigo,
            tipo: g.tipo,
            valor: g.valorTotalGlosa,
            observacion: g.observacion,
          })),
          excel: {
            path: `uploads/cuentas-medicas/auditoria_${factura._id}.xlsx`,
            filename: `auditoria_${factura._id}.xlsx`,
          },
          archivosProcessed: {
            facturas: archivosFacturas.length,
            procedimientos: todosProcedimientos.length,
            historiaClinica: archivosHistoriaClinica.length,
            total: files.length,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Error procesando factura:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar archivos',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * Descargar Excel de auditoría de una factura
   */
  descargarExcelAuditoria = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Buscar factura
      const factura = await Factura.findById(id);
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada',
        });
      }

      // Buscar atención y procedimientos
      const atencion = await Atencion.findOne({ facturaId: id }).populate('procedimientos');
      const procedimientos = await Procedimiento.find({ facturaId: id }).populate('glosas');
      const glosas = await Glosa.find({ facturaId: id });

      if (!atencion || procedimientos.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Datos de factura incompletos',
        });
      }

      // Reconstruir DatosFacturaPDF para generar Excel
      const datosFactura: any = {
        nroFactura: factura.numeroFactura,
        fechaFactura: factura.fechaEmision?.toLocaleDateString('es-CO') || '',
        fechaRadicacion: factura.fechaRadicacion?.toLocaleDateString('es-CO') || '',
        valorBrutoFactura: factura.valorBruto,
        valorIVA: factura.iva,
        valorNetoFactura: factura.valorTotal,
        tipoDocumentoIPS: factura.ips.nit,
        nombrePaciente: `${atencion.paciente.nombres} ${atencion.paciente.apellidos}`,
        numeroDocumento: atencion.paciente.numeroDocumento,
        tipoDocumentoPaciente: atencion.paciente.tipoDocumento,
        diagnosticoPrincipal: atencion.diagnosticoPrincipal.codigoCIE10,
        codigoProcedimiento: procedimientos[0].codigoCUPS,
        nombreProcedimiento: procedimientos[0].descripcion,
        valorIPS: procedimientos[0].valorUnitarioIPS,
        cant: procedimientos[0].cantidad,
        regimen: factura.regimen,
        autorizacion: atencion.numeroAutorizacion,
        fechaIngreso: atencion.fechaInicio?.toLocaleDateString('es-CO') || '',
        fechaEgreso: atencion.fechaFin?.toLocaleDateString('es-CO') || '',
        cmo: atencion.cuotaModeradora,
        copago: atencion.copago,
        vlrBrutoFact: factura.valorBruto,
        vlrNetoFact: factura.valorTotal,
        netoDigitado: factura.valorTotal,
        dif: 0,
        docValorIPS: factura.valorBruto,
        dacto: 0,
        totales: factura.valorTotal,
      };

      // Convertir glosas
      const glosasFormateadas = glosas.map((g: any) => ({
        codigo: g.codigo,
        tipo: g.tipo,
        codigoProcedimiento: procedimientos[0].codigoCUPS,
        descripcionProcedimiento: procedimientos[0].descripcion,
        valorIPS: procedimientos[0].valorUnitarioIPS,
        valorContrato: procedimientos[0].valorUnitarioContrato,
        diferencia: g.valorGlosado,
        cantidad: procedimientos[0].cantidad,
        valorTotalGlosa: g.valorGlosado,
        observacion: g.descripcion,
        automatica: g.esAutomatica,
      }));

      // Generar Excel
      const workbook = await excelFacturaMedicaService.generarExcelCompleto(
        datosFactura,
        glosasFormateadas,
        factura.valorAceptado,
        factura.totalGlosas
      );

      const buffer = await excelFacturaMedicaService.obtenerBuffer(workbook);

      // Enviar archivo
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Auditoria_NuevaEPS_${factura.numeroFactura}_${Date.now()}.xlsx`
      );

      return res.send(buffer);
    } catch (error: any) {
      console.error('Error generando Excel:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar Excel',
        error: error.message,
      });
    }
  }

  /**
   * Parsear fecha en formato DD/MM/YYYY o similar a Date
   */
  private parsearFecha(fechaStr: string): Date | null {
    if (!fechaStr) return null;

    try {
      const partes = fechaStr.split(/[\/\-\.]/);
      if (partes.length === 3) {
        // Asumir DD/MM/YYYY
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1; // Meses en JS son 0-11
        const anio = parseInt(partes[2]);

        return new Date(anio, mes, dia);
      }
    } catch (error) {
      console.warn(`No se pudo parsear fecha: ${fechaStr}`);
    }

    return null;
  }

  /**
   * Calcular edad aproximada desde una fecha
   */
  private calcularEdad(fechaStr: string): number {
    const fecha = this.parsearFecha(fechaStr);
    if (!fecha) return 0;

    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = fecha.getMonth();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < fecha.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Obtener descripción de un código CIE-10 (simplificado)
   */
  private obtenerDescripcionCIE10(codigo: string): string {
    const descripciones: Record<string, string> = {
      Q659: 'DEFORMIDAD CONGENITA DE LA CADERA, NO ESPECIFICADA',
      J00: 'Rinofaringitis aguda [resfriado común]',
      J18: 'Neumonía, organismo no especificado',
      J189: 'Neumonía no especificada',
      // Agregar más según necesidad
    };

    return descripciones[codigo] || `Diagnóstico ${codigo}`;
  }
}

export default new AuditoriaMedicaController();
