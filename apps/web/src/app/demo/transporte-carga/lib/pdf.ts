import jsPDF from 'jspdf';
import type { GuiaRemision, Factura, Cliente, Conductor, Vehiculo } from '../types';
import { formatPEN, formatFecha, formatRuc, formatPlaca, formatNumero } from './format';

export interface DescargarOpciones {
  abrir?: boolean;
  nombreArchivo?: string;
}

/**
 * Convierte números a letras en español (hasta 9,999,999)
 * Ejemplo: 1183.50 => "MIL CIENTO OCHENTA Y TRES CON 50/100 SOLES"
 */
export function numeroALetras(num: number, moneda = 'SOLES'): string {
  const unidades = [
    '',
    'UNO',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
  ];
  const decenas = [
    '',
    'DIEZ',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const dieciséis = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISéIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const centenas = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertirBloque(n: number): string {
    let resultado = '';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      if (c === 1 && d === 0 && u === 0) {
        resultado += 'CIEN ';
      } else {
        resultado += centenas[c] + ' ';
      }
    }

    if (d === 1) {
      resultado += dieciséis[u];
    } else {
      if (d > 0) {
        resultado += decenas[d];
        if (u > 0) resultado += ' Y ';
      }
      if (u > 0) {
        resultado += unidades[u];
      }
    }

    return resultado.trim();
  }

  if (num === 0) return 'CERO ' + moneda;

  const partes = num.toString().split('.');
  const entero = parseInt(partes[0], 10);
  const decimales = partes[1] ? partes[1].padEnd(2, '0').substring(0, 2) : '00';

  let letras = '';

  // Millones
  const millones = Math.floor(entero / 1000000);
  if (millones > 0) {
    if (millones === 1) {
      letras += 'UN MILLÓN ';
    } else {
      letras += convertirBloque(millones) + ' MILLONES ';
    }
  }

  // Miles
  const miles = Math.floor((entero % 1000000) / 1000);
  if (miles > 0) {
    if (miles === 1) {
      letras += 'MIL ';
    } else {
      letras += convertirBloque(miles) + ' MIL ';
    }
  }

  // Unidades
  const unidadesNum = entero % 1000;
  if (unidadesNum > 0) {
    letras += convertirBloque(unidadesNum) + ' ';
  }

  letras = letras.trim();
  if (letras === '') letras = 'CERO';

  return `${letras} CON ${decimales}/100 ${moneda}`;
}

/**
 * Genera un PDF de Guía de Remisión (formato A4, una página)
 */
