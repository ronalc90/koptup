'use client';

import { useState, useEffect } from 'react';
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
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilIcon,
  FolderPlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useDocuments, Document as DocumentType } from '@/hooks/useDocuments';

type ViewType = 'all' | 'favorites' | 'recent' | 'trash' | 'settings' | 'folder';

export default function GestorDocumentos() {
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showSemanticSearch, setShowSemanticSearch] = useState(false);
  const [semanticResults, setSemanticResults] = useState<any[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [documentToRename, setDocumentToRename] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showSimilarityModal, setShowSimilarityModal] = useState(false);
  const [similarityExplanation, setSimilarityExplanation] = useState('');
  const [loadingSimilarity, setLoadingSimilarity] = useState(false);
  const [settings, setSettings] = useState({
    autoProcess: true,
    semanticSearchEnabled: true,
    autoTagging: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const {
    documents,
    folders,
    stats,
    loading,
    error,
    uploadDocument,
    toggleFavorite,
    deleteDocument,
    restoreDocument,
    renameDocument,
    createFolder,
    searchSemantic,
    explainDocument,
    explainSimilarity,
    searchDocuments,
    moveToFolder,
    refetch,
  } = useDocuments(activeView, selectedFolder);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Si la búsqueda está vacía, recargar documentos normales
      const timer = setTimeout(() => {
        refetch?.();
      }, 300);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      searchDocuments(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchDocuments, refetch]);

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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const folder = activeView === 'folder' ? selectedFolder : 'General';

    for (const file of Array.from(files)) {
      try {
        setUploadProgress(0);
        await uploadDocument(file, folder, (progress) => {
          setUploadProgress(progress);
        });
        setUploadProgress(null);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error al subir el archivo');
        setUploadProgress(null);
      }
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSemanticLoading(true);
      setShowSemanticSearch(true);
      const results = await searchSemantic(searchQuery);
      setSemanticResults(results);
    } catch (error) {
      console.error('Error in semantic search:', error);
      alert('Error en la búsqueda semántica');
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleExplainDocument = async (docId: string) => {
    try {
      setLoadingExplanation(true);
      setExplanation('');
      const exp = await explainDocument(docId);
      setExplanation(exp);
    } catch (error) {
      console.error('Error explaining document:', error);
      alert('Error al explicar el documento');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleRenameClick = (docId: string, currentName: string) => {
    setDocumentToRename(docId);
    setNewFilename(currentName);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    if (!documentToRename || !newFilename.trim()) return;

    try {
      await renameDocument(documentToRename, newFilename);
      setShowRenameModal(false);
      setDocumentToRename(null);
      setNewFilename('');
    } catch (error) {
      console.error('Error renaming document:', error);
      alert('Error al renombrar el documento');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName);
      setShowNewFolderModal(false);
      setNewFolderName('');
    } catch (error: any) {
      console.error('Error creating folder:', error);
      alert(error.message || 'Error al crear la carpeta');
    }
  };

  const handleMoveToFolder = async (docId: string, folder: string) => {
    try {
      await moveToFolder(docId, folder);
    } catch (error) {
      console.error('Error moving document:', error);
      alert('Error al mover el documento');
    }
  };

  const handleDeleteClick = (docId: string) => {
    setDocumentToDelete(docId);
    setPinInput('');
    setShowPinModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete, pinInput);
      setShowPinModal(false);
      setDocumentToDelete(null);
      setPinInput('');
      setSelectedDoc(null); // Cerrar el panel de detalles si estaba abierto
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert(error.message || 'Error al eliminar el documento');
    }
  };

  const sidebarItems = [
    { id: 'all', name: 'Todos los Documentos', icon: DocumentTextIcon, count: stats?.total || 0 },
    { id: 'favorites', name: 'Favoritos', icon: StarIcon, count: stats?.favorites || 0 },
    { id: 'recent', name: 'Recientes', icon: ClockIcon, count: stats?.recent || 0 },
    { id: 'trash', name: 'Papelera', icon: TrashIcon, count: stats?.trash || 0 },
    { id: 'settings', name: 'Configuración', icon: Cog6ToothIcon, count: null },
  ];

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const renderSettingsView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Configuración del Sistema
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Procesamiento IA Automático</h4>
              <p className="text-sm text-slate-500">Analizar documentos con IA al subirlos</p>
            </div>
            <button
              onClick={() => toggleSetting('autoProcess')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoProcess ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoProcess ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Búsqueda Semántica</h4>
              <p className="text-sm text-slate-500">Habilitar búsqueda por significado con IA</p>
            </div>
            <button
              onClick={() => toggleSetting('semanticSearchEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.semanticSearchEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.semanticSearchEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Etiquetado Automático</h4>
              <p className="text-sm text-slate-500">Generar tags automáticamente con IA</p>
            </div>
            <button
              onClick={() => toggleSetting('autoTagging')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoTagging ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoTagging ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {settingsSaved ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ Configuración guardada
              </span>
            ) : (
              <span>Actualiza tu configuración aquí</span>
            )}
          </div>
          <button
            onClick={saveSettings}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      {stats && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Almacenamiento</h3>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Espacio Utilizado</span>
              <span className="text-sm font-semibold">
                {(stats.totalSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                style={{ width: `${Math.min((stats.totalSize / (100 * 1024 * 1024)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">{stats.total} documentos guardados</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Resumen de Configuración
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${settings.autoProcess ? 'bg-green-500' : 'bg-slate-400'}`}></div>
            <span className="text-slate-700 dark:text-slate-300">
              Procesamiento IA: <strong>{settings.autoProcess ? 'Activado' : 'Desactivado'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${settings.semanticSearchEnabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
            <span className="text-slate-700 dark:text-slate-300">
              Búsqueda Semántica: <strong>{settings.semanticSearchEnabled ? 'Activada' : 'Desactivada'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${settings.autoTagging ? 'bg-green-500' : 'bg-slate-400'}`}></div>
            <span className="text-slate-700 dark:text-slate-300">
              Etiquetado Automático: <strong>{settings.autoTagging ? 'Activado' : 'Desactivado'}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

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

            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileInput}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            />
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              Subir Archivo
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as ViewType);
                    setSelectedFolder('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeView === item.id
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
              <div className="flex items-center justify-between mb-3 px-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Carpetas
                </h3>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Nueva carpeta"
                >
                  <FolderPlusIcon className="w-4 h-4" />
                </button>
              </div>
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => {
                    setActiveView('folder');
                    setSelectedFolder(folder.name);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'folder' && selectedFolder === folder.name
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderIcon className="w-5 h-5" />
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
          {/* Header - Fixed position */}
          <header className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar documentos..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSemanticSearch}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <SparklesIcon className="w-5 h-5" />
                Búsqueda IA
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Filtros
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
              </div>
            )}
          </header>

          {/* Content */}
          {activeView === 'settings' ? (
            <div className="flex-1 overflow-y-auto p-6">{renderSettingsView()}</div>
          ) : (
            <>
              {/* Upload Area */}
              <div
                className="mx-6 mt-6"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950'
                  }`}
                >
                  <div className="text-center">
                    <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Arrastra y suelta tus archivos aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-slate-500">Soporta PDF, Word, Excel, PowerPoint, TXT, CSV</p>
                    {uploadProgress !== null && (
                      <div className="mt-4 max-w-md mx-auto">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          Procesando con IA... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando documentos...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-12">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {!loading && !error && documents.length === 0 && (
                  <div className="text-center py-12">
                    <DocumentIcon className="w-24 h-24 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No hay documentos aún. ¡Sube tu primer archivo!
                    </p>
                  </div>
                )}

                {activeView === 'trash' && documents.length > 0 && (
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Los documentos en la papelera se eliminarán permanentemente después de 30 días.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => activeView !== 'trash' && setSelectedDoc(doc)}
                      className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 transition-all cursor-pointer hover:shadow-lg hover:border-blue-300"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-4xl">
                            {doc.type === 'PDF' && '📄'}
                            {doc.type === 'Word' && '📝'}
                            {doc.type === 'Excel' && '📊'}
                            {doc.type === 'PowerPoint' && '📽️'}
                            {doc.type === 'Text' && '📃'}
                            {!['PDF', 'Word', 'Excel', 'PowerPoint', 'Text'].includes(doc.type) && '📄'}
                          </div>
                          <div className="flex items-center gap-2">
                            {activeView === 'trash' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreDocument(doc.id);
                                }}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-950 rounded-lg transition-colors"
                              >
                                <ArrowPathIcon className="w-4 h-4 text-green-600" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameClick(doc.id, doc.name);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Renombrar"
                                >
                                  <PencilIcon className="w-4 h-4 text-slate-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(doc.id, doc.favorite);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                  {doc.favorite ? (
                                    <StarIconSolid className="w-5 h-5 text-yellow-500" />
                                  ) : (
                                    <StarIcon className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>
                              </>
                            )}
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
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Document Viewer Panel */}
        {selectedDoc && activeView !== 'trash' && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedDoc(null)} />
            <div className="fixed right-0 top-0 h-full w-[600px] bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto">
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
                {/* AI Summary */}
                {selectedDoc.summary && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <SparklesIcon className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Resumen Automático IA
                      </h3>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedDoc.summary}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {selectedDoc.keywords && selectedDoc.keywords.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TagIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <h3 className="font-bold text-slate-900 dark:text-white">Palabras Clave</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entities */}
                {selectedDoc.entities && selectedDoc.entities.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <SparklesIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <h3 className="font-bold text-slate-900 dark:text-white">Entidades Detectadas</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedDoc.entities.map((entity, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300">{entity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Folder Selection */}
                <div className="mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Mover a Carpeta</h3>
                  <select
                    value={selectedDoc.folder}
                    onChange={(e) => handleMoveToFolder(selectedDoc.id, e.target.value)}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <option value="General">General</option>
                    {folders.map((folder) => (
                      <option key={folder.name} value={folder.name}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => handleExplainDocument(selectedDoc.id)}
                    disabled={loadingExplanation}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    {loadingExplanation ? 'Generando explicación...' : 'Explicar este documento con IA'}
                  </button>

                  {explanation && (
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                      <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">Explicación IA:</h4>
                      <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                        {explanation}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteClick(selectedDoc.id)}
                    className="w-full bg-red-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-red-700 transition-all"
                  >
                    Mover a Papelera (Requiere PIN)
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Semantic Search Results Modal */}
        {showSemanticSearch && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowSemanticSearch(false)} />
            <div className="fixed inset-x-4 top-20 max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Búsqueda Semántica IA
                    </h3>
                    <p className="text-sm text-slate-500">Consulta: {searchQuery}</p>
                  </div>
                  <button
                    onClick={() => setShowSemanticSearch(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {semanticLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">
                      Buscando documentos similares...
                    </p>
                  </div>
                ) : semanticResults.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">
                      No se encontraron documentos similares
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {semanticResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{result.name}</h4>
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold">
                            {result.similarity}% similar
                          </span>
                        </div>
                        {result.summary && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{result.summary}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{result.type}</span>
                            <span>•</span>
                            <span>{result.folder}</span>
                            <span>•</span>
                            <span>{result.date}</span>
                          </div>
                          <button
                            onClick={async () => {
                              setLoadingSimilarity(true);
                              setShowSimilarityModal(true);
                              setSimilarityExplanation('');
                              try {
                                const exp = await explainSimilarity(result.id, searchQuery, result.similarity / 100);
                                setSimilarityExplanation(exp);
                              } catch (error: any) {
                                setSimilarityExplanation('Error: ' + (error.message || 'No se pudo generar la explicación'));
                              } finally {
                                setLoadingSimilarity(false);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                          >
                            <SparklesIcon className="w-3 h-3" />
                            ¿Por qué?
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Rename Modal */}
        {showRenameModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowRenameModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Renombrar Documento</h3>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4"
                  placeholder="Nuevo nombre"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRenameModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRenameSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Renombrar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* New Folder Modal */}
        {showNewFolderModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowNewFolderModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nueva Carpeta</h3>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4"
                  placeholder="Nombre de la carpeta"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewFolderModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PIN Modal for Delete */}
        {showPinModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPinModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                  Eliminar Documento
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                  Esta acción requiere un código PIN de seguridad.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mb-4 text-center">
                  PIN por defecto: <strong>1010</strong>
                </p>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 text-center text-lg tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteSubmit();
                    }
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput('');
                      setDocumentToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteSubmit}
                    disabled={pinInput.length !== 4}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Similarity Explanation Modal */}
        {showSimilarityModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowSimilarityModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-2xl w-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Explicación IA
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        ¿Por qué este documento es relevante?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSimilarityModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  {loadingSimilarity ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
                      <span className="ml-3 text-slate-600 dark:text-slate-400">
                        Analizando con IA...
                      </span>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {similarityExplanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowSimilarityModal(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
                  >
                    Entendido
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
