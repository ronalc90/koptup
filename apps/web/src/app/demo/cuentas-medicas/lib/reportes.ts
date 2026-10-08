import { downloadBlob } from '@/lib/utils';
import type { DetalleFactura, Factura } from '../tipos-auditoria';
import { tarifaDe } from './tarifarioDemo';
import {
  anonimizarTexto,
  decisionDeGlosa,
  formatearCOP,
  formatearFecha,
  nombreArchivo,
  nombreEntidad,
  valorPropuesto,
} from './formato';

/** Traductor ya acotado al espacio `demoMedicalAccounts` (lo pasa el componente). */
export type Traductor = (clave: string, valores?: Record<string, string | number>) => string;

function celda(valor: string | number, separador: string): string {
  const texto = String(valor ?? '');
  if (texto.includes(separador) || /["\n\r]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

function descargarCSV(filas: Array<Array<string | number>>, archivo: string, locale: string) {
  // En Excel con configuración regional de Colombia el separador de listas es ";".
  const separador = locale === 'en' ? ',' : ';';
  const contenido = filas.map((fila) => fila.map((v) => celda(v, separador)).join(separador)).join('\r\n');
  const blob = new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${nombreArchivo(archivo)}.csv`);
}

function etiquetasEntidad(t: Traductor) {
  return { prestador: t('entities.provider'), pagador: t('entities.payer') };
}

function estadoFactura(estado: string, t: Traductor, claves: Record<string, string>): string {
  const clave = claves[estado];
  return clave ? t(`states.${clave}`) : estado;
}

export function exportarListaCSV(
  facturas: Factura[],
  locale: string,
  t: Traductor,
  clavesEstado: Record<string, string>,
) {
  const etiquetas = etiquetasEntidad(t);
  const filas: Array<Array<string | number>> = [
    [
      t('invoices.columns.number'),
      t('invoices.columns.state'),
      t('invoices.columns.provider'),
      t('invoices.columns.payer'),
      t('invoices.columns.registered'),
      t('invoices.columns.billed'),
      t('invoices.columns.denied'),
      t('invoices.columns.toPay'),
    ],
    ...facturas.map((f) => [
      f.numeroFactura,
      estadoFactura(f.estado, t, clavesEstado),
      nombreEntidad(f.ips?.nombre, 'prestador', etiquetas),
      nombreEntidad(f.eps?.nombre, 'pagador', etiquetas),
      formatearFecha(f.fechaEmision, locale),
      Math.round(f.valorTotal || 0),
      Math.round(f.totalGlosas || 0),
      Math.round(f.valorAceptado || 0),
    ]),
  ];
  descargarCSV(filas, t('report.listFileName'), locale);
}

interface FilaReporte {
  codigo: string;
  descripcion: string;
  cantidad: number;
  facturado: number;
  tarifa: number;
  diferencia: number;
  propuesta: number;
  final: number;
  decision: string;
  nota: string;
}

function filasDetalle(detalle: DetalleFactura, t: Traductor): FilaReporte[] {
  const etiquetas = etiquetasEntidad(t);
  return detalle.procedimientos.map((p) => {
    const glosas = detalle.glosas.filter((g) => g.procedimientoId === p._id);
    const propuesta = glosas.reduce((s, g) => s + valorPropuesto(g, detalle.procedimientos), 0);
    const final = glosas.reduce((s, g) => s + (g.valorGlosado || 0), 0);
    const decisiones = glosas.map((g) => t(`denials.decision.${decisionDeGlosa(g, valorPropuesto(g, detalle.procedimientos))}`));
    const notas = glosas.map((g) => anonimizarTexto(g.observaciones, etiquetas)).filter(Boolean);
    return {
      codigo: p.codigoCUPS,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      facturado: Math.round(p.valorTotalIPS || 0),
      tarifa: tarifaDe(p.codigoCUPS) ? Math.round(p.valorTotalContrato || 0) : 0,
      diferencia: Math.round(p.diferenciaTarifa || 0),
      propuesta,
      final,
      decision: decisiones.join(' / ') || t('report.noDenial'),
      nota: notas.join(' / '),
    };
  });
}

export function exportarDetalleCSV(detalle: DetalleFactura, locale: string, t: Traductor) {
  const filas = filasDetalle(detalle, t);
  const numero = detalle.factura.numeroFactura;
  const tabla: Array<Array<string | number>> = [
    [
      t('report.columns.invoice'),
      t('report.columns.code'),
      t('report.columns.description'),
      t('report.columns.qty'),
      t('report.columns.billed'),
      t('report.columns.tariff'),
      t('report.columns.difference'),
      t('report.columns.proposed'),
      t('report.columns.final'),
      t('report.columns.decision'),
      t('report.columns.note'),
    ],
    ...filas.map((f) => [
      numero,
      f.codigo,
      f.descripcion,
      f.cantidad,
      f.facturado,
      f.tarifa || t('report.notInTariff'),
      f.diferencia,
      f.propuesta,
      f.final,
      f.decision,
      f.nota,
    ]),
    [
      t('report.total'),
      '',
      '',
      '',
      filas.reduce((s, f) => s + f.facturado, 0),
      '',
      '',
      filas.reduce((s, f) => s + f.propuesta, 0),
      filas.reduce((s, f) => s + f.final, 0),
      '',
      t('report.sampleNote'),
    ],
  ];
  descargarCSV(tabla, `${t('report.detailFileName')}-${numero}`, locale);
}

export async function exportarDetallePDF(
  detalle: DetalleFactura,
  locale: string,
  t: Traductor,
  clavesEstado: Record<string, string>,
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const etiquetas = etiquetasEntidad(t);
  const { factura } = detalle;
  const filas = filasDetalle(detalle, t);
  const margen = 15;
  const ancho = 186;
  let y = 18;

  const saltoSiHaceFalta = (alto: number) => {
    if (y + alto > 262) {
      doc.addPage();
      y = 18;
    }
  };
  const parrafo = (texto: string, tamano = 9, estilo: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamano);
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    lineas.forEach((linea) => {
      saltoSiHaceFalta(5);
      doc.text(linea, margen, y);
      y += tamano * 0.45 + 1;
    });
  };

  doc.setTextColor(185, 28, 28);
  parrafo(t('report.pdf.sampleBanner'), 8, 'bold');
  doc.setTextColor(17, 24, 39);
  y += 2;
  parrafo(t('report.pdf.title', { number: factura.numeroFactura }), 15, 'bold');
  y += 1;
  parrafo(
    `${nombreEntidad(factura.ips?.nombre, 'prestador', etiquetas)} -> ${nombreEntidad(factura.eps?.nombre, 'pagador', etiquetas)}`,
    10,
  );
  parrafo(
    `${t('report.pdf.registered')}: ${formatearFecha(factura.fechaEmision, locale)}   ${t('report.pdf.state')}: ${estadoFactura(factura.estado, t, clavesEstado)}`,
    9,
  );
  y += 3;

  parrafo(t('report.pdf.values'), 11, 'bold');
  parrafo(
    `${t('detail.values.billed')}: ${formatearCOP(factura.valorTotal, locale)}   ${t('detail.values.denied')}: ${formatearCOP(factura.totalGlosas, locale)}   ${t('detail.values.toPay')}: ${formatearCOP(factura.valorAceptado, locale)}`,
    9,
  );
  y += 3;

  parrafo(t('report.pdf.procedures'), 11, 'bold');
  const columnas = [
    { titulo: t('report.columns.code'), x: margen },
    { titulo: t('report.columns.description'), x: margen + 18 },
    { titulo: t('report.columns.billed'), x: margen + 100 },
    { titulo: t('report.columns.tariff'), x: margen + 128 },
    { titulo: t('report.columns.final'), x: margen + 158 },
  ];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  saltoSiHaceFalta(6);
  columnas.forEach((c) => doc.text(c.titulo, c.x, y));
  y += 5;
  doc.setFont('helvetica', 'normal');
  filas.forEach((f) => {
    const descripcion = doc.splitTextToSize(`${f.descripcion} (x${f.cantidad})`, 78) as string[];
    saltoSiHaceFalta(descripcion.length * 4 + 2);
    doc.text(f.codigo, columnas[0].x, y);
    doc.text(descripcion, columnas[1].x, y);
    doc.text(formatearCOP(f.facturado, locale), columnas[2].x, y);
    doc.text(f.tarifa ? formatearCOP(f.tarifa, locale) : t('report.notInTariff'), columnas[3].x, y);
    doc.text(formatearCOP(f.final, locale), columnas[4].x, y);
    y += descripcion.length * 4 + 1.5;
  });
  y += 3;

  parrafo(t('report.pdf.denials'), 11, 'bold');
  if (detalle.glosas.length === 0) {
    parrafo(t('detail.review.none'), 9);
  }
  detalle.glosas.forEach((g) => {
    const propuesto = valorPropuesto(g, detalle.procedimientos);
    const decision = t(`denials.decision.${decisionDeGlosa(g, propuesto)}`);
    const proc = detalle.procedimientos.find((p) => p._id === g.procedimientoId);
    parrafo(
      `${proc ? `${proc.codigoCUPS} ${proc.descripcion}` : g.codigo}: ${t('report.pdf.proposed')} ${formatearCOP(propuesto, locale)} - ${t('report.pdf.final')} ${formatearCOP(g.valorGlosado, locale)} - ${decision}`,
      9,
    );
    if (g.observaciones) parrafo(`${t('report.columns.note')}: ${anonimizarTexto(g.observaciones, etiquetas)}`, 8);
  });
  y += 3;

  if (factura.observaciones) {
    parrafo(t('report.pdf.aiProposal'), 11, 'bold');
    parrafo(t('detail.proposal.note'), 8);
    parrafo(anonimizarTexto(factura.observaciones, etiquetas), 9);
    y += 3;
  }

  doc.setTextColor(107, 114, 128);
  parrafo(t('report.pdf.footer'), 8);

  const blob = doc.output('blob');
  downloadBlob(blob, `${nombreArchivo(`${t('report.detailFileName')}-${factura.numeroFactura}`)}.pdf`);
}
