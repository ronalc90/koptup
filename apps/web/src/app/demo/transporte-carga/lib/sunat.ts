import type { Factura, GuiaRemision, Cliente, FacturaItem } from '../types';

// ============================================================
// CONSTANTES SUNAT (catálogos oficiales)
// ============================================================

/** Catálogo 01: Tipo de Documento */
export const TIPO_DOC = { FACTURA: '01', BOLETA: '03', NOTA_CREDITO: '07', NOTA_DEBITO: '08', GUIA_REMISION_REMITENTE: '09', GUIA_REMISION_TRANSPORTISTA: '31' } as const;

/** Catálogo 06: Tipo de Documento de Identidad */
export const TIPO_DOC_IDENT = { DNI: '1', CARNET_EXT: '4', RUC: '6', PASAPORTE: '7' } as const;

/** Catálogo 07: Afectación IGV (código SUNAT) */
export const AFECTACION_IGV = { GRAVADO: '10', EXONERADO: '20', INAFECTO: '30', EXPORTACION: '40' } as const;

/** Códigos detracción (catálogo 54) */
export const DETRACCION_CODIGO = { TRANSPORTE_CARGA: '027' } as const;

/** Catálogo de IGV por afectación: mapea código SUNAT 07 a atributos XML UBL */
export const SUNAT_TAX_CATEGORIES = {
  '10': { porcentaje: '18.00', categoryId: 'S', schemeId: '1000', schemeName: 'IGV', exemptionReasonCode: '10' },
  '20': { porcentaje: '0.00',  categoryId: 'E', schemeId: '9997', schemeName: 'EXO', exemptionReasonCode: '20' },
  '30': { porcentaje: '0.00',  categoryId: 'O', schemeId: '9998', schemeName: 'INA', exemptionReasonCode: '30' },
  '40': { porcentaje: '0.00',  categoryId: 'G', schemeId: '9995', schemeName: 'EXP', exemptionReasonCode: '40' },
} as const;

// Datos del emisor (empresa de transporte demo)
export const EMISOR = {
  ruc: '20505000999',
  razonSocial: 'TRANSPORTES DEMO S.A.C.',
  nombreComercial: 'TRANSPORTES DEMO',
  direccion: 'Av. Industrial 123, Lima, Lima, Perú',
  ubigeo: '150101',
};

/**
 * Escapa caracteres especiales XML para evitar inyección
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formatea un número a dos decimales para XML
 */
function formatDecimal(num: number): string {
  return (Math.round(num * 100) / 100).toFixed(2);
}

/**
 * Calcula el hash SHA-256 del XML, o usa un hash simple si no está disponible SubtleCrypto
 */
export async function calcularHash(xml: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(xml);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    // Fallback a hash simple
  }

  // Hash simple determinístico (para client-side sin crypto disponible)
  let hash = 0;
  for (let i = 0; i < xml.length; i++) {
    const char = xml.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
}

/**
 * Genera un nombre de archivo XML según estándares SUNAT
 * Formato: {ruc}-{tipoComprobante}-{serie}-{correlativo}.xml
 * Ejemplo: 20505000999-01-F001-00001.xml
 */
export function nombreArchivoXml(
  tipo: '01' | '03' | '09',
  emisorRuc: string,
  serie: string,
  correlativo: string
): string {
  return `${emisorRuc}-${tipo}-${serie}-${correlativo}.xml`;
}

/**
 * Resultado de validación SUNAT
 */
