/**
 * Tarifario de ejemplo que aplica el motor de la demo.
 *
 * Es una copia, solo para mostrarla en la pantalla "Cómo audita", de la tabla
 * fija del backend (`apps/backend/src/services/glosa-calculator.service.ts`).
 * Si cambia allí, actualízala aquí. Los códigos y valores son de ejemplo: no
 * corresponden a ningún contrato ni manual tarifario real.
 */
export interface TarifaDemo {
  codigo: string;
  descripcion: string;
  valor: number;
}

export const TARIFARIO_DEMO: readonly TarifaDemo[] = [
  { codigo: '890201', descripcion: 'Consulta de primera vez por medicina general', valor: 25000 },
  { codigo: '890281', descripcion: 'Consulta de primera vez por especialista en ortopedia', valor: 12510 },
  { codigo: '890202', descripcion: 'Consulta de primera vez por medicina especializada', valor: 38000 },
  { codigo: '890301', descripcion: 'Consulta de control o seguimiento por medicina general', valor: 20000 },
  { codigo: '890381', descripcion: 'Consulta de control o seguimiento por especialista', valor: 10000 },
  { codigo: '891201', descripcion: 'Consulta de urgencias por medicina general', valor: 45000 },
  { codigo: '871101', descripcion: 'Radiografía de tórax', valor: 85000 },
  { codigo: '871411', descripcion: 'Radiografía de cadera', valor: 120000 },
  { codigo: '873411', descripcion: 'Radiografía de cadera o articulación coxofemoral (AP y lateral)', valor: 95000 },
  { codigo: '873412', descripcion: 'Radiografía de cadera comparativa', valor: 110000 },
  { codigo: '902209', descripcion: 'Toma de muestra de laboratorio clínico', valor: 15000 },
  { codigo: '902210', descripcion: 'Hemograma', valor: 8500 },
  { codigo: '902211', descripcion: 'Glucemia', valor: 6500 },
  { codigo: '902212', descripcion: 'Creatinina', valor: 9500 },
];

/** Porcentaje que el motor de la demo propone glosar cuando el código no está en el tarifario. */
export const PORCENTAJE_GLOSA_SIN_TARIFA = 30;

export function tarifaDe(codigo: string | undefined): TarifaDemo | undefined {
  if (!codigo) return undefined;
  return TARIFARIO_DEMO.find((t) => t.codigo === codigo.trim());
}
