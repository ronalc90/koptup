import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ReglaInterpretada {
  condiciones: Array<{
    campo: string;
    operador: 'menor' | 'mayor' | 'igual' | 'contiene' | 'entre' | 'existe' | 'no_existe';
    valor: any;
    valorMax?: any;
  }>;
  accion: {
    tipo: 'ignorar_glosa' | 'no_validar_autorizacion' | 'ajustar_valor' | 'homologar_servicio' | 'aceptar_fecha';
    parametros?: any;
  };
  confianza: number;
  explicacion: string;
}

class ReglasIAService {
  /**
   * Interpreta una regla en lenguaje natural usando Claude AI
   */
  async interpretarRegla(
    descripcionNatural: string,
    tipo: 'glosa' | 'autorizacion' | 'valor' | 'fecha' | 'paciente' | 'servicio' | 'general'
  ): Promise<ReglaInterpretada> {
    try {
      const prompt = this.construirPromptInterpretacion(descripcionNatural, tipo);

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const respuestaTexto = message.content[0].type === 'text' ? message.content[0].text : '';

      logger.info('🤖 Respuesta de Claude para interpretación de regla:', respuestaTexto);

      // Parsear respuesta JSON
      const resultado = this.parsearRespuestaIA(respuestaTexto);

      return resultado;
    } catch (error: any) {
      logger.error('❌ Error interpretando regla con IA:', error);
      throw new Error(`Error al interpretar regla: ${error.message}`);
    }
  }

  /**
   * Construye el prompt para que Claude interprete la regla
   */
  private construirPromptInterpretacion(descripcion: string, tipo: string): string {
    return `Eres un experto en liquidación de cuentas médicas y facturación de salud en Colombia. Tu tarea es interpretar una regla de negocio escrita en lenguaje natural y convertirla en una estructura JSON ejecutable.

**Regla a interpretar:**
"${descripcion}"

**Tipo de regla:** ${tipo}

**Campos disponibles en el sistema:**
- valor: Valor monetario del servicio/procedimiento
- valorIPS: Valor cobrado por la IPS
- valorContratado: Valor según tarifario de la EPS
- codigoCUPS: Código CUPS del procedimiento
- nombreProcedimiento: Nombre del procedimiento
- autorizacion: Número de autorización
- fechaServicio: Fecha en que se prestó el servicio
- fechaAutorizacion: Fecha de la autorización
- diagnostico: Código CIE-10 del diagnóstico
- tipoDocumentoPaciente: Tipo de documento del paciente
- numeroDocumentoPaciente: Número de documento
- tipoAtencion: urgencias, consulta externa, hospitalización, etc.
- rango: clasificación por valor (1-4)

**Operadores disponibles:**
- menor: <
- mayor: >
- igual: ==
- contiene: string contains
- entre: valor >= min && valor <= max
- existe: campo no es null/undefined
- no_existe: campo es null/undefined

**Acciones disponibles:**
- ignorar_glosa: No generar glosa aunque exista diferencia
- no_validar_autorizacion: No validar que exista autorización
- ajustar_valor: Aceptar un valor diferente al tarifario (puede incluir porcentaje)
- homologar_servicio: Tratar un servicio como si fuera otro
- aceptar_fecha: Aceptar fechas fuera del rango normal

**Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json) con la siguiente estructura:**
{
  "condiciones": [
    {
      "campo": "nombre_del_campo",
      "operador": "uno_de_los_operadores",
      "valor": "valor_a_comparar",
      "valorMax": "opcional_para_operador_entre"
    }
  ],
  "accion": {
    "tipo": "tipo_de_accion",
    "parametros": {
      "clave": "valor opcional según la acción"
    }
  },
  "confianza": 95,
  "explicacion": "Breve explicación de cómo interpretaste la regla"
}

**Ejemplos:**

Regla: "No generar glosas por valores menores a $5,000"
{
  "condiciones": [
    {
      "campo": "valor",
      "operador": "menor",
      "valor": 5000
    }
  ],
  "accion": {
    "tipo": "ignorar_glosa",
    "parametros": {}
  },
  "confianza": 100,
  "explicacion": "Si el valor del servicio es menor a 5000 pesos, se ignora cualquier glosa que pudiera generarse"
}

Regla: "Los servicios de urgencias no requieren autorización previa"
{
  "condiciones": [
    {
      "campo": "tipoAtencion",
      "operador": "contiene",
      "valor": "urgencias"
    }
  ],
  "accion": {
    "tipo": "no_validar_autorizacion",
    "parametros": {}
  },
  "confianza": 100,
  "explicacion": "Para atenciones de tipo urgencias, no se valida la existencia de autorización previa"
}

Regla: "Aceptar valores hasta 10% por encima del tarifario para procedimientos quirúrgicos"
{
  "condiciones": [
    {
      "campo": "nombreProcedimiento",
      "operador": "contiene",
      "valor": "quirurgico"
    }
  ],
  "accion": {
    "tipo": "ajustar_valor",
    "parametros": {
      "porcentajePermitido": 10,
      "direccion": "superior"
    }
  },
  "confianza": 90,
  "explicacion": "Para procedimientos que contengan 'quirurgico' en el nombre, se acepta un valor hasta 10% superior al tarifario contratado"
}

Regla: "Homologar consulta de primera vez con consulta de control"
{
  "condiciones": [
    {
      "campo": "codigoCUPS",
      "operador": "igual",
      "valor": "890201"
    }
  ],
  "accion": {
    "tipo": "homologar_servicio",
    "parametros": {
      "codigoDestino": "890202",
      "nombreDestino": "Consulta de control"
    }
  },
  "confianza": 95,
  "explicacion": "Cuando se facture consulta de primera vez (890201), se tratará como consulta de control (890202) para efectos de validación y tarifario"
}

Ahora interpreta la regla proporcionada y responde solo con el JSON.`;
  }

