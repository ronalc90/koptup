'use client';

import { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  DocumentTextIcon,
  FolderIcon,
  QueueListIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  mockDocuments,
  mockCollections,
  mockAccounts,
  mockAnalysisResults,
  mockStatistics,
  mockNotifications,
  mockAuditLogs
} from './mockData';
import type {
  Document,
  Collection,
  MedicalAccount,
  AnalysisResult,
  DocumentStatus,
  CollectionStatus,
  AccountStatus
} from './types';

type TabType = 'dashboard' | 'documents' | 'collections' | 'queue' | 'review' | 'batch' | 'audit';

export default function CuentasMedicasDemo() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [collections, setCollections] = useState<Collection[]>(mockCollections);
  const [accounts, setAccounts] = useState<MedicalAccount[]>(mockAccounts);
  const [selectedAccount, setSelectedAccount] = useState<MedicalAccount | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: ChartBarIcon },
    { id: 'documents' as TabType, label: 'Biblioteca', icon: DocumentTextIcon },
    { id: 'collections' as TabType, label: 'Colecciones', icon: FolderIcon },
    { id: 'queue' as TabType, label: 'Cola de Cuentas', icon: QueueListIcon },
    { id: 'review' as TabType, label: 'Revisar Cuentas', icon: EyeIcon },
    { id: 'audit' as TabType, label: 'Auditoría', icon: ClockIcon },
  ];

  // Funciones de utilidad
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'uploaded': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      'processing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      'indexed': 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      'ready_for_training': 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
      'ready_for_ingest': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      'ingested': 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      'queued': 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
      'reviewed_by_agent': 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      'awaiting_auditor': 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      'approved': 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      'needs_info': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      'error': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'uploaded': 'Subido',
      'processing': 'Procesando',
      'indexed': 'Indexado',
      'ready_for_training': 'Listo',
      'draft': 'Borrador',
      'ready_for_ingest': 'Listo para indexar',
      'ingested': 'Indexado',
      'queued': 'En cola',
      'reviewed_by_agent': 'Revisado por IA',
      'awaiting_auditor': 'Esperando auditor',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'needs_info': 'Necesita info',
      'error': 'Error',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      'high': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    };
    return colors[priority] || colors.low;
  };

  // Filtrado de cuentas
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || account.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchQuery, filterStatus]);

  // Marcar colección como lista
  const markCollectionReady = (collectionId: string) => {
    setCollections(collections.map(col =>
      col.id === collectionId ? { ...col, status: 'ready_for_ingest' as CollectionStatus } : col
    ));
  };

  // Simular indexación
  const startIndexing = (collectionId: string) => {
    setCollections(collections.map(col =>
      col.id === collectionId ? { ...col, status: 'processing' as CollectionStatus, ingestProgress: 0 } : col
    ));

    // Simular progreso
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setCollections(prev => prev.map(col =>
        col.id === collectionId ? { ...col, ingestProgress: progress } : col
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setCollections(prev => prev.map(col =>
          col.id === collectionId ? {
            ...col,
            status: 'ingested' as CollectionStatus,
            ingestProgress: 100,
            snapshotId: `snap-${Date.now()}`
          } : col
        ));
      }
    }, 500);
  };

  // Renderizar Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">Dashboard</h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Resumen ejecutivo del sistema de auditoría de cuentas médicas
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="bordered" className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Cuentas</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-2">
                  {mockStatistics.totalAccounts}
                </p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-950 rounded-full">
                <QueueListIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <p className="text-xs text-secondary-500 mt-4">
              {mockStatistics.todayProcessed} procesadas hoy
            </p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Pendientes</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-2">
                  {mockStatistics.pendingAccounts}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-950 rounded-full">
                <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-secondary-500 mt-4">
              En revisión
            </p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Aprobadas</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {mockStatistics.approvedAccounts}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-secondary-500 mt-4">
              Tasa de aprobación: {mockStatistics.aiAcceptanceRate}%
            </p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Documentos</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-2">
                  {mockStatistics.totalDocuments}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-full">
                <DocumentTextIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-secondary-500 mt-4">
              {mockStatistics.totalCollections} colecciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cuentas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Cuentas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.slice(0, 4).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedAccount(account);
                    setActiveTab('review');
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900 dark:text-white">
                      {account.accountNumber}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {account.patientName}
                    </p>
                  </div>
                  <Badge className={getStatusColor(account.status)} size="sm">
                    {getStatusLabel(account.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockNotifications.slice(0, 4).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    notification.read
                      ? 'bg-secondary-50 dark:bg-secondary-900'
                      : 'bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <BellIcon className={`h-5 w-5 mt-0.5 ${
                      notification.type === 'success' ? 'text-green-600' :
                      notification.type === 'warning' ? 'text-yellow-600' :
                      notification.type === 'error' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Renderizar Biblioteca de Documentos
  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Biblioteca de Documentos
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gestiona documentos normativos y protocolos
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
          Subir Documentos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} variant="bordered" className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-950 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-1 truncate">
                    {doc.name}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                    {doc.source}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.metadata.tags.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} size="sm" variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(doc.status)} size="sm">
                      {getStatusLabel(doc.status)}
                    </Badge>
                    <span className="text-xs text-secondary-500">
                      {(doc.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  {doc.status === 'indexed' || doc.status === 'ready_for_training' ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400">
                        <CheckIcon className="h-4 w-4 text-green-600" />
                        Confidence: {(doc.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Renderizar Colecciones
  const renderCollections = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Colecciones / Sets
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Agrupa documentos para entrenamiento del agente
          </p>
        </div>
        <Button onClick={() => setShowCollectionModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Colección
        </Button>
      </div>

      <div className="space-y-4">
        {collections.map((collection) => (
          <Card key={collection.id} variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                  <FolderIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                        {collection.description}
                      </p>
                    </div>
                    <Badge className={getStatusColor(collection.status)}>
                      {getStatusLabel(collection.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                    <span>{collection.documents.length} documentos</span>
                    <span>•</span>
                    <span>Actualizado: {collection.updatedAt.toLocaleDateString()}</span>
                    {collection.snapshotId && (
                      <>
                        <span>•</span>
                        <span className="text-xs font-mono bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded">
                          {collection.snapshotId}
                        </span>
                      </>
                    )}
                  </div>

                  {collection.status === 'processing' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          Indexando...
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {collection.ingestProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${collection.ingestProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {collection.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => markCollectionReady(collection.id)}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Marcar como Listo
                      </Button>
                    )}
                    {collection.status === 'ready_for_ingest' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => startIndexing(collection.id)}
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Indexar Ahora
                      </Button>
                    )}
                    {collection.status === 'ingested' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startIndexing(collection.id)}
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Re-indexar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Renderizar Cola de Cuentas
  const renderQueue = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Cola de Cuentas
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gestiona y procesa cuentas médicas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Subir Cuenta
          </Button>
          <Button variant="outline">
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Lote CSV
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card variant="bordered">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por paciente o número de cuenta..."
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los estados</option>
              <option value="queued">En cola</option>
              <option value="processing">Procesando</option>
              <option value="reviewed_by_agent">Revisado por IA</option>
              <option value="awaiting_auditor">Esperando auditor</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cuentas */}
      <div className="space-y-3">
        {filteredAccounts.map((account) => (
          <Card
            key={account.id}
            variant="bordered"
            className="hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setSelectedAccount(account);
              setActiveTab('review');
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                      {account.accountNumber}
                    </h3>
                    <Badge className={getPriorityColor(account.priority)} size="sm">
                      Prioridad: {account.priority}
                    </Badge>
                    <Badge className={getStatusColor(account.status)}>
                      {getStatusLabel(account.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-secondary-600 dark:text-secondary-400">Paciente</p>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {account.patientName}
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary-600 dark:text-secondary-400">ID Paciente</p>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {account.patientId}
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary-600 dark:text-secondary-400">Monto Total</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        ${account.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary-600 dark:text-secondary-400">Fecha</p>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {account.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {account.assignedTo && (
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                      Asignado a: <span className="font-medium">{account.assignedTo}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Renderizar Revisión de Cuenta
  const renderReview = () => {
    if (!selectedAccount) {
      return (
        <div className="text-center py-16">
          <QueueListIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            Selecciona una cuenta para revisar
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            Ve a la Cola de Cuentas y selecciona una cuenta para ver los detalles
          </p>
          <Button onClick={() => setActiveTab('queue')}>
            Ir a Cola de Cuentas
          </Button>
        </div>
      );
    }

    const analysis = mockAnalysisResults.find(a => a.accountId === selectedAccount.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
              Revisar Cuenta: {selectedAccount.accountNumber}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              {selectedAccount.patientName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedAccount(null)}>
              Volver
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Documento */}
          <div className="lg:col-span-1">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Documento Original</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-8 text-center">
                  <DocumentTextIcon className="h-24 w-24 mx-auto text-secondary-400 mb-4" />
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                    Vista previa del documento de la cuenta médica
                  </p>
                  <Button size="sm" variant="outline">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Ver Documento
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Servicios</p>
                    <p className="text-xl font-bold text-secondary-900 dark:text-white">
                      {selectedAccount.services.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Monto Total</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${selectedAccount.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Estado</p>
                    <Badge className={getStatusColor(selectedAccount.status)}>
                      {getStatusLabel(selectedAccount.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Análisis y Decisiones */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumen del análisis */}
            {analysis && (
              <>
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Análisis del Agente IA</CardTitle>
                      <Badge className={
                        analysis.confidence === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                        analysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }>
                        Confianza: {analysis.confidence}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">
                          Resumen
                        </h4>
                        <p className="text-secondary-700 dark:text-secondary-300">
                          {analysis.summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">
                          Recomendación
                        </h4>
                        <p className="text-secondary-700 dark:text-secondary-300">
                          {analysis.recommendation}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">
                          Decisión Sugerida
                        </h4>
                        <Badge className={getStatusColor(analysis.suggestedDecision)} size="lg">
                          {analysis.suggestedDecision === 'approved' ? 'Aprobar' :
                           analysis.suggestedDecision === 'rejected' ? 'Rechazar' :
                           'Solicitar Información'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Problemas detectados */}
                {analysis.issues.length > 0 && (
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Problemas Detectados ({analysis.issues.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className={`p-4 rounded-lg border ${
                              issue.severity === 'critical' ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950' :
                              issue.severity === 'major' ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' :
                              issue.severity === 'minor' ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950' :
                              'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                                issue.severity === 'critical' ? 'text-red-600' :
                                issue.severity === 'major' ? 'text-orange-600' :
                                issue.severity === 'minor' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge size="sm" className={
                                    issue.severity === 'critical' ? 'bg-red-200 text-red-800' :
                                    issue.severity === 'major' ? 'bg-orange-200 text-orange-800' :
                                    issue.severity === 'minor' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-blue-200 text-blue-800'
                                  }>
                                    {issue.severity}
                                  </Badge>
                                  <span className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {issue.category}
                                  </span>
                                </div>
                                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-2">
                                  {issue.description}
                                </p>
                                {issue.suggestedAction && (
                                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                                    <strong>Acción sugerida:</strong> {issue.suggestedAction}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Referencias normativas */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Referencias Normativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.normativeReferences.map((ref, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-secondary-900 dark:text-white">
                              {ref.documentName}
                            </h4>
                            <Badge size="sm" variant="outline">
                              Relevancia: {(ref.relevance * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                            {ref.section} {ref.pageNumber && `- Pág. ${ref.pageNumber}`}
                          </p>
                          <p className="text-sm text-secondary-700 dark:text-secondary-300 italic">
                            &ldquo;{ref.text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Servicios de la cuenta */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Servicios Facturados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-secondary-200 dark:border-secondary-700">
                      <tr>
                        <th className="text-left py-2 px-2 font-medium text-secondary-600 dark:text-secondary-400">Código</th>
                        <th className="text-left py-2 px-2 font-medium text-secondary-600 dark:text-secondary-400">Descripción</th>
                        <th className="text-right py-2 px-2 font-medium text-secondary-600 dark:text-secondary-400">Cant.</th>
                        <th className="text-right py-2 px-2 font-medium text-secondary-600 dark:text-secondary-400">P. Unit.</th>
                        <th className="text-right py-2 px-2 font-medium text-secondary-600 dark:text-secondary-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccount.services.map((service) => (
                        <tr key={service.id} className="border-b border-secondary-100 dark:border-secondary-800">
                          <td className="py-3 px-2 font-mono text-xs text-secondary-900 dark:text-white">
                            {service.code}
                          </td>
                          <td className="py-3 px-2 text-secondary-900 dark:text-white">
                            {service.description}
                          </td>
                          <td className="py-3 px-2 text-right text-secondary-900 dark:text-white">
                            {service.quantity}
                          </td>
                          <td className="py-3 px-2 text-right text-secondary-900 dark:text-white">
                            ${service.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-right font-medium text-secondary-900 dark:text-white">
                            ${service.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-bold border-t-2 border-secondary-300 dark:border-secondary-600">
                      <tr>
                        <td colSpan={4} className="py-3 px-2 text-right text-secondary-900 dark:text-white">
                          Total:
                        </td>
                        <td className="py-3 px-2 text-right text-green-600 dark:text-green-400 text-lg">
                          ${selectedAccount.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Acciones del auditor */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Acciones del Revisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Notas del Revisor
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Agrega tus observaciones aquí..."
                      className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" className="flex-1">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Aprobar
                    </Button>
                    <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                      <XMarkIcon className="h-5 w-5 mr-2" />
                      Rechazar
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Solicitar Info
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full">
                    Continuar a Siguiente Cuenta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar Auditoría
  const renderAudit = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Registro de Auditoría
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Trazabilidad completa de todas las acciones del sistema
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {mockAuditLogs.map((log) => (
          <Card key={log.id} variant="bordered">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  log.actorRole === 'admin' ? 'bg-purple-100 dark:bg-purple-950' :
                  log.actorRole === 'auditor' ? 'bg-blue-100 dark:bg-blue-950' :
                  'bg-green-100 dark:bg-green-950'
                }`}>
                  <ClockIcon className={`h-5 w-5 ${
                    log.actorRole === 'admin' ? 'text-purple-600 dark:text-purple-400' :
                    log.actorRole === 'auditor' ? 'text-blue-600 dark:text-blue-400' :
                    'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {log.actorName}
                    </span>
                    <Badge size="sm" variant="outline">
                      {log.actorRole}
                    </Badge>
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {log.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-secondary-700 dark:text-secondary-300 mb-2">
                    {log.action}
                  </p>
                  <div className="flex gap-4 text-xs text-secondary-600 dark:text-secondary-400">
                    <span>Recurso: {log.resourceType} - {log.resourceId}</span>
                    {log.confidence && (
                      <span>Confianza: {(log.confidence * 100).toFixed(0)}%</span>
                    )}
                    {log.collectionSnapshotId && (
                      <span className="font-mono">{log.collectionSnapshotId}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/demo"
                className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                  Sistema de Auditoría - Cuentas Médicas
                </h1>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Demo Código: 2020
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                Sistema Activo
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'collections' && renderCollections()}
        {activeTab === 'queue' && renderQueue()}
        {activeTab === 'review' && renderReview()}
        {activeTab === 'audit' && renderAudit()}
      </main>

      {/* Modal de subida de documentos */}
      {showUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
            <Card variant="elevated" className="shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Subir Documentos Normativos</CardTitle>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    id="doc-upload"
                    multiple
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                  />
                  <label
                    htmlFor="doc-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <CloudArrowUpIcon className="h-16 w-16 text-secondary-400" />
                    <div>
                      <p className="text-lg font-medium text-secondary-900 dark:text-white mb-1">
                        Arrastra documentos aquí o haz clic para seleccionar
                      </p>
                      <p className="text-sm text-secondary-500">
                        PDF, DOCX, TXT (máx. 50MB por archivo)
                      </p>
                    </div>
                    <Button variant="outline">Seleccionar Archivos</Button>
                  </label>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Tipo de Documento
                  </label>
                  <select className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Normativa</option>
                    <option>Protocolo</option>
                    <option>Ley</option>
                    <option>Reglamento</option>
                    <option>Guía</option>
                    <option>Manual</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Tags (separados por coma)
                  </label>
                  <input
                    type="text"
                    placeholder="ej: facturación, CUPS, tarifas"
                    className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => setShowUploadModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button variant="primary" className="flex-1">
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Subir Documentos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Modal de crear colección */}
      {showCollectionModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCollectionModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
            <Card variant="elevated" className="shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Nueva Colección</CardTitle>
                  <button
                    onClick={() => setShowCollectionModal(false)}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Nombre de la Colección
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Normativa Facturación 2024"
                      className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe el propósito de esta colección..."
                      className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Seleccionar Documentos
                    </label>
                    <div className="border border-secondary-300 dark:border-secondary-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {documents.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex items-center gap-3 p-2 hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded cursor-pointer"
                        >
                          <input type="checkbox" className="rounded" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900 dark:text-white">
                              {doc.name}
                            </p>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400">
                              {doc.type} - {doc.source}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowCollectionModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button variant="primary" className="flex-1">
                      <FolderIcon className="h-5 w-5 mr-2" />
                      Crear Colección
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
