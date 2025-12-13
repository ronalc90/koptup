import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Radicado {
  id: string;
  numeroRadicado: string;
  nit: string;
  nombreIPS?: string;
  eps: string;
  numeroFactura?: string;
  valorTotal?: number;
  tipoAtencion?: string;
  rango: number;
  estado: 'pendiente' | 'en_proceso' | 'validado' | 'liquidado' | 'con_glosas' | 'finalizado' | 'rechazado';
  numDocumentos: number;
  numValidaciones: number;
  numGlosas: number;
  excelGenerado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadicadoCompleto extends Radicado {
  documentos: any[];
  paciente?: any;
  autorizacion?: any;
  validaciones: any[];
  glosas?: any[];
  reglasAplicadas?: any[];
  cuotaModeradora?: any;
  liquidacion?: any;
  consultasExternas?: any[];
  observacionesGenerales?: string;
}

export interface CrearRadicadoData {
  numeroRadicado: string;
  nit: string;
  eps: string;
  nombreIPS?: string;
  valorContratado?: number;
  creadoPor?: string;
}

export interface ResultadoLiquidacion {
  radicado: {
    id: string;
    numeroRadicado: string;
    estado: string;
    rango: number;
  };
  validaciones: any;
  reglasAplicadas: any[];
  glosas: any[];
  valorFinalAPagar: number;
  valorGlosaTotal: number;
  excelGenerado: boolean;
  rutaExcel?: string;
  mensajes: string[];
}

export interface Estadisticas {
  total: number;
  porEstado: Array<{ _id: string; count: number }>;
  porRango: Array<{ _id: number; count: number; valorPromedio: number }>;
  glosas: {
    conGlosas: number;
    sinGlosas: number;
  };
}

class LiquidacionService {
  /**
   * Crear un nuevo radicado
   */
  async crearRadicado(data: CrearRadicadoData): Promise<Radicado> {
    const response = await axios.post(`${API_URL}/api/liquidacion/radicados`, data);
    return response.data.data;
  }

  /**
   * Obtener todos los radicados
   */
  async obtenerRadicados(filtros?: {
    estado?: string;
    eps?: string;
    rango?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Radicado[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.eps) params.append('eps', filtros.eps);
    if (filtros?.rango) params.append('rango', String(filtros.rango));
    if (filtros?.limit) params.append('limit', String(filtros.limit));
    if (filtros?.offset) params.append('offset', String(filtros.offset));

    const response = await axios.get(`${API_URL}/api/liquidacion/radicados?${params}`);
    return response.data;
  }

  /**
   * Obtener un radicado por ID o número
   */
  async obtenerRadicadoPorId(id: string): Promise<RadicadoCompleto> {
    const response = await axios.get(`${API_URL}/api/liquidacion/radicados/${id}`);
    return response.data.data;
  }

  /**
   * Subir documentos a un radicado
   */
  async subirDocumentos(id: string, files: FileList | File[]): Promise<any> {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const response = await axios.post(
      `${API_URL}/api/liquidacion/radicados/${id}/documentos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Ejecutar liquidación automatizada
   */
  async liquidarRadicado(id: string): Promise<ResultadoLiquidacion> {
    const response = await axios.post(`${API_URL}/api/liquidacion/radicados/${id}/liquidar`);
    return response.data.data;
  }

  /**
   * Descargar Excel de liquidación
   */
  async descargarExcel(id: string): Promise<Blob> {
    const response = await axios.get(
      `${API_URL}/api/liquidacion/radicados/${id}/descargar-excel`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Eliminar un radicado
   */
  async eliminarRadicado(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/liquidacion/radicados/${id}`);
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(): Promise<Estadisticas> {
    const response = await axios.get(`${API_URL}/api/liquidacion/estadisticas`);
    return response.data.data;
  }

  /**
   * Helper para descargar el Excel
   */
  downloadExcel(blob: Blob, numeroRadicado: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liquidacion_${numeroRadicado}_${new Date().getTime()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

const liquidacionServiceInstance = new LiquidacionService();
export default liquidacionServiceInstance;
