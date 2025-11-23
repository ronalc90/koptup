'use client';

import { useState, useEffect } from 'react';
import reglasService, { Regla, CrearReglaData } from '@/services/reglas.service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';

export default function ReglasPage() {
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [reglaEditando, setReglaEditando] = useState<Regla | null>(null);
  const [ejemplos, setEjemplos] = useState<any[]>([]);
  const [previsualizacion, setPrevisualizacion] = useState<any | null>(null);

  // Formulario
  const [formData, setFormData] = useState<CrearReglaData>({
    nombre: '',
    descripcion: '',
    tipo: 'glosa',
    activa: true,
    prioridad: 100,
  });

  useEffect(() => {
    cargarReglas();
    cargarEjemplos();
  }, []);

  const cargarReglas = async () => {
    try {
      setLoading(true);
      const response = await reglasService.obtenerReglas({ limit: 100 });
      setReglas(response.data);
    } catch (error) {
      console.error('Error cargando reglas:', error);
      alert('Error al cargar las reglas');
    } finally {
      setLoading(false);
    }
  };

  const cargarEjemplos = async () => {
    try {
      const data = await reglasService.obtenerEjemplos();
      setEjemplos(data);
    } catch (error) {
      console.error('Error cargando ejemplos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (reglaEditando) {
        await reglasService.actualizarRegla(reglaEditando.id, formData);
        alert('Regla actualizada exitosamente');
      } else {
        await reglasService.crearRegla(formData);
        alert('Regla creada exitosamente');
      }

      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'glosa',
        activa: true,
        prioridad: 100,
      });
      setMostrarFormulario(false);
      setReglaEditando(null);
      setPrevisualizacion(null);
      cargarReglas();
    } catch (error: any) {
      console.error('Error guardando regla:', error);
      alert(error.response?.data?.message || 'Error al guardar la regla');
    }
  };

  const handlePrevisualizar = async () => {
    if (!formData.descripcion || !formData.tipo) {
      alert('Completa la descripción y el tipo para previsualizar');
      return;
    }

    try {
      const resultado = await reglasService.previsualizarRegla({
        descripcion: formData.descripcion,
        tipo: formData.tipo,
      });
      setPrevisualizacion(resultado);
    } catch (error: any) {
      console.error('Error previsualizando:', error);
      alert(error.response?.data?.message || 'Error al previsualizar la regla');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await reglasService.toggleRegla(id);
      cargarReglas();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la regla');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;

    try {
      await reglasService.eliminarRegla(id);
      alert('Regla eliminada');
      cargarReglas();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar la regla');
    }
  };

  const handleEditar = (regla: Regla) => {
    setReglaEditando(regla);
    setFormData({
      nombre: regla.nombre,
      descripcion: regla.descripcion,
      tipo: regla.tipo,
      activa: regla.activa,
      prioridad: regla.prioridad,
    });
    setMostrarFormulario(true);
  };

  const usarEjemplo = (ejemplo: any) => {
    setFormData({
      ...formData,
      descripcion: ejemplo.descripcion,
      tipo: ejemplo.tipo,
      nombre: ejemplo.descripcion.substring(0, 50) + (ejemplo.descripcion.length > 50 ? '...' : ''),
    });
    setMostrarFormulario(true);
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      glosa: 'bg-red-100 text-red-800',
      autorizacion: 'bg-blue-100 text-blue-800',
      valor: 'bg-green-100 text-green-800',
      fecha: 'bg-yellow-100 text-yellow-800',
      servicio: 'bg-purple-100 text-purple-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Cargando reglas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reglas de Facturación</h1>
          <p className="text-gray-600 mt-2">
            Gestiona reglas personalizadas en lenguaje natural interpretadas con IA
          </p>
        </div>

        {/* Botones de acción */}
        <div className="mb-6 flex gap-4">
          <Button
            onClick={() => {
              setMostrarFormulario(!mostrarFormulario);
              setReglaEditando(null);
              setPrevisualizacion(null);
              setFormData({
                nombre: '',
                descripcion: '',
                tipo: 'glosa',
                activa: true,
                prioridad: 100,
              });
            }}
          >
            {mostrarFormulario ? 'Cancelar' : '+ Nueva Regla'}
          </Button>
          <Button variant="outline" onClick={cargarReglas}>
            🔄 Refrescar
          </Button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {reglaEditando ? 'Editar Regla' : 'Crear Nueva Regla'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la regla
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Ignorar glosas pequeñas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción en lenguaje natural
                </label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: No generar glosas por valores menores a $5,000"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="glosa">Glosa</option>
                    <option value="autorizacion">Autorización</option>
                    <option value="valor">Valor</option>
                    <option value="fecha">Fecha</option>
                    <option value="servicio">Servicio</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <Input
                    type="number"
                    value={formData.prioridad}
                    onChange={(e) =>
                      setFormData({ ...formData, prioridad: parseInt(e.target.value) })
                    }
                    min="1"
                    max="1000"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Activa</span>
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <Button type="submit">
                  {reglaEditando ? 'Actualizar Regla' : 'Crear Regla'}
                </Button>
                <Button type="button" variant="outline" onClick={handlePrevisualizar}>
                  👁️ Previsualizar
                </Button>
              </div>

              {/* Previsualización */}
              {previsualizacion && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Interpretación de IA (Confianza: {previsualizacion.interpretacion.confianza}%)
                  </h3>
                  <p className="text-sm text-blue-800 mb-2">
                    {previsualizacion.interpretacion.explicacion}
                  </p>
                  <div className="text-xs text-blue-700">
                    <strong>Acción:</strong> {previsualizacion.interpretacion.accion.tipo}
                  </div>
                  {!previsualizacion.validacion.valida && (
                    <div className="mt-2 text-red-600 text-sm">
                      <strong>Errores:</strong>
                      <ul className="list-disc list-inside">
                        {previsualizacion.validacion.errores.map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </form>
          </Card>
        )}

        {/* Ejemplos */}
        {ejemplos.length > 0 && !mostrarFormulario && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">📚 Ejemplos de Reglas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ejemplos.slice(0, 6).map((ejemplo, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getTipoBadgeColor(ejemplo.tipo)}`}>
                      {ejemplo.tipo}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => usarEjemplo(ejemplo)}>
                      Usar
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mb-1 font-medium">{ejemplo.descripcion}</p>
                  <p className="text-xs text-gray-500">{ejemplo.explicacion}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Lista de reglas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Reglas Activas ({reglas.filter((r) => r.activa).length}/{reglas.length})
          </h2>

          {reglas.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay reglas creadas aún</p>
              <Button className="mt-4" onClick={() => setMostrarFormulario(true)}>
                Crear Primera Regla
              </Button>
            </Card>
          ) : (
            reglas.map((regla) => (
              <Card key={regla.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{regla.nombre}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getTipoBadgeColor(regla.tipo)}`}>
                        {regla.tipo}
                      </span>
                      {regla.activa ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                      <span className="text-xs text-gray-500">Prioridad: {regla.prioridad}</span>
                    </div>

                    <p className="text-gray-700 mb-3">{regla.descripcion}</p>

                    {regla.interpretacion && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>IA:</strong> {regla.interpretacion.explicacion} (Confianza:{' '}
                        {regla.interpretacion.confianza}%)
                      </div>
                    )}

                    {regla.estadisticas && regla.estadisticas.vecesAplicada > 0 && (
                      <div className="flex gap-4 text-sm text-gray-600 mt-3">
                        <span>✅ Aplicada: {regla.estadisticas.vecesAplicada} veces</span>
                        <span>💰 Monto afectado: ${regla.estadisticas.montoTotalAfectado.toLocaleString()}</span>
                        <span>🗑️ Glosas evitadas: {regla.estadisticas.glosasEvitadas}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEditar(regla)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={regla.activa ? 'outline' : 'default'}
                      onClick={() => handleToggle(regla.id)}
                    >
                      {regla.activa ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEliminar(regla.id)}>
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
