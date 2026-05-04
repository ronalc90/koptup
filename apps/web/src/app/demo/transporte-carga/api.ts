import {
  Cliente,
  Conductor,
  Vehiculo,
  OrdenServicio,
  GuiaRemision,
  Factura,
  User,
  KPIs,
  EstadoOrden,
  FacturaItem,
} from './types';
import {
  seedClientes,
  seedConductores,
  seedVehiculos,
  seedOrdenes,
  seedGuias,
  seedFacturas,
  seedUsuarios,
  EMISOR,
} from './mockData';
import { getState, setState } from './store';

// Utilidad para simular delay de red
const simulateDelay = () =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));

// Utilidad para generar UUID
const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Utilidad para generar número de orden con correlativo
const generateOrdenNumero = (): string => {
  const state = getState();
  // Calcular el máximo correlativo del año actual para evitar saltos en numeración
  const yearStr = String(new Date().getFullYear());
  const ordenesDelAnio = state.ordenes
    .map((o) => o.numero)
    .filter((n) => n.startsWith(`OS-${yearStr}-`));
  const maxCorrelativo = ordenesDelAnio.reduce((max, num) => {
    const c = parseInt(num.split('-')[2] || '0', 10);
    return c > max ? c : max;
  }, 0);
  const nextCorrelativo = maxCorrelativo + 1;
  const año = new Date().getFullYear();
  return `OS-${año}-${String(nextCorrelativo).padStart(5, '0')}`;
};

// Utilidad para generar número de guía con correlativo
const generateGuiaNumero = (serie: string): { serie: string; correlativo: string; numero: string } => {
  const state = getState();
  const guiasConSerie = state.guias.filter((g) => g.serie === serie);
  const nextCorrelativo = guiasConSerie.length + 1;
  const correlativo = String(nextCorrelativo).padStart(6, '0');
  const numero = `${serie}-${correlativo}`;
  return { serie, correlativo, numero };
};

// Utilidad para generar número de factura con correlativo
const generateFacturaNumero = (serie: string = 'F001'): { serie: string; correlativo: string; numero: string } => {
  const state = getState();
  // Filtrar facturas con la misma serie para calcular el próximo correlativo
  const facturasConSerie = state.facturas.filter((f) => f.serie === serie);
  const nextCorrelativo = facturasConSerie.length + 1;
  const correlativo = String(nextCorrelativo).padStart(6, '0');
  const numero = `${serie}-${correlativo}`;
  return { serie, correlativo, numero };
};

// API de Clientes
const clientesAPI = {
  list: async (): Promise<Cliente[]> => {
    await simulateDelay();
    return getState().clientes;
  },

  get: async (id: string): Promise<Cliente | null> => {
    await simulateDelay();
    return getState().clientes.find((c) => c.id === id) || null;
  },

  create: async (data: Omit<Cliente, 'id' | 'createdAt'>): Promise<Cliente> => {
    await simulateDelay();
    const state = getState();
    const cliente: Cliente = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.clientes.push(cliente);
    });
    return cliente;
  },

  update: async (id: string, data: Partial<Cliente>): Promise<Cliente | null> => {
    await simulateDelay();
    const state = getState();
    const cliente = state.clientes.find((c) => c.id === id);
    if (!cliente) return null;
    Object.assign(cliente, data);
    setState((s) => {
      const idx = s.clientes.findIndex((c) => c.id === id);
      if (idx >= 0) s.clientes[idx] = cliente;
    });
    return cliente;
  },

  remove: async (id: string): Promise<boolean> => {
    await simulateDelay();
    setState((s) => {
      s.clientes = s.clientes.filter((c) => c.id !== id);
    });
    return true;
  },
};

// API de Conductores
const conductoresAPI = {
  list: async (): Promise<Conductor[]> => {
    await simulateDelay();
    return getState().conductores;
  },

  get: async (id: string): Promise<Conductor | null> => {
    await simulateDelay();
    return getState().conductores.find((c) => c.id === id) || null;
  },

  create: async (data: Omit<Conductor, 'id' | 'createdAt'>): Promise<Conductor> => {
    await simulateDelay();
    const conductor: Conductor = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.conductores.push(conductor);
    });
    return conductor;
  },

  update: async (id: string, data: Partial<Conductor>): Promise<Conductor | null> => {
    await simulateDelay();
    const state = getState();
    const conductor = state.conductores.find((c) => c.id === id);
    if (!conductor) return null;
    Object.assign(conductor, data);
    setState((s) => {
      const idx = s.conductores.findIndex((c) => c.id === id);
      if (idx >= 0) s.conductores[idx] = conductor;
    });
    return conductor;
  },

  remove: async (id: string): Promise<boolean> => {
    await simulateDelay();
    setState((s) => {
      s.conductores = s.conductores.filter((c) => c.id !== id);
    });
    return true;
  },
};

