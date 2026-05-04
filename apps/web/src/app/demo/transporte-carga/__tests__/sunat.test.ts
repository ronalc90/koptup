import {
  generarXmlFactura,
  validarFactura,
  validarGuiaRemision,
  nombreArchivoXml,
  simularEnvioSunat,
} from '../lib/sunat';
import type { Factura, GuiaRemision, FacturaItem } from '../types';

// Mocks de datos válidos
const clienteValido = {
  tipoDoc: '6' as const,
  numeroDoc: '20505000999',
  razonSocial: 'CLIENTE TEST S.A.C.',
  direccion: 'Calle Principal 123, Lima',
};

const itemValido: FacturaItem = {
  id: '1',
  descripcion: 'Servicio de transporte',
  unidad: 'SERV',
  cantidad: 1,
  valorUnitario: 1000,
  precioUnitario: 1000,
  igv: 180,
  total: 1180,
  afectacionIgv: '10',
};

const facturaValida: Factura = {
  id: '1',
  serie: 'F001',
  correlativo: '00001',
  numero: 'F001-00001',
  tipoComprobante: '01',
  fechaEmision: '2026-05-04',
  ordenId: 'ord-1',
  clienteId: 'cli-1',
  moneda: 'PEN',
  subtotal: 1000,
  igv: 180,
  total: 1180,
  items: [itemValido],
  estado: 'pendiente',
  createdAt: '2026-05-04T00:00:00Z',
};

const facturaConDetraccion: Factura = {
  ...facturaValida,
  numero: 'F001-00002',
  subtotal: 2000,
  igv: 360,
  total: 2360,
  detraccion: {
    aplica: true,
    porcentaje: 4,
    monto: 94.4,
    cuenta: '00-000-000000',
    codigo: '027',
  },
  items: [
    {
      ...itemValido,
      valorUnitario: 2000,
      precioUnitario: 2000,
      igv: 360,
      total: 2360,
    },
  ],
};

const guiaValida: GuiaRemision = {
  id: 'gr-1',
  serie: 'T001',
  correlativo: '000001',
  numero: 'T001-000001',
  tipoGuia: 'remitente',
  fechaEmision: '2026-05-04',
  fechaInicioTraslado: '2026-05-05',
  ordenId: 'ord-1',
  motivoTraslado: '01',
  pesoTotalKg: 500,
  bultos: 10,
  descripcionMercancia: 'Productos varios',
  remitente: {
    tipoDoc: '6',
    numeroDoc: '20505000999',
    razonSocial: 'TRANSPORTES DEMO S.A.C.',
    direccion: 'Av. Industrial 123',
  },
  destinatario: {
    tipoDoc: '6',
    numeroDoc: '20505000999',
    razonSocial: 'CLIENTE TEST S.A.C.',
    direccion: 'Calle Principal 123',
  },
  origen: {
    direccion: 'Av. Industrial 123, Lima',
    ubigeo: '150101',
  },
  destino: {
    direccion: 'Calle Principal 123, Arequipa',
    ubigeo: '040102',
  },
  estado: 'pendiente',
  createdAt: '2026-05-04T00:00:00Z',
};

describe('SUNAT - Generación XML', () => {
  describe('generarXmlFactura', () => {
    it('genera XML que contiene UBL 2.1', () => {
      const xml = generarXmlFactura(facturaValida, clienteValido);
      expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
      expect(xml).toContain('<cbc:CustomizationID>2.0</cbc:CustomizationID>');
    });

    it('contiene el número de factura', () => {
      const xml = generarXmlFactura(facturaValida, clienteValido);
      expect(xml).toContain('F001-00001');
    });

    it('contiene datos del cliente', () => {
      const xml = generarXmlFactura(facturaValida, clienteValido);
      expect(xml).toContain(clienteValido.razonSocial);
      expect(xml).toContain(clienteValido.numeroDoc);
    });

    it('incluye bloque PaymentTerms detracción si aplica', () => {
      const xml = generarXmlFactura(facturaConDetraccion, clienteValido);
      expect(xml).toContain('Detraccion');
      expect(xml).toContain('027');
      expect(xml).toContain('4.00');
    });

    it('no incluye bloque PaymentTerms si detracción no aplica', () => {
      const xml = generarXmlFactura(facturaValida, clienteValido);
      expect(xml).not.toContain('PaymentTerms');
    });

    it('escapa caracteres especiales XML', () => {
      const clienteEspecial = {
        ...clienteValido,
        razonSocial: 'A & B <test>',
      };
      const xml = generarXmlFactura(facturaValida, clienteEspecial);
      expect(xml).not.toContain('<test>');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
    });

    it('incluye totales correctamente', () => {
      const xml = generarXmlFactura(facturaValida, clienteValido);
      expect(xml).toContain('1000.00');
      expect(xml).toContain('180.00');
      expect(xml).toContain('1180.00');
    });

    it('incluye items de la factura', () => {
      const xml = generarXmlFactura(facturaValida, clienteValido);
      expect(xml).toContain('Servicio de transporte');
      expect(xml).toContain('InvoiceLine');
    });
  });

  describe('generarXmlGuiaRemision', () => {
    it('genera XML DespatchAdvice válido', () => {
      const xml = generarXmlGuiaRemision(guiaValida);
      expect(xml).toContain('DespatchAdvice');
      expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    });

    it('contiene el número de guía', () => {
      const xml = generarXmlGuiaRemision(guiaValida);
      expect(xml).toContain('T001-000001');
    });

    it('tipo guía remitente usa código 09', () => {
      const xml = generarXmlGuiaRemision(guiaValida);
      expect(xml).toContain('<cbc:DespatchAdviceTypeCode>09</cbc:DespatchAdviceTypeCode>');
    });

    it('tipo guía transportista usa código 31', () => {
      const guiaTransportista = { ...guiaValida, tipoGuia: 'transportista' as const };
      const xml = generarXmlGuiaRemision(guiaTransportista);
      expect(xml).toContain('<cbc:DespatchAdviceTypeCode>31</cbc:DespatchAdviceTypeCode>');
    });

    it('incluye datos de origen y destino', () => {
      const xml = generarXmlGuiaRemision(guiaValida);
      expect(xml).toContain('150101');
      expect(xml).toContain('040102');
    });
  });
});

