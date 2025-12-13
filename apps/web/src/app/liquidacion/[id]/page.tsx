'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import liquidacionService, { RadicadoCompleto } from '@/services/liquidacion.service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

export default function DetalleRadicadoPage() {
  const params = useParams();
  const router = useRouter();
  const [radicado, setRadicado] = useState<RadicadoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      cargarRadicado(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const cargarRadicado = async (id: string) => {
    try {
      setLoading(true);
      const data = await liquidacionService.obtenerRadicadoPorId(id);
      setRadicado(data);
    } catch (error) {
      console.error('Error cargando radicado:', error);
      alert('Error al cargar el radicado');
      router.push('/liquidacion');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = async () => {
    if (!radicado) return;

    try {
      const blob = await liquidacionService.descargarExcel(radicado.id);
      liquidacionService.downloadExcel(blob, radicado.numeroRadicado);
    } catch (error) {
      console.error('Error descargando Excel:', error);
      alert('Error al descargar Excel');
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
      rechazado: { variant: 'danger', label: '❌ Rechazado' },
    };
    return badges[estado] || { variant: 'secondary', label: estado };
  };

  const getRangoDescripcion = (rango: number) => {
    const rangos: Record<number, string> = {
      1: '< $100,000',
      2: '$100,000 - $500,000',
      3: '$500,000 - $1,000,000',
      4: '> $1,000,000',
    };
    return rangos[rango] || `Rango ${rango}`;
  };

  const getValidacionIcon = (estado: string) => {
    return estado === 'aprobado' ? '✅' : estado === 'rechazado' ? '❌' : '⚠️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-center">Cargando...</p>
      </div>
    );
  }

  if (!radicado) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-center">Radicado no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link href="/liquidacion">
              <Button variant="outline" size="sm">
                ← Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              Radicado: {radicado.numeroRadicado}
            </h1>
            <div className="flex gap-3 mt-2">
              <Badge variant={getEstadoBadge(radicado.estado).variant}>
                {getEstadoBadge(radicado.estado).label}
              </Badge>
              <Badge variant="secondary">{getRangoDescripcion(radicado.rango)}</Badge>
            </div>
          </div>

          {radicado.liquidacion?.excelGenerado && (
            <Button onClick={handleDescargarExcel}>📥 Descargar Excel</Button>
          )}
        </div>

        {/* Información General */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Información General</h2>
          <div className="grid grid-cols-3 gap-4">
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
              <p className="text-sm text-gray-600">Número de Factura</p>
              <p className="font-medium">{radicado.numeroFactura || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="font-medium">
                {radicado.valorTotal ? `$${radicado.valorTotal.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Atención</p>
              <p className="font-medium">{radicado.tipoAtencion || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Documentos */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Documentos ({radicado.documentos.length})
          </h2>
          <div className="space-y-2">
            {radicado.documentos.map((doc, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{doc.originalName}</p>
                  <p className="text-sm text-gray-600">
                    Tipo: {doc.tipo} | Tamaño: {(doc.size / 1024).toFixed(2)} KB
                    {doc.procesado && ' | ✅ Procesado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Validaciones */}
        {radicado.validaciones && radicado.validaciones.length > 0 && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Validaciones ({radicado.validaciones.length})
            </h2>
            <div className="space-y-3">
              {radicado.validaciones.map((val, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    val.estado === 'aprobado'
                      ? 'bg-green-50 border-green-200'
                      : val.estado === 'rechazado'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getValidacionIcon(val.estado)}</span>
                    <div className="flex-1">
                      <p className="font-semibold capitalize">{val.tipo.replace('_', ' ')}</p>
                      <p className="text-sm mt-1">{val.mensaje}</p>
                      {val.detalles && (
                        <p className="text-xs text-gray-600 mt-2">
                          {JSON.stringify(val.detalles)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Reglas Aplicadas */}
        {radicado.reglasAplicadas && radicado.reglasAplicadas.length > 0 && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Reglas Aplicadas ({radicado.reglasAplicadas.length})
            </h2>
            <div className="space-y-2">
              {radicado.reglasAplicadas.map((regla, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded">
                  <p className="font-medium">{regla.nombreRegla}</p>
                  <p className="text-sm text-gray-600">Acción: {regla.accion}</p>
                  {regla.resultado && (
                    <p className="text-xs text-gray-500">Resultado: {regla.resultado}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Glosas */}
        {radicado.glosas && radicado.glosas.length > 0 && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-700">
              Glosas Encontradas ({radicado.glosas.length})
            </h2>
            <div className="space-y-3">
              {radicado.glosas.map((glosa, idx) => (
                <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{glosa.descripcion}</p>
                      <p className="text-sm text-gray-600">
                        Código: {glosa.codigo || 'N/A'} | Tipo: {glosa.tipo}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      ${glosa.valor.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Liquidación */}
        {radicado.liquidacion && (
          <Card className="mb-6 p-6 bg-green-50 border-green-200">
            <h2 className="text-xl font-semibold mb-4 text-green-900">Resultado de Liquidación</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded">
                <p className="text-sm text-gray-600">Valor Final a Pagar</p>
                <p className="text-2xl font-bold text-green-600">
                  ${radicado.liquidacion.valorFinalAPagar.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-white rounded">
                <p className="text-sm text-gray-600">Total Glosas</p>
                <p className="text-2xl font-bold text-red-600">
                  ${radicado.liquidacion.valorGlosaTotal.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-white rounded">
                <p className="text-sm text-gray-600">Valor Aceptado</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${radicado.liquidacion.valorAceptado.toLocaleString()}
                </p>
              </div>
            </div>

            {radicado.liquidacion.observaciones && (
              <div className="mt-4 p-4 bg-white rounded">
                <p className="text-sm font-medium text-gray-700 mb-2">Observaciones:</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {radicado.liquidacion.observaciones}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Consultas Externas */}
        {radicado.consultasExternas && radicado.consultasExternas.length > 0 && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Consultas Externas ({radicado.consultasExternas.length})
            </h2>
            <div className="space-y-2">
              {radicado.consultasExternas.map((consulta, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded ${
                    consulta.exitosa ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{consulta.sistema.toUpperCase()}</p>
                      <p className="text-sm text-gray-600">{consulta.url}</p>
                    </div>
                    <Badge variant={consulta.exitosa ? 'success' : 'danger'}>
                      {consulta.exitosa ? '✅ Exitosa' : '❌ Fallida'}
                    </Badge>
                  </div>
                  {consulta.error && (
                    <p className="text-sm text-red-600 mt-2">Error: {consulta.error}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Observaciones Generales */}
        {radicado.observacionesGenerales && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Observaciones Generales</h2>
            <p className="text-gray-700 whitespace-pre-line">{radicado.observacionesGenerales}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