// API de Vehículos
const vehiculosAPI = {
  list: async (): Promise<Vehiculo[]> => {
    await simulateDelay();
    return getState().vehiculos;
  },

  get: async (id: string): Promise<Vehiculo | null> => {
    await simulateDelay();
    return getState().vehiculos.find((v) => v.id === id) || null;
  },

  create: async (data: Omit<Vehiculo, 'id' | 'createdAt'>): Promise<Vehiculo> => {
    await simulateDelay();
    const vehiculo: Vehiculo = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.vehiculos.push(vehiculo);
    });
    return vehiculo;
  },

  update: async (id: string, data: Partial<Vehiculo>): Promise<Vehiculo | null> => {
    await simulateDelay();
    const state = getState();
    const vehiculo = state.vehiculos.find((v) => v.id === id);
    if (!vehiculo) return null;
    Object.assign(vehiculo, data);
    setState((s) => {
      const idx = s.vehiculos.findIndex((v) => v.id === id);
      if (idx >= 0) s.vehiculos[idx] = vehiculo;
    });
    return vehiculo;
  },

  remove: async (id: string): Promise<boolean> => {
    await simulateDelay();
    setState((s) => {
      s.vehiculos = s.vehiculos.filter((v) => v.id !== id);
    });
    return true;
  },
};

// API de Órdenes de Servicio
const ordenesAPI = {
  list: async (): Promise<OrdenServicio[]> => {
    await simulateDelay();
    return getState().ordenes;
  },

  get: async (id: string): Promise<OrdenServicio | null> => {
    await simulateDelay();
    return getState().ordenes.find((o) => o.id === id) || null;
  },

  create: async (data: Omit<OrdenServicio, 'id' | 'numero' | 'fecha' | 'createdAt'>): Promise<OrdenServicio> => {
    await simulateDelay();
    const orden: OrdenServicio = {
      ...data,
      id: generateUUID(),
      numero: generateOrdenNumero(),
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.ordenes.push(orden);
    });
    return orden;
  },

  update: async (id: string, data: Partial<OrdenServicio>): Promise<OrdenServicio | null> => {
    await simulateDelay();
    const state = getState();
    const orden = state.ordenes.find((o) => o.id === id);
    if (!orden) return null;
    Object.assign(orden, data);
    setState((s) => {
      const idx = s.ordenes.findIndex((o) => o.id === id);
      if (idx >= 0) s.ordenes[idx] = orden;
    });
    return orden;
  },

  remove: async (id: string): Promise<boolean> => {
    await simulateDelay();
    setState((s) => {
      s.ordenes = s.ordenes.filter((o) => o.id !== id);
    });
    return true;
  },

  // Transitar orden a un nuevo estado
  transitar: async (id: string, nuevoEstado: EstadoOrden): Promise<OrdenServicio | null> => {
    await simulateDelay();
    const state = getState();
    const orden = state.ordenes.find((o) => o.id === id);
    if (!orden) return null;
    orden.estado = nuevoEstado;
    setState((s) => {
      const idx = s.ordenes.findIndex((o) => o.id === id);
      if (idx >= 0) s.ordenes[idx] = orden;
    });
    return orden;
  },
};

