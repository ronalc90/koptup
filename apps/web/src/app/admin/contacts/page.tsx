'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, [statusFilter]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/contacts?status=${statusFilter}`);
      setContacts(response.data?.data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (contactId: string, newStatus: string) => {
    try {
      setUpdatingStatus(contactId);
      await api.patch(`/admin/contacts/${contactId}/status`, { status: newStatus });
      await loadContacts();
      if (selectedContact?._id === contactId) {
        setSelectedContact({ ...selectedContact, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar estado');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; text: string }> = {
      new: { variant: 'primary', text: 'Nuevo' },
      read: { variant: 'secondary', text: 'Leído' },
      responded: { variant: 'secondary', text: 'Respondido' },
    };
    const badge = badges[status] || { variant: 'secondary', text: status };
    return <Badge variant={badge.variant} size="sm">{badge.text}</Badge>;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Contactos
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gestiona las solicitudes de contacto recibidas
          </p>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos ({contacts.length})
              </Button>
              <Button
                variant={statusFilter === 'new' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('new')}
              >
                Nuevos
              </Button>
              <Button
                variant={statusFilter === 'read' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('read')}
              >
                Leídos
              </Button>
              <Button
                variant={statusFilter === 'responded' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('responded')}
              >
                Respondidos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Solicitudes de contacto</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <EnvelopeIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                    <p className="text-secondary-600 dark:text-secondary-400">
                      No hay contactos para mostrar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedContact?.id === contact.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                            : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-secondary-900 dark:text-white">
                                {contact.name}
                              </h3>
                              {getStatusBadge(contact.status)}
                            </div>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              {contact.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-secondary-500 mb-2">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {formatDate(contact.createdAt)}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <PhoneIcon className="h-4 w-4" />
                              {contact.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" size="sm">
                            {contact.service}
                          </Badge>
                          {contact.budget && (
                            <Badge variant="secondary" size="sm">
                              {contact.budget}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail */}
          <div>
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Detalle del contacto</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedContact ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">
                        {selectedContact.name}
                      </h3>
                      {getStatusBadge(selectedContact.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <EnvelopeIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-secondary-500">Email</p>
                          <p className="text-sm text-secondary-900 dark:text-white">
                            {selectedContact.email}
                          </p>
                        </div>
                      </div>

                      {selectedContact.phone && (
                        <div className="flex items-start gap-2">
                          <PhoneIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-secondary-500">Teléfono</p>
                            <p className="text-sm text-secondary-900 dark:text-white">
                              {selectedContact.phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedContact.company && (
                        <div className="flex items-start gap-2">
                          <BuildingOfficeIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-secondary-500">Empresa</p>
                            <p className="text-sm text-secondary-900 dark:text-white">
                              {selectedContact.company}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <p className="text-xs text-secondary-500 mb-1">Servicio</p>
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">
                        {selectedContact.service}
                      </p>
                    </div>

                    {selectedContact.budget && (
                      <div>
                        <p className="text-xs text-secondary-500 mb-1">Presupuesto</p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">
                          {selectedContact.budget}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-secondary-500 mb-2">Mensaje</p>
                      <p className="text-sm text-secondary-900 dark:text-white whitespace-pre-wrap">
                        {selectedContact.message}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <p className="text-xs text-secondary-500 mb-1">Fecha de contacto</p>
                      <p className="text-sm text-secondary-900 dark:text-white">
                        {formatDate(selectedContact.createdAt)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
                      <p className="text-xs text-secondary-500 mb-2">Actualizar estado</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={selectedContact.status === 'new' ? 'primary' : 'outline'}
                          size="sm"
                          fullWidth
                          onClick={() => handleUpdateStatus(selectedContact.id, 'new')}
                          disabled={updatingStatus === selectedContact.id}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Marcar como nuevo
                        </Button>
                        <Button
                          variant={selectedContact.status === 'read' ? 'primary' : 'outline'}
                          size="sm"
                          fullWidth
                          onClick={() => handleUpdateStatus(selectedContact.id, 'read')}
                          disabled={updatingStatus === selectedContact.id}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Marcar como leído
                        </Button>
                        <Button
                          variant={selectedContact.status === 'responded' ? 'primary' : 'outline'}
                          size="sm"
                          fullWidth
                          onClick={() => handleUpdateStatus(selectedContact.id, 'responded')}
                          disabled={updatingStatus === selectedContact.id}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Marcar como respondido
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <EnvelopeIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Selecciona un contacto para ver sus detalles
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