  /**
   * Parsea la respuesta de la IA y extrae el JSON
   */
  private parsearRespuestaIA(respuesta: string): ReglaInterpretada {
    try {
      // Limpiar posibles markdown o texto extra
      let jsonLimpio = respuesta.trim();

      // Remover ```json y ``` si existen
      jsonLimpio = jsonLimpio.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Buscar el primer { y el último }
      const inicio = jsonLimpio.indexOf('{');
      const fin = jsonLimpio.lastIndexOf('}');

      if (inicio === -1 || fin === -1) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      jsonLimpio = jsonLimpio.substring(inicio, fin + 1);

      const parsed = JSON.parse(jsonLimpio);

      // Validar estructura
      if (!parsed.condiciones || !Array.isArray(parsed.condiciones)) {
        throw new Error('La respuesta no tiene el formato esperado: falta array de condiciones');
      }

      if (!parsed.accion || !parsed.accion.tipo) {
        throw new Error('La respuesta no tiene el formato esperado: falta acción');
      }

      return {
        condiciones: parsed.condiciones,
        accion: parsed.accion,
        confianza: parsed.confianza || 50,
        explicacion: parsed.explicacion || 'Sin explicación',
      };
    } catch (error: any) {
      logger.error('❌ Error parseando respuesta de IA:', error);
      logger.error('Respuesta original:', respuesta);
      throw new Error(`Error parseando respuesta de IA: ${error.message}`);
    }
  }

  /**
   * Valida que una regla interpretada sea coherente
   */
  validarReglaInterpretada(regla: ReglaInterpretada): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar que haya al menos una condición
    if (!regla.condiciones || regla.condiciones.length === 0) {
      errores.push('La regla debe tener al menos una condición');
    }

    // Validar cada condición
    regla.condiciones.forEach((cond, idx) => {
      if (!cond.campo) {
        errores.push(`Condición ${idx + 1}: falta el campo`);
      }
      if (!cond.operador) {
        errores.push(`Condición ${idx + 1}: falta el operador`);
      }
      if (cond.valor === undefined && cond.operador !== 'existe' && cond.operador !== 'no_existe') {
        errores.push(`Condición ${idx + 1}: falta el valor`);
      }
      if (cond.operador === 'entre' && !cond.valorMax) {
        errores.push(`Condición ${idx + 1}: operador 'entre' requiere valorMax`);
      }
    });

    // Validar acción
    if (!regla.accion || !regla.accion.tipo) {
      errores.push('La regla debe tener una acción definida');
    }

    // Validar confianza
    if (regla.confianza < 50) {
      errores.push('La confianza de la interpretación es muy baja (< 50%)');
    }

    return {
      valida: errores.length === 0,
      errores,
    };
  }

  /**
   * Genera ejemplos de reglas para ayudar al usuario
   */
  obtenerEjemplosReglas(): Array<{ descripcion: string; tipo: string; explicacion: string }> {
    return [
      {
        tipo: 'glosa',
        descripcion: 'No generar glosas por valores menores a $5,000',
        explicacion: 'Ignora glosas en servicios de bajo valor',
      },
      {
        tipo: 'autorizacion',
        descripcion: 'Los servicios de urgencias no requieren autorización previa',
        explicacion: 'No valida autorización en urgencias',
      },
      {
        tipo: 'valor',
        descripcion: 'Aceptar valores hasta 15% por encima del tarifario para cirugías',
        explicacion: 'Permite margen en procedimientos quirúrgicos',
      },
      {
        tipo: 'servicio',
        descripcion: 'Homologar consulta de primera vez con consulta de control',
        explicacion: 'Trata ambos tipos de consulta como equivalentes',
      },
      {
        tipo: 'fecha',
        descripcion: 'Permitir fechas de servicio hasta 45 días después de la autorización',
        explicacion: 'Amplía el rango de validez de autorizaciones',
      },
      {
        tipo: 'glosa',
        descripcion: 'No validar autorización para servicios menores a $50,000',
        explicacion: 'Combina validación de valor y autorización',
      },
      {
        tipo: 'valor',
        descripcion: 'Aceptar valores contratados con diferencia menor al 5%',
        explicacion: 'Tolera pequeñas diferencias en tarifas',
      },
      {
        tipo: 'servicio',
        descripcion: 'Los exámenes de laboratorio no requieren diagnóstico específico',
        explicacion: 'Flexibiliza validación de diagnósticos',
      },
    ];
  }
}

export default new ReglasIAService();
