/**
 * Archivos de salida de la nómina de ejemplo. Son estructuras simplificadas
 * para mostrar el flujo: no son el formato oficial de la planilla PILA
 * (Resolución 2388 de 2016) ni el de ningún banco en particular.
 */
import { COMPANY } from './catalog';
import { ARL_RATES, csv, type PayLine } from './payroll';
import type { Employee } from './types';

export function pilaFile(month: string, lines: PayLine[], byId: Map<string, Employee>, header: string): string {
  const rows: (string | number)[][] = [
    [`# ${header}`],
    ['NIT', COMPANY.nitFormatted, 'PERIODO', month, 'REGISTROS', lines.length],
    ['TIPO_DOC', 'DOCUMENTO', 'NOMBRE', 'DIAS', 'IBC', 'EPS', 'SALUD_TRAB', 'SALUD_EMP', 'AFP', 'PENSION_TRAB', 'FSP', 'PENSION_EMP', 'ARL_CLASE', 'ARL_TARIFA', 'ARL', 'CCF', 'CCF_VALOR', 'ICBF', 'SENA'],
  ];
  for (const l of lines) {
    const e = byId.get(l.employeeId)!;
    rows.push([
      'CC', e.docId, e.name, l.days, l.ibc, e.eps, l.health, l.erHealth, e.afp, l.pension, l.fsp, l.erPension,
      l.apprentice ? 1 : e.arlClass, ARL_RATES[l.apprentice ? 1 : e.arlClass], l.arl, e.ccf, l.ccf, l.icbf, l.sena,
    ]);
  }
  return csv(rows);
}

export function bankFile(periodId: string, lines: PayLine[], byId: Map<string, Employee>, header: string): string {
  return csv([
    [`# ${header}`],
    ['ORDENANTE', COMPANY.name, 'NIT', COMPANY.nitFormatted, 'LOTE', periodId],
    ['TIPO_DOC', 'DOCUMENTO', 'BENEFICIARIO', 'BANCO', 'TIPO_CUENTA', 'CUENTA', 'VALOR'],
    ...lines.map((l) => {
      const e = byId.get(l.employeeId)!;
      return ['CC', e.docId, e.name, e.bank, 'AHORROS', e.account, l.net];
    }),
    ['TOTAL', '', '', '', '', '', lines.reduce((a, l) => a + l.net, 0)],
  ]);
}
