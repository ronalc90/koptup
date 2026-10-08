import fs from 'fs';
import { parsePdf } from '../utils/pdf-parse';

export interface DatosFacturaPDF {
  // SECCIÓN 1: DATOS DE RADICACIÓN/FACTURA
  nroRadicacion: string;
  fechaRadicacion: string;
  nroFactura: string;
  fechaFactura: string;
  valorBrutoFactura: number;
  valorIVA: number;
  valorNetoFactura: number;
  nroAtenciones: number;
  prefijoFactura: string;
  consecutivoFactura: string;
  tipoDocumentoIPS: string;
  regional: string;
  estadoFactura: string;
  observacion: string;

  // SECCIÓN 2: DATOS DEL PROCEDIMIENTO/SERVICIO
  codigoProcedimiento: string;
  nombreProcedimiento: string;
  mapiss: string;
  cantParagr: number;
  matricUno: string;
  matrizLiquidacion: string;
  valorIPS: number;
  cant: number;
  valorAPagar: number;
  valorNotaCredito: number;
  gestionGlosas: string;
  valorGlosaAdmitiva: number;
  valorGlosaAuditoria: number;
  estado: string;
  categoria: string;
  tipoLiquidacion: string;
  valor: number;
  subServicioContratado: string;
  uvr: number;
  regimen: string;
  convenioPaC: string;
  tipoDocumentoIPS2: string;

  // SECCIÓN 2.1: MÚLTIPLES PROCEDIMIENTOS (opcional - para facturas con varios procedimientos)
  procedimientos?: Array<{
    codigoProcedimiento: string;
    nombreProcedimiento: string;
    cant: number;
    valorUnitario: number;
  }>;

  // SECCIÓN 3: DETALLE DE GLOSAS
  codigoDevolucion: string;
  cantGlosada: number;
  vlrUnitGlosado: number;
  valorDevolucion: number;
  observacionesGlosa: string;
  origen: string;
  usuario: string;
  codigoDevolucionItem: string;
  totalGlosas: number;
  diferencia: number;

  // SECCIÓN 4: DATOS DE AUTORIZACIÓN
  nroAutNvo: string;
  autorizacion: string;
  pai: string;
  formaDePago: string;
  observacionAut: string;

  // SECCIÓN 5: DATOS PACIENTE Y ATENCIÓN
  tipoDocumentoPaciente: string;
  numeroDocumento: string;
  nombrePaciente: string;
  regimenPaciente: string;
  categoriaPaciente: string;
  tipoAfiliado: string;
  direccion: string;
  telefono: string;
  departamento: string;
  municipio: string;

  // SECCIÓN 6: DIAGNÓSTICOS
  diagnosticoPrincipal: string;
  diagnosticoRelacionado1: string;
  diagnosticoRelacionado2: string;
  diagnosticoEgreso: string;

  // SECCIÓN 7: FECHAS Y TIEMPOS
  fechaIngreso: string;
  horaIngreso: string;
  fechaEgreso: string;
  horaEgreso: string;
  servicioEgreso: string;
  cama: string;

  // SECCIÓN 8: VALORES FINALES
  vlrBrutoFact: number;
  vlrNetoFact: number;
  netoDigitado: number;
  dif: number;
  docValorIPS: number;
  copago: number;
  cmo: number; // Cuota Moderadora
  dacto: number;
  totales: number;
}

class PDFExtractorService {
  /**
   * Extrae datos de un PDF de factura médica
   */
  async extraerDatosFactura(filePath: string): Promise<DatosFacturaPDF> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await parsePdf(dataBuffer);
      const texto = data.text;

      console.log('📄 PDF Texto extraído (primeros 500 caracteres):');
      console.log(texto.substring(0, 500));

