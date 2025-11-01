'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  FolderPlusIcon,
  CloudArrowUpIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Cuenta {
  id: string;
  nombre: string;
  numFiles: number;
  createdAt: string;
  updatedAt: string;
}

interface CuentaDetalle {
  _id: string;
  id?: string;
  nombre: string;
  archivos: Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    uploadedAt: string;
    processed: boolean;
    enabled: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Ley100Doc {
  id: string;
  originalName: string;
  tipo: string;
  tags: string[];
  createdAt: string;
  size: number;
  enabled: boolean;
}

interface ProcessResult {
  totalCuentas: number;
  totalPDFs: number;
  totalPrestaciones: number;
  totalGlosas?: number;
  glosasAlta?: number;
  glosaMedia?: number;
  glosaBaja?: number;
  downloadUrl: string;
  filename: string;
  timestamp?: number;
  duration?: number;
}

type TabType = 'documentos' | 'cuentas' | 'resultados';

// Modal Component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors">
            <XMarkIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function CuentasMedicasDemo() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('documentos');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [ley100Docs, setLey100Docs] = useState<Ley100Doc[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaDetalle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedCuentasForProcess, setSelectedCuentasForProcess] = useState<Set<string>>(new Set());

  // Modal states
  const [showCreateCuentaModal, setShowCreateCuentaModal] = useState(false);
  const [showCuentaDetailsModal, setShowCuentaDetailsModal] = useState(false);
  const [showDeleteCuentaModal, setShowDeleteCuentaModal] = useState(false);
  const [cuentaToDelete, setCuentaToDelete] = useState<string | null>(null);

