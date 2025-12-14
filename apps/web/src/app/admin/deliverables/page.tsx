'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function AdminDeliverablesPage() {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.adminGetDeliverables(status === 'all' ? undefined : status);
      setDeliverables(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status]);

  const approve = async (id: string) => {
    await api.approveDeliverable(id);
    await load();
  };

  const reject = async (id: string) => {
    const comments = prompt('Comentarios de rechazo') || 'Rechazado por administrador';
    await api.rejectDeliverable(id, comments);
    await load();
  };

  const view = async (id: string) => {
    const data = await api.getDeliverableById(id);
    const url = (data?.fileUrl || '').toString();
    if (url) window.open(url, '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Entregables</h1>
          <div className="flex gap-2">
            {['all', 'pending', 'in_review', 'approved', 'rejected'].map(s => (
              <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => (
              <Card key={d.id} variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{d.title}</h3>
                      <p className="text-sm text-secondary-600">Usuario: {d.user?.name} · {d.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{d.status}</Badge>
                      <p className="text-xs text-secondary-600">{d.fileName} · {(d.fileSize || 0)} bytes</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => view(d.id)}>Ver</Button>
                    {d.status === 'in_review' || d.status === 'pending' ? (
                      <>
                        <Button size="sm" variant="primary" onClick={() => approve(d.id)}>Aprobar</Button>
                        <Button size="sm" variant="danger" onClick={() => reject(d.id)}>Rechazar</Button>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

