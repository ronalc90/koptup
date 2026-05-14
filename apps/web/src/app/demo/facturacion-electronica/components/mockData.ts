// Mock data y helpers para la demo de Facturación Electrónica multi-país.
// Tipos pequeños, datos inmutables y reglas mínimas por país.

export type CountryCode =
  | 'colombia'
  | 'mexico'
  | 'argentina'
  | 'chile'
  | 'peru'
  | 'uruguay'
  | 'paraguay'
  | 'ecuador';

export interface CountryFiscalRule {
  code: CountryCode;
  flag: string;
  taxIdRegex: RegExp;
  taxIdFormat: string;
  vatRate: number;
  withholdingRate: number;
  icaRate: number;
}

export const COUNTRIES: CountryCode[] = [
  'colombia',
  'mexico',
  'argentina',
  'chile',
  'peru',
  'uruguay',
  'paraguay',
  'ecuador',
];

export const FISCAL_RULES: Record<CountryCode, CountryFiscalRule> = {
  colombia: {
    code: 'colombia',
    flag: '🇨🇴',
    taxIdRegex: /^\d{9,10}-?\d?$/,
    taxIdFormat: '900123456-7',
    vatRate: 0.19,
    withholdingRate: 0.025,
    icaRate: 0.01104,
  },
  mexico: {
    code: 'mexico',
    flag: '🇲🇽',
    taxIdRegex: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i,
    taxIdFormat: 'XAXX010101000',
    vatRate: 0.16,
    withholdingRate: 0.1,
    icaRate: 0,
  },
  argentina: {
    code: 'argentina',
    flag: '🇦🇷',
    taxIdRegex: /^\d{2}-?\d{8}-?\d$/,
    taxIdFormat: '30-12345678-9',
    vatRate: 0.21,
    withholdingRate: 0.03,
    icaRate: 0.025,
  },
  chile: {
    code: 'chile',
    flag: '🇨🇱',
    taxIdRegex: /^\d{7,8}-?[\dkK]$/,
    taxIdFormat: '12345678-9',
    vatRate: 0.19,
    withholdingRate: 0.13,
    icaRate: 0,
  },
  peru: {
    code: 'peru',
    flag: '🇵🇪',
    taxIdRegex: /^\d{11}$/,
    taxIdFormat: '20123456789',
    vatRate: 0.18,
    withholdingRate: 0.03,
    icaRate: 0,
  },
  uruguay: {
    code: 'uruguay',
    flag: '🇺🇾',
    taxIdRegex: /^\d{12}$/,
    taxIdFormat: '123456789012',
    vatRate: 0.22,
    withholdingRate: 0.07,
    icaRate: 0,
  },
  paraguay: {
    code: 'paraguay',
    flag: '🇵🇾',
    taxIdRegex: /^\d{6,8}-?\d$/,
    taxIdFormat: '1234567-8',
    vatRate: 0.1,
    withholdingRate: 0.3,
    icaRate: 0,
  },
  ecuador: {
    code: 'ecuador',
    flag: '🇪🇨',
    taxIdRegex: /^\d{13}$/,
    taxIdFormat: '1790012345001',
    vatRate: 0.15,
    withholdingRate: 0.08,
    icaRate: 0,
  },
};

export type DocStatus = 'accepted' | 'pending' | 'rejected' | 'voided';

export interface IssuedDoc {
  id: string;
  number: string;
  client: string;
  taxId: string;
  date: string;
  amount: number;
  status: DocStatus;
}

export const MOCK_DOCS: IssuedDoc[] = [
  { id: 'd1', number: 'FE-0001245', client: 'Distribuidora Andina', taxId: '900123456-7', date: '2026-05-13', amount: 4_580_000, status: 'accepted' },
  { id: 'd2', number: 'FE-0001246', client: 'Tech Latam SAS', taxId: '901456789-2', date: '2026-05-13', amount: 1_290_500, status: 'accepted' },
  { id: 'd3', number: 'FE-0001247', client: 'Mercado Sur SRL', taxId: '900998877-1', date: '2026-05-12', amount: 7_120_300, status: 'pending' },
  { id: 'd4', number: 'FE-0001248', client: 'Servicios Globales', taxId: '901334455-9', date: '2026-05-12', amount: 980_000, status: 'rejected' },
  { id: 'd5', number: 'FE-0001249', client: 'Importadora Pacífico', taxId: '900111222-3', date: '2026-05-11', amount: 15_450_000, status: 'accepted' },
  { id: 'd6', number: 'FE-0001250', client: 'Grupo Empresarial Norte', taxId: '900665544-8', date: '2026-05-10', amount: 2_310_750, status: 'voided' },
  { id: 'd7', number: 'FE-0001251', client: 'Logística Express', taxId: '901223344-5', date: '2026-05-10', amount: 6_870_000, status: 'accepted' },
];

