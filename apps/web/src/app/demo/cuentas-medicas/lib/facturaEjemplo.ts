/**
 * Factura de ejemplo (datos ficticios) que la demo genera en el navegador para
 * probar el flujo sin documentos reales. Se arma con texto seleccionable para
 * que el backend la lea igual que una factura en PDF:
 *  - cada fila de la tabla va en una sola línea: ITEM CÓDIGO DESCRIPCIÓN CANTIDAD
 *    VALOR_UNITARIO VALOR_TOTAL (el patrón que usa el backend para la tabla);
 *  - los datos generales van en líneas que el backend conserva al filtrar el
 *    texto (llevan "factura", números largos o valores).
 * Dos procedimientos superan el tarifario de ejemplo, así que el motor propone
 * dos glosas por diferencia de tarifa.
 */

export const NOMBRE_FACTURA_EJEMPLO = 'FACTURA_EJEMPLO_FEDL-10432.pdf';

interface Fila {
  codigo: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

const FILAS: Fila[] = [
  { codigo: '891201', descripcion: 'CONSULTA DE URGENCIAS MEDICINA GENERAL', cantidad: 1, valorUnitario: 52000 },
  { codigo: '871101', descripcion: 'RADIOGRAFIA DE TORAX', cantidad: 1, valorUnitario: 85000 },
  { codigo: '902210', descripcion: 'HEMOGRAMA', cantidad: 1, valorUnitario: 11200 },
  { codigo: '902212', descripcion: 'CREATININA', cantidad: 1, valorUnitario: 9500 },
  { codigo: '890301', descripcion: 'CONSULTA DE CONTROL O SEGUIMIENTO MEDICINA GENERAL', cantidad: 1, valorUnitario: 20000 },
];

/** Miles con punto, como se escriben los valores en las facturas colombianas. */
function miles(valor: number): string {
  return String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export async function generarFacturaEjemplo(): Promise<File> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const margen = 15;
  let y = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text('DOCUMENTO DE EJEMPLO - DATOS FICTICIOS - SIN VALIDEZ FISCAL', margen, y);
  y += 9;

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.text('CLÍNICA DEMO LOS ANDES S.A.S.', margen, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('NIT 901.234.567-8 (ficticio) - Calle 10 # 20-30, Medellín, Antioquia', margen, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FACTURA ELECTRÓNICA DE VENTA No. FEDL-10432', margen, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const generales = [
    'Fecha de la factura: 14/09/2026',
    'Pagador de la factura: EPS ANDINA DEMO - Contrato de ejemplo CE-2026-001',
    'Paciente: LAURA DEMO MARTÍNEZ   Documento: CC DEMO-1045237',
    'Diagnóstico principal de la factura (CIE-10): J18.9',
    'Autorización No. AUT-DEMO-55821',
  ];
  generales.forEach((linea) => {
    doc.text(linea, margen, y);
    y += 6;
  });
  y += 4;

  // Tabla en fuente monoespaciada: una línea de texto por fila.
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  const encabezado = `${'ITEM'.padEnd(5)}${'CODIGO'.padEnd(8)}${'DESCRIPCION'.padEnd(52)}${'CANT'.padStart(5)}${'VALOR UNIT.'.padStart(13)}${'VALOR TOTAL'.padStart(13)}`;
  doc.text(encabezado, margen, y);
  y += 2;
  doc.setDrawColor(156, 163, 175);
  doc.line(margen, y, 200, y);
  y += 5;

  doc.setFont('courier', 'normal');
  let total = 0;
  FILAS.forEach((fila, i) => {
    const valorTotal = fila.cantidad * fila.valorUnitario;
    total += valorTotal;
    const linea = `${String(i + 1).padEnd(5)}${fila.codigo.padEnd(8)}${fila.descripcion.padEnd(52)}${String(fila.cantidad).padStart(5)}${miles(fila.valorUnitario).padStart(13)}${miles(valorTotal).padStart(13)}`;
    doc.text(linea, margen, y);
    y += 5.5;
  });
  doc.line(margen, y - 2, 200, y - 2);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`VALOR TOTAL FACTURA $ ${miles(total)}`, margen, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'Generada por la demo "Sistema experto para salud" de KopTup. Prestador, pagador, paciente y valores son ficticios.',
    margen,
    y,
  );

  const blob = doc.output('blob');
  return new File([blob], NOMBRE_FACTURA_EJEMPLO, { type: 'application/pdf' });
}
