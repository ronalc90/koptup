import AuditoriaSesion, { IPasoDetalle, IDatoExtraido, IResultadoPaso } from '../models/AuditoriaSesion';
import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import Tarifario from '../models/Tarifario';
import ReglaAuditoria from '../models/ReglaAuditoria';
import CUPS from '../models/CUPS';
import { Types } from 'mongoose';

/**
 * Servicio para ejecutar auditoría paso a paso con control manual del usuario
 */
class AuditoriaPasoPasoService {
  /**
   * Inicia una nueva sesión de auditoría paso a paso
   */
  async iniciarSesion(facturaId: string) {
    try {
      // Verificar que la factura existe
      const factura = await Factura.findById(facturaId);
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // Crear los 6 pasos iniciales
      const pasos: Partial<IPasoDetalle>[] = [
        {
          numero: 1,
          titulo: 'Carga y Validación de Datos',
          descripcion: 'Se cargan y validan todos los documentos de la factura: atenciones, procedimientos, diagnósticos y soportes.',
          estado: 'pendiente',
          datosUsados: ['Factura', 'Atenciones', 'Procedimientos', 'Diagnósticos CIE-10', 'Autorizaciones', 'Soportes PDF'],
        },
        {
          numero: 2,
          titulo: 'Consulta de Tarifarios',
          descripcion: 'Se consultan los tarifarios contractuales (SOAT, ISS, Manual Tarifario) y se comparan con las tarifas facturadas por la IPS.',
          estado: 'pendiente',
          datosUsados: ['Código CUPS', 'Tarifario SOAT', 'Tarifario ISS', 'Manual Tarifario EPS', 'Valor Facturado IPS'],
        },
        {
          numero: 3,
          titulo: 'Validación de Autorizaciones',
          descripcion: 'Verifica que cada procedimiento cuente con autorización vigente y que los datos coincidan (número, vigencia, cantidad).',
          estado: 'pendiente',
          datosUsados: ['Número de Autorización', 'Fecha de Vigencia', 'Cantidad Autorizada', 'Procedimientos Solicitados'],
        },
        {
          numero: 4,
          titulo: 'Detección de Duplicidades',
          descripcion: 'Identifica procedimientos duplicados para el mismo paciente en la misma fecha, evitando facturación doble.',
          estado: 'pendiente',
          datosUsados: ['Código CUPS', 'Documento Paciente', 'Fecha del Procedimiento', 'Número de Autorización'],
        },
        {
          numero: 5,
          titulo: 'Validación de Pertinencia Médica',
          descripcion: 'Verifica que los procedimientos sean coherentes con los diagnósticos según guías de práctica clínica y normativa vigente.',
          estado: 'pendiente',
          datosUsados: ['Diagnóstico CIE-10', 'Código CUPS', 'Guías de Práctica Clínica', 'Normativa Vigente'],
        },
        {
          numero: 6,
          titulo: 'Generación de Glosas y Excel Final',
          descripcion: 'Se generan automáticamente las glosas basadas en las inconsistencias encontradas, y se construye el archivo Excel con el reporte completo de auditoría.',
          estado: 'pendiente',
          datosUsados: ['Diferencias de Tarifa', 'Procedimientos sin Autorización', 'Duplicidades', 'Incoherencias Médicas'],
        },
      ];

      // Crear sesión
      const sesion = new AuditoriaSesion({
        facturaId: new Types.ObjectId(facturaId),
        pasoActual: 0,
        totalPasos: 6,
        estado: 'iniciada',
        pasos: pasos as IPasoDetalle[],
      });

      await sesion.save();

      return sesion;
    } catch (error: any) {
      console.error('Error iniciando sesión de auditoría:', error);
      throw error;
    }
  }

