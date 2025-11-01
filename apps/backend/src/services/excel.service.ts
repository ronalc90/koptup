// Service for Excel generation - 5 essential sheets
import ExcelJS from 'exceljs';
import { MedicalDataExtraction } from './openai.service';
import { ValidationResult, GlosaResult } from './validation.service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

/**
 * Generate consolidated medical account Excel file with 5 sheets
 */
export async function generateConsolidatedExcel(
  extractions: MedicalDataExtraction[],
  cuentasMap: Map<string, string>,
  validations: ValidationResult[] = [],
  glosas: GlosaResult[] = [],
  outputDir = './uploads/exports'
): Promise<string> {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const workbook = new ExcelJS.Workbook();

    // ==================== HOJA 1: DATOS GENERALES ====================
    const ws1 = workbook.addWorksheet('1. Datos Generales');
    ws1.columns = [
      { header: 'Cuenta', key: 'cuenta_nombre', width: 30 },
      { header: 'Nro_Factura', key: 'nro_factura', width: 20 },
      { header: 'Fecha_Factura', key: 'fecha_factura', width: 15 },
      { header: 'IPS', key: 'ips', width: 40 },
      { header: 'Aseguradora', key: 'aseguradora', width: 40 },
      { header: 'Tipo_Doc', key: 'tipo_documento', width: 12 },
      { header: 'Numero_Documento', key: 'numero_documento', width: 20 },
      { header: 'Nombre_Paciente', key: 'nombre_completo', width: 40 },
      { header: 'Fecha_Nacimiento', key: 'fecha_nacimiento', width: 15 },
      { header: 'Sexo', key: 'sexo', width: 12 },
      { header: 'Edad', key: 'edad_atencion', width: 10 },
      { header: 'Regimen', key: 'regimen', width: 20 },
      { header: 'Fecha_Ingreso', key: 'fecha_ingreso', width: 18 },
      { header: 'Fecha_Egreso', key: 'fecha_egreso', width: 15 },
      { header: 'Servicio_Atencion', key: 'servicio_atencion', width: 30 },
      { header: 'Profesional_Tratante', key: 'profesional_tratante', width: 40 },
    ];

    // Header styling
    ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    extractions.forEach((ext) => {
      ws1.addRow({
        cuenta_nombre: cuentasMap.get(ext.cuenta_id) || ext.cuenta_id,
        nro_factura: ext.nro_factura || 'N/A',
        fecha_factura: ext.fecha_factura || '',
        ips: ext.ips || '',
        aseguradora: ext.aseguradora || '',
        tipo_documento: ext.tipo_documento || '',
        numero_documento: ext.numero_documento || '',
        nombre_completo: ext.nombre_completo || '',
        fecha_nacimiento: ext.fecha_nacimiento || '',
        sexo: ext.sexo || '',
        edad_atencion: ext.edad_atencion || '',
        regimen: ext.regimen || '',
        fecha_ingreso: ext.fecha_ingreso || '',
        fecha_egreso: ext.fecha_egreso || '',
        servicio_atencion: ext.servicio_atencion || '',
        profesional_tratante: ext.profesional_tratante || '',
      });
    });

    // ==================== HOJA 2: DIAGNÓSTICOS ====================
    const ws2 = workbook.addWorksheet('2. Diagnósticos');
    ws2.columns = [
      { header: 'Cuenta', key: 'cuenta_nombre', width: 30 },
      { header: 'Paciente', key: 'paciente', width: 40 },
      { header: 'Codigo_CIE10', key: 'codigo', width: 15 },
      { header: 'Descripcion', key: 'descripcion', width: 60 },
      { header: 'Tipo', key: 'tipo', width: 25 },
      { header: 'Principal', key: 'principal', width: 12 },
      { header: 'Confirmacion', key: 'confirmacion', width: 25 },
      { header: 'Responsable', key: 'responsable', width: 40 },
    ];

    ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };

    extractions.forEach((ext) => {
      const paciente = ext.nombre_completo || 'Sin nombre';
      const cuenta = cuentasMap.get(ext.cuenta_id) || ext.cuenta_id;

      if (ext.diagnosticos && ext.diagnosticos.length > 0) {
        ext.diagnosticos.forEach((diag) => {
          ws2.addRow({
            cuenta_nombre: cuenta,
            paciente: paciente,
            codigo: diag.codigo || '',
            descripcion: diag.descripcion || '',
            tipo: diag.tipo || '',
            principal: diag.principal ? 'Sí' : 'No',
            confirmacion: diag.confirmacion || '',
            responsable: diag.responsable || '',
          });
        });
      } else {
        // Empty row if no diagnostics
        ws2.addRow({
          cuenta_nombre: cuenta,
          paciente: paciente,
          codigo: 'Sin diagnósticos',
          descripcion: '',
          tipo: '',
          principal: '',
          confirmacion: '',
          responsable: '',
        });
      }
    });

    // ==================== HOJA 3: PROCEDIMIENTOS ====================
    const ws3 = workbook.addWorksheet('3. Procedimientos');
    ws3.columns = [
      { header: 'Cuenta', key: 'cuenta_nombre', width: 30 },
      { header: 'Paciente', key: 'paciente', width: 40 },
      { header: 'Codigo_CUPS', key: 'codigo_cups', width: 20 },
      { header: 'Descripcion', key: 'descripcion', width: 60 },
      { header: 'Fecha_Realizacion', key: 'fecha_realizacion', width: 18 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Valor_Unitario', key: 'valor_unitario', width: 18 },
      { header: 'Valor_Total', key: 'valor_total', width: 18 },
      { header: 'Profesional', key: 'profesional', width: 40 },
    ];

    ws3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws3.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' },
    };

    extractions.forEach((ext) => {
      const paciente = ext.nombre_completo || 'Sin nombre';
      const cuenta = cuentasMap.get(ext.cuenta_id) || ext.cuenta_id;

      if (ext.procedimientos && ext.procedimientos.length > 0) {
        ext.procedimientos.forEach((proc) => {
          ws3.addRow({
            cuenta_nombre: cuenta,
            paciente: paciente,
            codigo_cups: proc.codigo_cups || '',
            descripcion: proc.descripcion || '',
            fecha_realizacion: proc.fecha_realizacion || '',
            cantidad: proc.cantidad || 0,
            valor_unitario: proc.valor_unitario || 0,
            valor_total: proc.valor_total || 0,
            profesional: proc.profesional || '',
          });
        });
      } else {
        ws3.addRow({
          cuenta_nombre: cuenta,
          paciente: paciente,
          codigo_cups: 'Sin procedimientos',
          descripcion: '',
          fecha_realizacion: '',
          cantidad: 0,
          valor_unitario: 0,
          valor_total: 0,
          profesional: '',
        });
      }
    });

    // ==================== HOJA 4: AUTORIZACIONES ====================
    const ws4 = workbook.addWorksheet('4. Autorizaciones');
    ws4.columns = [
      { header: 'Cuenta', key: 'cuenta_nombre', width: 30 },
      { header: 'Paciente', key: 'paciente', width: 40 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Numero', key: 'numero', width: 25 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'PAC', key: 'pac', width: 20 },
      { header: 'Forma_Pago', key: 'forma_pago', width: 20 },
      { header: 'Observacion', key: 'observacion', width: 60 },
    ];

    ws4.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws4.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5B9BD5' },
    };

    extractions.forEach((ext) => {
      const paciente = ext.nombre_completo || 'Sin nombre';
      const cuenta = cuentasMap.get(ext.cuenta_id) || ext.cuenta_id;

      if (ext.autorizaciones && ext.autorizaciones.length > 0) {
        ext.autorizaciones.forEach((auth) => {
          ws4.addRow({
            cuenta_nombre: cuenta,
            paciente: paciente,
            tipo: auth.tipo || '',
            numero: auth.numero || '',
            fecha: auth.fecha || '',
            pac: auth.pac || '',
            forma_pago: auth.forma_pago || '',
            observacion: auth.observacion || '',
          });
        });
      } else {
        ws4.addRow({
          cuenta_nombre: cuenta,
          paciente: paciente,
          tipo: 'Sin autorizaciones',
          numero: '',
          fecha: '',
          pac: '',
          forma_pago: '',
          observacion: '',
        });
      }
    });

    // ==================== HOJA 5: VALIDACIONES Y GLOSAS ====================
    const ws5 = workbook.addWorksheet('5. Validaciones y Glosas');
    ws5.columns = [
      { header: 'Cuenta', key: 'cuenta_nombre', width: 30 },
      { header: 'Paciente', key: 'paciente', width: 40 },
      { header: 'Campo_Validado', key: 'campo', width: 25 },
      { header: 'Validacion', key: 'validacion', width: 50 },
      { header: 'Resultado', key: 'resultado', width: 15 },
      { header: 'Observacion', key: 'observacion', width: 150 }, // Increased for full RAG responses
    ];

    ws5.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws5.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7030A0' },
    };

    if (validations && validations.length > 0) {
      validations.forEach((val) => {
        const row = ws5.addRow({
          cuenta_nombre: val.cuenta_nombre,
          paciente: val.paciente,
          campo: val.campo,
          validacion: val.validacion,
          resultado: val.resultado,
          observacion: val.observacion,
        });

        // Enable text wrapping for observation cell
        const obsCell = row.getCell(6); // Observacion is column 6
        obsCell.alignment = { wrapText: true, vertical: 'top' };

        // Color coding
        const resultCell = row.getCell(5);
        if (val.resultado === 'APROBADO') {
          resultCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' },
          };
          resultCell.font = { color: { argb: 'FF006100' } };
        } else if (val.resultado === 'RECHAZADO') {
          resultCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' },
          };
          resultCell.font = { color: { argb: 'FF9C0006' } };
        } else if (val.resultado === 'ALERTA') {
          resultCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB9C' },
          };
          resultCell.font = { color: { argb: 'FF9C6500' } };
        }
      });
    } else {
      ws5.addRow({
        cuenta_nombre: 'Sin validaciones',
        paciente: '',
        campo: '',
        validacion: '',
        resultado: '',
        observacion: '',
      });
    }

    // Add glosa summary at the end
    if (glosas && glosas.length > 0) {
      ws5.addRow({}); // Empty row
      ws5.addRow({}); // Another empty row

      // Header row for glosas using EXISTING columns
      const glosaHeaderRow = ws5.addRow({
        cuenta_nombre: 'Tipo_Glosa',
        paciente: 'Codigo_Glosa',
        campo: 'Descripcion',
        validacion: 'Recomendacion',
        resultado: 'Severidad',
        observacion: 'Detalles Financieros',
      });
      glosaHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      glosaHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7030A0' },
      };

      // Add glosa rows using EXISTING column structure
      glosas.forEach((glosa) => {
        // Build financial details string if available
        let detallesFinancieros = '';
        if (glosa.valorCobrado !== undefined && glosa.valorCorrecto !== undefined && glosa.diferencia !== undefined) {
          detallesFinancieros = `CUPS: ${glosa.codigoCUPS || 'N/A'} | Cobrado: $${glosa.valorCobrado.toLocaleString()} | Correcto: $${glosa.valorCorrecto.toLocaleString()} | ${glosa.diferencia > 0 ? 'Devolver' : 'Cobrar'}: $${Math.abs(glosa.diferencia).toLocaleString()}`;
        }

        const gRow = ws5.addRow({
          cuenta_nombre: glosa.tipoGlosa || '',
          paciente: glosa.codigoGlosa || '',
          campo: glosa.descripcionGlosa || '',
          validacion: glosa.recomendacion || '',
          resultado: glosa.severidad,
          observacion: detallesFinancieros,
        });

        // Enable text wrapping for glosa text fields
        gRow.getCell(3).alignment = { wrapText: true, vertical: 'top' }; // descripcionGlosa
        gRow.getCell(4).alignment = { wrapText: true, vertical: 'top' }; // recomendacion
        gRow.getCell(6).alignment = { wrapText: true, vertical: 'top' }; // detallesFinancieros

        // Color code severity in the "resultado" column (column 5)
        const sevCell = gRow.getCell(5);
        if (glosa.severidad === 'ALTA') {
          sevCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF0000' },
          };
          sevCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        } else if (glosa.severidad === 'MEDIA') {
          sevCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' },
          };
        } else if (glosa.severidad === 'BAJA') {
          sevCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF92D050' },
          };
        }

        // Highlight financial details cell if there are monetary differences
        if (detallesFinancieros) {
          const detailsCell = gRow.getCell(6);
          detailsCell.font = { bold: true, color: { argb: 'FF0000FF' } };
        }
      });
    }

    // Save workbook
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `Cuentas_Medicas_${timestamp}.xlsx`;
    const outputPath = path.join(outputDir, filename);

    await workbook.xlsx.writeFile(outputPath);
    logger.info(`Excel file generated: ${outputPath}`);

    return outputPath;
  } catch (error: any) {
    logger.error('Error generating Excel:', error);
    throw new Error(`Failed to generate Excel: ${error.message}`);
  }
}