      return this.parsearTextoFactura(texto);
    } catch (error) {
      console.error('Error extrayendo datos del PDF:', error);
      throw error;
    }
  }

  /**
   * Parsea el texto extraído del PDF y extrae los campos
   */
  private parsearTextoFactura(texto: string): DatosFacturaPDF {
    // Normalizar texto (eliminar saltos de línea múltiples, espacios extra)
    const textoNormalizado = texto.replace(/\s+/g, ' ').trim();

    return {
      // SECCIÓN 1: DATOS DE RADICACIÓN/FACTURA
      nroRadicacion: this.extraerCampo(textoNormalizado, /Radicaci[oó]n(?:\s*No\.?)?[:\s]+(\d+)/i) || '',
      fechaRadicacion: this.extraerFecha(textoNormalizado, /Fecha.*?Radicaci[oó]n[:\s]+([0-9\/\-\.]+)/i),
      nroFactura: this.extraerCampo(textoNormalizado, /Factura(?:\s*Electr[oó]nica)?(?:\s*de\s*Venta)?(?:\s*No\.?)?[:\s]+([A-Z0-9]+)/i) || '',
      fechaFactura: this.extraerFecha(textoNormalizado, /Fecha(?:\s*de)?(?:\s*Expedici[oó]n)?[:\s]+([0-9\/\-\.]+)/i),
      valorBrutoFactura: this.extraerValor(textoNormalizado, /(?:EXENTO|SUBTOTAL|Valor\s*Total)[:\s]*\$?\s*([\d,.]+)/i),
      valorIVA: this.extraerValor(textoNormalizado, /IVA[:\s]*\$?\s*([\d,.]+)/i),
      valorNetoFactura: this.extraerValor(textoNormalizado, /(?:TOTAL\s*A\s*COBRAR|Valor\s*Total)[:\s]*\$?\s*([\d,.]+)/i),
      nroAtenciones: parseInt(this.extraerCampo(textoNormalizado, /Total\s*Lineas?[:\s]+(\d+)/i) || '1'),
      prefijoFactura: this.extraerCampo(textoNormalizado, /(?:PREFIJO|Factura)\s*([A-Z]+)\d+/i) || '',
      consecutivoFactura: this.extraerCampo(textoNormalizado, /Factura.*?([0-9]{7,})/i) || '',
      tipoDocumentoIPS: this.extraerCampo(textoNormalizado, /NIT[:\s]*([\d\-]+)/i) || '',
      regional: '',
      estadoFactura: 'EST',
      observacion: 'Radicación exitosa',

      // SECCIÓN 2: DATOS DEL PROCEDIMIENTO/SERVICIO
      codigoProcedimiento: this.extraerCodigoCUPS(textoNormalizado),
      nombreProcedimiento: this.extraerNombreProcedimiento(textoNormalizado),
      mapiss: '',
      cantParagr: 1,
      matricUno: '',
      matrizLiquidacion: this.extraerCodigoCUPS(textoNormalizado),
      valorIPS: this.extraerValorServicio(textoNormalizado),
      cant: parseInt(this.extraerCampo(textoNormalizado, /Cant(?:idad)?[:\s]+([\d.]+)/i) || '1'),
      valorAPagar: 0, // Se calculará con tarifario
      valorNotaCredito: 0,
      gestionGlosas: '',
      valorGlosaAdmitiva: 0, // Se calculará: valorIPS - valorAPagar
      valorGlosaAuditoria: 0,
      estado: 'UNILA',
      categoria: '',
      tipoLiquidacion: '',
      valor: 0,
      subServicioContratado: '',
      uvr: 0,
      regimen: this.extraerRegimen(textoNormalizado),
      convenioPaC: '',
      tipoDocumentoIPS2: this.extraerCampo(textoNormalizado, /NIT[:\s]*([\d\-]+)/i) || '',

      // SECCIÓN 3: DETALLE DE GLOSAS
      codigoDevolucion: '202', // Código estándar para diferencia de tarifa
      cantGlosada: 1,
      vlrUnitGlosado: 0, // Se calculará
      valorDevolucion: 0, // Se calculará
      observacionesGlosa: '',
      origen: 'SISTEMA',
      usuario: '',
      codigoDevolucionItem: '0',
      totalGlosas: 0,
      diferencia: 0,

      // SECCIÓN 4: DATOS DE AUTORIZACIÓN
      nroAutNvo: this.extraerCampo(textoNormalizado, /Episodio(?:\s*No\.?)?[:\s]+(\d+)/i) || '',
      autorizacion: this.extraerCampo(textoNormalizado, /(?:N[uú]mero\s*de\s*)?Autorizaci[oó]n[:\s]+([A-Z0-9\-]+)/i) || '',
      pai: '',
      formaDePago: this.extraerCampo(textoNormalizado, /Forma\s*de\s*Pago[:\s]+([A-Za-z]+)/i) || 'NORMAL',
      observacionAut: '',

      // SECCIÓN 5: DATOS PACIENTE Y ATENCIÓN
      tipoDocumentoPaciente: this.extraerTipoDocumento(textoNormalizado),
      numeroDocumento: this.extraerNumeroDocumento(textoNormalizado),
      nombrePaciente: this.extraerNombrePaciente(textoNormalizado),
      regimenPaciente: this.extraerRegimen(textoNormalizado),
      categoriaPaciente: this.extraerCampo(textoNormalizado, /Categor[ií]a[:\s]+([A-Z0-9\-\s]+?)(?:\s|Tipo)/i) || '',
      tipoAfiliado: this.extraerCampo(textoNormalizado, /Tipo\s*(?:de\s*)?(?:Afiliado|vinculaci[oó]n)[:\s]+([A-Z:\s]+?)(?:\s|Cama)/i) || '',
      direccion: this.extraerCampo(textoNormalizado, /Direcci[oó]n(?:\s*de\s*domicilio)?[:\s]+([^Tel]+?)(?:Tel|$)/i) || '',
      telefono: this.extraerCampo(textoNormalizado, /Tel[eé]fono(?:\s*domicilio)?[:\s]+([\d\s]+)/i) || '',
      departamento: this.extraerDepartamento(textoNormalizado),
      municipio: this.extraerMunicipio(textoNormalizado),

      // SECCIÓN 6: DIAGNÓSTICOS
      diagnosticoPrincipal: this.extraerDiagnosticoPrincipal(textoNormalizado),
      diagnosticoRelacionado1: '',
      diagnosticoRelacionado2: '',
      diagnosticoEgreso: this.extraerDiagnosticoPrincipal(textoNormalizado),

      // SECCIÓN 7: FECHAS Y TIEMPOS
      fechaIngreso: this.extraerFecha(textoNormalizado, /Fecha\s*de\s*(?:Ingreso|ingreso)[:\s]+([0-9\/\-\.]+)/i),
      horaIngreso: this.extraerHora(textoNormalizado, /Fecha\s*de\s*(?:Ingreso|ingreso)[:\s]+[0-9\/\-\.]+\s+([0-9:]+)/i),
      fechaEgreso: this.extraerFecha(textoNormalizado, /Fecha\s*de\s*(?:Egreso|egreso)[:\s]+([0-9\/\-\.]+)/i),
      horaEgreso: this.extraerHora(textoNormalizado, /Fecha\s*de\s*(?:Egreso|egreso)[:\s]+[0-9\/\-\.]+\s+([0-9:]+)/i),
      servicioEgreso: '',
      cama: '',

      // SECCIÓN 8: VALORES FINALES
      vlrBrutoFact: this.extraerValor(textoNormalizado, /(?:EXENTO|SUBTOTAL)[:\s]*\$?\s*([\d,.]+)/i),
      vlrNetoFact: this.extraerValor(textoNormalizado, /(?:TOTAL\s*A\s*COBRAR)[:\s]*\$?\s*([\d,.]+)/i),
      netoDigitado: this.extraerValor(textoNormalizado, /(?:TOTAL\s*A\s*COBRAR)[:\s]*\$?\s*([\d,.]+)/i),
      dif: 0,
      docValorIPS: this.extraerValor(textoNormalizado, /(?:EXENTO|SUBTOTAL)[:\s]*\$?\s*([\d,.]+)/i),
      copago: 0,
      cmo: this.extraerValor(textoNormalizado, /(?:CUOTA\s*MODERADORA)[:\s]*\$?\s*([\d,.]+)/i),
      dacto: 0,
      totales: this.extraerValor(textoNormalizado, /(?:TOTAL\s*A\s*COBRAR)[:\s]*\$?\s*([\d,.]+)/i),
    };
  }

  /**
   * Extrae un campo usando regex
   */
  private extraerCampo(texto: string, regex: RegExp): string | null {
    const match = texto.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extrae un valor numérico
   */
  private extraerValor(texto: string, regex: RegExp): number {
    const match = texto.match(regex);
    if (!match) return 0;

    // Limpiar el valor: remover puntos de miles y reemplazar coma por punto
    const valorLimpio = match[1]
      .replace(/\./g, '') // Remover puntos de miles
      .replace(',', '.') // Reemplazar coma decimal por punto
      .trim();

    return parseFloat(valorLimpio) || 0;
  }

  /**
   * Extrae una fecha en formato DD/MM/YYYY
   */
  private extraerFecha(texto: string, regex: RegExp): string {
    const match = texto.match(regex);
    if (!match) return '';

    // Convertir diferentes formatos a DD/MM/YYYY
    let fecha = match[1].trim();

    // Si es formato DD.MM.YYYY, convertir a DD/MM/YYYY
    fecha = fecha.replace(/\./g, '/');

    // Si es formato YYYY-MM-DD, convertir a DD/MM/YYYY
    if (fecha.match(/^\d{4}-\d{2}-\d{2}/)) {
      const partes = fecha.split('-');
      fecha = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return fecha;
  }

  /**
   * Extrae una hora en formato HH:MM
   */
  private extraerHora(texto: string, regex: RegExp): string {
    const match = texto.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extrae código CUPS del procedimiento
   */
  private extraerCodigoCUPS(texto: string): string {
    // Buscar todos los códigos de 6 dígitos
    const matches = texto.match(/\b(\d{6})\b/g);

    console.log('🔍 Códigos de 6 dígitos encontrados:', matches);

    if (!matches || matches.length === 0) return '';

    // Filtrar códigos CUPS válidos (deben empezar con 8 o 9)
    const codigosValidos = matches.filter(codigo => codigo.startsWith('8') || codigo.startsWith('9'));

    console.log('✅ Códigos CUPS válidos (empiezan con 8 o 9):', codigosValidos);

    // Retornar el primer código válido, o el primero encontrado si no hay válidos
    return codigosValidos.length > 0 ? codigosValidos[0] : matches[0];
  }

  /**
   * Extrae nombre del procedimiento
   */
  private extraerNombreProcedimiento(texto: string): string {
    // Buscar descripción después del código
    const match = texto.match(/\d{6}\s+([A-ZÁÉÍÓÚ][A-ZÁÉÍÓÚa-záéíóú\s]+?)(?:\s+\d|\s+Cant|$)/i);
    return match ? match[1].trim() : 'CONSULTA PRIMERA VEZ MEDICINA ESPECIALIZADA';
  }

  /**
   * Extrae valor del servicio
   */
  private extraerValorServicio(texto: string): number {
    // Buscar "Valor Unitario" o similar
    const match = texto.match(/Valor\s*(?:Unitario|Total)?[:\s]*\$?\s*([\d,.]+)/i);
    if (!match) return 0;

    const valorLimpio = match[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(valorLimpio) || 0;
  }

  /**
   * Extrae tipo de documento del paciente
   */
  private extraerTipoDocumento(texto: string): string {
    const match = texto.match(/Tipo\s*de\s*(?:Identificaci[oó]n|documento)[:\s]+(RC|CC|TI|CE|PA|MS)/i);
    return match ? match[1].toUpperCase() : 'RC';
  }

  /**
   * Extrae número de documento del paciente
   */
  private extraerNumeroDocumento(texto: string): string {
    // Intentar múltiples patrones
    let match = texto.match(/(?:N[uú]mero\s*de\s*(?:Identificaci[oó]n|documento)|Identificaci[oó]n)[:\s]+([\d]+)/i);

    if (!match) {
      // Buscar "CC" o "RC" seguido de número
      match = texto.match(/(?:CC|RC|TI)[:\s]+([\d]+)/i);
    }

    if (!match) {
      // Buscar cualquier secuencia de 7-10 dígitos después de tipo de documento
      match = texto.match(/(?:CC|RC|TI|CE)\s+([\d]{7,10})/i);
    }

    console.log('📄 Número de documento extraído:', match ? match[1] : 'NO ENCONTRADO');
    return match ? match[1] : '';
  }

  /**
   * Extrae nombre completo del paciente
   */
  private extraerNombrePaciente(texto: string): string {
    // Intentar múltiples patrones
    let match = texto.match(/Nombre\s*del\s*[Pp]aciente[:\s]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\s+Fecha|Tipo|Sexo|Documento|$)/i);

    if (!match) {
      // Intentar formato "APELLIDOS NOMBRES"
      const apellidos = texto.match(/APELLIDOS\s*DEL\s*PACIENTE[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?:\s+NOMBRES|$)/i);
      const nombres = texto.match(/NOMBRES\s*DEL\s*PACIENTE[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?:\s+Fecha|Tipo|$)/i);

      if (apellidos && nombres) {
        const nombreCompleto = `${nombres[1].trim()} ${apellidos[1].trim()}`;
        console.log('👤 Nombre del paciente extraído (formato APELLIDOS/NOMBRES):', nombreCompleto);
        return nombreCompleto;
      }
    }

    if (!match) {
      // Buscar nombre después de "Paciente:"
      match = texto.match(/Paciente[:\s]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]{5,50}?)(?:\s+(?:CC|RC|TI|Documento)|$)/i);
    }

    console.log('👤 Nombre del paciente extraído:', match ? match[1].trim() : 'NO ENCONTRADO');
    return match ? match[1].trim() : '';
  }

  /**
   * Extrae régimen (Contributivo, Subsidiado, etc)
   */
  private extraerRegimen(texto: string): string {
    const match = texto.match(/(?:R[eé]gimen|REGIMEN)[:\s]+(Contributivo|Subsidiado|Especial)/i);
    return match ? match[1] : 'CONTRIBUTIVO';
  }

  /**
   * Extrae departamento
   */
  private extraerDepartamento(texto: string): string {
    const match = texto.match(/(?:Lugar\s*de\s*residencia|Departamento)[:\s]+([a-záéíóú]+)/i);
    return match ? match[1].toUpperCase() : 'CUNDINAMARCA';
  }

  /**
   * Extrae municipio
   */
  private extraerMunicipio(texto: string): string {
    // Buscar en dirección o ciudad
    const match = texto.match(/\b(BOGOTA|CAJICA|CHIA|SOACHA|FUNZA|MADRID|MOSQUERA|FACATATIVA|ZIPAQUIRA)\b/i);
    return match ? match[1].toUpperCase() : '';
  }

  /**
   * Extrae diagnóstico principal (código CIE-10)
   */
  private extraerDiagnosticoPrincipal(texto: string): string {
    // Primero buscar cerca de "Diagnóstico Principal" o "Dx Principal"
    let match = texto.match(/(?:Diagn[oó]stico\s*Principal|Dx\s*Principal|Diagnostico\s*de\s*ingreso)[:\s]+([A-Z]\d{2,3}(?:\.\d)?)/i);

    if (!match) {
      // Buscar todos los códigos CIE-10 y filtrar los más probables
      const matches = texto.match(/\b([A-Z]\d{2,3}(?:\.\d)?)\b/g);
      console.log('🏥 Códigos CIE-10 encontrados:', matches);

      if (matches && matches.length > 0) {
        // Filtrar códigos que no son CIE-10 comunes (evitar códigos como V03 que son de vehículos)
        // Priorizar códigos que empiezan con letras comunes en diagnósticos médicos
        const codigosValidos = matches.filter(codigo => {
          const letra = codigo.charAt(0);
          // Priorizar diagnósticos médicos comunes (A-U excepto V para vehículos)
          return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'].includes(letra);
        });

        console.log('✅ Códigos CIE-10 válidos (diagnósticos médicos):', codigosValidos);

        if (codigosValidos.length > 0) {
          return codigosValidos[0];
        }

        return matches[0];
      }
    }

    console.log('🏥 Diagnóstico principal extraído:', match ? match[1] : 'NO ENCONTRADO');
    return match ? match[1] : '';
  }

  /**
   * Extrae datos de una historia clínica PDF
   */
  async extraerDatosHistoriaClinica(filePath: string): Promise<Partial<DatosFacturaPDF>> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await parsePdf(dataBuffer);
      const texto = data.text;

      console.log('📋 Historia Clínica - Texto extraído (primeros 500 caracteres):');
      console.log(texto.substring(0, 500));

      const textoNormalizado = texto.replace(/\s+/g, ' ').trim();

      return {
        // Extraer datos adicionales de la historia clínica
        diagnosticoPrincipal: this.extraerDiagnosticoPrincipal(textoNormalizado),
        nombrePaciente: this.extraerNombrePaciente(textoNormalizado),
        numeroDocumento: this.extraerNumeroDocumento(textoNormalizado),
        tipoDocumentoPaciente: this.extraerTipoDocumento(textoNormalizado),
        fechaIngreso: this.extraerFecha(textoNormalizado, /Fecha\s*de\s*la\s*atenci[oó]n[:\s]+([0-9\/\-\.]+)/i),
        autorizacion: this.extraerCampo(textoNormalizado, /Episodio[:\s]+(\d+)/i) || '',
      };
    } catch (error) {
      console.error('Error extrayendo datos de historia clínica:', error);
      throw error;
    }
  }
}

export default new PDFExtractorService();
