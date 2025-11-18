'use client';

import { useState } from 'react';

interface EndpointTest {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  description: string;
  body?: any;
  headers?: Record<string, string>;
}

interface TestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  statusCode?: number;
  data?: any;
  error?: string;
  rawResponse?: string;
  timestamp?: Date;
}

const DEFAULT_BACKEND_URL = 'https://koptupbackend-production.up.railway.app';

const endpoints: EndpointTest[] = [
  // Health & System
  {
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    description: 'Verifica que el servidor esté funcionando',
  },

  // Auth
  {
    name: 'Auth - Register',
    method: 'POST',
    url: '/api/auth/register',
    description: 'Registro de usuario',
    body: {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User',
    },
  },

  // Chatbot
  {
    name: 'Chatbot - Create Session',
    method: 'POST',
    url: '/api/chatbot/session',
    description: 'Crear o recuperar sesión de chatbot',
    body: {
      sessionId: 'test-session-' + Date.now(),
      config: {
        title: 'Test Chatbot',
        greeting: 'Hola, ¿cómo puedo ayudarte?',
      },
    },
  },
  {
    name: 'Chatbot - Send Message',
    method: 'POST',
    url: '/api/chatbot/message',
    description: 'Enviar mensaje al chatbot',
    body: {
      sessionId: 'test-session',
      message: '¿Qué servicios ofrecen?',
    },
  },

  // Contact
  {
    name: 'Contact - Send Message',
    method: 'POST',
    url: '/api/contact',
    description: 'Enviar mensaje de contacto',
    body: {
      name: 'Test User',
      email: 'test@example.com',
      message: 'Test message',
    },
  },

  // Expert System
  {
    name: 'Expert System - Query',
    method: 'POST',
    url: '/api/expert/query',
    description: 'Consultar sistema experto',
    body: {
      query: 'test query',
    },
  },

  // CUPS
  {
    name: 'CUPS - Search',
    method: 'GET',
    url: '/api/cups?search=consulta',
    description: 'Buscar códigos CUPS',
  },

  // Documents
  {
    name: 'Documents - List',
    method: 'GET',
    url: '/api/documents',
    description: 'Listar documentos',
  },

  // Cuentas Médicas
  {
    name: 'Cuentas - Listar',
    method: 'GET',
    url: '/api/cuentas',
    description: 'Listar todas las cuentas médicas',
  },
  {
    name: 'Cuentas - Buscar CUPS',
    method: 'GET',
    url: '/api/cuentas/search/cups?query=consulta',
    description: 'Búsqueda semántica de códigos CUPS',
  },
  {
    name: 'Cuentas - Buscar Medicamentos',
    method: 'GET',
    url: '/api/cuentas/search/medicamentos?query=ibuprofeno',
    description: 'Búsqueda de medicamentos',
  },
  {
    name: 'Cuentas - Buscar Diagnósticos',
    method: 'GET',
    url: '/api/cuentas/search/diagnosticos?query=gripe',
    description: 'Búsqueda de diagnósticos CIE-10',
  },

  // Ley100
  {
    name: 'Ley100 - Listar Documentos',
    method: 'GET',
    url: '/api/ley100',
    description: 'Listar documentos de la Ley 100',
  },

  // Facturas
  {
    name: 'Invoices - Listar',
    method: 'GET',
    url: '/api/invoices',
    description: 'Listar facturas',
  },

  // Órdenes
  {
    name: 'Orders - Listar',
    method: 'GET',
    url: '/api/orders',
    description: 'Listar órdenes',
  },

  // Proyectos
  {
    name: 'Projects - Dashboard Stats',
    method: 'GET',
    url: '/api/projects/dashboard/stats',
    description: 'Estadísticas del dashboard de proyectos',
  },

  // Mensajes
  {
    name: 'Messages - Conversations',
    method: 'GET',
    url: '/api/messages/conversations',
    description: 'Listar conversaciones',
  },

  // Deliverables
  {
    name: 'Deliverables - Listar',
    method: 'GET',
    url: '/api/deliverables',
    description: 'Listar entregables',
  },
];