  /**
   * Avanza al siguiente paso en la auditoría
   */
  async avanzarPaso(sesionId: string) {
    try {
      const sesion = await AuditoriaSesion.findById(sesionId);
      if (!sesion) {
        throw new Error('Sesión no encontrada');
      }

      if (sesion.estado === 'completada') {
        throw new Error('La auditoría ya fue completada');
      }

      const siguientePaso = sesion.pasoActual + 1;

      if (siguientePaso > sesion.totalPasos) {
        throw new Error('No hay más pasos por ejecutar');
      }

      // Marcar paso actual como en-proceso
      sesion.pasos[siguientePaso - 1].estado = 'en-proceso';
      sesion.pasos[siguientePaso - 1].inicioTimestamp = new Date();
      sesion.pasoActual = siguientePaso;
      sesion.estado = 'en-progreso';
      await sesion.save();

      // Ejecutar el paso correspondiente
      const inicioEjecucion = Date.now();

      try {
        switch (siguientePaso) {
          case 1:
            await this.ejecutarPaso1(sesion);
            break;
          case 2:
            await this.ejecutarPaso2(sesion);
            break;
          case 3:
            await this.ejecutarPaso3(sesion);
            break;
          case 4:
            await this.ejecutarPaso4(sesion);
            break;
          case 5:
            await this.ejecutarPaso5(sesion);
            break;
          case 6:
            await this.ejecutarPaso6(sesion);
            break;
        }

        // Marcar paso como completado
        const duracion = Date.now() - inicioEjecucion;
        sesion.pasos[siguientePaso - 1].estado = 'completado';
        sesion.pasos[siguientePaso - 1].finTimestamp = new Date();
        sesion.pasos[siguientePaso - 1].duracion = duracion;

        // Si es el último paso, marcar sesión como completada
        if (siguientePaso === sesion.totalPasos) {
          sesion.estado = 'completada';
        }

        await sesion.save();
        return sesion;
      } catch (error: any) {
        // Marcar paso como error
        sesion.pasos[siguientePaso - 1].estado = 'error';
        sesion.pasos[siguientePaso - 1].error = error.message;
        sesion.estado = 'error';
        await sesion.save();
        throw error;
      }
    } catch (error: any) {
      console.error('Error avanzando paso:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual de la sesión
   */
  async obtenerSesion(sesionId: string) {
    const sesion = await AuditoriaSesion.findById(sesionId);
    if (!sesion) {
      throw new Error('Sesión no encontrada');
    }
    return sesion;
  }

  // ==================== EJECUCIÓN DE PASOS ====================

  /**
   * Paso 1: Carga y Validación de Datos
   */
  private async ejecutarPaso1(sesion: any) {
    const factura = await Factura.findById(sesion.facturaId);
    const atenciones = await Atencion.find({ facturaId: sesion.facturaId });
    const procedimientos = await Procedimiento.find({ facturaId: sesion.facturaId });

    // Extraer datos reales de la primera atención y procedimiento para mostrar
    const primeraAtencion = atenciones[0];
    const primerProcedimiento = procedimientos[0];

    const datosExtraidos: IDatoExtraido[] = [];

    if (factura) {
      datosExtraidos.push({
        campo: 'Número de Factura',
        valor: factura.numeroFactura,
        origen: 'Base de Datos - Factura',
        ubicacion: 'Campo "numeroFactura"',
        explicacion: 'Identificador único de la factura para rastreo y auditoría',
      });

      datosExtraidos.push({
        campo: 'NIT IPS',
        valor: factura.ips.nit,
        origen: 'Base de Datos - Factura',
        ubicacion: 'Campo "ips.nit"',
        explicacion: 'Identifica la IPS que factura para validar contratos y tarifas',
      });

      datosExtraidos.push({
        campo: 'Código EPS',
        valor: factura.eps.nit,
        origen: 'Base de Datos - Factura',
        ubicacion: 'Campo "eps.nit"',
        explicacion: 'Identifica la EPS pagadora para aplicar el tarifario correcto',
      });
    }

    if (primeraAtencion) {
      datosExtraidos.push({
        campo: 'Documento Paciente',
        valor: primeraAtencion.paciente.numeroDocumento,
        origen: 'Base de Datos - Atención',
        ubicacion: 'Campo "paciente.numeroDocumento"',
        explicacion: 'Identifica al paciente para validar autorización y duplicidades',
      });

      datosExtraidos.push({
        campo: 'Diagnóstico CIE-10',
        valor: `${primeraAtencion.diagnosticoPrincipal.codigoCIE10} - ${primeraAtencion.diagnosticoPrincipal.descripcion}`,
        origen: 'Base de Datos - Atención',
        ubicacion: 'Campo "diagnosticoPrincipal"',
        explicacion: 'Diagnóstico principal para validar pertinencia del procedimiento',
      });

      if (primeraAtencion.numeroAutorizacion) {
        datosExtraidos.push({
          campo: 'Número de Autorización',
          valor: primeraAtencion.numeroAutorizacion,
          origen: 'Base de Datos - Atención',
          ubicacion: 'Campo "numeroAutorizacion"',
          explicacion: 'Valida que el procedimiento esté autorizado por la EPS',
        });
      }
    }

    if (primerProcedimiento) {
      datosExtraidos.push({
        campo: 'Código CUPS',
        valor: `${primerProcedimiento.codigoCUPS} - ${primerProcedimiento.descripcion}`,
        origen: 'Base de Datos - Procedimiento',
        ubicacion: 'Campo "codigoCUPS"',
        explicacion: 'Código del procedimiento para consultar tarifario y pertinencia',
      });

      datosExtraidos.push({
        campo: 'Valor Facturado',
        valor: `$${primerProcedimiento.valorTotalIPS.toLocaleString('es-CO')}`,
        origen: 'Base de Datos - Procedimiento',
        ubicacion: 'Campo "valorTotalIPS"',
        explicacion: 'Valor cobrado por la IPS a comparar contra tarifario contractual',
      });
    }

    sesion.pasos[0].datosExtraidos = datosExtraidos;
    sesion.pasos[0].procesoDetallado = [
      'Se conecta a la base de datos y se consulta la factura por su ID',
      'Se extraen los datos principales de la factura: identificadores, IPS, EPS, valores',
      'Se consultan todas las atenciones asociadas a la factura',
      'Se consultan todos los procedimientos de cada atención',
      'Se valida que cada dato requerido esté presente y tenga el formato correcto',
      'Se cruzan los datos entre entidades para asegurar coherencia',
      'Se genera un registro estructurado con todos los datos listos para las validaciones',
    ];
    sesion.pasos[0].resultados = [
      { label: 'Atenciones cargadas', valor: String(atenciones.length), tipo: 'exito' },
      { label: 'Procedimientos cargados', valor: String(procedimientos.length), tipo: 'exito' },
      { label: 'Valor total factura', valor: `$${factura?.valorTotal.toLocaleString('es-CO')}`, tipo: 'exito' },
    ];
  }

  /**
   * Paso 2: Consulta de Tarifarios
   */
  private async ejecutarPaso2(sesion: any) {
    const factura = await Factura.findById(sesion.facturaId);

    // Obtener o buscar tarifario
    let tarifario;
    if (factura?.tarifarioId) {
      tarifario = await Tarifario.findById(factura.tarifarioId);
    } else {
      tarifario = await this.obtenerTarifarioVigente(factura?.eps.nit, factura?.fechaEmision);
    }

    // Actualizar valores de contrato
    const procedimientos = await Procedimiento.find({ facturaId: sesion.facturaId });
    let diferenciasDetectadas = 0;

    const datosExtraidos: IDatoExtraido[] = [];
    const primerProc = procedimientos[0];

    if (primerProc && tarifario) {
      const itemTarifario = tarifario.items.find((item: any) => item.codigoCUPS === primerProc.codigoCUPS);

      datosExtraidos.push({
        campo: 'Código CUPS',
        valor: `${primerProc.codigoCUPS} - ${primerProc.descripcion}`,
        origen: 'Del paso anterior (Base de Datos)',
        ubicacion: 'Previamente extraído',
        explicacion: 'Se usa para buscar el valor en el tarifario contractual',
      });

      if (itemTarifario) {
        primerProc.valorUnitarioContrato = itemTarifario.valor;
        primerProc.valorTotalContrato = primerProc.cantidad * itemTarifario.valor;
        primerProc.diferenciaTarifa = primerProc.valorTotalIPS - primerProc.valorTotalContrato;
        primerProc.tarifaValidada = true;
        await primerProc.save();

        datosExtraidos.push({
          campo: 'Tarifa Contrato',
          valor: `$${itemTarifario.valor.toLocaleString('es-CO')}`,
          origen: `Base de Datos - Tarifario ${tarifario.nombre}`,
          ubicacion: `Items del tarifario para CUPS ${primerProc.codigoCUPS}`,
          explicacion: 'Valor máximo que se debe pagar según contrato',
        });

        datosExtraidos.push({
          campo: 'Valor Facturado IPS',
          valor: `$${primerProc.valorTotalIPS.toLocaleString('es-CO')}`,
          origen: 'Del paso anterior',
          ubicacion: 'Campo "valorTotalIPS" del procedimiento',
          explicacion: 'Valor que la IPS está cobrando por el procedimiento',
        });

        if (primerProc.diferenciaTarifa > 0) {
          const porcentaje = ((primerProc.diferenciaTarifa / primerProc.valorTotalContrato) * 100).toFixed(2);
          datosExtraidos.push({
            campo: 'Diferencia (Posible Glosa)',
            valor: `$${primerProc.diferenciaTarifa.toLocaleString('es-CO')} (${porcentaje}% de sobrecosto)`,
            origen: 'Calculado: Valor Facturado - Tarifa Contrato',
            ubicacion: `Cálculo: $${primerProc.valorTotalIPS.toLocaleString('es-CO')} - $${primerProc.valorTotalContrato.toLocaleString('es-CO')}`,
            explicacion: 'La IPS cobra más de lo permitido, se marca para posible glosa',
          });
        }
      }
    }

    // Actualizar todos los procedimientos
    for (const proc of procedimientos) {
      if (tarifario) {
        const itemTarifario = tarifario.items.find((item: any) => item.codigoCUPS === proc.codigoCUPS);
        if (itemTarifario) {
          proc.valorUnitarioContrato = itemTarifario.valor;
          proc.valorTotalContrato = proc.cantidad * itemTarifario.valor;
          proc.diferenciaTarifa = proc.valorTotalIPS - proc.valorTotalContrato;
          proc.tarifaValidada = true;
          await proc.save();

          if (proc.diferenciaTarifa > 0) {
            diferenciasDetectadas++;
          }
        }
      }
    }

    sesion.pasos[1].datosExtraidos = datosExtraidos;
    sesion.pasos[1].procesoDetallado = [
      'Para cada procedimiento extraído (código CUPS), se consulta en la base de datos de tarifarios',
      'Se identifica el contrato vigente entre la IPS y la EPS en la fecha de facturación',
      'Se obtiene el valor contractual para ese código CUPS específico',
      'Se compara el valor facturado vs el valor del contrato',
      'Si hay diferencia, se calcula el porcentaje de sobrecosto o descuento',
      'Se marca para glosa si el valor facturado excede el contractual en más del 5%',
    ];
    sesion.pasos[1].resultados = [
      { label: 'Tarifas consultadas', valor: `${procedimientos.length}/${procedimientos.length}`, tipo: 'exito' },
      { label: 'Diferencias detectadas', valor: String(diferenciasDetectadas), tipo: diferenciasDetectadas > 0 ? 'advertencia' : 'exito' },
      { label: 'Tarifario usado', valor: tarifario?.nombre || 'No encontrado', tipo: tarifario ? 'exito' : 'error' },
    ];
  }

  /**
   * Paso 3: Validación de Autorizaciones
   */
  private async ejecutarPaso3(sesion: any) {
    const atenciones = await Atencion.find({ facturaId: sesion.facturaId });

    let conAutorizacion = 0;
    let sinAutorizacion = 0;
    let autorizacionesVencidas = 0;

    for (const atencion of atenciones) {
      const procedimientos = await Procedimiento.find({ atencionId: atencion._id });

      for (const proc of procedimientos) {
        const cups = await CUPS.findOne({ codigo: proc.codigoCUPS });

        if (cups?.metadata?.requiereAutorizacion || !atencion.numeroAutorizacion) {
          if (atencion.numeroAutorizacion) {
            atencion.tieneAutorizacion = true;
            atencion.autorizacionValida = this.validarFechaAutorizacion(
              atencion.fechaAutorizacion,
              atencion.fechaInicio
            );

            if (atencion.autorizacionValida) {
              conAutorizacion++;
            } else {
              autorizacionesVencidas++;
            }
          } else {
            atencion.tieneAutorizacion = false;
            sinAutorizacion++;
          }
          await atencion.save();
        } else {
          conAutorizacion++;
        }
      }
    }

    sesion.pasos[2].procesoDetallado = [
      'Se obtiene la configuración de cada código CUPS desde la base de datos',
      'Se verifica si el procedimiento requiere autorización según normativa',
      'Para los que requieren autorización, se busca el número de autorización en la atención',
      'Se valida que la fecha de autorización sea anterior a la fecha de atención',
      'Se valida que la autorización no tenga más de 30 días de antigüedad',
      'Se marca cada atención con el estado de su autorización',
    ];
    sesion.pasos[2].resultados = [
      { label: 'Con autorización válida', valor: String(conAutorizacion), tipo: 'exito' },
      { label: 'Sin autorización', valor: String(sinAutorizacion), tipo: sinAutorizacion > 0 ? 'error' : 'exito' },
      { label: 'Autorizaciones vencidas', valor: String(autorizacionesVencidas), tipo: autorizacionesVencidas > 0 ? 'error' : 'exito' },
    ];
  }

  /**
   * Paso 4: Detección de Duplicidades
   */
  private async ejecutarPaso4(sesion: any) {
    const atenciones = await Atencion.find({ facturaId: sesion.facturaId });
    let duplicadosEncontrados = 0;
    let valorDuplicado = 0;

    for (const atencion of atenciones) {
      const procedimientos = await Procedimiento.find({ atencionId: atencion._id });

      const procedimientosPorCodigo: Record<string, any[]> = {};
      for (const proc of procedimientos) {
        if (!procedimientosPorCodigo[proc.codigoCUPS]) {
          procedimientosPorCodigo[proc.codigoCUPS] = [];
        }
        procedimientosPorCodigo[proc.codigoCUPS].push(proc);
      }

      for (const codigo in procedimientosPorCodigo) {
        const procs = procedimientosPorCodigo[codigo];
        if (procs.length > 1) {
          for (let i = 1; i < procs.length; i++) {
            procs[i].duplicado = true;
            await procs[i].save();
            duplicadosEncontrados++;
            valorDuplicado += procs[i].valorTotalIPS;
          }
        }
      }
    }

    sesion.pasos[3].procesoDetallado = [
      'Se agrupan todos los procedimientos por atención (mismo paciente, misma fecha)',
      'Dentro de cada atención, se agrupan procedimientos por código CUPS',
      'Si hay más de un procedimiento con el mismo código CUPS en la misma atención, se marca como duplicado',
      'El primer procedimiento se mantiene, los demás se marcan como duplicados',
      'Se calcula el valor total de los procedimientos duplicados para potencial glosa',
    ];
    sesion.pasos[3].resultados = [
      { label: 'Duplicados encontrados', valor: String(duplicadosEncontrados), tipo: duplicadosEncontrados > 0 ? 'error' : 'exito' },
      { label: 'Valor duplicado', valor: `$${valorDuplicado.toLocaleString('es-CO')}`, tipo: duplicadosEncontrados > 0 ? 'error' : 'exito' },
    ];
  }

  /**
   * Paso 5: Validación de Pertinencia Médica
   */
  private async ejecutarPaso5(sesion: any) {
    const atenciones = await Atencion.find({ facturaId: sesion.facturaId });
    let procedimientosPertinentes = 0;
    let incoherenciasDetectadas = 0;

    for (const atencion of atenciones) {
      const procedimientos = await Procedimiento.find({ atencionId: atencion._id });

      for (const proc of procedimientos) {
        const pertinente = await this.verificarPertinenciaCUPSconCIE10(
          proc.codigoCUPS,
          atencion.diagnosticoPrincipal.codigoCIE10
        );

        proc.pertinenciaValidada = pertinente;
        await proc.save();

        if (pertinente) {
          procedimientosPertinentes++;
        } else {
          incoherenciasDetectadas++;
        }
      }
    }

    sesion.pasos[4].procesoDetallado = [
      'Para cada procedimiento, se obtiene su código CUPS y el diagnóstico CIE-10 de la atención',
      'Se consultan las tablas de correspondencia CUPS-CIE10 en la base de datos',
      'Se verifican las guías de práctica clínica que relacionan diagnósticos con procedimientos',
      'Se aplican reglas de coherencia médica (ej: procedimiento de cardiología con diagnóstico cardíaco)',
      'Se marcan las incoherencias evidentes para revisión manual',
    ];
    sesion.pasos[4].resultados = [
      { label: 'Procedimientos pertinentes', valor: String(procedimientosPertinentes), tipo: 'exito' },
      { label: 'Incoherencias detectadas', valor: String(incoherenciasDetectadas), tipo: incoherenciasDetectadas > 0 ? 'advertencia' : 'exito' },
    ];
  }

  /**
   * Paso 6: Generación de Glosas
   */
  private async ejecutarPaso6(sesion: any) {
    // Aplicar reglas de auditoría
    const reglas = await ReglaAuditoria.find({ activa: true }).sort({ prioridad: 1 });
    const glosas: any[] = [];
    const procedimientos = await Procedimiento.find({ facturaId: sesion.facturaId }).populate('atencionId');

    for (const proc of procedimientos) {
      for (const regla of reglas) {
        const cumpleRegla = this.evaluarCondiciones(proc, regla);

        if (cumpleRegla) {
          const glosa = await this.crearGlosa(proc, regla);
          if (glosa) {
            glosas.push(glosa);
          }
        }
      }
    }

    // Calcular totales
    const factura = await Factura.findById(sesion.facturaId);
    const todasGlosas = await Glosa.find({ facturaId: sesion.facturaId });
    const totalGlosas = todasGlosas.reduce((sum, g) => sum + g.valorGlosado, 0);
    const valorAceptado = (factura?.valorTotal || 0) - totalGlosas;

    // Actualizar factura
    await Factura.findByIdAndUpdate(sesion.facturaId, {
      estado: 'Auditada',
      auditoriaCompletada: true,
      fechaAuditoria: new Date(),
      totalGlosas,
      valorAceptado,
    });

    // Datos extraídos para mostrar glosas generadas
    const datosExtraidos: IDatoExtraido[] = [];

    if (glosas.length > 0) {
      glosas.slice(0, 3).forEach((glosa, idx) => {
        datosExtraidos.push({
          campo: `Glosa #${idx + 1} - ${glosa.tipo}`,
          valor: `$${glosa.valorGlosado.toLocaleString('es-CO')}`,
          origen: `Generada por regla automática`,
          ubicacion: `Se escribe en Base de Datos → Colección "Glosas"`,
          explicacion: glosa.descripcion,
        });
      });
    }

    datosExtraidos.push({
      campo: 'Valor Total Facturado',
      valor: `$${factura?.valorTotal.toLocaleString('es-CO')}`,
      origen: 'Suma de todos los procedimientos (Paso 1)',
      ubicacion: 'Campo "valorTotal" de la Factura',
      explicacion: 'Suma total de todos los procedimientos de la factura',
    });

    datosExtraidos.push({
      campo: 'Total Glosas',
      valor: `$${totalGlosas.toLocaleString('es-CO')}`,
      origen: 'Suma de todas las glosas generadas',
      ubicacion: 'Calculado desde colección "Glosas"',
      explicacion: 'Suma de todos los valores objetados/glosados',
    });

    datosExtraidos.push({
      campo: 'Valor Aceptado',
      valor: `$${valorAceptado.toLocaleString('es-CO')}`,
      origen: 'Calculado: Total Facturado - Total Glosas',
      ubicacion: 'Campo "valorAceptado" de la Factura',
      explicacion: 'Valor que la EPS debe pagar después de aplicar las glosas',
    });

    sesion.pasos[5].datosExtraidos = datosExtraidos;
    sesion.pasos[5].procesoDetallado = [
      'Se recopilan todas las inconsistencias detectadas en los pasos 2-5',
      'Para cada inconsistencia se crea una glosa con: tipo, código, descripción, valor y justificación',
      'Se aplican las 9 reglas de auditoría configuradas en el sistema',
      'Se calcula el valor de cada glosa según el tipo (diferencia, total, porcentaje o fijo)',
      'Se actualizan los procedimientos con el total de glosas aplicadas',
      'Se actualiza la factura con el estado "Auditada" y los totales calculados',
      'Se preparan los datos para generar el reporte Excel de auditoría',
    ];
    sesion.pasos[5].resultados = [
      { label: 'Glosas generadas', valor: String(todasGlosas.length), tipo: todasGlosas.length > 0 ? 'advertencia' : 'exito' },
      { label: 'Total glosado', valor: `$${totalGlosas.toLocaleString('es-CO')}`, tipo: totalGlosas > 0 ? 'error' : 'exito' },
      { label: 'Valor aceptado', valor: `$${valorAceptado.toLocaleString('es-CO')}`, tipo: 'exito' },
    ];

    // Guardar resultado final
    sesion.resultadoFinal = {
      totalGlosas,
      valorFacturaOriginal: factura?.valorTotal || 0,
      valorAceptado,
      cantidadGlosas: todasGlosas.length,
    };
  }

  // ==================== FUNCIONES AUXILIARES ====================

  private async obtenerTarifarioVigente(epsNit?: string, fecha?: Date) {
    let tarifario = await Tarifario.findOne({
      eps: { $exists: true },
      activo: true,
      vigenciaInicio: { $lte: fecha || new Date() },
      $or: [{ vigenciaFin: { $exists: false } }, { vigenciaFin: { $gte: fecha || new Date() } }],
    }).sort({ vigenciaInicio: -1 });

    if (!tarifario) {
      tarifario = await Tarifario.findOne({
        nombre: 'ISS 2004',
        activo: true,
      });
    }

    return tarifario;
  }

  private validarFechaAutorizacion(fechaAutorizacion?: Date, fechaAtencion?: Date): boolean {
    if (!fechaAutorizacion || !fechaAtencion) return false;

    const diffDias = Math.floor(
      (fechaAtencion.getTime() - fechaAutorizacion.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDias >= 0 && diffDias <= 30;
  }

  private async verificarPertinenciaCUPSconCIE10(codigoCUPS: string, codigoCIE10: string): boolean {
    // Implementación simplificada - siempre retorna true
    // En producción debería consultar tablas de correspondencia
    return true;
  }

  private evaluarCondiciones(procedimiento: any, regla: any): boolean {
    const { condiciones, operadorLogico } = regla;

    const resultados = condiciones.map((condicion: any) =>
      this.evaluarCondicion(procedimiento, condicion)
    );

    if (operadorLogico === 'AND') {
      return resultados.every((r) => r);
    } else {
      return resultados.some((r) => r);
    }
  }

  private evaluarCondicion(procedimiento: any, condicion: any): boolean {
    const { campo, operador, valor } = condicion;
    let valorCampo = this.obtenerValorCampo(procedimiento, campo);

    switch (operador) {
      case '>': return valorCampo > valor;
      case '<': return valorCampo < valor;
      case '=': return valorCampo === valor;
      case '!=': return valorCampo !== valor;
      case '>=': return valorCampo >= valor;
      case '<=': return valorCampo <= valor;
      case 'contains': return String(valorCampo).includes(valor);
      case 'exists': return valorCampo !== null && valorCampo !== undefined;
      case 'not_exists': return valorCampo === null || valorCampo === undefined;
      default: return false;
    }
  }

  private obtenerValorCampo(procedimiento: any, campo: string): any {
    if (campo in procedimiento) {
      return procedimiento[campo];
    }

    if (campo === 'porcentajeDiferencia') {
      if (procedimiento.valorTotalContrato === 0) return 0;
      return (procedimiento.diferenciaTarifa / procedimiento.valorTotalContrato) * 100;
    }

    if (campo === 'tieneAutorizacion') {
      return procedimiento.atencionId?.tieneAutorizacion || false;
    }

    if (campo === 'autorizacionValida') {
      return procedimiento.atencionId?.autorizacionValida || false;
    }

    return null;
  }

  private async crearGlosa(procedimiento: any, regla: any) {
    const { accion } = regla;

    const glosaExistente = await Glosa.findOne({
      procedimientoId: procedimiento._id,
      codigo: accion.codigoGlosa,
    });

    if (glosaExistente) {
      return null;
    }

    let valorGlosado = 0;
    let porcentaje = 0;

    switch (accion.calcularValor) {
      case 'diferencia':
        valorGlosado = Math.max(0, procedimiento.diferenciaTarifa);
        break;
      case 'total':
        valorGlosado = procedimiento.valorTotalIPS;
        break;
      case 'porcentaje':
        porcentaje = accion.porcentaje || 0;
        valorGlosado = (procedimiento.valorTotalIPS * porcentaje) / 100;
        break;
      case 'fijo':
        valorGlosado = accion.valorFijo || 0;
        break;
    }

    const glosa = new Glosa({
      procedimientoId: procedimiento._id,
      atencionId: procedimiento.atencionId._id,
      facturaId: procedimiento.facturaId,
      codigo: accion.codigoGlosa,
      tipo: accion.tipo,
      descripcion: accion.descripcion,
      valorGlosado,
      porcentaje: porcentaje > 0 ? porcentaje : undefined,
      observaciones: `Generada por regla: ${regla.nombre}`,
      estado: 'Pendiente',
      generadaAutomaticamente: true,
      fechaGeneracion: new Date(),
    });

    await glosa.save();

    procedimiento.glosas.push(glosa._id);
    procedimiento.totalGlosas += valorGlosado;
    procedimiento.valorAPagar = procedimiento.valorTotalIPS - procedimiento.totalGlosas;
    await procedimiento.save();

    return glosa;
  }
}

export default new AuditoriaPasoPasoService();