export function generarPdfGuiaRemision(
  guia: GuiaRemision,
  ctx: { conductor?: Conductor; vehiculo?: Vehiculo; cliente?: Cliente }
): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'A4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const colWidth = (pageWidth - margin * 2 - 4) / 2; // 4 es espacio entre columnas

  let y = margin;

  // === HEADER ===
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('TRANSPORTES DEMO S.A.C.', margin, y);
  y += 5;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text('RUC: 20505000999', margin, y);
  y += 4;
  doc.text('Av. Industrial 123, Lima, Lima, Perú', margin, y);
  y += 7;

  // === TÍTULO ===
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('GUÍA DE REMISIÓN ELECTRÓNICA', margin, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(guia.tipoGuia === 'transportista' ? 'TRANSPORTISTA' : 'REMITENTE', margin, y);

  // === NÚMERO GRANDE ===
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  const numeroText = guia.numero;
  doc.text(numeroText, pageWidth - margin - 50, margin + 8);

  y += 15;

  // === SECCIÓN REMITENTE / DESTINATARIO (DOS COLUMNAS) ===
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('REMITENTE:', margin, y);
  doc.text('DESTINATARIO:', margin + colWidth + 2, y);
  y += 5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text(`${guia.remitente.razonSocial}`, margin, y, { maxWidth: colWidth });
  doc.text(`${guia.destinatario.razonSocial}`, margin + colWidth + 2, y, {
    maxWidth: colWidth,
  });
  y += 5;

  doc.text(
    `Doc: ${guia.remitente.tipoDoc === '6' ? 'RUC' : 'DNI'} ${formatRuc(guia.remitente.numeroDoc)}`,
    margin,
    y,
    { maxWidth: colWidth }
  );
  doc.text(
    `Doc: ${guia.destinatario.tipoDoc === '6' ? 'RUC' : 'DNI'} ${formatRuc(guia.destinatario.numeroDoc)}`,
    margin + colWidth + 2,
    y,
    { maxWidth: colWidth }
  );
  y += 5;

  doc.text(`${guia.remitente.direccion}`, margin, y, { maxWidth: colWidth });
  doc.text(`${guia.destinatario.direccion}`, margin + colWidth + 2, y, {
    maxWidth: colWidth,
  });
  y += 7;

  // === PUNTO DE PARTIDA / LLEGADA ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('PUNTO DE PARTIDA:', margin, y);
  doc.text('PUNTO DE LLEGADA:', margin + colWidth + 2, y);
  y += 5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text(`${guia.origen.direccion}`, margin, y, { maxWidth: colWidth });
  doc.text(`${guia.destino.direccion}`, margin + colWidth + 2, y, {
    maxWidth: colWidth,
  });
  y += 5;

  doc.text(`UBIGEO: ${guia.origen.ubigeo}`, margin, y, { maxWidth: colWidth });
  doc.text(`UBIGEO: ${guia.destino.ubigeo}`, margin + colWidth + 2, y, {
    maxWidth: colWidth,
  });
  y += 8;

  // === DATOS DE TRANSPORTE ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DE TRANSPORTE:', margin, y);
  y += 5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  if (ctx.vehiculo) {
    doc.text(`Placa: ${formatPlaca(ctx.vehiculo.placa)}`, margin, y);
    y += 4;
    doc.text(`Marca: ${ctx.vehiculo.marca} | Modelo: ${ctx.vehiculo.modelo}`, margin, y);
    y += 4;
    doc.text(`Año: ${ctx.vehiculo.anio} | Capacidad: ${formatNumero(ctx.vehiculo.capacidadKg)} kg`, margin, y);
  }
  y += 5;

  if (ctx.conductor) {
    doc.text(`Conductor: ${ctx.conductor.nombres} ${ctx.conductor.apellidos}`, margin, y);
    y += 4;
    doc.text(`DNI: ${ctx.conductor.dni} | Licencia: ${ctx.conductor.licencia}`, margin, y);
  }
  y += 8;

  // === TABLA DE MERCANCÍA ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPCIÓN DE MERCANCÍA:', margin, y);
  y += 5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);

  // Encabezados de tabla
  const tableX = margin;
  const col1 = 100; // Descripción
  const col2 = 20; // Peso
  const col3 = 20; // Bultos

  doc.setFont(undefined, 'bold');
  doc.text('Descripción', tableX, y);
  doc.text('Peso (kg)', tableX + col1, y);
  doc.text('Bultos', tableX + col1 + col2, y);

  doc.line(tableX, y + 2, pageWidth - margin, y + 2);
  y += 5;

  doc.setFont(undefined, 'normal');
  doc.text(guia.descripcionMercancia, tableX, y, { maxWidth: col1 - 2 });
  doc.text(formatNumero(guia.pesoTotalKg), tableX + col1, y);
  doc.text(guia.bultos.toString(), tableX + col1 + col2, y);
  y += 6;

  doc.line(tableX, y, pageWidth - margin, y);
  y += 5;

  // === INFORMACIÓN ADICIONAL ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(8);
  doc.text('Motivo de Traslado: ' + (guia.motivoTraslado || 'Venta'), margin, y);
  y += 4;

  if (guia.observaciones) {
    doc.text('Observaciones: ' + guia.observaciones, margin, y, { maxWidth: pageWidth - margin * 2 });
    y += 4;
  }

  y += 2;

  // === FOOTER CON HASH ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(7);
  if (guia.hash) {
    const hashText = `Hash: ${guia.hash.substring(0, 32)}...`;
    doc.text(hashText, margin, pageHeight - margin - 5);
  }

  return doc;
}

/**
 * Genera un PDF de Factura (formato A4)
 */