export interface ValidacionSunat {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

/**
 * Valida los datos de una factura antes de generación XML
 */
export function validarFactura(factura: Factura): ValidacionSunat {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validar formato de número (ej: F001-00001)
  const regexNumero = /^[A-Z0-9]{4}-\d{1,8}$/i;
  if (!regexNumero.test(factura.numero)) {
    errores.push(
      `Número de factura inválido: ${factura.numero} (debe ser formato: F001-00001)`
    );
  }

  // Validar tipoComprobante
  if (!['01', '03'].includes(factura.tipoComprobante)) {
    errores.push(
      `Tipo de comprobante inválido: ${factura.tipoComprobante} (debe ser 01 o 03)`
    );
  }

  // Validar montos > 0
  if (factura.subtotal <= 0) {
    errores.push(`Subtotal debe ser mayor a 0: ${factura.subtotal}`);
  }
  if (factura.igv < 0) {
    errores.push(`IGV no puede ser negativo: ${factura.igv}`);
  }
  if (factura.total <= 0) {
    errores.push(`Total debe ser mayor a 0: ${factura.total}`);
  }

  // Validar que IGV ≈ subtotal * 0.18 (con tolerancia)
  const igvEsperado = factura.subtotal * 0.18;
  const tolerancia = 0.05;
  if (Math.abs(factura.igv - igvEsperado) > tolerancia) {
    advertencias.push(
      `IGV no coincide con el 18% del subtotal (esperado ~${igvEsperado.toFixed(2)}, actual ${factura.igv.toFixed(2)})`
    );
  }

  // Validar que total ≈ subtotal + IGV
  const totalEsperado = factura.subtotal + factura.igv;
  if (Math.abs(factura.total - totalEsperado) > tolerancia) {
    advertencias.push(
      `Total no coincide con subtotal + IGV (esperado ~${totalEsperado.toFixed(2)}, actual ${factura.total.toFixed(2)})`
    );
  }

  // Validar items
  if (!factura.items || factura.items.length === 0) {
    errores.push('La factura debe tener al menos 1 item');
  } else {
    factura.items.forEach((item, idx) => {
      if (item.cantidad <= 0) {
        errores.push(`Item ${idx + 1}: cantidad debe ser > 0`);
      }
      if (item.valorUnitario < 0) {
        errores.push(`Item ${idx + 1}: valor unitario no puede ser negativo`);
      }
    });
  }

  // Validar detracción si aplica
  if (factura.detraccion && factura.detraccion.aplica) {
    if (factura.detraccion.codigo !== '027') {
      advertencias.push(
        `Código de detracción esperado 027 para transporte, actual: ${factura.detraccion.codigo}`
      );
    }
    if (factura.detraccion.porcentaje !== 4) {
      advertencias.push(
        `Porcentaje de detracción esperado 4%, actual: ${factura.detraccion.porcentaje}%`
      );
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Valida los datos de una guía de remisión
 */
export function validarGuiaRemision(guia: GuiaRemision): ValidacionSunat {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validar formato de número (ej: T001-000001)
  const regexNumero = /^[TV]\d{3}-\d{6}$/;
  if (!regexNumero.test(guia.numero)) {
    errores.push(
      `Número de guía inválido: ${guia.numero} (debe ser formato: T001-000001)`
    );
  }

  // Validar tipoGuia
  if (!['remitente', 'transportista'].includes(guia.tipoGuia)) {
    errores.push(
      `Tipo de guía inválido: ${guia.tipoGuia} (debe ser remitente o transportista)`
    );
  }

  // Validar pesos y bultos
  if (guia.pesoTotalKg <= 0) {
    errores.push(`Peso total debe ser > 0 kg: ${guia.pesoTotalKg}`);
  }
  if (guia.bultos < 1) {
    errores.push(`Bultos debe ser >= 1: ${guia.bultos}`);
  }

  // Validar origen y destino
  if (!guia.origen?.direccion || !guia.origen?.ubigeo) {
    errores.push('Origen debe tener dirección y ubigeo');
  }
  if (!guia.destino?.direccion || !guia.destino?.ubigeo) {
    errores.push('Destino debe tener dirección y ubigeo');
  }

  // Validar ubigeo formato (6 dígitos)
  if (guia.origen?.ubigeo && !/^\d{6}$/.test(guia.origen.ubigeo)) {
    errores.push(`Ubigeo origen inválido: ${guia.origen.ubigeo}`);
  }
  if (guia.destino?.ubigeo && !/^\d{6}$/.test(guia.destino.ubigeo)) {
    errores.push(`Ubigeo destino inválido: ${guia.destino.ubigeo}`);
  }

  // Si es guía transportista, debe tener datos de transportista
  if (guia.tipoGuia === 'transportista' && !guia.transportista) {
    errores.push('Guía transportista debe tener datos del transportista');
  }

  // Validar fechas
  const fechaEmision = new Date(guia.fechaEmision);
  const fechaInicio = new Date(guia.fechaInicioTraslado);

  if (isNaN(fechaEmision.getTime())) {
    errores.push(`Fecha de emisión inválida: ${guia.fechaEmision}`);
  }
  if (isNaN(fechaInicio.getTime())) {
    errores.push(`Fecha de inicio de traslado inválida: ${guia.fechaInicioTraslado}`);
  }

  if (!isNaN(fechaEmision.getTime()) && !isNaN(fechaInicio.getTime())) {
    if (fechaInicio < fechaEmision) {
      advertencias.push('La fecha de inicio de traslado no puede ser anterior a la emisión');
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Respuesta de CDR (Comprobante de Recepción) simulado de SUNAT
 */
export interface CdrSunat {
  codigo: string;
  descripcion: string;
  fechaRespuesta: string;
  hash: string;
  aceptado: boolean;
  observaciones?: string[];
}

/**
 * Simula el envío a SUNAT y devuelve un CDR mock
 * Si simularRechazo=true, fuerza rechazo con código 2335
 */
export async function simularEnvioSunat(
  xml: string,
  opciones?: { simularRechazo?: boolean }
): Promise<CdrSunat> {
  // Simula latencia de envío (600-1200ms)
  const latencia = 600 + Math.random() * 600;
  await new Promise((resolve) => setTimeout(resolve, latencia));

  const hash = await calcularHash(xml);
  const fechaRespuesta = new Date().toISOString().split('T')[0];

  if (opciones?.simularRechazo) {
    return {
      codigo: '2335',
      descripcion: 'El XML no contiene información del emisor',
      fechaRespuesta,
      hash,
      aceptado: false,
      observaciones: ['Verifique los datos del RUC y razón social'],
    };
  }

  // 90% aceptado, 10% rechazo aleatorio
  const rechazosAleatorios = [
    { codigo: '1033', descripcion: 'El comprobante electrónico no contiene un CDI válido' },
    { codigo: '2326', descripcion: 'La estructura del contenedor es inválida' },
    { codigo: '2329', descripcion: 'El identificador del documento es inválido' },
  ];

  const aceptado = Math.random() < 0.9;

  if (!aceptado) {
    const rechazo = rechazosAleatorios[Math.floor(Math.random() * rechazosAleatorios.length)];
    return {
      codigo: rechazo.codigo,
      descripcion: rechazo.descripcion,
      fechaRespuesta,
      hash,
      aceptado: false,
    };
  }

  return {
    codigo: '0',
    descripcion: 'La factura ha sido aceptada',
    fechaRespuesta,
    hash,
    aceptado: true,
  };
}

/**
 * Genera XML UBL 2.1 de Factura (mock, sin firma real XAdES-BES)
 */
export function generarXmlFactura(
  factura: Factura,
  cliente: {
    tipoDoc: string;
    numeroDoc: string;
    razonSocial: string;
    direccion: string;
  }
): string {
  const tipoComprobante = factura.tipoComprobante === '01' ? '01' : '03';
  const codigoTipoDoc = cliente.tipoDoc === '6' ? '6' : '1';

  const itemsXml = factura.items
    .map(
      (item, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="NIU">${formatDecimal(item.cantidad)}</cbc:InvoicedQuantity>
      <cac:PricingReference>
        <cac:AlternativeConditionPrice>
          <cbc:PriceAmount currencyID="PEN">${formatDecimal(item.valorUnitario)}</cbc:PriceAmount>
          <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
        </cac:AlternativeConditionPrice>
      </cac:PricingReference>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="PEN">${formatDecimal(item.igv)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="PEN">${formatDecimal(item.valorUnitario * item.cantidad)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="PEN">${formatDecimal(item.igv)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:Percent>${SUNAT_TAX_CATEGORIES[item.afectacionIgv as keyof typeof SUNAT_TAX_CATEGORIES]?.porcentaje ?? '18.00'}</cbc:Percent>
            <cac:TaxScheme>
              <cbc:ID>${SUNAT_TAX_CATEGORIES[item.afectacionIgv as keyof typeof SUNAT_TAX_CATEGORIES]?.schemeId ?? '1000'}</cbc:ID>
              <cbc:Name>${SUNAT_TAX_CATEGORIES[item.afectacionIgv as keyof typeof SUNAT_TAX_CATEGORIES]?.schemeName ?? 'IGV'}</cbc:Name>
              <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description>${escapeXml(item.descripcion)}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="PEN">${formatDecimal(item.precioUnitario)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`
    )
    .join('');

  const detraccionXml = factura.detraccion && factura.detraccion.aplica
    ? `
  <cac:PaymentTerms>
    <cbc:ID>Detraccion</cbc:ID>
    <cbc:PaymentMeansID>${factura.detraccion.codigo}</cbc:PaymentMeansID>
    <cbc:PaymentPercent>${formatDecimal(factura.detraccion.porcentaje)}</cbc:PaymentPercent>
    <cbc:Amount currencyID="PEN">${formatDecimal(factura.detraccion.monto)}</cbc:Amount>
  </cac:PaymentTerms>`
    : '';

  const [serie, ...correlativos] = factura.numero.split('-');
  const correlativo = correlativos.join('-');

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sac:DUEDate>${factura.fechaEmision}</sac:DUEDate>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(factura.numero)}</cbc:ID>
  <cbc:IssueDate>${factura.fechaEmision}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="SUNAT:Identificador de Tipo de Documento">${tipoComprobante}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:Signature>
    <cbc:ID>SignST</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${EMISOR.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(EMISOR.razonSocial)}</cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cbc:ExternalReference>
        <cbc:URI>#signaturevalue</cbc:URI>
      </cbc:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="6">${EMISOR.ruc}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${escapeXml(EMISOR.razonSocial)}</cbc:Name>
    </cac:PartyName>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXml(EMISOR.razonSocial)}</cbc:RegistrationName>
      <cbc:CompanyID schemeID="6">${EMISOR.ruc}</cbc:CompanyID>
      <cac:RegistrationAddress>
        <cbc:AddressTypeCode>0</cbc:AddressTypeCode>
        <cbc:CitySubdivisionName>LIMA</cbc:CitySubdivisionName>
        <cbc:CityName>LIMA</cbc:CityName>
        <cbc:CountrySubentity>LIMA</cbc:CountrySubentity>
        <cbc:District>01</cbc:District>
        <cbc:Province>01</cbc:Province>
        <cbc:Department>15</cbc:Department>
        <cac:AddressLine>
          <cbc:Line>${escapeXml(EMISOR.direccion)}</cbc:Line>
        </cac:AddressLine>
        <cac:Country>
          <cbc:IdentificationCode>PE</cbc:IdentificationCode>
        </cac:Country>
      </cac:RegistrationAddress>
    </cac:PartyLegalEntity>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="${codigoTipoDoc}">${cliente.numeroDoc}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${escapeXml(cliente.razonSocial)}</cbc:Name>
    </cac:PartyName>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXml(cliente.razonSocial)}</cbc:RegistrationName>
      <cbc:CompanyID schemeID="${codigoTipoDoc}">${cliente.numeroDoc}</cbc:CompanyID>
      <cac:RegistrationAddress>
        <cac:AddressLine>
          <cbc:Line>${escapeXml(cliente.direccion)}</cbc:Line>
        </cac:AddressLine>
        <cac:Country>
          <cbc:IdentificationCode>PE</cbc:IdentificationCode>
        </cac:Country>
      </cac:RegistrationAddress>
    </cac:PartyLegalEntity>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${formatDecimal(factura.igv)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${formatDecimal(factura.subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${formatDecimal(factura.igv)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>18.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  ${detraccionXml}
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${formatDecimal(factura.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${formatDecimal(factura.total)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${formatDecimal(factura.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${itemsXml}
</Invoice>`;

  return xml;
}

/**
 * Genera XML UBL 2.1 de Guía de Remisión (DespatchAdvice)
 */
export function generarXmlGuiaRemision(guia: GuiaRemision): string {
  const tipoGuiaCode = guia.tipoGuia === 'transportista' ? '31' : '09';

  const transportistaXml = guia.transportista
    ? `
  <cac:ShipmentParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="6">${guia.transportista.ruc}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${escapeXml(guia.transportista.razonSocial)}</cbc:Name>
    </cac:PartyName>
    <cac:Transport>
      <cac:TransportEquipment>
        <cbc:ID>${guia.transportista.placa}</cbc:ID>
        <cac:TransportEquipmentSeal>
          <cbc:ID>${guia.transportista.licencia}</cbc:ID>
        </cac:TransportEquipmentSeal>
      </cac:TransportEquipment>
      <cac:TransportMeans>
        <cbc:Description>${guia.transportista.licencia}</cbc:Description>
      </cac:TransportMeans>
    </cac:Transport>
  </cac:ShipmentParty>`
    : '';

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
                xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>1.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(guia.numero)}</cbc:ID>
  <cbc:IssueDate>${guia.fechaEmision}</cbc:IssueDate>
  <cbc:IssueTime>00:00:00</cbc:IssueTime>
  <cbc:DespatchAdviceTypeCode>${tipoGuiaCode}</cbc:DespatchAdviceTypeCode>
  <cac:SupplierParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="6">${EMISOR.ruc}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${escapeXml(EMISOR.razonSocial)}</cbc:Name>
    </cac:PartyName>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXml(EMISOR.razonSocial)}</cbc:RegistrationName>
      <cbc:CompanyID schemeID="6">${EMISOR.ruc}</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:SupplierParty>
  <cac:CustomerParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="${guia.destinatario.tipoDoc}">${guia.destinatario.numeroDoc}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${escapeXml(guia.destinatario.razonSocial)}</cbc:Name>
    </cac:PartyName>
  </cac:CustomerParty>
  ${transportistaXml}
  <cac:Shipment>
    <cbc:ID>1</cbc:ID>
    <cbc:HandlingCode>${guia.motivoTraslado || '01'}</cbc:HandlingCode>
    <cbc:GrossWeightMeasure unitCode="KG">${formatDecimal(guia.pesoTotalKg)}</cbc:GrossWeightMeasure>
    <cac:ShipmentStage>
      <cbc:TransportModeCode>01</cbc:TransportModeCode>
      <cac:TransitPeriod>
        <cbc:StartDate>${guia.fechaInicioTraslado}</cbc:StartDate>
        <cbc:EndDate>${guia.fechaInicioTraslado}</cbc:EndDate>
      </cac:TransitPeriod>
      <cac:CarrierParty>
        <cac:PartyIdentification>
          <cbc:ID schemeID="6">${EMISOR.ruc}</cbc:ID>
        </cac:PartyIdentification>
      </cac:CarrierParty>
    </cac:ShipmentStage>
    <cac:Origin>
      <cac:Address>
        <cbc:CityName>${escapeXml(guia.origen.direccion)}</cbc:CityName>
        <cbc:CitySubdivisionName>${guia.origen.ubigeo}</cbc:CitySubdivisionName>
      </cac:Address>
    </cac:Origin>
    <cac:Destination>
      <cac:Address>
        <cbc:CityName>${escapeXml(guia.destino.direccion)}</cbc:CityName>
        <cbc:CitySubdivisionName>${guia.destino.ubigeo}</cbc:CitySubdivisionName>
      </cac:Address>
    </cac:Destination>
    <cac:GoodsItem>
      <cbc:ID>1</cbc:ID>
      <cbc:Description>${escapeXml(guia.descripcionMercancia)}</cbc:Description>
      <cbc:Quantity unitCode="NIU">${guia.bultos}</cbc:Quantity>
      <cbc:GrossWeightMeasure unitCode="KG">${formatDecimal(guia.pesoTotalKg)}</cbc:GrossWeightMeasure>
    </cac:GoodsItem>
  </cac:Shipment>
</DespatchAdvice>`;

  return xml;
}