export interface IncomingDoc {
  id: string;
  supplier: string;
  taxId: string;
  amount: number;
  date: string;
  ocrConfidence: number;
  taxIdValid: boolean;
  duplicate: boolean;
  decision: 'pending' | 'approved' | 'rejected';
}

export const MOCK_INCOMING: IncomingDoc[] = [
  { id: 'i1', supplier: 'Papelería Central', taxId: '900224466-1', amount: 320_500, date: '2026-05-13', ocrConfidence: 0.98, taxIdValid: true, duplicate: false, decision: 'pending' },
  { id: 'i2', supplier: 'Energía Plus', taxId: '901556677-4', amount: 1_245_000, date: '2026-05-13', ocrConfidence: 0.95, taxIdValid: true, duplicate: false, decision: 'pending' },
  { id: 'i3', supplier: 'Internet Fibra Co', taxId: '901334455-9', amount: 489_900, date: '2026-05-12', ocrConfidence: 0.87, taxIdValid: false, duplicate: false, decision: 'pending' },
  { id: 'i4', supplier: 'Mantenimiento HVAC', taxId: '900778899-2', amount: 2_100_000, date: '2026-05-12', ocrConfidence: 0.92, taxIdValid: true, duplicate: true, decision: 'pending' },
];

export interface Brand {
  id: string;
  name: string;
  domain: string;
  clients: number;
  monthlyDocs: number;
  status: 'active' | 'trial';
}

export const MOCK_BRANDS: Brand[] = [
  { id: 'b1', name: 'FacturaYa', domain: 'app.facturaya.co', clients: 142, monthlyDocs: 28_400, status: 'active' },
  { id: 'b2', name: 'NubeFiscal', domain: 'panel.nubefiscal.mx', clients: 89, monthlyDocs: 16_200, status: 'active' },
  { id: 'b3', name: 'BillSur', domain: 'billsur.com.ar', clients: 23, monthlyDocs: 3_100, status: 'trial' },
];

export interface ReceptionLine {
  description: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
  withholding: number;
}

export const SAMPLE_LINES: ReceptionLine[] = [
  { description: 'Servicio consultoría tecnológica', qty: 10, unitPrice: 180_000, vatRate: 0.19, withholding: 0.025 },
  { description: 'Licencia plataforma SaaS — mensual', qty: 1, unitPrice: 950_000, vatRate: 0.19, withholding: 0 },
];

export function formatMoney(amount: number, symbol: string): string {
  return `${symbol} ${amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

export function generateUuid(prefix: string): string {
  const hex = (n: number) => Math.floor(Math.random() * 16 ** n).toString(16).padStart(n, '0');
  return `${prefix}-${hex(8)}-${hex(4)}-${hex(4)}-${hex(12)}`.toUpperCase();
}

export interface CodeSample {
  language: 'ts' | 'python' | 'go';
  code: string;
}

export const CODE_SAMPLES: CodeSample[] = [
  {
    language: 'ts',
    code: `import { Koptup } from '@koptup/sdk';

const client = new Koptup({ apiKey: process.env.KOPTUP_KEY });

const invoice = await client.invoices.create({
  country: 'colombia',
  receiver: { taxId: '900123456-7', name: 'Acme SAS' },
  lines: [
    { description: 'Consultoría', qty: 10, unitPrice: 180_000, vatRate: 0.19 },
  ],
});

console.log(invoice.cufe, invoice.status); // ACCEPTED`,
  },
  {
    language: 'python',
    code: `from koptup import Koptup

client = Koptup(api_key=os.environ["KOPTUP_KEY"])

invoice = client.invoices.create(
    country="mexico",
    receiver={"tax_id": "XAXX010101000", "name": "Acme SA"},
    lines=[{"description": "Software", "qty": 1, "unit_price": 12000, "vat_rate": 0.16}],
)

print(invoice.uuid, invoice.status)  # ACCEPTED`,
  },
  {
    language: 'go',
    code: `package main

import "github.com/koptup/go-sdk"

func main() {
    c := koptup.New(os.Getenv("KOPTUP_KEY"))
    inv, _ := c.Invoices.Create(&koptup.InvoiceInput{
        Country: "peru",
        Receiver: koptup.Party{TaxID: "20123456789", Name: "Acme SAC"},
        Lines: []koptup.Line{{Description: "Hosting", Qty: 1, UnitPrice: 450}},
    })
    fmt.Println(inv.UUID, inv.Status)
}`,
  },
];

export const ENDPOINTS: { method: string; path: string; desc: string }[] = [
  { method: 'POST', path: '/v1/invoices', desc: 'Emitir factura electrónica' },
  { method: 'POST', path: '/v1/credit-notes', desc: 'Emitir nota crédito' },
  { method: 'GET', path: '/v1/invoices/:id', desc: 'Consultar documento' },
  { method: 'POST', path: '/v1/reception/parse', desc: 'OCR + parser proveedor' },
  { method: 'GET', path: '/v1/reports/sales', desc: 'Libro de ventas periodo' },
];
