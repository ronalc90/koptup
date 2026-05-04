import { validarRuc, validarDni } from '../lib/validators';

describe('validarRuc — algoritmo módulo 11 PE', () => {
  it.each([
    ['20505000995', true],   // Válido: dígito verificador correcto
    ['10410055959', true],   // Válido: dígito verificador correcto
    ['20100070971', true],   // Válido: dígito verificador correcto
    ['20505000990', false],  // Inválido: dígito final cambiado
    ['12345678901', false],  // Inválido: RUC aleatorio
    ['12345', false],        // Inválido: muy corto
    ['abc12345678', false],  // Inválido: no numérico
    ['', false],             // Inválido: vacío
  ])('RUC %s → %s', (ruc, esValido) => {
    expect(validarRuc(ruc)).toBe(esValido);
  });
});

describe('validarDni', () => {
  it.each([
    ['12345678', true],      // Válido: 8 dígitos
    ['00000001', true],      // Válido: 8 dígitos
    ['1234567', false],      // Inválido: 7 dígitos
    ['123456789', false],    // Inválido: 9 dígitos
    ['abcd1234', false],     // Inválido: contiene letras
    ['', false],             // Inválido: vacío
  ])('DNI %s → %s', (dni, esValido) => {
    expect(validarDni(dni)).toBe(esValido);
  });
});
