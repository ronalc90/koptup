import { z } from 'zod';

/**
 * Validador de RUC peruano usando algoritmo módulo 11 estándar
 * Pesos: 5,4,3,2,7,6,5,4,3,2 (de izquierda a derecha)
 */
export function validarRuc(ruc: string): boolean {
  // RUC debe tener 11 dígitos
  if (!ruc || !/^\d{11}$/.test(ruc)) {
    return false;
  }

  // Pesos para el algoritmo de validación
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(ruc[i], 10) * pesos[i];
  }

  const resto = suma % 11;
  const digito = 11 - resto;
  const digitoValidacion = digito === 11 ? 0 : digito === 10 ? 1 : digito;

  return parseInt(ruc[10], 10) === digitoValidacion;
}

/**
 * Validador de DNI peruano (solo verifica que tenga 8 dígitos)
 */
export function validarDni(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

/**
 * Esquema Zod para Cliente
 */
export const clienteSchema = z
  .object({
    tipoDoc: z.enum(['1', '6']),
    numeroDoc: z.string().min(1),
    razonSocial: z.string().min(2).max(150),
    nombreComercial: z.string().max(150).optional().or(z.literal('')),
    direccion: z.string().min(3).max(200),
    ubigeo: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
    telefono: z.string().max(15).optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    activo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Si tipoDoc es '1' (DNI), debe tener 8 dígitos
      if (data.tipoDoc === '1') {
        return validarDni(data.numeroDoc);
      }
      // Si tipoDoc es '6' (RUC), debe validar el RUC
      if (data.tipoDoc === '6') {
        return validarRuc(data.numeroDoc);
      }
      return false;
    },
    {
      message: 'Documento de identidad inválido',
      path: ['numeroDoc'],
    }
  );

export type ClienteFormData = z.infer<typeof clienteSchema>;

/**
 * Esquema Zod para Conductor
 */
export const conductorSchema = z.object({
  dni: z
    .string()
    .regex(/^\d{8}$/, 'DNI debe tener 8 dígitos'),
  nombres: z.string().min(2).max(80),
  apellidos: z.string().min(2).max(80),
  licencia: z.string().min(5).max(20),
  categoriaLicencia: z.enum([
    'A-I',
    'A-IIa',
    'A-IIb',
    'A-IIIa',
    'A-IIIb',
    'A-IIIc',
    'B-I',
    'B-IIa',
    'B-IIb',
    'B-IIc',
  ]),
  vencimientoLicencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  telefono: z.string().max(15).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  activo: z.boolean().default(true),
});

export type ConductorFormData = z.infer<typeof conductorSchema>;

/**
 * Esquema Zod para Vehículo
 */
export const vehiculoSchema = z.object({
  placa: z
    .string()
    .regex(/^[A-Z0-9]{3}-\d{3}$/i, 'Placa formato AAA-123'),
  marca: z.string().min(2).max(40),
  modelo: z.string().min(1).max(40),
  anio: z.number().int().min(1990).max(2030),
  capacidadKg: z.number().positive('Capacidad debe ser positiva'),
  configuracion: z.enum([
    'C2',
    'C3',
    'C4',
    'T2S2',
    'T2S3',
    'T3S2',
    'T3S3',
    'C2RB1',
    'C3RB1',
  ]),
  certificadoMTC: z.string().max(30).optional().or(z.literal('')),
  vencimientoSOAT: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vencimientoRevision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activo: z.boolean().default(true),
});

export type VehiculoFormData = z.infer<typeof vehiculoSchema>;

/**
 * Esquema Zod para Orden de Servicio
 */
export const ordenSchema = z.object({
  clienteId: z.string().min(1, 'Cliente es requerido'),
  conductorId: z.string().min(1, 'Conductor es requerido'),
  vehiculoId: z.string().min(1, 'Vehículo es requerido'),
  origen: z.object({
    direccion: z.string().min(3, 'Dirección requerida'),
    ubigeo: z.string().regex(/^\d{6}$/, 'UBIGEO debe ser 6 dígitos'),
  }),
  destino: z.object({
    direccion: z.string().min(3, 'Dirección requerida'),
    ubigeo: z.string().regex(/^\d{6}$/, 'UBIGEO debe ser 6 dígitos'),
  }),
  fechaInicioTraslado: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pesoTotalKg: z.number().positive('Peso debe ser mayor a 0'),
  bultos: z.number().int().positive('Bultos debe ser mayor a 0'),
  descripcionMercancia: z.string().min(3).max(500),
  modalidadTransporte: z.enum(['01', '02']),
  flete: z.number().positive('Flete debe ser mayor a 0'),
  observaciones: z.string().max(500).optional().or(z.literal('')),
});

export type OrdenFormData = z.infer<typeof ordenSchema>;

/**
 * Esquema Zod para Factura (básico, sin detalles de items)
 */
export const facturaSchema = z.object({
  serie: z.string().regex(/^[A-Z]\d{3}$/, 'Serie formato: F001'),
  clienteId: z.string().min(1, 'Cliente es requerido'),
  tipoComprobante: z.enum(['01', '03']),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observaciones: z.string().max(500).optional().or(z.literal('')),
});

export type FacturaFormData = z.infer<typeof facturaSchema>;

/**
 * Esquema Zod para Guía de Remisión
 */
export const guiaRemisionSchema = z.object({
  serie: z.string().regex(/^[TV]\d{3}$/, 'Serie formato: T001'),
  tipoGuia: z.enum(['remitente', 'transportista']),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  motivoTraslado: z.string().min(1),
  observaciones: z.string().max(500).optional().or(z.literal('')),
});

export type GuiaRemisionFormData = z.infer<typeof guiaRemisionSchema>;