// API de Guías de Remisión
const guiasAPI = {
  list: async (): Promise<GuiaRemision[]> => {
    await simulateDelay();
    return getState().guias;
  },

  get: async (id: string): Promise<GuiaRemision | null> => {
    await simulateDelay();
    return getState().guias.find((g) => g.id === id) || null;
  },

  create: async (
    data: Omit<GuiaRemision, 'id' | 'numero' | 'serie' | 'correlativo' | 'fechaEmision' | 'createdAt' | 'emitidaAt' | 'estado' | 'hash'> & { serie?: string }
  ): Promise<GuiaRemision> => {
    await simulateDelay();
    // Usar serie proporcionada o default a 'T001'
    const serie = data.serie || 'T001';
    const { serie: _, ...dataWithoutSerie } = data;
    const numeracion = generateGuiaNumero(serie);
    const guia: GuiaRemision = {
      ...dataWithoutSerie,
      ...numeracion,
      id: generateUUID(),
      fechaEmision: new Date().toISOString(),
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
      hash: generateUUID().replace(/-/g, '').substring(0, 32),
    };
    setState((s) => {
      s.guias.push(guia);
    });
    return guia;
  },

  // Emitir guía (cambiar estado a emitida)
  emitir: async (id: string): Promise<GuiaRemision | null> => {
    await simulateDelay();
    const state = getState();
    const guia = state.guias.find((g) => g.id === id);
    if (!guia) return null;
    guia.estado = 'emitida';
    guia.emitidaAt = new Date().toISOString();
    if (!guia.hash) {
      guia.hash = generateUUID().replace(/-/g, '').substring(0, 32);
    }
    setState((s) => {
      const idx = s.guias.findIndex((g) => g.id === id);
      if (idx >= 0) s.guias[idx] = guia;
    });
    return guia;
  },

  // Anular guía
  anular: async (id: string): Promise<GuiaRemision | null> => {
    await simulateDelay();
    const state = getState();
    const guia = state.guias.find((g) => g.id === id);
    if (!guia) return null;
    guia.estado = 'anulada';
    setState((s) => {
      const idx = s.guias.findIndex((g) => g.id === id);
      if (idx >= 0) s.guias[idx] = guia;
    });
    return guia;
  },
};

// API de Facturas
const facturasAPI = {
  list: async (): Promise<Factura[]> => {
    await simulateDelay();
    return getState().facturas;
  },

  get: async (id: string): Promise<Factura | null> => {
    await simulateDelay();
    return getState().facturas.find((f) => f.id === id) || null;
  },

  create: async (
    data: Omit<Factura, 'id' | 'numero' | 'serie' | 'correlativo' | 'fechaEmision' | 'createdAt' | 'emitidaAt' | 'estado' | 'hash'> & { serie?: string }
  ): Promise<Factura> => {
    await simulateDelay();
    // Usar serie proporcionada o default a 'F001'
    const serie = data.serie || 'F001';
    const { serie: _, ...dataWithoutSerie } = data;
    const numeracion = generateFacturaNumero(serie);

    // Calcular detracción si aplica (4% cuando total >= 700)
    const detraccion = dataWithoutSerie.total >= 700
      ? {
          aplica: true,
          porcentaje: 4,
          monto: dataWithoutSerie.total * 0.04,
          cuenta: '0123456789',
          codigo: '027',
        }
      : undefined;

    const factura: Factura = {
      ...dataWithoutSerie,
      ...numeracion,
      id: generateUUID(),
      fechaEmision: new Date().toISOString(),
      estado: 'pendiente',
      detraccion,
      createdAt: new Date().toISOString(),
      hash: generateUUID().replace(/-/g, '').substring(0, 32),
    };
    setState((s) => {
      s.facturas.push(factura);
    });
    return factura;
  },

  // Emitir factura (cambiar estado a emitida)
  emitir: async (id: string): Promise<Factura | null> => {
    await simulateDelay();
    const state = getState();
    const factura = state.facturas.find((f) => f.id === id);
    if (!factura) return null;
    factura.estado = 'emitida';
    factura.emitidaAt = new Date().toISOString();
    if (!factura.hash) {
      factura.hash = generateUUID().replace(/-/g, '').substring(0, 32);
    }
    setState((s) => {
      const idx = s.facturas.findIndex((f) => f.id === id);
      if (idx >= 0) s.facturas[idx] = factura;
    });
    return factura;
  },

  // Anular factura
  anular: async (id: string): Promise<Factura | null> => {
    await simulateDelay();
    const state = getState();
    const factura = state.facturas.find((f) => f.id === id);
    if (!factura) return null;
    factura.estado = 'anulada';
    setState((s) => {
      const idx = s.facturas.findIndex((f) => f.id === id);
      if (idx >= 0) s.facturas[idx] = factura;
    });
    return factura;
  },
};

