'use client';

import { useState, useEffect } from 'react';
import liquidacionService, {
  Radicado,
  CrearRadicadoData,
  ResultadoLiquidacion,
} from '@/services/liquidacion.service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

export default function LiquidacionPage() {
  const [radicados, setRadicados] = useState<Radicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [radicadoSeleccionado, setRadicadoSeleccionado] = useState<string | null>(null);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<FileList | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLiquidacion | null>(null);

  const [formData, setFormData] = useState<CrearRadicadoData>({
    numeroRadicado: '',
    nit: '',
    eps: '',
    nombreIPS: '',
    valorContratado: undefined,
    creadoPor: 'usuario@sistema.com',
  });

  useEffect(() => {
    cargarRadicados();
  }, []);

  const cargarRadicados = async () => {
    try {
      setLoading(true);
      const response = await liquidacionService.obtenerRadicados({ limit: 50 });
      setRadicados(response.data);
    } catch (error) {
      console.error('Error cargando radicados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearRadicado = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await liquidacionService.crearRadicado(formData);
      alert('Radicado creado exitosamente');
      setFormData({
        numeroRadicado: '',
        nit: '',
        eps: '',
        nombreIPS: '',
        valorContratado: undefined,
        creadoPor: 'usuario@sistema.com',
      });
      setMostrarFormulario(false);
      cargarRadicados();
    } catch (error: any) {
      console.error('Error creando radicado:', error);
      alert(error.response?.data?.message || 'Error al crear radicado');
    }
  };

  const handleSubirArchivos = async (radicadoId: string) => {
    if (!archivosSeleccionados || archivosSeleccionados.length === 0) {
      alert('Selecciona al menos un archivo PDF');
      return;
    }

    try {
      await liquidacionService.subirDocumentos(radicadoId, archivosSeleccionados);
      alert(`${archivosSeleccionados.length} archivo(s) subido(s) exitosamente`);
      setArchivosSeleccionados(null);
      setRadicadoSeleccionado(null);
      cargarRadicados();
    } catch (error: any) {
      console.error('Error subiendo archivos:', error);
      alert(error.response?.data?.message || 'Error al subir archivos');
    }
  };

  const handleLiquidar = async (radicadoId: string) => {
    if (!confirm('¿Ejecutar liquidación automatizada? Este proceso puede tardar varios minutos.'))
      return;

    try {
      setProcesando(true);
      setResultado(null);
      const res = await liquidacionService.liquidarRadicado(radicadoId);
      setResultado(res);
      alert('Liquidación completada exitosamente');
      cargarRadicados();
    } catch (error: any) {
      console.error('Error en liquidación:', error);
      alert(error.response?.data?.message || 'Error al liquidar radicado');
    } finally {
      setProcesando(false);
    }
  };

  const handleDescargarExcel = async (radicadoId: string, numeroRadicado: string) => {
    try {
      const blob = await liquidacionService.descargarExcel(radicadoId);
      liquidacionService.downloadExcel(blob, numeroRadicado);
      alert('Excel descargado exitosamente');
    } catch (error: any) {
      console.error('Error descargando Excel:', error);
      alert(error.response?.data?.message || 'Error al descargar Excel');
    }
  };

  const handleEliminar = async (radicadoId: string) => {
    if (!confirm('¿Eliminar este radicado?')) return;

    try {
      await liquidacionService.eliminarRadicado(radicadoId);
      alert('Radicado eliminado');
      cargarRadicados();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar radicado');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      pendiente: { variant: 'secondary', label: '⏳ Pendiente' },
      en_proceso: { variant: 'default', label: '⚙️ En Proceso' },
      validado: { variant: 'default', label: '✅ Validado' },
      liquidado: { variant: 'success', label: '✅ Liquidado' },
      con_glosas: { variant: 'warning', label: '⚠️ Con Glosas' },
      finalizado: { variant: 'success', label: '✅ Finalizado' },
      rechazado: { variant: 'destructive', label: '❌ Rechazado' },
    };
    return badges[estado] || { variant: 'secondary', label: estado };
  };

  const getRangoDescripcion = (rango: number) => {
    const rangos: Record<number, string> = {
      1: '< $100k',
      2: '$100k-$500k',
      3: '$500k-$1M',
      4: '> $1M',
    };
    return rangos[rango] || `Rango ${rango}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Cargando radicados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Liquidación de Cuentas Médicas</h1>
              <p className="text-gray-600 mt-2">
                Sistema automatizado de liquidación con IA
              </p>
            </div>
            <Link href="/liquidacion/reglas">
              <Button variant="outline">⚙️ Gestionar Reglas</Button>
            </Link>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mb-6 flex gap-4">
          <Button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
            {mostrarFormulario ? 'Cancelar' : '+ Nuevo Radicado'}
          </Button>
          <Button variant="outline" onClick={cargarRadicados}>
            🔄 Refrescar
          </Button>
        </div>

        {/* Formulario de creación */}
        {mostrarFormulario && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Crear Nuevo Radicado</h2>
            <form onSubmit={handleCrearRadicado} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Radicado *
                  </label>
                  <Input
                    value={formData.numeroRadicado}
                    onChange={(e) =>
                      setFormData({ ...formData, numeroRadicado: e.target.value })
                    }
                    placeholder="RAD-2024-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIT *</label>
                  <Input
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                    placeholder="900123456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EPS *</label>
                  <Input
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    placeholder="Nueva EPS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre IPS
                  </label>
                  <Input
                    value={formData.nombreIPS}
                    onChange={(e) => setFormData({ ...formData, nombreIPS: e.target.value })}
                    placeholder="IPS Salud Total"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Contratado EPS
                  </label>
                  <Input
                    type="number"
                    value={formData.valorContratado || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorContratado: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="75000"
                  />
                </div>
              </div>

              <Button type="submit">Crear Radicado</Button>
            </form>
          </Card>
        )}

        {/* Resultado de liquidación */}
        {resultado && (
          <Card className="mb-8 p-6 bg-green-50 border-green-200">
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              ✅ Liquidación Completada
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Radicado</p>
                  <p className="font-semibold">{resultado.radicado.numeroRadicado}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant={getEstadoBadge(resultado.radicado.estado).variant}>
                    {getEstadoBadge(resultado.radicado.estado).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rango</p>
                  <p className="font-semibold">{getRangoDescripcion(resultado.radicado.rango)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Valor a Pagar</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${resultado.valorFinalAPagar.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Total Glosas</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${resultado.valorGlosaTotal.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Reglas Aplicadas: {resultado.reglasAplicadas.length}
                </p>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Glosas Encontradas: {resultado.glosas.length}
                </p>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-sm font-medium text-gray-700">Mensajes:</p>
                {resultado.mensajes.map((msg, idx) => (
                  <p key={idx} className="text-sm text-gray-600">
                    {msg}
                  </p>
                ))}
              </div>

              {resultado.excelGenerado && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    handleDescargarExcel(resultado.radicado.id, resultado.radicado.numeroRadicado)
                  }
                >
                  📥 Descargar Excel
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Indicador de procesamiento */}
        {procesando && (
          <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold text-blue-900">Procesando liquidación...</p>
                <p className="text-sm text-blue-700">
                  Esto puede tardar varios minutos. Se están ejecutando validaciones, consultas
                  externas y aplicando reglas de negocio.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de radicados */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Radicados ({radicados.length})</h2>

          {radicados.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay radicados creados aún</p>
              <Button className="mt-4" onClick={() => setMostrarFormulario(true)}>
                Crear Primer Radicado
              </Button>
            </Card>
          ) : (
            radicados.map((radicado) => (
              <Card key={radicado.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{radicado.numeroRadicado}</h3>
                      <Badge variant={getEstadoBadge(radicado.estado).variant}>
                        {getEstadoBadge(radicado.estado).label}
                      </Badge>
                      <Badge variant="secondary">
                        {getRangoDescripcion(radicado.rango)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">NIT</p>
                        <p className="font-medium">{radicado.nit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">EPS</p>
                        <p className="font-medium">{radicado.eps}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">IPS</p>
                        <p className="font-medium">{radicado.nombreIPS || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="font-medium">
                          {radicado.valorTotal
                            ? `$${radicado.valorTotal.toLocaleString()}`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-6 text-sm text-gray-600">
                      <span>📎 {radicado.numDocumentos} documentos</span>
                      <span>✅ {radicado.numValidaciones} validaciones</span>
                      <span>⚠️ {radicado.numGlosas} glosas</span>
                      {radicado.excelGenerado && <span>📊 Excel generado</span>}
                    </div>

                    {/* Subir documentos */}
                    {radicadoSeleccionado === radicado.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar archivos PDF
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={(e) => setArchivosSeleccionados(e.target.files)}
                          className="mb-3"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleSubirArchivos(radicado.id)}>
                            Subir Archivos
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRadicadoSeleccionado(null);
                              setArchivosSeleccionados(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {radicado.estado === 'pendiente' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRadicadoSeleccionado(radicado.id)}
                      >
                        📎 Subir PDFs
                      </Button>
                    )}

                    {radicado.numDocumentos > 0 &&
                      ['pendiente', 'con_glosas'].includes(radicado.estado) && (
                        <Button size="sm" onClick={() => handleLiquidar(radicado.id)}>
                          🚀 Liquidar
                        </Button>
                      )}

                    {radicado.excelGenerado && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDescargarExcel(radicado.id, radicado.numeroRadicado)}
                      >
                        📥 Excel
                      </Button>
                    )}

                    <Link href={`/liquidacion/${radicado.id}`}>
                      <Button size="sm" variant="outline">
                        👁️ Ver
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEliminar(radicado.id)}
                    >
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
