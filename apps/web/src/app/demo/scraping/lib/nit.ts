/**
 * Dígito de verificación del NIT (algoritmo de la DIAN, módulo 11 con los
 * pesos oficiales). Se calcula de verdad en tu navegador: así la demo detecta
 * cuando el dígito que "leyó" del documento no coincide con el NIT.
 */
const WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function nitDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function verificationDigit(nit: string): number | null {
  const digits = nitDigits(nit);
  if (!digits || digits.length > WEIGHTS.length) return null;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[digits.length - 1 - i]) * WEIGHTS[i];
  }
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

/** `901482736` → `901.482.736` */
export function formatNit(nit: string): string {
  return nitDigits(nit).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function nitWithDv(nit: string): string {
  const dv = verificationDigit(nit);
  return dv === null ? formatNit(nit) : `${formatNit(nit)}-${dv}`;
}
