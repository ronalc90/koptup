import { Factura, ResultadoAuditoria, Estadisticas, Tarifario } from './tipos-auditoria';

// Asegurarse de que siempre use /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

export const auditoriaAPI = {
  // Facturas
  async obtenerFacturas(params?: {
    estado?: string;
    eps?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    const response = await fetch(`${API_BASE}/auditoria/facturas?${queryParams}`);
    if (!response.ok) throw new Error('Error al obtener facturas');
    return response.json();
  },

  async obtenerFacturaPorId(id: string) {
    const response = await fetch(`${API_BASE}/auditoria/facturas/${id}`);
    if (!response.ok) throw new Error('Error al obtener factura');
    return response.json();
  },

  async crearFactura(factura: Partial<Factura>) {
    const response = await fetch(`${API_BASE}/auditoria/facturas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factura),
    });
    if (!response.ok) throw new Error('Error al crear factura');
    return response.json();
  },

  async eliminarFactura(id: string) {
    const response = await fetch(`${API_BASE}/auditoria/facturas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar factura');
    return response.json();
  },

  async ejecutarAuditoria(facturaId: string): Promise<{ success: boolean; data: ResultadoAuditoria }> {
    const response = await fetch(`${API_BASE}/auditoria/facturas/${facturaId}/auditar`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Error al ejecutar auditoría');
    return response.json();
  },

  async descargarExcel(facturaId: string) {
    const response = await fetch(`${API_BASE}/auditoria/facturas/${facturaId}/excel`);
    if (!response.ok) throw new Error('Error al generar Excel');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_${facturaId}_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Soportes
  async subirSoporte(formData: FormData) {
    const response = await fetch(`${API_BASE}/auditoria/soportes`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Error al subir soporte');
    return response.json();
  },

  // Tarifarios
  async obtenerTarifarios(params?: { tipo?: string; eps?: string; activo?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const response = await fetch(`${API_BASE}/auditoria/tarifarios?${queryParams}`);
    if (!response.ok) throw new Error('Error al obtener tarifarios');
    return response.json();
  },

  // Glosas
  async actualizarGlosa(glosaId: string, updates: any) {
    const response = await fetch(`${API_BASE}/auditoria/glosas/${glosaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Error al actualizar glosa');
    return response.json();
  },

  // Estadísticas
  async obtenerEstadisticas(params?: { desde?: string; hasta?: string }): Promise<{ success: boolean; data: Estadisticas }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const response = await fetch(`${API_BASE}/auditoria/estadisticas?${queryParams}`);
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  // Auditoría Paso a Paso
  async iniciarAuditoriaPasoPaso(facturaId: string) {
    const response = await fetch(`${API_BASE}/auditoria/facturas/${facturaId}/auditar-paso-a-paso`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Error al iniciar auditoría paso a paso');
    return response.json();
  },

  async avanzarPaso(sesionId: string) {
    const response = await fetch(`${API_BASE}/auditoria/sesion/${sesionId}/siguiente`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Error al avanzar paso');
    return response.json();
  },

  async obtenerSesion(sesionId: string) {
    const response = await fetch(`${API_BASE}/auditoria/sesion/${sesionId}`);
    if (!response.ok) throw new Error('Error al obtener sesión');
    return response.json();
  },
};
