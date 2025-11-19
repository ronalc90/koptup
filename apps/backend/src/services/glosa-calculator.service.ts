import { DatosFacturaPDF } from './pdf-extractor.service';

/**
 * Tarifario de Nueva EPS para procedimientos CUPS más comunes
 * Estos valores son ejemplos basados en contratos típicos Nueva EPS
 * En producción, esto debería venir de una base de datos
 */
const TARIFARIO_NUEVA_EPS: Record<string, { valor: number; descripcion: string }> = {
  '890201': { valor: 25000, descripcion: 'CONSULTA DE PRIMERA VEZ POR MEDICINA GENERAL' },
  '890281': { valor: 12510, descripcion: 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN ORTOPEDIA' },
  '890202': { valor: 38000, descripcion: 'CONSULTA DE PRIMERA VEZ POR MEDICINA ESPECIALIZADA' },
  '890301': { valor: 20000, descripcion: 'CONSULTA DE CONTROL O SEGUIMIENTO MEDICINA GENERAL' },
  '890381': { valor: 10000, descripcion: 'CONSULTA DE CONTROL O SEGUIMIENTO ESPECIALISTA' },
  '891201': { valor: 45000, descripcion: 'CONSULTA DE URGENCIAS MEDICINA GENERAL' },
  '871101': { valor: 85000, descripcion: 'RADIOGRAFIA DE TORAX' },
  '871411': { valor: 120000, descripcion: 'RADIOGRAFIA DE CADERA' },
  '873411': { valor: 95000, descripcion: 'RADIOGRAFIA DE CADERA O ARTICULACION COXO FEMORAL (AP LATERAL)' },
  '873412': { valor: 110000, descripcion: 'RADIOGRAFIA DE CADERA COMPARATIVA' },
  '902209': { valor: 15000, descripcion: 'TOMA DE MUESTRA DE LABORATORIO CLINICO' },
  '902210': { valor: 8500, descripcion: 'HEMOGRAMA' },
  '902211': { valor: 6500, descripcion: 'GLUCEMIA' },
  '902212': { valor: 9500, descripcion: 'CREATININA' },
  // Agregar más códigos según necesidad
};

export interface GlosaCalculada {
  codigo: string;
  tipo: 'DIFERENCIA_TARIFA' | 'SIN_AUTORIZACION' | 'DUPLICADO' | 'PERTINENCIA';
  codigoProcedimiento: string;
  descripcionProcedimiento: string;
  valorIPS: number;
  valorContrato: number;
  diferencia: number;
  cantidad: number;
  valorTotalGlosa: number;
  observacion: string;
  automatica: boolean;
}

class GlosaCalculatorService {
  /**
   * Calcula glosas para una factura basándose en el tarifario de Nueva EPS
   */
  calcularGlosas(datosFactura: DatosFacturaPDF): {
    valorAPagar: number;
    valorGlosaAdmitiva: number;
    glosas: GlosaCalculada[];
    observacion: string;
  } {
    const glosas: GlosaCalculada[] = [];
    const codigoCUPS = datosFactura.codigoProcedimiento || datosFactura.matrizLiquidacion;

    if (!codigoCUPS) {
      console.warn('⚠️ No se encontró código CUPS en la factura');
      return {
        valorAPagar: datosFactura.valorIPS,
        valorGlosaAdmitiva: 0,
        glosas: [],
        observacion: 'No se encontró código CUPS para validar tarifa',
      };
    }

    // Buscar tarifa en el tarifario de Nueva EPS
    const tarifaNuevaEPS = TARIFARIO_NUEVA_EPS[codigoCUPS];

    if (!tarifaNuevaEPS) {
      console.warn(`⚠️ Código CUPS ${codigoCUPS} no encontrado en tarifario Nueva EPS`);

      // Si no está en el tarifario, aplicar un descuento estándar del 30%
      const valorAPagar = Math.round(datosFactura.valorIPS * 0.7);
      const diferencia = datosFactura.valorIPS - valorAPagar;

      glosas.push({
        codigo: '202',
        tipo: 'DIFERENCIA_TARIFA',
        codigoProcedimiento: codigoCUPS,
        descripcionProcedimiento: datosFactura.nombreProcedimiento || 'Procedimiento no especificado',
        valorIPS: datosFactura.valorIPS,
        valorContrato: valorAPagar,
        diferencia: diferencia,
        cantidad: datosFactura.cant || 1,
        valorTotalGlosa: diferencia * (datosFactura.cant || 1),
        observacion: `202 - SE GLOSA ${datosFactura.nombreProcedimiento} POR DIFERENCIA DE TARIFA (código no en tarifario, se aplica 30% descuento estándar) - Admiva`,
        automatica: true,
      });

      return {
        valorAPagar,
        valorGlosaAdmitiva: diferencia * (datosFactura.cant || 1),
        glosas,
        observacion: `Código ${codigoCUPS} no encontrado en tarifario Nueva EPS. Se aplica descuento estándar 30%.`,
      };
    }

    // Calcular diferencia con tarifa de Nueva EPS
    const valorContratoNuevaEPS = tarifaNuevaEPS.valor;
    const valorIPS = datosFactura.valorIPS;
    const cantidad = datosFactura.cant || 1;

    console.log(`💰 Comparando tarifas para ${codigoCUPS}:`);
    console.log(`   - Valor IPS: $${valorIPS.toLocaleString('es-CO')}`);
    console.log(`   - Valor Nueva EPS: $${valorContratoNuevaEPS.toLocaleString('es-CO')}`);

    if (valorIPS > valorContratoNuevaEPS) {
      // Hay diferencia de tarifa - GENERAR GLOSA
      const diferencia = valorIPS - valorContratoNuevaEPS;
      const valorTotalGlosa = diferencia * cantidad;

      console.log(`   ❌ GLOSA: $${diferencia.toLocaleString('es-CO')} por unidad`);
      console.log(`   ❌ GLOSA TOTAL: $${valorTotalGlosa.toLocaleString('es-CO')} (${cantidad} unidad/es)`);

      glosas.push({
        codigo: '202',
        tipo: 'DIFERENCIA_TARIFA',
        codigoProcedimiento: codigoCUPS,
        descripcionProcedimiento: tarifaNuevaEPS.descripcion,
        valorIPS: valorIPS,
        valorContrato: valorContratoNuevaEPS,
        diferencia: diferencia,
        cantidad: cantidad,
        valorTotalGlosa: valorTotalGlosa,
        observacion: `202 - SE GLOSA ${tarifaNuevaEPS.descripcion} POR DIFERENCIA DE TARIFA. IPS facturó $${valorIPS.toLocaleString('es-CO')} pero el contrato Nueva EPS permite máximo $${valorContratoNuevaEPS.toLocaleString('es-CO')} - Admiva`,
        automatica: true,
      });

      return {
        valorAPagar: valorContratoNuevaEPS,
        valorGlosaAdmitiva: valorTotalGlosa,
        glosas,
        observacion: `Se glosa por diferencia de tarifa: IPS cobra $${valorIPS.toLocaleString('es-CO')} vs Nueva EPS $${valorContratoNuevaEPS.toLocaleString('es-CO')}`,
      };
    } else {
      // Valor IPS está dentro del tarifario - NO HAY GLOSA
      console.log(`   ✅ SIN GLOSA: Valor dentro del tarifario Nueva EPS`);

      return {
        valorAPagar: valorIPS,
        valorGlosaAdmitiva: 0,
        glosas: [],
        observacion: 'Valor dentro del tarifario contractual Nueva EPS',
      };
    }
  }

  /**
   * Obtiene la tarifa de Nueva EPS para un código CUPS
   */
  obtenerTarifaNuevaEPS(codigoCUPS: string): { valor: number; descripcion: string } | null {
    return TARIFARIO_NUEVA_EPS[codigoCUPS] || null;
  }

  /**
   * Valida si un procedimiento requiere autorización
   */
  validarAutorizacion(
    datosFactura: DatosFacturaPDF,
    autorizacionRequerida: boolean = true
  ): GlosaCalculada | null {
    if (!autorizacionRequerida) {
      return null;
    }

    if (!datosFactura.autorizacion || datosFactura.autorizacion === '') {
      return {
        codigo: '203',
        tipo: 'SIN_AUTORIZACION',
        codigoProcedimiento: datosFactura.codigoProcedimiento,
        descripcionProcedimiento: datosFactura.nombreProcedimiento,
        valorIPS: datosFactura.valorIPS,
        valorContrato: 0,
        diferencia: datosFactura.valorIPS,
        cantidad: datosFactura.cant || 1,
        valorTotalGlosa: datosFactura.valorIPS * (datosFactura.cant || 1),
        observacion: `203 - SE GLOSA ${datosFactura.nombreProcedimiento} POR FALTA DE AUTORIZACIÓN DE LA EPS - Glosa Automática 100%`,
        automatica: true,
      };
    }

    return null;
  }

  /**
   * Calcula totales de glosas
   */
  calcularTotales(glosas: GlosaCalculada[]): {
    totalGlosas: number;
    cantidadGlosas: number;
    glosasPorTipo: Record<string, number>;
  } {
    const totalGlosas = glosas.reduce((sum, glosa) => sum + glosa.valorTotalGlosa, 0);
    const cantidadGlosas = glosas.length;

    const glosasPorTipo = glosas.reduce((acc, glosa) => {
      acc[glosa.tipo] = (acc[glosa.tipo] || 0) + glosa.valorTotalGlosa;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGlosas,
      cantidadGlosas,
      glosasPorTipo,
    };
  }

  /**
   * Agrega un código CUPS al tarifario (para testing o configuración dinámica)
   */
  agregarTarifaCUPS(codigo: string, valor: number, descripcion: string): void {
    TARIFARIO_NUEVA_EPS[codigo] = { valor, descripcion };
    console.log(`✅ Agregado al tarifario Nueva EPS: ${codigo} - $${valor.toLocaleString('es-CO')}`);
  }

  /**
   * Obtiene todo el tarifario de Nueva EPS
   */
  obtenerTarifarioCompleto(): Record<string, { valor: number; descripcion: string }> {
    return { ...TARIFARIO_NUEVA_EPS };
  }
}

export default new GlosaCalculatorService();
