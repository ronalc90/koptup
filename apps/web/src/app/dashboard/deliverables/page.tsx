'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadDeliverables();
  }, []);

  const loadDeliverables = async () => {
    try {
      // Try to fetch from API
      const data = await api.getDeliverables();
      setDeliverables(data);
    } catch (error) {
      console.error('Failed to load deliverables from API, using fallback data:', error);

      // Fallback to mock data if API fails
      const mockDeliverables = [
        {
          id: 'DEL-001',
          name: 'Mockups de diseño UI/UX',
          description: 'Diseños completos de todas las pantallas de la aplicación',
          project: 'Plataforma E-commerce',
          projectId: 'PROJ-001',
          type: 'design',
          status: 'approved',
          uploadDate: '2025-09-12',
          version: '2.1',
          fileSize: '45.2 MB',
          format: 'Figma',
          comments: 3,
        },
        {
          id: 'DEL-002',
          name: 'Prototipo funcional',
          description: 'Versión beta del sistema con funcionalidades principales',
          project: 'Plataforma E-commerce',
          projectId: 'PROJ-001',
          type: 'code',
          status: 'approved',
          uploadDate: '2025-09-28',
          version: '1.0-beta',
          fileSize: '128 MB',
          format: 'ZIP',
          comments: 5,
        },
        {
          id: 'DEL-003',
          name: 'Beta version completa',
          description: 'Versión completa con todas las funcionalidades para testing',
          project: 'Plataforma E-commerce',
          projectId: 'PROJ-001',
          type: 'code',
          status: 'in_review',
          uploadDate: '2025-10-15',
          version: '1.0-rc1',
          fileSize: '256 MB',
          format: 'ZIP',
          comments: 2,
        },
        {
          id: 'DEL-004',
          name: 'Documento de requisitos',
          description: 'Especificaciones técnicas y funcionales del proyecto',
          project: 'Portal de Clientes',
          projectId: 'PROJ-002',
          type: 'document',
          status: 'approved',
          uploadDate: '2025-10-03',
          version: '1.0',
          fileSize: '2.8 MB',
          format: 'PDF',
          comments: 1,
        },
        {
          id: 'DEL-005',
          name: 'Wireframes iniciales',
          description: 'Bocetos de la estructura del dashboard',
          project: 'Portal de Clientes',
          projectId: 'PROJ-002',
          type: 'design',
          status: 'approved',
          uploadDate: '2025-10-10',
          version: '1.2',
          fileSize: '15.7 MB',
          format: 'Figma',
          comments: 4,
        },
        {
          id: 'DEL-006',
          name: 'Research de usuarios',
          description: 'Análisis de necesidades y comportamiento de usuarios',
          project: 'App Móvil iOS/Android',
          projectId: 'PROJ-003',
          type: 'document',
          status: 'in_review',
          uploadDate: '2025-10-18',
          version: '1.0',
          fileSize: '8.3 MB',
          format: 'PDF',
          comments: 0,
        },
        {
          id: 'DEL-007',
          name: 'Documentación API',
          description: 'Documentación completa de endpoints y modelos de datos',
          project: 'Plataforma E-commerce',
          projectId: 'PROJ-001',
          type: 'document',
          status: 'rejected',
          uploadDate: '2025-10-05',
          version: '0.9',
          fileSize: '5.2 MB',
          format: 'PDF',
          comments: 7,
        },
      ];

      setDeliverables(mockDeliverables);
    } finally {
      setLoading(false);
    }
  };

  const downloadDeliverable = async (id: string) => {
    try {
      const data = await api.getDeliverableById(id);
      const url = (data?.fileUrl || '').toString();
      if (url) {
        window.open(url, '_blank');
      } else {
        console.warn('No se recibió URL del entregable');
      }
    } catch (error) {
      console.error('Error al descargar el entregable', error);
    }
  };

  const approve = async (id: string) => {
    try {
      await api.approveDeliverable(id);
      await loadDeliverables();
    } catch (error) {
      console.error('Error al aprobar el entregable', error);
    }
  };

  const reject = async (id: string) => {
    try {
      const comments = prompt('Comentarios de rechazo') || 'Rechazado por el usuario';
      await api.rejectDeliverable(id, comments);
      await loadDeliverables();
    } catch (error) {
      console.error('Error al rechazar el entregable', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string; icon: any }> = {
      approved: {
        className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
        text: 'Aprobado',
        icon: CheckCircleIcon,
      },
      in_review: {
        className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
        text: 'En Revisión',
        icon: ClockIcon,
      },
      rejected: {
        className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
        text: 'Rechazado',
        icon: XCircleIcon,
      },
    };
    const badge = badges[status] || { className: 'bg-secondary-100', text: status, icon: DocumentTextIcon };
    const Icon = badge.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Badge variant="secondary" size="sm" className={badge.className}>
          {badge.text}
        </Badge>
      </div>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      design: '🎨',
      code: '💻',
      document: '📄',
    };
    return icons[type] || '📁';
  };

  const filteredDeliverables = filterStatus === 'all'
    ? deliverables
    : deliverables.filter(d => d.status === filterStatus);

  const groupedByProject = filteredDeliverables.reduce((acc: any, deliverable) => {
    const projectName = deliverable.project || 'Sin proyecto';
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(deliverable);
    return acc;
  }, {});

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Entregables y Documentos
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Repositorio de archivos y entregables por proyecto
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="bordered">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Total</p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {deliverables.length}
                  </p>
                </div>
                <FolderIcon className="h-8 w-8 text-secondary-400" />
              </div>
            </CardContent>
          </Card>

          {['approved', 'in_review', 'rejected'].map(status => {
            const count = deliverables.filter(d => d.status === status).length;
            const label = status === 'approved' ? 'Aprobados' : status === 'in_review' ? 'En Revisión' : 'Rechazados';
            const color = status === 'approved' ? 'text-green-600' : status === 'in_review' ? 'text-yellow-600' : 'text-red-600';
            return (
              <Card key={status} variant="bordered" className="cursor-pointer" onClick={() => setFilterStatus(status)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === 'approved' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('approved')}
          >
            Aprobados
          </Button>
          <Button
            variant={filterStatus === 'in_review' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('in_review')}
          >
            En Revisión
          </Button>
          <Button
            variant={filterStatus === 'rejected' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('rejected')}
          >
            Rechazados
          </Button>
        </div>

        {/* Deliverables by Project */}
        <div className="space-y-6">
          {Object.entries(groupedByProject).map(([projectName, projectDeliverables]: [string, any]) => (
            <Card key={projectName} variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FolderIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <CardTitle>{projectName}</CardTitle>
                  <Badge variant="secondary" size="sm">
                    {projectDeliverables.length} archivos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectDeliverables.map((deliverable: any) => (
                    <div
                      key={deliverable.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
                    >
                      <div className="text-3xl">{getTypeIcon(deliverable.type)}</div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-secondary-900 dark:text-white">
                            {deliverable.name}
                          </h4>
                          {getStatusBadge(deliverable.status)}
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                          {deliverable.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-secondary-500">
                          <span className="font-mono">{deliverable.id}</span>
                          <span>•</span>
                          <span>v{deliverable.version}</span>
                          <span>•</span>
                          <span>{deliverable.format}</span>
                          <span>•</span>
                          <span>{deliverable.fileSize}</span>
                          <span>•</span>
                          <span>{deliverable.uploadDate}</span>
                          {deliverable.comments > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <ChatBubbleLeftIcon className="h-3 w-3" />
                                {deliverable.comments}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadDeliverable(deliverable.id)}>
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadDeliverable(deliverable.id)}>
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                        </Button>
                        {deliverable.status === 'in_review' && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => approve(deliverable.id)}>
                              Aprobar
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => reject(deliverable.id)}>
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