describe('SUNAT - Validación', () => {
  describe('validarFactura', () => {
    it('valida factura correcta', () => {
      const r = validarFactura(facturaValida);
      expect(r.valido).toBe(true);
      expect(r.errores).toHaveLength(0);
    });

    it('rechaza factura con número inválido', () => {
      const factura = { ...facturaValida, numero: 'INVALIDO' };
      const r = validarFactura(factura);
      expect(r.valido).toBe(false);
      expect(r.errores.length).toBeGreaterThan(0);
    });

    it('rechaza tipoComprobante inválido', () => {
      const factura = { ...facturaValida, tipoComprobante: '99' as any };
      const r = validarFactura(factura);
      expect(r.valido).toBe(false);
    });

    it('rechaza factura sin items', () => {
      const factura = { ...facturaValida, items: [] };
      const r = validarFactura(factura);
      expect(r.valido).toBe(false);
    });

    it('rechaza factura con subtotal <= 0', () => {
      const factura = { ...facturaValida, subtotal: 0 };
      const r = validarFactura(factura);
      expect(r.valido).toBe(false);
    });

    it('rechaza factura con IGV negativo', () => {
      const factura = { ...facturaValida, igv: -10 };
      const r = validarFactura(factura);
      expect(r.valido).toBe(false);
    });

    it('advierte si IGV no coincide con 18%', () => {
      const factura = { ...facturaValida, igv: 100 }; // Debería ser ~180
      const r = validarFactura(factura);
      expect(r.advertencias.length).toBeGreaterThan(0);
    });

    it('advierte si total no coincide con subtotal + IGV', () => {
      const factura = { ...facturaValida, total: 5000 }; // Incorrecto
      const r = validarFactura(factura);
      expect(r.advertencias.length).toBeGreaterThan(0);
    });
  });

  describe('validarGuiaRemision', () => {
    it('valida guía correcta', () => {
      const r = validarGuiaRemision(guiaValida);
      expect(r.valido).toBe(true);
      expect(r.errores).toHaveLength(0);
    });

    it('rechaza guía con número inválido', () => {
      const guia = { ...guiaValida, numero: 'INVALIDO' };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });

    it('rechaza guía con peso <= 0', () => {
      const guia = { ...guiaValida, pesoTotalKg: 0 };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });

    it('rechaza guía con bultos < 1', () => {
      const guia = { ...guiaValida, bultos: 0 };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });

    it('rechaza guía sin origen', () => {
      const guia = { ...guiaValida, origen: undefined as any };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });

    it('rechaza guía sin destino', () => {
      const guia = { ...guiaValida, destino: undefined as any };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });

    it('rechaza UBIGEO inválido en origen', () => {
      const guia = { ...guiaValida, origen: { ...guiaValida.origen, ubigeo: 'XXXXX' } };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });

    it('rechaza guía transportista sin transportista', () => {
      const guia = { ...guiaValida, tipoGuia: 'transportista' as const, transportista: undefined };
      const r = validarGuiaRemision(guia);
      expect(r.valido).toBe(false);
    });
  });
});

describe('SUNAT - Utilidades', () => {
  describe('nombreArchivoXml', () => {
    it('genera nombre archivo formato correcto', () => {
      const nombre = nombreArchivoXml('01', '20505000999', 'F001', '00001');
      expect(nombre).toBe('20505000999-01-F001-00001.xml');
    });

    it('soporta tipo 03', () => {
      const nombre = nombreArchivoXml('03', '20505000999', 'B001', '00005');
      expect(nombre).toBe('20505000999-03-B001-00005.xml');
    });

    it('soporta tipo 09', () => {
      const nombre = nombreArchivoXml('09', '20505000999', 'T001', '000001');
      expect(nombre).toBe('20505000999-09-T001-000001.xml');
    });
  });

  describe('simularEnvioSunat', () => {
    it('devuelve CDR con aceptado=true cuando falla aleatoriamente', async () => {
      const xml = '<test/>';
      const cdr = await simularEnvioSunat(xml);
      expect(cdr).toHaveProperty('codigo');
      expect(cdr).toHaveProperty('descripcion');
      expect(cdr).toHaveProperty('fechaRespuesta');
      expect(cdr).toHaveProperty('hash');
      expect(cdr).toHaveProperty('aceptado');
    });

    it('simula rechazo cuando simularRechazo=true', async () => {
      const xml = '<test/>';
      const cdr = await simularEnvioSunat(xml, { simularRechazo: true });
      expect(cdr.aceptado).toBe(false);
      expect(cdr.codigo).toBe('2335');
    });

    it('devuelve hash válido', async () => {
      const xml = '<test/>';
      const cdr = await simularEnvioSunat(xml);
      expect(cdr.hash).toBeTruthy();
      expect(cdr.hash.length).toBeGreaterThan(0);
    });

    it('devuelve fechaRespuesta en formato ISO date', async () => {
      const xml = '<test/>';
      const cdr = await simularEnvioSunat(xml);
      expect(/^\d{4}-\d{2}-\d{2}$/.test(cdr.fechaRespuesta)).toBe(true);
    });
  });
});
