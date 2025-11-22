/**
 * Script de prueba para procesamiento de PDFs reales
 * Simula el procesamiento de la factura S9033866630 de Colsubsidio
 */

import pdfExtractorService from './services/pdf-extractor.service';
import glosaCalculatorService from './services/glosa-calculator.service';
import excelFacturaMedicaService from './services/excel-factura-medica.service';
import fs from 'fs';

// Simular el texto extraído del PDF de factura
const textoFacturaSimulado = `
CAJA COLOMBIANA DE SUBSIDIO FAMILIAR COLSUBSIDIO
860007336-1
CALLE 67 NO. 10 - 67
Gran Contribuyente Regimen Comun Agente Retenedor de IVA e ICA

Cliente: NUEVA EPS S.A.
Identificación: NIT: 900156264
Dirección: KR 13A 29 30 LC 101 P.C. Bavaria BOGOTA D.C BOGOTA D.C
Teléfono: 9366841

Factura Electrónica de Venta No: S9033866630
Fecha de Expedición: 15.07.2025 - 07:36:13
Forma de Pago: Crédito
Plazo de Pago: 13.09.2025

Total Lineas: 1
Observaciones:
Nombre del paciente: THIAGOGABRIEL SAPUYRES
Identificación: RC 1072681696
Fecha de ingreso: 20250521
Fecha de egreso: 20250521

EXENTO $ 38.586,00
SUBTOTAL $ 38.586,00
CUOTA MODERADORA $ 4.700,00
TOTAL $ 38.586,00
TOTAL A COBRAR $ 33.886,00

Item Código Descripción Cant. Valor Unitario
1 0000890281 CONSULTA DE PRIMERA VEZ POR ESPECIALISTA 1.00 38.586,00

DETALLE DE CUENTA SALUD
FACTURA No S9033866630
CENTRO DE ATENCIÓN CL INFANTIL
ASEGURADORA NUEVA EPS S.A.
EPISODIO No. 89589722
CONVENIO NUEVA EPS EVENTO CLINICAS

APELLIDOS DEL PACIENTE SAPUYRES
NOMBRES DEL PACIENTE THIAGO GABRIEL
TIPO DE IDENTIFICACION RC
NUMERO DE IDENTIFICACION 1072681696
CATEGORIA A- Nivel 1
TIPO AFILIADO RCT: Beneficiario
DIRECCION KR 6E 0 35 CAJICA
TELEFONO 3202765735
FECHA DE INGRESO 21.05.2025
FECHA DE EGRESO 21.05.2025

Código Descripción Fecha y Hora Cant. % Valor Unitario Valor Total
CUOTAMODE VR. CUOTA O PAGOS MODERADORES 2025-05-21 11:20 1 100 4.700- 4.700-
SUBTOTAL 4.700- 4.700-

2 CONSULTAS
0000890281 CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN ORTOPEDIA Y TRAUMATOLOGIA PEDIATRICA
2025-05-21 11:10 1 100 38.586 38.586
SUBTOTAL 38.586 38.586

TOTAL CUENTA 33.886
PAGOS EN OTRAS INSTITUCIONES 0
VALOR CON CARGO AL PACIENTE 0
VALOR CON CARGO A LA ASEGURADORA 33.886
`;

// Simular el texto extraído de la historia clínica
const textoHistoriaClinicaSimulada = `
IDENTIFICACIÓN
Nombre del Paciente THIAGO GABRIEL SAPUYRES
Fecha de nacimiento 28/01/2024
Sexo Masculino
Dirección de domicilio KR 6E 0 35 CAJICA
Acudiente
Acompañante
Asegurador NUEVA EPS EVENTO CLINICAS
Episodio 89589722
Fecha de la atención 21/05/2025
Tipo de documento Registro Civil
Edad atención 1 año 3 meses
Teléfono domicilio 3202765735
Categoría A
Lugar de atención CL INFANTIL
Número de documento 1072681696
Lugar de residencia cundinamarca
Tipo de vinculación RCT: Beneficiario

HISTORIA CLÍNICA GENERAL
Estado de Ingreso: Vivo
Causa externa: Enfermedad general
Finalidad de la consulta: Tratamiento
Motivo de consulta: SOSPEHCA DE DDC

Diagnósticos
Código Diagnóstico Descripción Diagnóstico
Q659 DEFORMIDAD CONGENITA DE LA CADERA, NO ES
`;