  // Form states
  const [newCuentaNombre, setNewCuentaNombre] = useState('');
  const [newCuentaFiles, setNewCuentaFiles] = useState<FileList | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchCuentas();
    fetchLey100Docs();
  }, []);

  const fetchCuentas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cuentas`);
      const data = await res.json();
      if (data.success) {
        setCuentas(data.data);
      }
    } catch (error) {
      console.error('Error fetching cuentas:', error);
    }
  };

  const fetchLey100Docs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ley100`);
      const data = await res.json();
      if (data.success) {
        setLey100Docs(data.data);
      }
    } catch (error) {
      console.error('Error fetching ley100 docs:', error);
    }
  };

  const fetchCuentaDetails = async (cuentaId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCuenta(data.data);
        setShowCuentaDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching cuenta details:', error);
      showMessage('error', 'Error al cargar detalles de la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Upload Ley100 documents
  const handleLey100Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('tipo', 'normativa');
    formData.append('tags', 'ley 100, facturación, normativa');

    try {
      const res = await fetch(`${API_BASE_URL}/ley100/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', `${files.length} documento(s) subido(s) correctamente`);
        fetchLey100Docs();
        e.target.value = '';
      } else {
        showMessage('error', data.message || 'Error al subir documentos');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al subir documentos');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  // Create new cuenta with files
  const handleCreateCuenta = async () => {
    if (!newCuentaNombre || newCuentaNombre.trim().length === 0) {
      showMessage('error', 'El nombre de la cuenta es requerido');
      return;
    }

    setLoading(true);

    try {
      // Create cuenta
      const res = await fetch(`${API_BASE_URL}/cuentas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCuentaNombre.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        const cuentaId = data.data.id;

        // If files were selected, upload them
        if (newCuentaFiles && newCuentaFiles.length > 0) {
          const formData = new FormData();
          Array.from(newCuentaFiles).forEach((file) => {
            formData.append('files', file);
          });

          const uploadRes = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/upload`, {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();

          if (uploadData.success) {
            showMessage('success', `Cuenta creada con ${newCuentaFiles.length} archivo(s)`);
          } else {
            showMessage('success', 'Cuenta creada, pero hubo un error al subir los archivos');
          }
        } else {
          showMessage('success', 'Cuenta creada correctamente');
        }

        fetchCuentas();
        setShowCreateCuentaModal(false);
        setNewCuentaNombre('');
        setNewCuentaFiles(null);
        setActiveTab('cuentas');
      } else {
        showMessage('error', data.message || 'Error al crear cuenta');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  // Upload PDFs to a cuenta
  const handleUploadToCuenta = async (cuentaId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchCuentas();
        if (selectedCuenta && (selectedCuenta.id === cuentaId || selectedCuenta._id === cuentaId)) {
          fetchCuentaDetails(cuentaId);
        }
      } else {
        showMessage('error', data.message || 'Error al subir archivos');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al subir archivos');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  // Delete cuenta
  const handleDeleteCuenta = async () => {
    if (!cuentaToDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cuentas/${cuentaToDelete}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'Cuenta eliminada correctamente');
        fetchCuentas();
        setShowDeleteCuentaModal(false);
        setShowCuentaDetailsModal(false);
        setSelectedCuenta(null);
        setCuentaToDelete(null);
      } else {
        showMessage('error', data.message || 'Error al eliminar cuenta');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al eliminar cuenta');
    } finally {
      setLoading(false);
    }
  };

  // Delete Ley100 document
  const handleDeleteLey100Doc = async (docId: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ley100/${docId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'Documento eliminado correctamente');
        fetchLey100Docs();
      } else {
        showMessage('error', data.message || 'Error al eliminar documento');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al eliminar documento');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Ley100 document enabled status
  const handleToggleLey100Enabled = async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ley100/${docId}/toggle`, {
        method: 'PATCH',
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchLey100Docs();
      } else {
        showMessage('error', data.message || 'Error al cambiar estado del documento');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al cambiar estado del documento');
    } finally {
      setLoading(false);
    }
  };

  // Delete file from cuenta
  const handleDeleteFileFromCuenta = async (cuentaId: string, filename: string) => {
    if (!confirm('¿Está seguro de eliminar este archivo?')) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/files/${filename}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'Archivo eliminado correctamente');
        fetchCuentas();
        if (selectedCuenta && (selectedCuenta.id === cuentaId || selectedCuenta._id === cuentaId)) {
          fetchCuentaDetails(cuentaId);
        }
      } else {
        showMessage('error', data.message || 'Error al eliminar archivo');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al eliminar archivo');
    } finally {
      setLoading(false);
    }
  };

  // Toggle file enabled status
  const handleToggleFileEnabled = async (cuentaId: string, filename: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/files/${filename}/toggle`, {
        method: 'PATCH',
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchCuentas();
        if (selectedCuenta && (selectedCuenta.id === cuentaId || selectedCuenta._id === cuentaId)) {
          fetchCuentaDetails(cuentaId);
        }
      } else {
        showMessage('error', data.message || 'Error al cambiar estado del archivo');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al cambiar estado del archivo');
    } finally {
      setLoading(false);
    }
  };

  // Delete single processing result
  const handleDeleteResult = (index: number) => {
    if (!confirm('¿Está seguro de eliminar este resultado del historial?')) return;
    setProcessResults((prev) => prev.filter((_, i) => i !== index));
    showMessage('success', 'Resultado eliminado del historial');
  };

  // Clear all processing results
  const handleClearAllResults = () => {
    if (!confirm('¿Está seguro de eliminar TODO el historial de procesamientos?')) return;
    setProcessResults([]);
    showMessage('success', 'Historial completamente limpiado');
  };

  // Toggle cuenta selection for processing
  const toggleCuentaForProcess = (cuentaId: string) => {
    const newSelection = new Set(selectedCuentasForProcess);
    if (newSelection.has(cuentaId)) {
      newSelection.delete(cuentaId);
    } else {
      newSelection.add(cuentaId);
    }
    setSelectedCuentasForProcess(newSelection);
  };

  // Process selected cuentas
  const handleProcessCuentas = async () => {
    if (selectedCuentasForProcess.size === 0) {
      showMessage('error', 'Debe seleccionar al menos una cuenta');
      return;
    }

    setProcessing(true);
    const startTime = Date.now();
    showMessage('success', 'Procesando... esto puede tomar varios minutos');

    try {
      const res = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaIds: Array.from(selectedCuentasForProcess) }),
      });

      const data = await res.json();

      if (data.success) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const result = {
          ...data.data,
          timestamp: Date.now(),
          duration,
        };

        setProcessResults((prev) => [result, ...prev]);

        let glosaMsg = '';
        if (result.totalGlosas && result.totalGlosas > 0) {
          const severities = [];
          if (result.glosasAlta && result.glosasAlta > 0) severities.push(`${result.glosasAlta} alta`);
          if (result.glosaMedia && result.glosaMedia > 0) severities.push(`${result.glosaMedia} media`);
          if (result.glosaBaja && result.glosaBaja > 0) severities.push(`${result.glosaBaja} baja`);
          glosaMsg = ` | ${result.totalGlosas} glosa(s): ${severities.join(', ')}`;
        }

        showMessage(
          'success',
          `Procesamiento completado: ${data.data.totalPrestaciones} prestaciones extraídas en ${duration}s${glosaMsg}`
        );

        // Switch to results tab
        setActiveTab('resultados');

        // Auto-download
        const downloadUrl = `${API_BASE_URL}${data.data.downloadUrl}`;
        window.open(downloadUrl, '_blank');
      } else {
        showMessage('error', data.message || 'Error al procesar cuentas');
      }
    } catch (error: any) {
      showMessage('error', 'Error de conexión al procesar cuentas');
    } finally {
      setProcessing(false);
    }
  };

  // Filter cuentas by search
  const filteredCuentas = cuentas.filter((cuenta) =>
    cuenta.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalCuentas: cuentas.length,
    totalDocs: ley100Docs.length,
    totalPDFs: cuentas.reduce((acc, c) => acc + c.numFiles, 0),
    totalResults: processResults.length,
    totalPrestaciones: processResults.reduce((acc, r) => acc + r.totalPrestaciones, 0),
  };

  // Render Módulo 1: Documentos Ley 100
  const renderDocumentosModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Gestión Documental - Ley 100
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Sube documentos normativos de referencia para el procesamiento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" size="lg">
            {ley100Docs.length} documentos
          </Badge>
        </div>
      </div>

      {/* Upload area */}
      <Card variant="elevated">
        <CardContent className="p-8">
          <div className="text-center">
            <label
              htmlFor="ley100-upload"
              className="cursor-pointer group inline-block"
            >
              <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-xl p-12 hover:border-primary-500 dark:hover:border-primary-500 transition-all group-hover:bg-secondary-50 dark:group-hover:bg-secondary-900">
                <CloudArrowUpIcon className="h-16 w-16 mx-auto text-secondary-400 group-hover:text-primary-600 transition-colors mb-4" />
                <p className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                  {loading ? 'Subiendo documentos...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                </p>
                <p className="text-sm text-secondary-500">
                  PDF, DOCX, TXT • Máximo 50MB por archivo
                </p>
                {uploadProgress !== null && (
                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <input
                id="ley100-upload"
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleLey100Upload}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Documents list */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Documentos Subidos</CardTitle>
        </CardHeader>
        <CardContent>
          {ley100Docs.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400">
                No hay documentos subidos aún
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ley100Docs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    doc.enabled
                      ? 'bg-secondary-50 dark:bg-secondary-900 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                      : 'bg-secondary-200 dark:bg-secondary-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      doc.enabled ? 'bg-primary-100 dark:bg-primary-950' : 'bg-secondary-300 dark:bg-secondary-700'
                    }`}>
                      <DocumentTextIcon className={`h-6 w-6 ${
                        doc.enabled ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${
                        doc.enabled ? 'text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-500'
                      }`}>
                        {doc.originalName}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <Badge size="sm" variant="outline">{doc.tipo}</Badge>
                        <span>•</span>
                        <span className={doc.enabled ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                          {doc.enabled ? 'Habilitado' : 'Deshabilitado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleLey100Enabled(doc.id)}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        doc.enabled ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          doc.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleDeleteLey100Doc(doc.id)}
                      disabled={loading}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render Módulo 2: Cuentas
  const renderCuentasModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Gestión de Cuentas Médicas
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Crea y administra cuentas médicas, asigna PDFs a cada cuenta
          </p>
        </div>
        <Button onClick={() => setShowCreateCuentaModal(true)} disabled={loading}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Cuenta
        </Button>
      </div>

      {/* Search and stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card variant="bordered" className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cuentas por nombre..."
                className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Cuentas</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.totalCuentas}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuentas list */}
      <div className="space-y-3">
        {filteredCuentas.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="p-12 text-center">
              <FolderPlusIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                {searchQuery ? 'No se encontraron cuentas' : 'No hay cuentas creadas'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateCuentaModal(true)}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Crear Primera Cuenta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCuentas.map((cuenta) => (
            <Card
              key={cuenta.id}
              variant="bordered"
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => fetchCuentaDetails(cuenta.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                        {cuenta.nombre}
                      </h3>
                      <Badge size="sm" variant="outline">
                        {cuenta.numFiles} PDFs
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Creada: {new Date(cuenta.createdAt).toLocaleDateString()} •
                      Actualizada: {new Date(cuenta.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline">
                        <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                        Subir
                      </Button>
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleUploadToCuenta(cuenta.id, e.target.files);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchCuentaDetails(cuenta.id);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // Render Módulo 3: Resultados y Procesamiento
  const renderResultadosModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Procesamiento y Resultados
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Procesa cuentas seleccionadas y descarga los resultados en Excel
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Cuentas Totales</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                  {stats.totalCuentas}
                </p>
              </div>
              <FolderPlusIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">PDFs Subidos</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                  {stats.totalPDFs}
                </p>
              </div>
              <DocumentTextIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Procesamientos</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                  {stats.totalResults}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Prestaciones</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                  {stats.totalPrestaciones}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Seleccionar Cuentas para Procesar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {selectedCuentasForProcess.size} de {cuentas.length} cuentas seleccionadas
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCuentasForProcess(new Set(cuentas.map((c) => c.id)))}
                >
                  Seleccionar Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCuentasForProcess(new Set())}
                >
                  Limpiar Selección
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {cuentas.map((cuenta) => (
                <label
                  key={cuenta.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCuentasForProcess.has(cuenta.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCuentasForProcess.has(cuenta.id)}
                    onChange={() => toggleCuentaForProcess(cuenta.id)}
                    className="h-5 w-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 dark:text-white truncate">
                      {cuenta.nombre}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {cuenta.numFiles} PDFs
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <Button
                size="lg"
                variant="primary"
                className="w-full"
                onClick={handleProcessCuentas}
                disabled={processing || selectedCuentasForProcess.size === 0}
              >
                {processing ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Procesando con IA...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Procesar {selectedCuentasForProcess.size} Cuenta(s) Seleccionada(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results history */}
      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Procesamientos</CardTitle>
            {processResults.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleClearAllResults}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Limpiar Todo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {processResults.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400">
                No hay procesamientos realizados aún
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {processResults.map((result, index) => (
                <div
                  key={index}
                  className="p-5 bg-secondary-50 dark:bg-secondary-900 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-secondary-900 dark:text-white">
                        Procesamiento #{processResults.length - index}
                      </h4>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                        {result.timestamp && new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Completado
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">Cuentas</p>
                      <p className="text-lg font-bold text-secondary-900 dark:text-white">
                        {result.totalCuentas}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">PDFs</p>
                      <p className="text-lg font-bold text-secondary-900 dark:text-white">
                        {result.totalPDFs}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">Prestaciones</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {result.totalPrestaciones}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">Glosas</p>
                      <p className={`text-lg font-bold ${result.totalGlosas && result.totalGlosas > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {result.totalGlosas || 0}
                      </p>
                      {result.totalGlosas && result.totalGlosas > 0 && (
                        <div className="flex gap-1 mt-1">
                          {result.glosasAlta && result.glosasAlta > 0 && (
                            <Badge size="sm" className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs">
                              {result.glosasAlta} Alta
                            </Badge>
                          )}
                          {result.glosaMedia && result.glosaMedia > 0 && (
                            <Badge size="sm" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 text-xs">
                              {result.glosaMedia} Media
                            </Badge>
                          )}
                          {result.glosaBaja && result.glosaBaja > 0 && (
                            <Badge size="sm" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs">
                              {result.glosaBaja} Baja
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">Duración</p>
                      <p className="text-lg font-bold text-secondary-900 dark:text-white">
                        {result.duration || 0}s
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${API_BASE_URL}${result.downloadUrl}`, '_blank')}
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                      Descargar Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleDeleteResult(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/demo"
              className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                Sistema de Cuentas Médicas
              </h1>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Procesamiento inteligente con IA • Código: 2020
              </p>
            </div>
            <Badge variant="outline" className="hidden md:flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Sistema Activo
            </Badge>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('documentos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'documentos'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
              Documentos Ley 100
              <Badge size="sm" variant={activeTab === 'documentos' ? 'outline' : 'default'}>
                {stats.totalDocs}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('cuentas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'cuentas'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              <FolderPlusIcon className="h-5 w-5" />
              Cuentas Médicas
              <Badge size="sm" variant={activeTab === 'cuentas' ? 'outline' : 'default'}>
                {stats.totalCuentas}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('resultados')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'resultados'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              <ChartBarIcon className="h-5 w-5" />
              Procesamiento
              <Badge size="sm" variant={activeTab === 'resultados' ? 'outline' : 'default'}>
                {stats.totalResults}
              </Badge>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'documentos' && renderDocumentosModule()}
        {activeTab === 'cuentas' && renderCuentasModule()}
        {activeTab === 'resultados' && renderResultadosModule()}
      </main>

      {/* Modal: Create Cuenta */}
      <Modal
        isOpen={showCreateCuentaModal}
        onClose={() => {
          setShowCreateCuentaModal(false);
          setNewCuentaNombre('');
          setNewCuentaFiles(null);
        }}
        title="Crear Nueva Cuenta Médica"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Nombre de la Cuenta *
            </label>
            <input
              type="text"
              value={newCuentaNombre}
              onChange={(e) => setNewCuentaNombre(e.target.value)}
              placeholder="Ej: Paciente Juan Pérez - Enero 2025"
              className="w-full px-4 py-2.5 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Archivos PDF (Opcional)
            </label>
            <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg p-6 text-center">
              <label htmlFor="create-cuenta-files" className="cursor-pointer">
                <CloudArrowUpIcon className="h-12 w-12 mx-auto text-secondary-400 mb-2" />
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {newCuentaFiles && newCuentaFiles.length > 0
                    ? `${newCuentaFiles.length} archivo(s) seleccionado(s)`
                    : 'Haz clic para seleccionar PDFs'}
                </p>
                <input
                  id="create-cuenta-files"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => setNewCuentaFiles(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCuentaModal(false);
                setNewCuentaNombre('');
                setNewCuentaFiles(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCuenta}
              disabled={loading || !newCuentaNombre.trim()}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Cuenta Details */}
      <Modal
        isOpen={showCuentaDetailsModal}
        onClose={() => {
          setShowCuentaDetailsModal(false);
          setSelectedCuenta(null);
        }}
        title={selectedCuenta?.nombre || 'Detalles de Cuenta'}
      >
        {selectedCuenta && (
          <div className="space-y-6">
            {/* Cuenta Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Archivos</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {selectedCuenta.archivos.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Creada</p>
                <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                  {new Date(selectedCuenta.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Upload more files */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Agregar más archivos
              </label>
              <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg p-4 text-center">
                <label htmlFor="add-files" className="cursor-pointer">
                  <CloudArrowUpIcon className="h-10 w-10 mx-auto text-secondary-400 mb-2" />
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Haz clic para subir PDFs
                  </p>
                  <input
                    id="add-files"
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleUploadToCuenta(selectedCuenta._id || selectedCuenta.id || '', e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Files list */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                Archivos en esta cuenta
              </h3>
              {selectedCuenta.archivos.length === 0 ? (
                <div className="text-center py-8 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
                  <DocumentTextIcon className="h-12 w-12 mx-auto text-secondary-400 mb-2" />
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    No hay archivos en esta cuenta
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedCuenta.archivos.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        file.enabled
                          ? 'bg-secondary-50 dark:bg-secondary-900 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                          : 'bg-secondary-200 dark:bg-secondary-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <DocumentTextIcon className={`h-5 w-5 flex-shrink-0 ${
                          file.enabled ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${
                            file.enabled ? 'text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-500'
                          }`}>
                            {file.originalName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400">
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span className={file.enabled ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                              {file.enabled ? 'Habilitado' : 'Deshabilitado'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleFileEnabled(selectedCuenta._id || selectedCuenta.id || '', file.filename)}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            file.enabled ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600'
                          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              file.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDeleteFileFromCuenta(selectedCuenta._id || selectedCuenta.id || '', file.filename)}
                          disabled={loading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => {
                  setCuentaToDelete(selectedCuenta._id || selectedCuenta.id || '');
                  setShowDeleteCuentaModal(true);
                }}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Eliminar Cuenta
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowCuentaDetailsModal(false);
                  setSelectedCuenta(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Delete Cuenta Confirmation */}
      <Modal
        isOpen={showDeleteCuentaModal}
        onClose={() => {
          setShowDeleteCuentaModal(false);
          setCuentaToDelete(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                ¿Está seguro?
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Esta acción eliminará la cuenta y todos sus archivos asociados. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteCuentaModal(false);
                setCuentaToDelete(null);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteCuenta}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Eliminar Cuenta
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