// API de Reportes
const reportesAPI = {
  kpis: async (): Promise<KPIs> => {
    await simulateDelay();
    const state = getState();
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    // Órdenes activas (no entregadas, no anuladas, no facturadas)
    const ordenesActivas = state.ordenes.filter(
      (o) => !['entregada', 'facturada', 'anulada'].includes(o.estado)
    ).length;

    // Órdenes entregadas
    const ordenesEntregadas = state.ordenes.filter((o) => o.estado === 'entregada').length;

    // Órdenes de este mes
    const ordenesMes = state.ordenes.filter((o) => {
      const fecha = new Date(o.fecha);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    }).length;

    // Facturación de este mes (PEN)
    const facturacionMesPEN = state.facturas
      .filter((f) => f.estado === 'emitida')
      .filter((f) => {
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
      })
      .reduce((sum, f) => sum + f.total, 0);

    // Facturación del mes anterior
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual;
    const facturacionMesAnterior = state.facturas
      .filter((f) => f.estado === 'emitida')
      .filter((f) => {
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoAnterior;
      })
      .reduce((sum, f) => sum + f.total, 0);

    // Detracciones de este mes
    const detraccionesMes = state.facturas
      .filter((f) => f.estado === 'emitida' && f.detraccion?.aplica)
      .filter((f) => {
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
      })
      .reduce((sum, f) => sum + (f.detraccion?.monto || 0), 0);

    // Top 5 clientes por facturación
    const clienteFacturacion = new Map<string, number>();
    state.facturas
      .filter((f) => f.estado === 'emitida')
      .forEach((f) => {
        const actual = clienteFacturacion.get(f.clienteId) || 0;
        clienteFacturacion.set(f.clienteId, actual + f.total);
      });

    const topClientes = Array.from(clienteFacturacion.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clienteId, total]) => {
        const cliente = state.clientes.find((c) => c.id === clienteId);
        return {
          clienteId,
          razonSocial: cliente?.razonSocial || 'Desconocido',
          total,
        };
      });

    // Órdenes por estado
    const ordenesPorEstado = [
      'borrador',
      'confirmada',
      'en_ruta',
      'entregada',
      'facturada',
      'anulada',
    ].map((estado) => ({
      estado: estado as EstadoOrden,
      count: state.ordenes.filter((o) => o.estado === estado).length,
    }));

    // Ingresos últimos 6 meses
    const ingresosUltimos6Meses: { mes: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mes = fecha.toLocaleString('es-PE', { month: 'short', year: '2-digit' });
      const total = state.facturas
        .filter((f) => f.estado === 'emitida')
        .filter((f) => {
          const fFecha = new Date(f.fechaEmision);
          return fFecha.getMonth() === fecha.getMonth() && fFecha.getFullYear() === fecha.getFullYear();
        })
        .reduce((sum, f) => sum + f.total, 0);
      ingresosUltimos6Meses.push({ mes, total });
    }

    return {
      ordenesActivas,
      ordenesEntregadas,
      ordenesMes,
      facturacionMesPEN,
      facturacionMesAnterior,
      detraccionesMes,
      topClientes,
      ordenesPorEstado,
      ingresosUltimos6Meses,
    };
  },
};

// Helpers para descarga de PDFs (delegan a lib/pdf)
import { descargarPdfFactura, descargarPdfGuia } from './lib/pdf';

const descargarPdfFacturaWrapper = async (id: string): Promise<void> => {
  const state = getState();
  const factura = state.facturas.find((f) => f.id === id);
  if (!factura) throw new Error('Factura no encontrada');
  const cliente = state.clientes.find((c) => c.id === factura.clienteId);
  if (!cliente) throw new Error('Cliente no encontrado');
  descargarPdfFactura(factura, { cliente });
};

const descargarPdfGuiaWrapper = async (id: string): Promise<void> => {
  const state = getState();
  const guia = state.guias.find((g) => g.id === id);
  if (!guia) throw new Error('Guía no encontrada');
  const orden = state.ordenes.find((o) => o.id === guia.ordenId);
  const conductor = orden ? state.conductores.find((c) => c.id === orden.conductorId) : undefined;
  const vehiculo = orden ? state.vehiculos.find((v) => v.id === orden.vehiculoId) : undefined;
  const cliente = orden ? state.clientes.find((c) => c.id === orden.clienteId) : undefined;
  descargarPdfGuia(guia, { conductor, vehiculo, cliente });
};

// Exportar API completa con aliases (.delete -> .remove, .descargarPDF para guías y facturas)
export const transporteAPI = {
  clientes: { ...clientesAPI, delete: clientesAPI.remove },
  conductores: { ...conductoresAPI, delete: conductoresAPI.remove },
  vehiculos: { ...vehiculosAPI, delete: vehiculosAPI.remove },
  ordenes: { ...ordenesAPI, delete: ordenesAPI.remove },
  guias: { ...guiasAPI, descargarPDF: descargarPdfGuiaWrapper },
  facturas: { ...facturasAPI, descargarPDF: descargarPdfFacturaWrapper },
  reportes: reportesAPI,
};