export function generarPdfFactura(factura: Factura, ctx: { cliente: Cliente }): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'A4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  let y = margin;

  // === HEADER CON EMISOR ===
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('TRANSPORTES DEMO S.A.C.', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('RUC: 20505000999', margin, y);
  y += 3;
  doc.text('Av. Industrial 123, Lima, Lima, Perú', margin, y);
  y += 8;

  // === TÍTULO FACTURA EN RECUADRO ===
  const titleX = pageWidth / 2 - 30;
  const titleY = y - 3;
  doc.setDrawColor(0, 0, 0);
  doc.rect(titleX - 2, titleY - 4, 60, 10);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('FACTURA ELECTRÓNICA', titleX, titleY + 2, { align: 'center' });

  doc.setFontSize(10);
  doc.text(factura.numero, titleX, titleY + 6, { align: 'center' });

  y += 12;

  // === DATOS DEL CLIENTE ===
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('CLIENTE:', margin, y);
  y += 4;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text(`${ctx.cliente.razonSocial}`, margin, y);
  y += 3;
  doc.text(
    `${ctx.cliente.tipoDoc === '6' ? 'RUC' : 'DNI'}: ${formatRuc(ctx.cliente.numeroDoc)}`,
    margin,
    y
  );
  y += 3;
  doc.text(`Dirección: ${ctx.cliente.direccion}`, margin, y);
  y += 6;

  // === FECHA ===
  doc.setFont(undefined, 'bold');
  doc.text(`Fecha: ${formatFecha(factura.fechaEmision)}`, margin, y);
  y += 6;

  // === TABLA DE ITEMS ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(8);

  const col1X = margin; // Item
  const col2X = col1X + 8; // Descripción
  const col3X = col2X + 60; // Unidad
  const col4X = col3X + 12; // Cantidad
  const col5X = col4X + 12; // Valor Unit
  const col6X = col5X + 15; // Importe

  doc.text('Item', col1X, y);
  doc.text('Descripción', col2X, y);
  doc.text('Unidad', col3X, y);
  doc.text('Cantidad', col4X, y);
  doc.text('Valor Unit', col5X, y);
  doc.text('Importe', col6X, y);

  doc.line(margin, y + 1, pageWidth - margin, y + 1);
  y += 4;

  doc.setFont(undefined, 'normal');
  factura.items.forEach((item, idx) => {
    doc.text((idx + 1).toString(), col1X, y);
    doc.text(item.descripcion, col2X, y, { maxWidth: 58 });
    doc.text(item.unidad, col3X, y);
    doc.text(formatNumero(item.cantidad), col4X, y, { align: 'right' });
    doc.text(formatPEN(item.valorUnitario), col5X, y, { align: 'right' });
    doc.text(formatPEN(item.total), col6X, y, { align: 'right' });
    y += 3;
  });

  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // === TOTALES ===
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text('Subtotal:', col5X, y, { align: 'right' });
  doc.text(formatPEN(factura.subtotal), col6X, y, { align: 'right' });
  y += 4;

  doc.text('IGV (18%):', col5X, y, { align: 'right' });
  doc.text(formatPEN(factura.igv), col6X, y, { align: 'right' });
  y += 4;

  if (factura.detraccion && factura.detraccion.aplica) {
    doc.setFontSize(8);
    doc.text('Detracción:', col5X, y, { align: 'right' });
    doc.text(formatPEN(factura.detraccion.monto), col6X, y, { align: 'right' });
    y += 4;
  }

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.rect(col5X - 15, y - 3, 20, 5);
  doc.text('TOTAL:', col5X, y, { align: 'right' });
  doc.text(formatPEN(factura.total), col6X, y, { align: 'right' });
  y += 7;

  // === IMPORTE EN LETRAS ===
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Son:', margin, y);
  y += 1;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  const enLetras = numeroALetras(factura.total);
  doc.text(enLetras, margin + 8, y, { maxWidth: pageWidth - margin * 2 - 8 });
  y += 5;

  // === BLOQUE DETRACCIÓN (SI APLICA) ===
  if (factura.detraccion && factura.detraccion.aplica) {
    doc.setDrawColor(200, 0, 0);
    doc.setFillColor(255, 240, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 15, 'FD');

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(200, 0, 0);
    doc.text('RÉGIMEN DE DETRACCIÓN', margin + 2, y + 4);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Porcentaje: ${factura.detraccion.porcentaje}% | Monto: ${formatPEN(factura.detraccion.monto)}`,
      margin + 2,
      y + 8
    );
    doc.text(
      `Cuenta BN: ${factura.detraccion.cuenta} | Código: ${factura.detraccion.codigo}`,
      margin + 2,
      y + 12
    );

    y += 18;
  }

  // === OBSERVACIONES ===
  if (factura.observaciones) {
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.text('Observaciones:', margin, y);
    y += 3;

    doc.setFont(undefined, 'normal');
    doc.text(factura.observaciones, margin, y, { maxWidth: pageWidth - margin * 2 });
    y += 4;
  }

  // === FOOTER HASH ===
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  if (factura.hash) {
    const hashPreview = factura.hash.substring(0, 40) + '...';
    doc.text(`Hash: ${hashPreview}`, margin, pageHeight - margin);
  }

  return doc;
}

/**
 * Descarga el PDF de la guía de remisión
 */
export function descargarPdfGuia(
  guia: GuiaRemision,
  ctx: { conductor?: Conductor; vehiculo?: Vehiculo; cliente?: Cliente },
  opts?: DescargarOpciones
): void {
  const doc = generarPdfGuiaRemision(guia, ctx);
  const nombreArchivo = opts?.nombreArchivo || `GR-${guia.numero.replace('/', '-')}.pdf`;
  doc.save(nombreArchivo);

  if (opts?.abrir) {
    const url = doc.output('bloburl');
    if (typeof url === 'string') {
      window.open(url);
    }
  }
}

/**
 * Descarga el PDF de la factura
 */
export function descargarPdfFactura(
  factura: Factura,
  ctx: { cliente: Cliente },
  opts?: DescargarOpciones
): void {
  const doc = generarPdfFactura(factura, ctx);
  const nombreArchivo = opts?.nombreArchivo || `FACT-${factura.numero.replace('/', '-')}.pdf`;
  doc.save(nombreArchivo);

  if (opts?.abrir) {
    const url = doc.output('bloburl');
    if (typeof url === 'string') {
      window.open(url);
    }
  }
}
