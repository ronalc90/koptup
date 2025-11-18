'use client';

import { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { MagnifyingGlassIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ResultadoBusqueda {
  cups: {
    codigo: string;
    descripcion: string;
    categoria: string;
    especialidad?: string;
    tarifaISS2004?: number;
    tarifaSOAT?: number;
  };
  similaridad: number;
}

export default function BusquedaSemanticaCUPS() {
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [tiempoBusqueda, setTiempoBusqueda] = useState<number | null>(null);

  const buscarSemantica = async () => {
    if (!consulta.trim()) return;

    setBuscando(true);
    setResultados([]);
    const inicio = Date.now();

    try {
      const res = await fetch(`${API_BASE_URL}/cups/buscar-semantica`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta: consulta.trim(),
          limite: 10,
          umbralSimilaridad: 0.7,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResultados(data.data.resultados);
        setTiempoBusqueda(Date.now() - inicio);
      }
    } catch (error) {
      console.error('Error en búsqueda semántica:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarSemantica();
    }
  };

  const ejemplos = [
    'dolor de cabeza intenso con náuseas',
    'examen de sangre para diabetes',
    'cirugía de apendicitis',
    'consulta por problemas de corazón',
    'radiografía de tórax',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-primary-500" />
            <div>
              <CardTitle>Búsqueda Semántica de CUPS</CardTitle>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Encuentra procedimientos usando lenguaje natural con IA
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ej: dolor de cabeza intenso..."
                className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white"
                disabled={buscando}
              />
              <MagnifyingGlassIcon className="absolute right-3 top-3.5 h-5 w-5 text-secondary-400" />
            </div>
            <Button
              onClick={buscarSemantica}
              disabled={buscando || !consulta.trim()}
              className="px-6"
            >
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Ejemplos rápidos */}
          <div className="mb-6">
            <p className="text-xs text-secondary-500 mb-2">Ejemplos rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {ejemplos.map((ejemplo, idx) => (
                <button
                  key={idx}
                  onClick={() => setConsulta(ejemplo)}
                  className="text-xs px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  {ejemplo}
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo de búsqueda */}
          {tiempoBusqueda !== null && (
            <div className="flex items-center gap-2 mb-4 text-sm text-secondary-600 dark:text-secondary-400">
              <ClockIcon className="h-4 w-4" />
              <span>Búsqueda completada en {tiempoBusqueda}ms</span>
              <Badge variant="success">{resultados.length} resultados</Badge>
            </div>
          )}

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="space-y-3">
              {resultados.map((resultado, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="primary">{resultado.cups.codigo}</Badge>
                        <Badge
                          variant={
                            resultado.similaridad >= 0.9
                              ? 'success'
                              : resultado.similaridad >= 0.8
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {(resultado.similaridad * 100).toFixed(0)}% similar
                        </Badge>
                      </div>
                      <h3 className="font-medium text-secondary-900 dark:text-white mb-1">
                        {resultado.cups.descripcion}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Categoría:</span>
                          {resultado.cups.categoria}
                        </span>
                        {resultado.cups.especialidad && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">•</span>
                            <span className="font-medium">Especialidad:</span>
                            {resultado.cups.especialidad}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {resultado.cups.tarifaISS2004 && (
                        <div className="text-sm">
                          <span className="text-secondary-600 dark:text-secondary-400">
                            ISS 2004:
                          </span>
                          <p className="font-semibold text-primary-600 dark:text-primary-400">
                            ${resultado.cups.tarifaISS2004.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {resultado.cups.tarifaSOAT && (
                        <div className="text-sm mt-1">
                          <span className="text-secondary-600 dark:text-secondary-400">SOAT:</span>
                          <p className="font-medium text-secondary-700 dark:text-secondary-300">
                            ${resultado.cups.tarifaSOAT.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {!buscando && resultados.length === 0 && tiempoBusqueda === null && (
            <div className="text-center py-12">
              <SparklesIcon className="h-16 w-16 text-secondary-300 dark:text-secondary-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Búsqueda Inteligente con IA
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
                Describe el procedimiento en lenguaje natural y encontraremos los códigos CUPS más
                relevantes usando inteligencia artificial.
              </p>
            </div>
          )}

          {/* Sin resultados */}
          {!buscando && resultados.length === 0 && tiempoBusqueda !== null && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-16 w-16 text-secondary-300 dark:text-secondary-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Intenta con una descripción diferente o más específica.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