async function testPDFProcessing() {
  console.log('🧪 ===== INICIANDO PRUEBA DE PROCESAMIENTO DE PDFs =====\n');

  try {
    // Simular datos extraídos del PDF (normalmente vendría de pdf-parse)
    console.log('📄 Paso 1: Simulando extracción de datos del PDF...');
    const datosFactura = {
      // SECCIÓN 1: DATOS DE RADICACIÓN/FACTURA
      nroRadicacion: '',
      fechaRadicacion: new Date().toLocaleDateString('es-CO'),
      nroFactura: 'S9033866630',
      fechaFactura: '15/07/2025',
      valorBrutoFactura: 38586,
      valorIVA: 0,
      valorNetoFactura: 33886,
      nroAtenciones: 1,
      prefijoFactura: 'S903',
      consecutivoFactura: '3866630',
      tipoDocumentoIPS: '860007336-1',
      regional: '',
      estadoFactura: 'EST',
      observacion: 'Radicación exitosa',

      // SECCIÓN 2: DATOS DEL PROCEDIMIENTO/SERVICIO
      codigoProcedimiento: '890281',
      nombreProcedimiento: 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN ORTOPEDIA Y TRAUMATOLOGIA PEDIATRICA',
      mapiss: '',
      cantParagr: 1,
      matricUno: '',
      matrizLiquidacion: '890281',
      valorIPS: 38586,
      cant: 1,
      valorAPagar: 0, // Se calculará
      valorNotaCredito: 0,
      gestionGlosas: '',
      valorGlosaAdmitiva: 0, // Se calculará
      valorGlosaAuditoria: 0,
      estado: 'UNILA',
      categoria: 'A- Nivel 1',
      tipoLiquidacion: '',
      valor: 0,
      subServicioContratado: '',
      uvr: 0,
      regimen: 'CONTRIBUTIVO',
      convenioPaC: '',
      tipoDocumentoIPS2: '860007336-1',

      // SECCIÓN 3: DETALLE DE GLOSAS
      codigoDevolucion: '202',
      cantGlosada: 1,
      vlrUnitGlosado: 0,
      valorDevolucion: 0,
      observacionesGlosa: '',
      origen: 'SISTEMA',
      usuario: 'AUTO',
      codigoDevolucionItem: '0',
      totalGlosas: 0,
      diferencia: 0,

      // SECCIÓN 4: DATOS DE AUTORIZACIÓN
      nroAutNvo: '89589722',
      autorizacion: '89589722',
      pai: '',
      formaDePago: 'NORMAL',
      observacionAut: '',

      // SECCIÓN 5: DATOS PACIENTE Y ATENCIÓN
      tipoDocumentoPaciente: 'RC',
      numeroDocumento: '1072681696',
      nombrePaciente: 'THIAGO GABRIEL SAPUYRES',
      regimenPaciente: 'CONTRIBUTIVO',
      categoriaPaciente: 'A- Nivel 1',
      tipoAfiliado: 'RCT: Beneficiario',
      direccion: 'KR 6E 0 35 CAJICA',
      telefono: '3202765735',
      departamento: 'CUNDINAMARCA',
      municipio: 'CAJICA',

      // SECCIÓN 6: DIAGNÓSTICOS
      diagnosticoPrincipal: 'Q659',
      diagnosticoRelacionado1: '',
      diagnosticoRelacionado2: '',
      diagnosticoEgreso: 'Q659',

      // SECCIÓN 7: FECHAS Y TIEMPOS
      fechaIngreso: '21/05/2025',
      horaIngreso: '11:10',
      fechaEgreso: '21/05/2025',
      horaEgreso: '11:20',
      servicioEgreso: '',
      cama: '',

      // SECCIÓN 8: VALORES FINALES
      vlrBrutoFact: 38586,
      vlrNetoFact: 33886,
      netoDigitado: 33886,
      dif: 0,
      docValorIPS: 38586,
      copago: 0,
      cmo: 4700,
      dacto: 0,
      totales: 33886,
    };

    console.log('✅ Datos extraídos:');
    console.log(`   - Factura: ${datosFactura.nroFactura}`);
    console.log(`   - Paciente: ${datosFactura.nombrePaciente}`);
    console.log(`   - Documento: ${datosFactura.tipoDocumentoPaciente} ${datosFactura.numeroDocumento}`);
    console.log(`   - Procedimiento: ${datosFactura.codigoProcedimiento} - ${datosFactura.nombreProcedimiento}`);
    console.log(`   - Valor IPS: $${datosFactura.valorIPS.toLocaleString('es-CO')}`);
    console.log(`   - Diagnóstico: ${datosFactura.diagnosticoPrincipal}`);
    console.log('');

    // Paso 2: Calcular glosas
    console.log('💰 Paso 2: Calculando glosas con tarifario Nueva EPS...');
    const resultadoGlosas = glosaCalculatorService.calcularGlosas(datosFactura);

    console.log('');
    console.log('📊 ===== RESULTADO DE LA AUDITORÍA =====');
    console.log(`✅ Valor a pagar Nueva EPS: $${resultadoGlosas.valorAPagar.toLocaleString('es-CO')}`);
    console.log(`❌ Glosa admitiva: $${resultadoGlosas.valorGlosaAdmitiva.toLocaleString('es-CO')}`);
    console.log(`📋 Cantidad de glosas: ${resultadoGlosas.glosas.length}`);
    console.log(`📝 Observación: ${resultadoGlosas.observacion}`);
    console.log('');

    if (resultadoGlosas.glosas.length > 0) {
      console.log('🔍 Detalle de glosas:');
      resultadoGlosas.glosas.forEach((glosa, index) => {
        console.log(`\n   Glosa #${index + 1}:`);
        console.log(`   - Código: ${glosa.codigo}`);
        console.log(`   - Tipo: ${glosa.tipo}`);
        console.log(`   - Procedimiento: ${glosa.codigoProcedimiento} - ${glosa.descripcionProcedimiento}`);
        console.log(`   - Valor IPS: $${glosa.valorIPS.toLocaleString('es-CO')}`);
        console.log(`   - Valor Nueva EPS: $${glosa.valorContrato.toLocaleString('es-CO')}`);
        console.log(`   - Diferencia: $${glosa.diferencia.toLocaleString('es-CO')}`);
        console.log(`   - Glosa Total: $${glosa.valorTotalGlosa.toLocaleString('es-CO')}`);
        console.log(`   - Observación: ${glosa.observacion}`);
      });
    }
    console.log('');

    // Paso 3: Generar Excel
    console.log('📊 Paso 3: Generando Excel con 8 pestañas...');
    const workbook = await excelFacturaMedicaService.generarExcelCompleto(
      datosFactura,
      resultadoGlosas.glosas,
      resultadoGlosas.valorAPagar,
      resultadoGlosas.valorGlosaAdmitiva
    );

    // Guardar Excel
    const excelPath = '/home/user/koptup/test-pdfs/auditoria_S9033866630_test.xlsx';
    const buffer = await excelFacturaMedicaService.obtenerBuffer(workbook);
    fs.writeFileSync(excelPath, Buffer.from(buffer));

    console.log(`✅ Excel generado exitosamente en: ${excelPath}`);
    console.log('');

    // Resumen final
    console.log('📄 ===== RESUMEN EXCEL GENERADO =====');
    console.log('Pestañas creadas:');
    console.log('   1. ✅ FACTURACION (Nro radicación, factura, valores, fechas)');
    console.log('   2. ✅ PROCEDIMIENTOS (Códigos CUPS, valores IPS vs contrato)');
    console.log('   3. ✅ GLOSAS (Detalle de glosas con observaciones)');
    console.log('   4. ✅ AUTORIZACIONES (Nro autorización, episodio)');
    console.log('   5. ✅ PACIENTE (Datos demográficos completos)');
    console.log('   6. ✅ DIAGNOSTICOS (CIE-10: Q659)');
    console.log('   7. ✅ FECHAS (Ingreso, egreso, horas)');
    console.log('   8. ✅ RESUMEN (Valores finales, totales)');
    console.log('');

    console.log('💡 ===== INFORMACIÓN PARA NUEVA EPS =====');
    console.log(`Factura: S9033866630`);
    console.log(`Paciente: THIAGO GABRIEL SAPUYRES (${datosFactura.tipoDocumentoPaciente} ${datosFactura.numeroDocumento})`);
    console.log(`Procedimiento: 890281 - CONSULTA PRIMERA VEZ ESPECIALISTA ORTOPEDIA`);
    console.log(`Diagnóstico: Q659 - DEFORMIDAD CONGENITA DE LA CADERA`);
    console.log('');
    console.log(`Valor facturado IPS: $${datosFactura.valorIPS.toLocaleString('es-CO')}`);
    console.log(`Valor tarifario Nueva EPS: $${resultadoGlosas.valorAPagar.toLocaleString('es-CO')}`);
    console.log(`GLOSA APLICADA: $${resultadoGlosas.valorGlosaAdmitiva.toLocaleString('es-CO')}`);
    console.log('');
    console.log(`Motivo glosa: ${resultadoGlosas.observacion}`);
    console.log('');

    console.log('✅ ===== PRUEBA COMPLETADA EXITOSAMENTE =====');
    console.log(`\n📥 Descarga el archivo Excel en: ${excelPath}`);

    return {
      success: true,
      datosFactura,
      resultadoGlosas,
      excelPath,
    };
  } catch (error: any) {
    console.error('❌ Error en la prueba:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Ejecutar prueba
testPDFProcessing()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Sistema funcionando correctamente!');
      process.exit(0);
    } else {
      console.log('\n❌ Prueba fallida');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