export default function TestPage() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const testEndpoint = async (endpoint: EndpointTest) => {
    const key = endpoint.name;
    setResults((prev) => ({
      ...prev,
      [key]: { status: 'loading' },
    }));

    try {
      const url = `${backendUrl}${endpoint.url}`;
      console.log(`Testing ${endpoint.method} ${url}`);

      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...endpoint.headers,
        },
      };

      if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(url, options);
      const responseText = await response.text();

      let data: any;
      let rawResponse: string | undefined;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // No es JSON, guardar la respuesta raw
        rawResponse = responseText;
        data = { error: 'Respuesta no es JSON válido', preview: responseText.substring(0, 200) };
      }

      setResults((prev) => ({
        ...prev,
        [key]: {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          data,
          rawResponse,
          timestamp: new Date(),
        },
      }));
    } catch (error: any) {
      console.error(`Error testing ${endpoint.name}:`, error);
      setResults((prev) => ({
        ...prev,
        [key]: {
          status: 'error',
          error: error.message || 'Error desconocido',
          timestamp: new Date(),
        },
      }));
    }
  };

  const testAllEndpoints = async () => {
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      // Pequeño delay entre requests para no saturar
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const toggleExpanded = (key: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'loading':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'idle':
        return '⚪';
      case 'loading':
        return '🔵';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Prueba de Endpoints
          </h1>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL del Backend:
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="https://koptupbackend-production.up.railway.app"
            />
            <p className="text-xs text-gray-500 mt-1">
              Modifica esta URL si necesitas probar contra un backend diferente (local o producción)
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={testAllEndpoints}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Probar Todos los Endpoints
            </button>

            <button
              onClick={() => setResults({})}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Limpiar Resultados
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {endpoints.map((endpoint) => {
            const result = results[endpoint.name] || { status: 'idle' };
            const isExpanded = expandedResults.has(endpoint.name);

            return (
              <div
                key={endpoint.name}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getStatusIcon(result.status)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {endpoint.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            endpoint.method === 'GET'
                              ? 'bg-green-100 text-green-800'
                              : endpoint.method === 'POST'
                              ? 'bg-blue-100 text-blue-800'
                              : endpoint.method === 'PUT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        {result.statusCode && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                              result.status
                            )}`}
                          >
                            {result.statusCode}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{endpoint.description}</p>
                      <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {endpoint.url}
                      </code>
                    </div>

                    <button
                      onClick={() => testEndpoint(endpoint)}
                      disabled={result.status === 'loading'}
                      className="ml-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {result.status === 'loading' ? 'Probando...' : 'Probar'}
                    </button>
                  </div>

                  {result.timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      Última prueba: {result.timestamp.toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {(result.data || result.error || result.rawResponse) && (
                  <div className="p-4 bg-gray-50">
                    <button
                      onClick={() => toggleExpanded(endpoint.name)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 mb-2"
                    >
                      {isExpanded ? '▼ Ocultar' : '▶ Ver'} detalles de respuesta
                    </button>

                    {isExpanded && (
                      <div className="mt-2">
                        {result.error && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                            <p className="text-sm font-semibold text-red-800 mb-1">Error:</p>
                            <p className="text-sm text-red-700">{result.error}</p>
                          </div>
                        )}
                        {result.rawResponse && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                            <p className="text-sm font-semibold text-yellow-800 mb-1">
                              Respuesta Raw (No JSON):
                            </p>
                            <pre className="text-xs text-yellow-900 overflow-x-auto bg-white p-2 rounded max-h-96 overflow-y-auto">
                              {result.rawResponse}
                            </pre>
                          </div>
                        )}
                        {result.data && !result.rawResponse && (
                          <div className="bg-white border border-gray-200 rounded p-3">
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                              Respuesta JSON:
                            </p>
                            <pre className="text-xs text-gray-700 overflow-x-auto bg-gray-50 p-2 rounded">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(results).length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Diagnóstico Automático de Resultados
            </h2>
            {(() => {
              const mongoErrors = Object.entries(results).filter(([_, r]) =>
                r.data?.error?.includes('buffering timed out') ||
                r.data?.error?.includes('Operation')
              );
              const authErrors = Object.entries(results).filter(([_, r]) =>
                r.statusCode === 401
              );
              const notFound = Object.entries(results).filter(([_, r]) =>
                r.statusCode === 404
              );
              const successful = Object.entries(results).filter(([_, r]) =>
                r.status === 'success'
              );

              return (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="text-2xl font-bold text-green-700">{successful.length}</div>
                      <div className="text-xs text-green-600">Exitosos</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="text-2xl font-bold text-red-700">{mongoErrors.length}</div>
                      <div className="text-xs text-red-600">MongoDB Timeout</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="text-2xl font-bold text-yellow-700">{authErrors.length}</div>
                      <div className="text-xs text-yellow-600">Auth Requerida</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="text-2xl font-bold text-gray-700">{notFound.length}</div>
                      <div className="text-xs text-gray-600">No Encontrados</div>
                    </div>
                  </div>

                  {/* MongoDB Error (CRÍTICO) */}
                  {mongoErrors.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                      <h3 className="text-lg font-bold text-red-800 mb-2">
                        🔴 PROBLEMA CRÍTICO: MongoDB NO conectado
                      </h3>
                      <p className="text-sm text-red-700 mb-2">
                        <strong>{mongoErrors.length} endpoints</strong> están fallando con timeout de MongoDB.
                      </p>
                      <div className="text-sm text-red-900 mb-3">
                        <strong>Error:</strong> <code className="bg-red-100 px-2 py-1 rounded text-xs">
                          buffering timed out after 10000ms
                        </code>
                      </div>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-sm font-semibold text-gray-800 mb-2">Endpoints afectados:</p>
                        <div className="flex flex-wrap gap-2">
                          {mongoErrors.slice(0, 8).map(([name]) => (
                            <span key={name} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              {name}
                            </span>
                          ))}
                          {mongoErrors.length > 8 && (
                            <span className="text-xs text-red-600">+{mongoErrors.length - 8} más</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-red-100 rounded p-3">
                        <p className="text-sm font-bold text-red-900 mb-2">✅ SOLUCIÓN:</p>
                        <ol className="list-decimal list-inside text-sm text-red-800 space-y-1">
                          <li>Ve a Railway → Tu proyecto backend → Variables</li>
                          <li>Verifica que <code className="bg-red-200 px-1 rounded">MONGODB_URI</code> esté configurada</li>
                          <li>El formato debe ser: <code className="bg-red-200 px-1 rounded text-xs">mongodb+srv://usuario:password@cluster.mongodb.net/database</code></li>
                          <li>Redeploya el backend después de configurarla</li>
                          <li>Vuelve a probar los endpoints aquí</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Auth Errors (ESPERADO) */}
                  {authErrors.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                      <h3 className="text-sm font-bold text-yellow-800 mb-1">
                        ⚠️ Autenticación Requerida (Normal)
                      </h3>
                      <p className="text-xs text-yellow-700">
                        {authErrors.length} endpoints requieren autenticación. Esto es esperado y correcto.
                      </p>
                    </div>
                  )}

                  {/* 404 Errors */}
                  {notFound.length > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                      <h3 className="text-sm font-bold text-orange-800 mb-1">
                        🔍 Endpoints No Encontrados
                      </h3>
                      <p className="text-xs text-orange-700 mb-2">
                        {notFound.length} endpoints no existen o la ruta es incorrecta:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {notFound.map(([name]) => (
                          <span key={name} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success */}
                  {successful.length > 0 && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                      <h3 className="text-sm font-bold text-green-800 mb-1">
                        ✅ Endpoints Funcionando
                      </h3>
                      <p className="text-xs text-green-700">
                        {successful.length} endpoints están respondiendo correctamente.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Esta página es solo para desarrollo y pruebas. No debe estar
            accesible en producción sin autenticación adecuada.
          </p>
        </div>
      </div>
    </div>
  );
}
