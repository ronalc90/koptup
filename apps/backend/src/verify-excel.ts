/**
 * Script para verificar que el Excel generado tiene las 8 pestañas con los datos correctos
 */
import ExcelJS from 'exceljs';

async function verificarExcel() {
  console.log('📊 ===== VERIFICANDO EXCEL GENERADO =====\n');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/home/user/koptup/test-pdfs/auditoria_S9033866630_test.xlsx');

  console.log(`✅ Excel cargado exitosamente`);
  console.log(`📄 Número de pestañas: ${workbook.worksheets.length}\n`);

  // Verificar cada pestaña
  const pestañasEsperadas = [
    'FACTURACION',
    'PROCEDIMIENTOS',
    'GLOSAS',
    'AUTORIZACIONES',
    'PACIENTE',
    'DIAGNOSTICOS',
    'FECHAS',
    'RESUMEN',
  ];

  console.log('🔍 Verificando pestañas:\n');

  pestañasEsperadas.forEach((nombreEsperado, index) => {
    const worksheet = workbook.worksheets[index];
    if (worksheet && worksheet.name === nombreEsperado) {
      const rowCount = worksheet.rowCount;
      const columnCount = worksheet.columnCount;
      console.log(`   ${index + 1}. ✅ ${nombreEsperado}`);
      console.log(`      - Filas: ${rowCount}`);
      console.log(`      - Columnas: ${columnCount}`);

      // Mostrar algunos datos de la pestaña
      if (rowCount > 0) {
        const headerRow = worksheet.getRow(1);
        const headers = headerRow.values as any[];
        console.log(`      - Encabezados: ${headers.filter(h => h).slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`);

        // Si hay datos, mostrar la primera fila de datos
        if (rowCount > 1) {
          const dataRow = worksheet.getRow(2);
          const firstValue = dataRow.getCell(1).value;
          console.log(`      - Primer valor: ${firstValue}`);
        }
      }
      console.log('');
    } else {
      console.log(`   ${index + 1}. ❌ ${nombreEsperado} - NO ENCONTRADA o NOMBRE INCORRECTO`);
      console.log(`      Encontrada: ${worksheet?.name || 'N/A'}\n`);
    }
  });

  // Verificar datos específicos en PROCEDIMIENTOS
  console.log('💰 Verificando datos en PROCEDIMIENTOS:');
  const procSheet = workbook.getWorksheet('PROCEDIMIENTOS');
  if (procSheet) {
    // Acceder por índice de columna (1-based index)
    // Columnas: 1=Codigo_Procedimiento, 7=Valor_IPS, 9=Valor_a_Pagar, 12=Valor_Glosa_Admitiva
    const valorIPSCell = procSheet.getRow(2).getCell(7);
    const valorAPagarCell = procSheet.getRow(2).getCell(9);
    const valorGlosaCell = procSheet.getRow(2).getCell(12);

    console.log(`   - Valor IPS: $${valorIPSCell.value}`);
    console.log(`   - Valor a Pagar Nueva EPS: $${valorAPagarCell.value}`);
    console.log(`   - Glosa Admitiva: $${valorGlosaCell.value}`);

    const glosaCalculada = Number(valorIPSCell.value) - Number(valorAPagarCell.value);
    if (glosaCalculada === Number(valorGlosaCell.value)) {
      console.log(`   ✅ Cálculo de glosa CORRECTO: ${valorIPSCell.value} - ${valorAPagarCell.value} = ${glosaCalculada}`);
    } else {
      console.log(`   ❌ Cálculo de glosa INCORRECTO: esperado ${glosaCalculada}, obtenido ${valorGlosaCell.value}`);
    }
  }
  console.log('');

  // Verificar datos específicos en GLOSAS
  console.log('📋 Verificando datos en GLOSAS:');
  const glosasSheet = workbook.getWorksheet('GLOSAS');
  if (glosasSheet) {
    // Columnas: 1=Codigo_Devolucion, 4=Valor_devolucion, 5=Observaciones_Glosa
    const codigoCell = glosasSheet.getRow(2).getCell(1);
    const valorDevCell = glosasSheet.getRow(2).getCell(4);
    const obsCell = glosasSheet.getRow(2).getCell(5);

    console.log(`   - Código Devolución: ${codigoCell.value}`);
    console.log(`   - Valor Devolución: $${valorDevCell.value}`);
    const obs = String(obsCell.value);
    console.log(`   - Observación: ${obs.substring(0, 100)}${obs.length > 100 ? '...' : ''}`);
  }
  console.log('');

  // Verificar datos del paciente
  console.log('👤 Verificando datos en PACIENTE:');
  const pacSheet = workbook.getWorksheet('PACIENTE');
  if (pacSheet) {
    // Columnas: 1=Tipo_Documento_Paciente, 2=Numero_Documento, 3=Nombre_Paciente
    const tipoDocCell = pacSheet.getRow(2).getCell(1);
    const docCell = pacSheet.getRow(2).getCell(2);
    const nombreCell = pacSheet.getRow(2).getCell(3);

    console.log(`   - Nombre: ${nombreCell.value}`);
    console.log(`   - Documento: ${tipoDocCell.value} ${docCell.value}`);
  }
  console.log('');

  // Verificar diagnóstico
  console.log('🏥 Verificando datos en DIAGNOSTICOS:');
  const diagSheet = workbook.getWorksheet('DIAGNOSTICOS');
  if (diagSheet) {
    // Columna: 1=Diagnostico_Principal
    const diagCell = diagSheet.getRow(2).getCell(1);
    console.log(`   - Diagnóstico Principal: ${diagCell.value}`);
  }
  console.log('');

  console.log('✅ ===== VERIFICACIÓN COMPLETADA =====');
}

verificarExcel()
  .then(() => {
    console.log('\n✅ Excel verificado exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al verificar Excel:', error);
    process.exit(1);
  });
