'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  StarIcon,
  ClockIcon,
  TrashIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  SparklesIcon,
  TagIcon,
  CalendarIcon,
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  thumbnail: string;
  favorite: boolean;
  tags: string[];
  summary?: string;
  keywords?: string[];
  entities?: string[];
}

export default function GestorDocumentos() {
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 1,
      name: 'Reporte_Financiero_Q1_2024.pdf',
      type: 'PDF',
      size: '2.4 MB',
      date: '2024-01-15',
      thumbnail: '📊',
      favorite: true,
      tags: ['Finanzas', 'Q1', 'Reportes'],
      summary: 'Análisis financiero del primer trimestre 2024 incluyendo ingresos, gastos y proyecciones.',
      keywords: ['finanzas', 'ingresos', 'gastos', 'Q1', 'trimestre'],
      entities: ['Balance General', 'Estado de Resultados', 'Flujo de Caja'],
    },
    {
      id: 2,
      name: 'Contrato_Servicio_Cliente_ABC.docx',
      type: 'Word',
      size: '856 KB',
      date: '2024-01-20',
      thumbnail: '📄',
      favorite: false,
      tags: ['Contratos', 'Legal'],
      summary: 'Contrato de prestación de servicios con el cliente ABC Corp por 12 meses.',
      keywords: ['contrato', 'servicios', 'cliente', 'legal'],
      entities: ['ABC Corp', 'Términos y Condiciones', 'Cláusulas'],
    },
    {
      id: 3,
      name: 'Propuesta_Proyecto_Marketing.pdf',
      type: 'PDF',
      size: '1.8 MB',
      date: '2024-01-22',
      thumbnail: '📈',
      favorite: true,
      tags: ['Marketing', 'Proyectos'],
      summary: 'Propuesta detallada de campaña de marketing digital para lanzamiento de producto.',
      keywords: ['marketing', 'campaña', 'digital', 'redes sociales'],
      entities: ['Plan de Marketing', 'Presupuesto', 'KPIs'],
    },
    {
      id: 4,
      name: 'Manual_Empleados_2024.pdf',
      type: 'PDF',
      size: '3.2 MB',
      date: '2024-01-10',
      thumbnail: '📖',
      favorite: false,
      tags: ['RRHH', 'Políticas'],
      summary: 'Manual completo de políticas y procedimientos para empleados actualizado 2024.',
      keywords: ['empleados', 'políticas', 'procedimientos', 'RRHH'],
      entities: ['Código de Conducta', 'Beneficios', 'Vacaciones'],
    },
    {
      id: 5,
      name: 'Presentacion_Resultados_Anuales.pptx',
      type: 'PowerPoint',
      size: '5.6 MB',
      date: '2024-01-25',
      thumbnail: '📊',
      favorite: true,
      tags: ['Presentaciones', 'Anual'],
      summary: 'Presentación ejecutiva de resultados anuales 2023 para junta directiva.',
      keywords: ['resultados', 'anual', 'presentación', 'junta'],
      entities: ['Métricas', 'Objetivos', 'Logros'],
    },
    {
      id: 6,
      name: 'Factura_Proveedor_XYZ_Enero.pdf',
      type: 'PDF',
      size: '245 KB',
      date: '2024-01-28',
      thumbnail: '🧾',
      favorite: false,
      tags: ['Facturas', 'Proveedores'],
      summary: 'Factura de proveedor XYZ correspondiente al mes de enero 2024.',
      keywords: ['factura', 'proveedor', 'pago', 'enero'],
      entities: ['XYZ Corp', 'Monto', 'Fecha de Vencimiento'],
    },
  ]);

  const sidebarItems = [
    { name: 'Todos los Documentos', icon: DocumentTextIcon, count: documents.length, active: true },
    { name: 'Favoritos', icon: StarIcon, count: documents.filter(d => d.favorite).length, active: false },
    { name: 'Recientes', icon: ClockIcon, count: 8, active: false },
    { name: 'Papelera', icon: TrashIcon, count: 3, active: false },
    { name: 'Configuración', icon: Cog6ToothIcon, count: null, active: false },
  ];

  const folders = [
    { name: 'Finanzas', icon: '💰', count: 24 },
    { name: 'Legal', icon: '⚖️', count: 12 },
    { name: 'Marketing', icon: '📢', count: 18 },
    { name: 'RRHH', icon: '👥', count: 15 },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Lógica para manejar archivos
  };

  const toggleFavorite = (id: number) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, favorite: !doc.favorite } : doc
    ));
  };

  const toggleCompareSelection = (id: number) => {
    if (selectedDocs.includes(id)) {
      setSelectedDocs(selectedDocs.filter(docId => docId !== id));
    } else if (selectedDocs.length < 2) {
      setSelectedDocs([...selectedDocs, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">DocuIA</span>
            </div>

            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5" />
              Subir Archivo
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {item.count !== null && (
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-3">
                Carpetas
              </h3>
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{folder.icon}</span>
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                    {folder.count}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por significado, no solo por texto..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Filtros
              </button>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  compareMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
                Comparar
              </button>
            </div>

            {showFilters && (
              <div className="flex gap-3 flex-wrap">
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Tipo: Todos</option>
                  <option>PDF</option>
                  <option>Word</option>
                  <option>Excel</option>
                </select>
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Fecha: Todas</option>
                  <option>Última semana</option>
                  <option>Último mes</option>
                  <option>Último año</option>
                </select>
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Etiquetas: Todas</option>
                  <option>Finanzas</option>
                  <option>Legal</option>
                  <option>Marketing</option>
                </select>
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Relevancia: Todos</option>
                  <option>Alta relevancia</option>
                  <option>Media relevancia</option>
                </select>
              </div>
            )}

            {compareMode && selectedDocs.length === 2 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      2 documentos seleccionados para comparar
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                    Ver Comparación
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Upload Area */}
          <div
            className="mx-6 mt-6"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div
              className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
              }`}
            >
              <div className="text-center">
                <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Arrastra y suelta tus archivos aquí
                </p>
                <p className="text-xs text-slate-500">
                  Soporta PDF, Word, Excel, PowerPoint e imágenes
                </p>
              </div>
            </div>
          </div>

          {/* Documents Grid/List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents
                .filter(doc =>
                  doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                      compareMode && selectedDocs.includes(doc.id)
                        ? 'border-blue-500 shadow-lg'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{doc.thumbnail}</div>
                        <div className="flex items-center gap-2">
                          {compareMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompareSelection(doc.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                selectedDocs.includes(doc.id)
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <ArrowsRightLeftIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(doc.id);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            {doc.favorite ? (
                              <StarIconSolid className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <StarIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-white line-clamp-2">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                            +{doc.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>

        {/* Document Viewer Panel */}
        {selectedDoc && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedDoc(null)}
            />
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {selectedDoc.name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{selectedDoc.type}</span>
                      <span>•</span>
                      <span>{selectedDoc.size}</span>
                      <span>•</span>
                      <span>{selectedDoc.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* PDF Preview */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-8 mb-6 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <DocumentIcon className="w-24 h-24 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Vista previa del documento
                    </p>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Resumen Automático
                    </h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedDoc.summary}
                  </p>
                </div>

                {/* Keywords */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TagIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Palabras Clave
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.keywords?.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Entities */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Entidades Detectadas
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {selectedDoc.entities?.map((entity, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {entity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Details */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                    Detalles del Archivo
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Nombre</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tamaño</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.size}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Fecha</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tipo</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.type}
                      </span>
                    </div>
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-slate-500">Etiquetas</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {selectedDoc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
                    Explicar este documento
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
