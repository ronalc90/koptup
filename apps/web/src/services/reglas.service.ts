import axios from 'axios';
import { withAuth } from '@/lib/auth-token';
import { BACKEND_URL as API_URL } from '@/lib/backend-url';

// Envía la sesión (Authorization) en cada llamada: el backend exige staff o
// acceso a la demo de cuentas médicas para estas rutas.
const http = withAuth(axios.create());

export interface Regla {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'glosa' | 'autorizacion' | 'valor' | 'fecha' | 'paciente' | 'servicio' | 'general';
  activa: boolean;
  prioridad: number;
  ambito: {
    tipo: 'global' | 'eps' | 'servicio' | 'rango_valor' | 'tipo_atencion';
    valor?: string;
  };
  estadisticas?: {
    vecesAplicada: number;
    ultimaAplicacion?: Date;
    montoTotalAfectado: number;
    glosasEvitadas: number;
  };
  interpretacion?: {
    confianza: number;
    explicacion: string;
    accion: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearReglaData {
  nombre: string;
  descripcion: string;
  tipo: string;
  activa?: boolean;
  prioridad?: number;
  ambito?: {
    tipo: string;
    valor?: string;
  };
  creadoPor?: string;
}

export interface PrevisualizarReglaData {
  descripcion: string;
  tipo: string;
}

class ReglasService {
  /**
   * Obtener todas las reglas
   */
  async obtenerReglas(filtros?: {
    activa?: boolean;
    tipo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Regla[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filtros?.activa !== undefined) params.append('activa', String(filtros.activa));
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.limit) params.append('limit', String(filtros.limit));
    if (filtros?.offset) params.append('offset', String(filtros.offset));

    const response = await http.get(`${API_URL}/api/reglas-facturacion?${params}`);
    return response.data;
  }

  /**
   * Obtener una regla por ID
   */
  async obtenerReglaPorId(id: string): Promise<Regla> {
    const response = await http.get(`${API_URL}/api/reglas-facturacion/${id}`);
    return response.data.data;
  }

  /**
   * Crear una nueva regla
   */
  async crearRegla(data: CrearReglaData): Promise<Regla> {
    const response = await http.post(`${API_URL}/api/reglas-facturacion`, data);
    return response.data.data;
  }

  /**
   * Actualizar una regla
   */
  async actualizarRegla(id: string, data: Partial<CrearReglaData>): Promise<Regla> {
    const response = await http.patch(`${API_URL}/api/reglas-facturacion/${id}`, data);
    return response.data.data;
  }

  /**
   * Eliminar una regla
   */
  async eliminarRegla(id: string): Promise<void> {
    await http.delete(`${API_URL}/api/reglas-facturacion/${id}`);
  }

  /**
   * Activar/Desactivar una regla
   */
  async toggleRegla(id: string): Promise<Regla> {
    const response = await http.patch(`${API_URL}/api/reglas-facturacion/${id}/toggle`);
    return response.data.data;
  }

  /**
   * Obtener ejemplos de reglas
   */
  async obtenerEjemplos(): Promise<any[]> {
    const response = await http.get(`${API_URL}/api/reglas-facturacion/ejemplos`);
    return response.data.data;
  }

  /**
   * Previsualizar interpretación de una regla
   */
  async previsualizarRegla(data: PrevisualizarReglaData): Promise<any> {
    const response = await http.post(`${API_URL}/api/reglas-facturacion/previsualizar`, data);
    return response.data.data;
  }
}

const reglasServiceInstance = new ReglasService();
export default reglasServiceInstance;
