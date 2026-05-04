/**
 * Formatea un número a moneda PEN (Soles)
 * Ejemplo: 1234.56 => "S/ 1,234.56"
 */
export const formatPEN = (n: number): string => {
  return `S/ ${formatNumero(n)}`;
};

/**
 * Formatea un número con separador de miles y decimales
 * Ejemplo: 1234.56 => "1,234.56"
 */
export const formatNumero = (n: number, dec = 2): string => {
  const partes = (Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec))
    .toFixed(dec)
    .split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return partes.join('.');
};

/**
 * Formatea una fecha ISO a formato DD/MM/YYYY
 * Ejemplo: "2026-05-04" => "04/05/2026"
 */
export const formatFecha = (iso: string): string => {
  if (!iso) return '';
  const [año, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${año}`;
};

/**
 * Formatea una fecha ISO con hora a formato DD/MM/YYYY HH:MM
 * Ejemplo: "2026-05-04T14:30:00" => "04/05/2026 14:30"
 */
export const formatFechaHora = (iso: string): string => {
  if (!iso) return '';
  const [fecha, hora] = iso.split('T');
  const [año, mes, dia] = fecha.split('-');
  const [horas] = hora.split(':');
  const minutos = hora.split(':')[1];
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
};

/**
 * Formatea un RUC de 11 dígitos a formato XX-XXXXXXX-XX
 * Ejemplo: "20505000999" => "20-5050009-99"
 */
export const formatRuc = (ruc: string): string => {
  if (!ruc || ruc.length !== 11) return ruc;
  return `${ruc.substring(0, 2)}-${ruc.substring(2, 9)}-${ruc.substring(9)}`;
};

/**
 * Formatea una placa a mayúsculas
 * Ejemplo: "abc-123" => "ABC-123"
 */
export const formatPlaca = (p: string): string => p.toUpperCase();

/**
 * Genera el próximo número correlativo para un comprobante
 * Ejemplo con serie "T001" y existentes ["T001-000001", "T001-000005"]
 * => "T001-000006"
 */
export const proximoCorrelativo = (
  existentes: string[],
  serie: string,
  padding = 5
): string => {
  let maxNum = 0;

  for (const num of existentes) {
    const match = num.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) {
        maxNum = n;
      }
    }
  }

  const siguiente = maxNum + 1;
  const correlativo = siguiente.toString().padStart(padding, '0');
  return `${serie}-${correlativo}`;
};

/**
 * Genera un número de orden único con formato OS-YYYY-NNNNN
 * Ejemplo: "OS-2026-00001"
 */
export const generarNumeroOrden = (
  existentes: { numero: string }[],
  year = new Date().getFullYear()
): string => {
  let maxNum = 0;

  for (const orden of existentes) {
    const match = orden.numero.match(/OS-\d{4}-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) {
        maxNum = n;
      }
    }
  }

  const siguiente = maxNum + 1;
  const correlativo = siguiente.toString().padStart(5, '0');
  return `OS-${year}-${correlativo}`;
};
